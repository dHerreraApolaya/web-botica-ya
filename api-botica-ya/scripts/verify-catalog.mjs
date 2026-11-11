import assert from 'node:assert/strict';

const baseUrl = process.env.BOTICAYA_API_URL ?? 'http://127.0.0.1:8081';
const response = await fetch(new URL('/api/products', baseUrl), {
  signal: AbortSignal.timeout(10000),
});
assert.equal(response.status, 200, 'GET /api/products must return HTTP 200');
const products = await response.json();
assert.ok(Array.isArray(products), 'The response must be a JSON array');
const expectedFields = [
  'id',
  'sku',
  'name',
  'category',
  'brand',
  'presentation',
  'priceInCents',
  'availableQuantity',
  'inStock',
  'requiresPrescription',
  'isFeatured',
].sort();
for (const product of products) {
  assert.deepEqual(Object.keys(product).sort(), expectedFields);
  for (const field of ['id', 'sku', 'name', 'category', 'brand', 'presentation']) {
    assert.equal(typeof product[field], 'string', field);
  }
  assert.ok(Number.isInteger(product.priceInCents) && product.priceInCents >= 0);
  assert.ok(Number.isInteger(product.availableQuantity) && product.availableQuantity >= 0);
  assert.equal(product.inStock, product.availableQuantity > 0);
  assert.equal(typeof product.requiresPrescription, 'boolean');
  assert.equal(typeof product.isFeatured, 'boolean');
}
assert.equal(products.filter((product) => product.sku === 'BY-0001').length, 1);
assert.equal(products.find((product) => product.sku === 'BY-0001').availableQuantity, 5);
if (process.env.BOTICAYA_SPRING_URL) {
  const spring = await fetch(new URL('/api/products', process.env.BOTICAYA_SPRING_URL), {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(spring.status, 200);
  assert.deepEqual(
    products,
    await spring.json(),
    'Express and Spring must return the same catalog'
  );
}
process.stdout.write(
  'Verified GET /api/products: BY-0001, availableQuantity=5, compatible JSON.\n'
);
