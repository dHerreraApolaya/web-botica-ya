import type { StoreApi } from 'zustand/vanilla';
import type { SalesState } from '../state/sales.store';
import type {
  Order,
  PaymentAdapter,
  PrescriptionAdapter,
  PrescriptionDocument,
} from '../domain/Sales';
import { earliestIncompleteStep } from '../state/checkout.state';
import {
  calculatePricing,
  createOrderSnapshot,
  prescriptionSignature,
  validatePrescriptionDocument,
} from '../utils/checkout.util';

export const createCheckoutFacade = (
  store: StoreApi<SalesState>,
  adapters: { payment: PaymentAdapter; prescription: PrescriptionAdapter }
) => {
  let reviewVersion = 0;
  return {
    async reviewPrescription(document: PrescriptionDocument): Promise<string | null> {
      const state = store.getState();
      const signature = prescriptionSignature(state.cart);
      if (
        !signature ||
        state.prescription.status === 'pending' ||
        state.paymentStatus === 'processing'
      )
        return 'No se puede revisar la receta en este momento.';
      const error = validatePrescriptionDocument(document);
      if (error) return error;
      const version = ++reviewVersion;
      store.setState({ prescription: { status: 'pending', signature, document: { ...document } } });
      try {
        const status = await adapters.prescription.review(document);
        if (
          version === reviewVersion &&
          prescriptionSignature(store.getState().cart) === signature &&
          store.getState().prescription.status === 'pending'
        )
          store.setState({ prescription: { status, signature, document: { ...document } } });
      } catch {
        if (
          version === reviewVersion &&
          prescriptionSignature(store.getState().cart) === signature &&
          store.getState().prescription.status === 'pending'
        )
          store.setState({
            prescription: { status: 'error', signature, document: { ...document } },
          });
      }
      return null;
    },
    async confirmOrder(): Promise<Order | null> {
      const state = store.getState();
      if (
        !state.cart.length ||
        state.paymentStatus === 'processing' ||
        earliestIncompleteStep(state) !== 'review' ||
        !state.fulfillment ||
        !state.contact ||
        !state.paymentMethod
      )
        return null;
      const draft = createOrderSnapshot(
        {
          items: state.cart,
          fulfillment: state.fulfillment,
          contact: state.contact,
          paymentMethod: state.paymentMethod,
          prescription: state.prescription,
          pricing: calculatePricing(state.cart, state.fulfillment),
        },
        'pending'
      );
      store.setState({ paymentStatus: 'processing' });
      try {
        const result = await adapters.payment.pay(draft);
        if (result.status !== 'approved') {
          store.setState({ paymentStatus: result.status });
          return null;
        }
        const order = createOrderSnapshot(draft, result.orderId);
        store.setState({
          order,
          cart: [],
          prescription: { status: 'idle', signature: '' },
          contact: null,
          fulfillment: null,
          paymentMethod: null,
          paymentStatus: 'idle',
        });
        return order;
      } catch {
        store.setState({ paymentStatus: 'error' });
        return null;
      }
    },
  };
};
export type CheckoutFacade = ReturnType<typeof createCheckoutFacade>;
