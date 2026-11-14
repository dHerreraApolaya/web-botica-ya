const { createRequire } = require('node:module');
const { randomUUID, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const { Pool } = createRequire('D:/REPOSITORIO_PRACTICAS/boticaya-orders-service/package.json')('pg');
const service = process.argv[2];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });

async function expectRejection(client, sql, values, code) {
  await client.query('SAVEPOINT rejected_operation');
  let actual;
  try { await client.query(sql, values); } catch (error) { actual = error.code; }
  await client.query('ROLLBACK TO SAVEPOINT rejected_operation');
  assert.equal(actual, code);
}

async function main() {
  assert.ok(['identity', 'orders'].includes(service));
  const endpoint = new URL(process.env.DATABASE_URL);
  assert.equal(endpoint.hostname, 'aws-0-us-east-2.pooler.supabase.com');
  assert.equal(endpoint.searchParams.get('sslmode'), 'verify-full');
  assert.ok(endpoint.searchParams.get('sslrootcert'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const schema = service === 'identity' ? 'public' : 'orders';
    const names = service === 'identity'
      ? ['users', 'roles', 'user_roles', 'sessions', 'consents', 'schema_migrations']
      : ['carts', 'cart_items', 'orders', 'order_items', 'fulfillments', 'payments', 'refunds'];
    const meta = await client.query(
      'SELECT c.relname, c.relrowsecurity, c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=ANY($2) AND c.relkind=$3',
      [schema, names, 'r']
    );
    assert.equal(meta.rowCount, names.length);
    assert.ok(meta.rows.every((row) => row.relrowsecurity));
    const constraints = await client.query(
      'SELECT conrelid, contype FROM pg_constraint WHERE conrelid=ANY($1::oid[])',
      [meta.rows.map((row) => row.oid)]
    );
    assert.equal(constraints.rows.filter((row) => row.contype === 'p').length, names.length);
    const foreignKeys = constraints.rows.filter((row) => row.contype === 'f').length;
    assert.equal(foreignKeys, service === 'identity' ? 5 : 7);
    if (service === 'identity') {
      const id = randomUUID();
      const argon2 = createRequire('D:/REPOSITORIO_PRACTICAS/boticaya-identity-service/package.json')('argon2');
      const passwordHash = await argon2.hash(randomBytes(32).toString('hex'));
      await client.query('INSERT INTO public.users (id,full_name,email,password_hash) VALUES ($1,$2,$3,$4)',
        [id, 'Integration Test', randomUUID() + '@example.invalid', passwordHash]);
      await client.query("INSERT INTO public.user_roles (user_id,role_id) SELECT $1,id FROM public.roles WHERE code='customer'", [id]);
      const assigned = await client.query('SELECT role_id FROM public.user_roles WHERE user_id=$1', [id]);
      assert.equal(assigned.rowCount, 1);
      await client.query("INSERT INTO public.consents (id,user_id,type,policy_version) VALUES ($1,$2,'health_data_processing','integration-test')", [randomUUID(), id]);
      await client.query("INSERT INTO public.sessions (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '1 minute')",
        [randomUUID(), id, randomBytes(32).toString('hex')]);
      await expectRejection(client, 'SELECT id FROM orders.orders LIMIT 1', [], '42501');
      await expectRejection(client, 'INSERT INTO public.user_roles (user_id,role_id) VALUES ($1,$2)', [randomUUID(), randomUUID()], '23503');
    } else {
      const cart = randomUUID(), order = randomUUID(), product = randomUUID(), warehouse = randomUUID();
      await client.query('INSERT INTO orders.carts (id,guest_token_hash) VALUES ($1,$2)', [cart, randomBytes(32).toString('hex')]);
      await client.query('INSERT INTO orders.cart_items VALUES ($1,$2,1)', [cart, product]);
      await client.query('UPDATE orders.cart_items SET quantity=2 WHERE cart_id=$1', [cart]);
      assert.equal((await client.query('SELECT quantity FROM orders.cart_items WHERE cart_id=$1', [cart])).rows[0].quantity, 2);
      await client.query("INSERT INTO orders.orders (id,cart_id,contact_name,contact_email,contact_phone,subtotal_cents,delivery_fee_cents) VALUES ($1,$2,'Integration Test','probe@example.invalid','000000000',200,0)", [order, cart]);
      await client.query("INSERT INTO orders.order_items VALUES ($1,$2,'TEST','Integration Test',2,100)", [order, product]);
      await client.query("INSERT INTO orders.fulfillments (order_id,warehouse_id,method) VALUES ($1,$2,'pickup')", [order, warehouse]);
      await client.query("INSERT INTO orders.payments (order_id,fulfillment_method,method,amount_cents) VALUES ($1,'pickup','cash',200)", [order]);
      await expectRejection(client, 'SELECT id FROM public.users LIMIT 1', [], '42501');
      await expectRejection(client, 'INSERT INTO orders.cart_items VALUES ($1,$2,1)', [randomUUID(), product], '23503');
      await expectRejection(client, "INSERT INTO orders.payments (order_id,fulfillment_method,method,amount_cents) VALUES ($1,'delivery','cash',200)", [order], '23514');
    }
    console.log(JSON.stringify({ service, target: 'Supabase', tls: 'verify-full',
      tables: names.length, primaryKeys: names.length, foreignKeys,
      rls: 'enabled', readWrite: 'passed', crossServiceAccess: 'denied',
      foreignKeyRejection: 'passed', testData: 'rolled-back' }));
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}
main().catch((error) => {
  console.error('Verification failed:', error.code ?? error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
