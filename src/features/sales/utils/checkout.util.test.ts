import { describe, expect, it } from 'vitest';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import {
  CHECKOUT_DATA,
  calculatePricing,
  contactSchema,
  createOrderSnapshot,
  formatPrice,
  formatCount,
  fulfillmentSchema,
  prescriptionSignature,
  validatePrescriptionDocument,
  validQuantity,
} from './checkout.util';
import { accessibleStep, earliestIncompleteStep } from '../state/checkout.state';
import { createSalesStore } from '../state/sales.store';

const contact = { fullName: ' Ana María ', email: ' ANA@example.test ', phone: '999111222' };
const pickup = { type: 'pickup' as const, pharmacyId: 'demo-centro' };
const document = { name: 'prueba.pdf', type: 'application/pdf', size: 100 };

describe('checkout rules', () => {
  it('calculates integer-cent prices, delivery and pickup, including an empty cart', () => {
    const cart = [{ product: LOCAL_PRODUCTS[0], quantity: 2 }];
    expect(calculatePricing(cart, null)).toEqual({ subtotal: 900, delivery: 0, total: 900 });
    expect(
      calculatePricing(cart, {
        type: 'delivery',
        district: CHECKOUT_DATA.districts[0],
        address: 'Calle Demo 123',
        reference: '',
      })
    ).toEqual({ subtotal: 900, delivery: 800, total: 1700 });
    expect(calculatePricing(cart, pickup).total).toBe(900);
    expect(calculatePricing([], pickup).total).toBe(0);
    expect(formatPrice(450)).toMatch(/S\/\s*4\.50/);
    expect(formatCount(1, 'unidad', 'unidades')).toBe('1 unidad');
    expect(formatCount(2, 'unidad', 'unidades')).toBe('2 unidades');
  });

  it('validates contact, supported locations and available pharmacies', () => {
    expect(contactSchema.safeParse({ ...contact, phone: '-------' }).success).toBe(false);
    expect(contactSchema.parse(contact)).toEqual({
      ...contact,
      fullName: 'Ana María',
      email: 'ana@example.test',
    });
    expect(contactSchema.safeParse({ fullName: '', email: 'bad', phone: '---abcd' }).success).toBe(
      false
    );
    expect(fulfillmentSchema.safeParse(pickup).success).toBe(true);
    expect(fulfillmentSchema.safeParse({ type: 'pickup', pharmacyId: 'demo-sur' }).success).toBe(
      false
    );
    expect(fulfillmentSchema.safeParse({ type: 'pickup', pharmacyId: 'missing' }).success).toBe(
      false
    );
    expect(
      fulfillmentSchema.safeParse({
        type: 'delivery',
        district: 'Other',
        address: '',
        reference: '',
      }).success
    ).toBe(false);
  });

  it('accepts only positive integer quantities within stock', () => {
    for (const quantity of [0, -1, 1.5, NaN, Infinity, 6])
      expect(validQuantity(quantity, 5)).toBe(false);
    expect(validQuantity(1, 5)).toBe(true);
    expect(validQuantity(5, 5)).toBe(true);
  });

  it('validates synthetic prescription metadata without reading file content', () => {
    for (const [name, type] of [
      ['sample.PDF', 'application/pdf'],
      ['sample.jpg', 'image/jpeg'],
      ['sample.jpeg', 'image/jpeg'],
      ['sample.png', 'image/png'],
    ]) {
      expect(validatePrescriptionDocument({ name, type, size: 5 * 1024 * 1024 })).toBeNull();
    }
    for (const sample of [
      { ...document, name: 'file.exe' },
      { ...document, type: 'text/html' },
      { ...document, size: 0 },
      { ...document, size: 5 * 1024 * 1024 + 1 },
      { ...document, name: '' },
    ])
      expect(validatePrescriptionDocument(sample)).toBeTruthy();
  });

  it('guards progression and permits only accessible earlier steps', () => {
    const store = createSalesStore();
    store.getState().addProduct(LOCAL_PRODUCTS[0]);
    expect(earliestIncompleteStep(store.getState())).toBe('fulfillment');
    expect(accessibleStep('review', store.getState())).toBe('fulfillment');
    expect(accessibleStep(undefined, store.getState())).toBe('fulfillment');
    expect(accessibleStep('invalid', store.getState())).toBe('fulfillment');
    expect(accessibleStep('prescription', store.getState())).toBe('fulfillment');
    store.getState().setFulfillment(pickup);
    expect(earliestIncompleteStep(store.getState())).toBe('payment');
    store.getState().setContactAndPayment(contactSchema.parse(contact), 'demo-card');
    expect(earliestIncompleteStep(store.getState())).toBe('review');
    expect(accessibleStep('fulfillment', store.getState())).toBe('fulfillment');
    store.getState().addProduct(LOCAL_PRODUCTS[6]);
    expect(earliestIncompleteStep(store.getState())).toBe('prescription');
    store.setState({ prescription: { status: 'approved', signature: 'stale' } });
    expect(earliestIncompleteStep(store.getState())).toBe('prescription');
    store.setState({
      prescription: { status: 'approved', signature: prescriptionSignature(store.getState().cart) },
    });
    expect(earliestIncompleteStep(store.getState())).toBe('review');
    const draft = {
      items: store.getState().cart,
      fulfillment: pickup,
      contact: contactSchema.parse(contact),
      paymentMethod: 'demo-card' as const,
      pricing: calculatePricing(store.getState().cart, pickup),
      prescription: { status: 'approved' as const, signature: 'test', document },
    };
    const order = createOrderSnapshot(draft, 'DEMO-1');
    expect(Object.isFrozen(order)).toBe(true);
    expect(Object.isFrozen(order.items[0].product)).toBe(true);
    expect(Object.isFrozen(order.prescription.document)).toBe(true);
    expect(
      createOrderSnapshot({ ...draft, prescription: { status: 'idle', signature: '' } }, 'DEMO-2')
        .prescription.document
    ).toBeUndefined();
  });
});
