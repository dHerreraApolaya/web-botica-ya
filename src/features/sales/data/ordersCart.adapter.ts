import { z } from 'zod';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import type { CartLine } from '../domain/Sales';
import { salesStore } from '../state/sales.store';

const prefix = 'b071ca00-0000-4000-8000-';
const productIds = new Map(
  LOCAL_PRODUCTS.map((product) => [product.id, prefix + product.sku.slice(3).padStart(12, '0')])
);
const productsById = new Map(
  LOCAL_PRODUCTS.map((product) => [productIds.get(product.id), product])
);
const remoteCart = z.object({
  cart: z.object({ status: z.string() }).nullable(),
  items: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().positive() })),
});

async function request(path: string, method = 'GET', quantity?: number): Promise<Response> {
  const response = await fetch('/v1/orders/cart' + path, {
    method,
    credentials: 'same-origin',
    signal: AbortSignal.timeout(5000),
    ...(quantity === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) }),
  });
  if (!response.ok) throw new Error('Cart synchronization failed');
  return response;
}

let currentSync: Promise<void> | undefined;
let saved = new Map<string, number>();
let initialized = false;

async function synchronize(): Promise<void> {
  if (!initialized) {
    const response = await request('');
    const remote = remoteCart.parse(await response.json());
    const restored: CartLine[] = [];
    if (remote.cart?.status === 'active') {
      for (const item of remote.items) {
        const product = productsById.get(item.productId);
        if (product) restored.push({ product, quantity: item.quantity });
      }
    }
    saved = new Map(restored.map(({ product, quantity }) => [product.id, quantity]));
    initialized = true;
    if (restored.length) {
      const local = salesStore.getState().cart;
      const localIds = new Set(local.map(({ product }) => product.id));
      salesStore.setState({
        cart: [...local, ...restored.filter(({ product }) => !localIds.has(product.id))],
      });
    }
  }
  for (;;) {
    const cart = salesStore.getState().cart;
    const desired = new Map(
      cart
        .filter(({ product }) => productIds.has(product.id))
        .map(({ product, quantity }) => [product.id, quantity])
    );
    const changed = [...new Set([...saved.keys(), ...desired.keys()])].filter(
      (id) => saved.get(id) !== desired.get(id)
    );
    if (!changed.length) return;
    await request('', 'POST');
    for (const id of changed) {
      const remoteId = productIds.get(id);
      if (!remoteId) continue;
      const quantity = desired.get(id) ?? 0;
      await request('/items/' + remoteId, 'PUT', quantity);
      if (quantity) saved.set(id, quantity);
      else saved.delete(id);
    }
  }
}

export function syncOrdersCart(): Promise<void> {
  currentSync ??= synchronize().finally(() => {
    currentSync = undefined;
  });
  return currentSync;
}
