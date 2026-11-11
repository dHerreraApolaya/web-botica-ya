import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

const databaseUrl = process.env.BOTICAYA_TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Set BOTICAYA_TEST_DATABASE_URL to a disposable database ending in _test');
}
const pool = new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5000 });
let server: Server;
let baseUrl: string;

const product = {
  id: 'product-0001',
  sku: 'BY-0001',
  name: 'Paracetamol 500 mg Vitaluna',
  category: 'Medicamentos',
  brand: 'Vitaluna',
  presentation: 'Paquete de 1 unidad',
  priceInCents: 450,
  availableQuantity: 5,
  inStock: true,
  requiresPrescription: false,
  isFeatured: true,
};
const orderInput = {
  contact: { fullName: 'Test Customer', email: 'test@example.org', phone: '999888777' },
  fulfillment: { type: 'pickup', pharmacyId: 'botica-1' },
  items: [{ productId: 'product-0001', quantity: 2 }],
};

async function postOrder(body: unknown = orderInput, key: string = randomUUID()) {
  return fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(body),
  });
}

async function availableQuantity() {
  const result = await pool.query<{ available_quantity: number }>(
    'SELECT available_quantity FROM public.products WHERE id = $1',
    ['product-0001']
  );
  return result.rows[0]?.available_quantity;
}

