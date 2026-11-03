import { createMockCheckoutAdapters } from '../data/mockCheckout.adapter';
import { salesStore } from '../state/sales.store';
import { createCheckoutFacade } from './checkout.facade';

export const checkoutFacade = createCheckoutFacade(salesStore, createMockCheckoutAdapters());
