import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSalesStore } from '../state/sales.store';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import { createCheckoutFacade } from './checkout.facade';
import { createMockCheckoutAdapters } from '../data/mockCheckout.adapter';
import type { PaymentResult } from '../domain/Sales';

const document = { name: 'receta.pdf', type: 'application/pdf', size: 100 };
const readyStore = () => {
  const store = createSalesStore();
  store.getState().addProduct(LOCAL_PRODUCTS[0]);
  store.getState().setFulfillment({ type: 'pickup', pharmacyId: 'demo-centro' });
  store
    .getState()
    .setContactAndPayment(
      { fullName: 'Ana Demo', email: 'ana@example.test', phone: '999111222' },
      'demo-card'
    );
  return store;
};
afterEach(() => vi.useRealTimers());

describe('checkout facade and mock boundaries', () => {
  it('requires a complete order and creates an immutable snapshot before clearing', async () => {
    const store = readyStore();
    const facade = createCheckoutFacade(store, createMockCheckoutAdapters({ delayMs: 0 }));
    const order = await facade.confirmOrder();
    expect(order?.id).toBe('DEMO-000001');
    expect(order?.items).toHaveLength(1);
    expect(Object.isFrozen(order)).toBe(true);
    expect(store.getState().cart).toHaveLength(0);
    expect(store.getState().contact).toBeNull();
    expect(await facade.confirmOrder()).toBeNull();
    store.getState().addProduct(LOCAL_PRODUCTS[1]);
    expect(order?.items[0].product.id).toBe(LOCAL_PRODUCTS[0].id);
    expect(await facade.confirmOrder()).toBeNull();
  });

  it.each(['declined', 'error'] as const)(
    'preserves cart when gateway returns %s',
    async (payment) => {
      const store = readyStore();
      const cart = store.getState().cart;
      expect(
        await createCheckoutFacade(
          store,
          createMockCheckoutAdapters({ delayMs: 0, payment })
        ).confirmOrder()
      ).toBeNull();
      expect(store.getState().paymentStatus).toBe(payment);
      expect(store.getState().cart).toBe(cart);
      expect(
        await createCheckoutFacade(store, createMockCheckoutAdapters({ delayMs: 0 })).confirmOrder()
      ).toBeTruthy();
    }
  );

  it('blocks duplicate payment attempts and mutating cart while pending', async () => {
    vi.useFakeTimers();
    const store = readyStore();
    const adapters = createMockCheckoutAdapters({ delayMs: 1000 });
    const pay = vi.spyOn(adapters.payment, 'pay');
    const facade = createCheckoutFacade(store, adapters);
    const first = facade.confirmOrder();
    expect(await facade.confirmOrder()).toBeNull();
    expect(store.getState().addProduct(LOCAL_PRODUCTS[1])).toBe(false);
    expect(pay).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await first).toBeTruthy();
  });

  it('maps unexpected gateway exceptions to a retryable error', async () => {
    const store = readyStore();
    const adapters = createMockCheckoutAdapters({ delayMs: 0 });
    adapters.payment.pay = async (): Promise<PaymentResult> => {
      throw new Error('private details');
    };
    expect(await createCheckoutFacade(store, adapters).confirmOrder()).toBeNull();
    expect(store.getState().paymentStatus).toBe('error');
    expect(store.getState().cart).toHaveLength(1);
  });

  it.each(['approved', 'rejected', 'error'] as const)(
    'handles prescription outcome %s',
    async (prescription) => {
      const store = readyStore();
      const facade = createCheckoutFacade(
        store,
        createMockCheckoutAdapters({ delayMs: 0, prescription })
      );
      expect(await facade.reviewPrescription(document)).toBeTruthy();
      store.getState().addProduct(LOCAL_PRODUCTS[6]);
      expect(await facade.confirmOrder()).toBeNull();
      expect(
        await facade.reviewPrescription({ ...document, type: 'application/zip' })
      ).toBeTruthy();
      expect(await facade.reviewPrescription(document)).toBeNull();
      expect(store.getState().prescription.status).toBe(prescription);
    }
  );

  it('ignores pending review after prescription-required quantities change', async () => {
    vi.useFakeTimers();
    const store = readyStore();
    store.getState().addProduct(LOCAL_PRODUCTS[6]);
    const facade = createCheckoutFacade(store, createMockCheckoutAdapters({ delayMs: 1000 }));
    const first = facade.reviewPrescription(document);
    expect(await facade.reviewPrescription(document)).toBeTruthy();
    store.getState().changeQuantity(LOCAL_PRODUCTS[6].id, 2);
    await vi.advanceTimersByTimeAsync(1000);
    await first;
    expect(store.getState().prescription.status).toBe('idle');
  });

  it('ignores an older review when a replacement is pending', async () => {
    const store = readyStore();
    store.getState().addProduct(LOCAL_PRODUCTS[6]);
    const deferred = (): {
      promise: Promise<'approved' | 'rejected'>;
      resolve: (status: 'approved' | 'rejected') => void;
    } => {
      let complete: (status: 'approved' | 'rejected') => void = () => undefined;
      const promise = new Promise<'approved' | 'rejected'>((resolve) => {
        complete = resolve;
      });
      return { promise, resolve: complete };
    };
    const first = deferred();
    const second = deferred();
    const adapters = createMockCheckoutAdapters({ delayMs: 0 });
    adapters.prescription.review = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const facade = createCheckoutFacade(store, adapters);
    const oldReview = facade.reviewPrescription(document);
    store.getState().changeQuantity(LOCAL_PRODUCTS[6].id, 2);
    store.getState().changeQuantity(LOCAL_PRODUCTS[6].id, 1);
    const replacement = facade.reviewPrescription({ ...document, name: 'replacement.pdf' });
    first.resolve('approved');
    await oldReview;
    expect(store.getState().prescription.status).toBe('pending');
    expect(store.getState().prescription.document?.name).toBe('replacement.pdf');
    second.resolve('rejected');
    await replacement;
    expect(store.getState().prescription.status).toBe('rejected');
  });

  it('maps review exceptions and blocks review during payment', async () => {
    const store = readyStore();
    store.getState().addProduct(LOCAL_PRODUCTS[6]);
    const adapters = createMockCheckoutAdapters({ delayMs: 0 });
    adapters.prescription.review = async () => {
      throw new Error('offline');
    };
    const facade = createCheckoutFacade(store, adapters);
    await facade.reviewPrescription(document);
    expect(store.getState().prescription.status).toBe('error');
    store.setState({ paymentStatus: 'processing' });
    expect(await facade.reviewPrescription(document)).toBeTruthy();
  });
});