beforeAll(async () => {
  const fixture = await readFile(new URL('../sql/catalogo-prueba.sql', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../sql/001-orders.sql', import.meta.url), 'utf8');
  await pool.query(fixture.replace(/^\uFEFF/, ''));
  await pool.query(migration);
  await pool.query(migration);
  server = createApp(pool, { ordersEnabled: true }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await pool.query('TRUNCATE public.order_items, public.orders, public.products');
  const fixture = await readFile(new URL('../sql/catalogo-prueba.sql', import.meta.url), 'utf8');
  await pool.query(fixture.replace(/^\uFEFF/, ''));
});

afterAll(async () => {
  vi.restoreAllMocks();
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  await pool.end();
});

describe('Express with real PostgreSQL', () => {
  it('returns exactly the Spring catalog contract and BY-0001 with five units', async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-powered-by')).toBeNull();
    expect(await response.json()).toEqual([product]);
  });

  it('returns inventory and derives out-of-stock from the database', async () => {
    expect(await (await fetch(`${baseUrl}/api/inventory`)).json()).toEqual([
      { productId: product.id, sku: product.sku, availableQuantity: 5, inStock: true },
    ]);
    await pool.query('UPDATE public.products SET available_quantity = 0');
    expect(await (await fetch(`${baseUrl}/api/products`)).json()).toEqual([
      { ...product, availableQuantity: 0, inStock: false },
    ]);
  });

  it('keeps product ordering and handles an empty catalog', async () => {
    await pool.query(`INSERT INTO public.products SELECT 'product-0000', 'BY-0000', name,
      category, brand, presentation, price_in_cents, available_quantity, requires_prescription,
      is_featured FROM public.products WHERE id = 'product-0001'`);
    const products = await (await fetch(`${baseUrl}/api/products`)).json();
    expect(products.map((item: { id: string }) => item.id)).toEqual([
      'product-0000',
      'product-0001',
    ]);
    await pool.query('DELETE FROM public.products');
    expect(await (await fetch(`${baseUrl}/api/products`)).json()).toEqual([]);
  });

  it('receives a pending order using server prices and reserves stock atomically', async () => {
    const response = await postOrder();
    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order).toEqual({
      id: expect.any(String),
      status: 'pending',
      subtotalInCents: 900,
      requiresPrescriptionReview: false,
      items: [
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: 2,
          unitPriceInCents: 450,
        },
      ],
    });
    expect(await availableQuantity()).toBe(3);
    expect((await pool.query('SELECT contact, fulfillment FROM public.orders')).rows).toEqual([
      { contact: orderInput.contact, fulfillment: orderInput.fulfillment },
    ]);
    expect(
      (await pool.query('SELECT quantity, unit_price_in_cents FROM public.order_items')).rows
    ).toEqual([{ quantity: 2, unit_price_in_cents: 450 }]);
  });

  it('marks prescription products for manual review and does not approve prescriptions', async () => {
    await pool.query('UPDATE public.products SET requires_prescription = true');
    const response = await postOrder({
      ...orderInput,
      fulfillment: {
        type: 'delivery',
        district: 'Lima',
        address: 'Test address',
        reference: 'Test reference',
      },
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      status: 'pending',
      requiresPrescriptionReview: true,
    });
  });

  it('replays concurrent retries once, including UUID keys with different case', async () => {
    const key = randomUUID();
    const responses = await Promise.all([
      postOrder(orderInput, key),
      postOrder(orderInput, key.toUpperCase()),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 201]);
    const [first, second] = await Promise.all(responses.map((response) => response.json()));
    expect(first).toEqual(second);
    expect(await availableQuantity()).toBe(3);
    expect(
      (await pool.query('SELECT count(*)::int AS count FROM public.orders')).rows[0]?.count
    ).toBe(1);
  });

  it('rejects reuse of an idempotency key with changed order details', async () => {
    const key = randomUUID();
    await postOrder(orderInput, key);
    const response = await postOrder(
      { ...orderInput, items: [{ productId: product.id, quantity: 1 }] },
      key
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'idempotency_conflict' });
    expect(await availableQuantity()).toBe(3);
  });

  it('prevents overselling when two different orders race for the same stock', async () => {
    const body = { ...orderInput, items: [{ productId: product.id, quantity: 4 }] };
    const responses = await Promise.all([postOrder(body), postOrder(body)]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await availableQuantity()).toBe(1);
    expect(
      (await pool.query('SELECT count(*)::int AS count FROM public.orders')).rows[0]?.count
    ).toBe(1);
  });

  it('rejects unknown products and insufficient stock without persisting any order', async () => {
    for (const [productId, quantity, error] of [
      ['missing', 1, 'unknown_product'],
      ['product-0001', 6, 'insufficient_stock'],
    ] as const) {
      const response = await postOrder({ ...orderInput, items: [{ productId, quantity }] });
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error });
    }
    expect(await availableQuantity()).toBe(5);
    expect((await pool.query('SELECT * FROM public.orders')).rows).toEqual([]);
  });

  it('uses consistent locks for reversed multi-product carts', async () => {
    await pool.query(`INSERT INTO public.products SELECT 'product-0002', 'BY-0002', name,
      category, brand, presentation, price_in_cents, available_quantity, requires_prescription,
      is_featured FROM public.products WHERE id = 'product-0001'`);
    const items = [
      { productId: 'product-0001', quantity: 1 },
      { productId: 'product-0002', quantity: 1 },
    ];
    const responses = await Promise.all([
      postOrder({ ...orderInput, items }),
      postOrder({ ...orderInput, items: [...items].reverse() }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(await availableQuantity()).toBe(3);
    const key = randomUUID();
    const first = await postOrder({ ...orderInput, items }, key);
    const replay = await postOrder({ ...orderInput, items: [...items].reverse() }, key);
    expect(replay.status).toBe(200);
    expect(await first.json()).toEqual(await replay.json());
  });

  it('rolls back earlier stock changes if a later line fails to persist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await pool.query(`INSERT INTO public.products SELECT 'product-0002', 'BY-0002', name,
      category, brand, presentation, price_in_cents, available_quantity, requires_prescription,
      is_featured FROM public.products WHERE id = 'product-0001'`);
    await pool.query(
      'ALTER TABLE public.order_items ADD CONSTRAINT test_forced_failure CHECK (quantity < 3)'
    );
    try {
      const response = await postOrder({
        ...orderInput,
        items: [
          { productId: 'product-0001', quantity: 1 },
          { productId: 'product-0002', quantity: 3 },
        ],
      });
      expect(response.status).toBe(503);
      expect(await availableQuantity()).toBe(5);
      expect((await pool.query('SELECT * FROM public.orders')).rows).toEqual([]);
      expect((await pool.query('SELECT * FROM public.order_items')).rows).toEqual([]);
    } finally {
      await pool.query('ALTER TABLE public.order_items DROP CONSTRAINT test_forced_failure');
    }
  });

  it('validates bodies and idempotency keys before accessing the database', async () => {
    for (const [body, key] of [
      [orderInput, 'bad-key'],
      [{ ...orderInput, total: 1 }, randomUUID()],
      [{ ...orderInput, items: [...orderInput.items, ...orderInput.items] }, randomUUID()],
    ] as const) {
      expect((await postOrder(body, key)).status).toBe(400);
    }
    const missingKey = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderInput),
    });
    expect(missingKey.status).toBe(400);
    expect(await availableQuantity()).toBe(5);
  });

  it('handles invalid JSON, unsupported encoding and oversized payloads', async () => {
    for (const [body, type, status] of [
      ['{', 'application/json', 400],
      [JSON.stringify(orderInput), 'application/json; charset=iso-8859-1', 415],
      [JSON.stringify({ padding: 'x'.repeat(40000) }), 'application/json', 413],
    ] as const) {
      const response = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': type },
        body,
      });
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ error: 'invalid_body' });
    }
  });

  it('returns a generic 503 on database failure and never substitutes seed data', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('private connection details'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await fetch(`${baseUrl}/api/products`);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'service_unavailable',
      message: 'Servicio temporalmente no disponible.',
    });
    expect(console.error).toHaveBeenCalledWith('API database operation failed');
  });

  it('keeps order reception off by default and returns JSON for unknown routes', async () => {
    const catalogOnly = createApp(pool).listen(0, '127.0.0.1');
    await once(catalogOnly, 'listening');
    try {
      const response = await fetch(
        `http://127.0.0.1:${(catalogOnly.address() as AddressInfo).port}/api/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderInput),
        }
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: 'not_found' });
    } finally {
      await new Promise<void>((resolve) => catalogOnly.close(() => resolve()));
    }
  });
});
