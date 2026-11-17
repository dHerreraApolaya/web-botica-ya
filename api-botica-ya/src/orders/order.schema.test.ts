import { describe, expect, it } from 'vitest';
import { idempotencyKeySchema, orderSchema } from './order.schema.js';

const order = {
  contact: { fullName: 'Test Customer', email: 'test@example.org', phone: '999888777' },
  fulfillment: { type: 'pickup', pharmacyId: 'botica-1' },
  items: [{ productId: 'product-0001', quantity: 1 }],
};

describe('order input', () => {
  it('accepts pickup and delivery and supplies an empty optional delivery reference', () => {
    expect(orderSchema.parse(order).items).toEqual(order.items);
    expect(
      orderSchema.parse({
        ...order,
        fulfillment: {
          type: 'delivery',
          district: 'Lima',
          address: 'Test address',
        },
      }).fulfillment
    ).toEqual({ type: 'delivery', district: 'Lima', address: 'Test address', reference: '' });
  });

  const invalidItems = [
    [],
    [{ productId: 'product-0001', quantity: 0 }],
    [{ productId: 'product-0001', quantity: -1 }],
    [{ productId: 'product-0001', quantity: 1.5 }],
    [{ productId: 'product-0001', quantity: '1' }],
    [{ productId: 'product-0001', quantity: 1001 }],
    [{ productId: '', quantity: 1 }],
    [{ productId: 'product-0001', quantity: 1, priceInCents: 1 }],
    [...order.items, ...order.items],
    Array.from({ length: 101 }, (_, index) => ({ productId: `product-${index}`, quantity: 1 })),
  ];

  it.each(invalidItems.map((items) => ({ items })))('rejects invalid item list %#', ({ items }) => {
    expect(orderSchema.safeParse({ ...order, items }).success).toBe(false);
  });

  it('rejects untrusted prices, prescription approvals, malformed contact and fulfillment', () => {
    for (const invalid of [
      { ...order, total: 1 },
      { ...order, prescription: { status: 'approved' } },
      { ...order, contact: { ...order.contact, email: 'invalid' } },
      { ...order, contact: { ...order.contact, phone: '<script>' } },
      { ...order, fulfillment: { type: 'delivery', address: 'x' } },
    ])
      expect(orderSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires a UUID idempotency key and normalizes case', () => {
    expect(idempotencyKeySchema.safeParse('invalid').success).toBe(false);
    expect(idempotencyKeySchema.parse('550E8400-E29B-41D4-A716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });
});
