import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { OrderInput } from './order.schema.js';

export class OrderConflict extends Error {
  constructor(
    public readonly code: 'insufficient_stock' | 'unknown_product' | 'idempotency_conflict'
  ) {
    super(code);
  }
}

interface StockRow {
  id: string;
  sku: string;
  name: string;
  price_in_cents: number;
  available_quantity: number;
  requires_prescription: boolean;
}

export interface ReceivedOrder {
  id: string;
  status: 'pending';
  subtotalInCents: number;
  requiresPrescriptionReview: boolean;
  items: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPriceInCents: number;
  }[];
}

export async function receiveOrder(pool: Pool, input: OrderInput, idempotencyKey: string) {
  const items = [...input.items].sort((left, right) =>
    left.productId.localeCompare(right.productId)
  );
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ contact: input.contact, fulfillment: input.fulfillment, items }))
    .digest('hex');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [idempotencyKey]);
    const existing = await client.query<{ request_hash: string; response: ReceivedOrder }>(
      'SELECT request_hash, response FROM public.orders WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    const previous = existing.rows[0];
    if (previous) {
      if (previous.request_hash !== requestHash) throw new OrderConflict('idempotency_conflict');
      await client.query('COMMIT');
      return { order: previous.response, replayed: true };
    }

    const stock = await client.query<StockRow>(
      `SELECT id, sku, name, price_in_cents, available_quantity, requires_prescription
       FROM public.products WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
      [items.map((item) => item.productId)]
    );
    const products = new Map(stock.rows.map((product) => [product.id, product]));
    const lines = items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new OrderConflict('unknown_product');
      if (product.available_quantity < item.quantity) throw new OrderConflict('insufficient_stock');
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPriceInCents: product.price_in_cents,
      };
    });

    const order: ReceivedOrder = {
      id: randomUUID(),
      status: 'pending',
      subtotalInCents: lines.reduce(
        (total, line) => total + line.unitPriceInCents * line.quantity,
        0
      ),
      requiresPrescriptionReview: stock.rows.some((product) => product.requires_prescription),
      items: lines,
    };
    await client.query(
      `INSERT INTO public.orders
       (id, idempotency_key, request_hash, contact, fulfillment, response)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order.id, idempotencyKey, requestHash, input.contact, input.fulfillment, order]
    );
    for (const line of lines) {
      await client.query(
        `INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_in_cents)
         VALUES ($1, $2, $3, $4)`,
        [order.id, line.productId, line.quantity, line.unitPriceInCents]
      );
      await client.query(
        'UPDATE public.products SET available_quantity = available_quantity - $1 WHERE id = $2',
        [line.quantity, line.productId]
      );
    }
    await client.query('COMMIT');
    return { order, replayed: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
