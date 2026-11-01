import { describe, expect, it } from 'vitest';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import { createSalesStore } from './sales.store';
import { prescriptionSignature } from '../utils/checkout.util';

describe('cart state', () => {
  it('combines additions and enforces stock and quantity limits', () => {
    const store = createSalesStore();
    const actions = store.getState();
    expect(actions.addProduct(LOCAL_PRODUCTS[10])).toBe(false);
    for (let unit = 0; unit < LOCAL_PRODUCTS[0].availableQuantity; unit += 1)
      expect(actions.addProduct(LOCAL_PRODUCTS[0])).toBe(true);
    expect(actions.addProduct(LOCAL_PRODUCTS[0])).toBe(false);
    expect(store.getState().cart).toHaveLength(1);
    expect(actions.changeQuantity('missing', 1)).toBe(false);
    expect(actions.changeQuantity(LOCAL_PRODUCTS[0].id, 0)).toBe(false);
    expect(actions.changeQuantity(LOCAL_PRODUCTS[0].id, 2)).toBe(true);
    actions.addProduct(LOCAL_PRODUCTS[1]);
    actions.changeQuantity(LOCAL_PRODUCTS[0].id, 1);
    expect(store.getState().cart[1].quantity).toBe(1);
    actions.removeProduct(LOCAL_PRODUCTS[0].id);
    expect(store.getState().cart).toHaveLength(1);
    actions.reset();
    expect(store.getState().cart).toEqual([]);
  });

  it('invalidates prescription approval only when required lines change', () => {
    const store = createSalesStore();
    store.getState().addProduct(LOCAL_PRODUCTS[6]);
    const approved = {
      status: 'approved' as const,
      signature: prescriptionSignature(store.getState().cart),
    };
    store.setState({ prescription: approved });
    store.getState().addProduct(LOCAL_PRODUCTS[0]);
    expect(store.getState().prescription).toBe(approved);
    store.getState().changeQuantity(LOCAL_PRODUCTS[6].id, 2);
    expect(store.getState().prescription.status).toBe('idle');
    store.getState().removeProduct(LOCAL_PRODUCTS[6].id);
    expect(prescriptionSignature(store.getState().cart)).toBe('');
  });

  it('locks every mutation during payment processing', () => {
    const store = createSalesStore();
    store.getState().addProduct(LOCAL_PRODUCTS[0]);
    store.setState({ paymentStatus: 'processing' });
    const original = store.getState();
    expect(original.addProduct(LOCAL_PRODUCTS[1])).toBe(false);
    expect(original.changeQuantity(LOCAL_PRODUCTS[0].id, 2)).toBe(false);
    original.removeProduct(LOCAL_PRODUCTS[0].id);
    original.setFulfillment({ type: 'pickup', pharmacyId: 'demo-centro' });
    original.setContactAndPayment(
      { fullName: 'Ana', email: 'ana@example.test', phone: '999111222' },
      'demo-wallet'
    );
    original.reset();
    expect(store.getState()).toBe(original);
  });

  it('handles functional volume using all available catalog products', () => {
    const store = createSalesStore();
    const available = LOCAL_PRODUCTS.filter((product) => product.inStock);
    available.forEach((product) => store.getState().addProduct(product));
    expect(store.getState().cart).toHaveLength(available.length);
    expect(new Set(store.getState().cart.map((line) => line.product.id)).size).toBe(
      available.length
    );
  });
});
