import assert from 'node:assert/strict';

const baseUrl = new URL(
  process.env.BOTICAYA_API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 8081}`
);
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(baseUrl.hostname),
  'La prueba requiere una API local.'
);
assert.equal(baseUrl.protocol, 'http:', 'La prueba requiere HTTP local.');
const key = process.env.BOTICAYA_TEST_ORDER_KEY;
assert.match(
  key ?? '',
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Define BOTICAYA_TEST_ORDER_KEY con un UUID y reutilízalo para repetir esta prueba.'
);

async function readInventory() {
  const response = await fetch(new URL('/api/inventory', baseUrl), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, 'No se pudo consultar el inventario.');
  const inventory = await response.json();
  assert.ok(Array.isArray(inventory));
  const product = inventory.find((item) => item.sku === 'BY-0001');
  assert.ok(product, 'BY-0001 no existe en el inventario.');
  assert.ok(Number.isInteger(product.availableQuantity) && product.availableQuantity >= 0);
  return product;
}

const before = await readInventory();
const payload = {
  contact: { fullName: 'Prueba local', email: 'prueba@example.invalid', phone: '999888777' },
  fulfillment: { type: 'pickup', pharmacyId: 'botica-local' },
  items: [{ productId: before.productId, quantity: 1 }],
};
async function submit() {
  const response = await fetch(new URL('/api/orders', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  assert.ok(
    [200, 201].includes(response.status),
    `No se recibió el pedido: HTTP ${response.status}, ${body.error ?? 'error'}.`
  );
  return { status: response.status, body };
}

process.stdout.write(
  'Prueba local: reserva una unidad con una clave nueva; reutilizarla no vuelve a reservar.\n'
);
const first = await submit();
assert.equal(first.body.status, 'pending');
assert.equal(first.body.items.length, 1);
assert.equal(first.body.items[0].productId, before.productId);
assert.equal(first.body.items[0].quantity, 1);
const after = await readInventory();
assert.equal(after.availableQuantity, before.availableQuantity - (first.status === 201 ? 1 : 0));
const retry = await submit();
assert.equal(retry.status, 200);
assert.deepEqual(retry.body, first.body);
const afterRetry = await readInventory();
assert.equal(afterRetry.availableQuantity, after.availableQuantity);
process.stdout.write(
  JSON.stringify({
    orderId: first.body.id,
    status: first.body.status,
    idempotencyKey: key,
    before: before.availableQuantity,
    after: after.availableQuantity,
    afterRetry: afterRetry.availableQuantity,
    replayed: first.status === 200,
  }) + '\n'
);
