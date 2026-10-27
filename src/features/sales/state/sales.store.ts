import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { Product } from '../../products/domain/Product';
import type {
  CartLine,
  CheckoutContext,
  Contact,
  Fulfillment,
  Order,
  PaymentMethod,
} from '../domain/Sales';
import { prescriptionSignature, validQuantity } from '../utils/checkout.util';

export interface SalesState extends CheckoutContext {
  readonly paymentStatus: 'idle' | 'processing' | 'declined' | 'error';
  readonly order: Order | null;
  addProduct: (product: Product) => boolean;
  changeQuantity: (id: string, quantity: number) => boolean;
  removeProduct: (id: string) => void;
  setFulfillment: (value: Fulfillment) => void;
  setContactAndPayment: (contact: Contact, method: PaymentMethod) => void;
  reset: () => void;
}
const initialState = (): Pick<SalesState, keyof CheckoutContext | 'paymentStatus' | 'order'> => ({
  cart: [],
  prescription: { status: 'idle', signature: '' },
  fulfillment: null,
  contact: null,
  paymentMethod: null,
  paymentStatus: 'idle',
  order: null,
});
export const createSalesStore = () =>
  createStore<SalesState>((set, get) => {
    const updateCart = (cart: readonly CartLine[]): void =>
      set((state) => ({
        cart,
        paymentStatus: 'idle',
        prescription:
          prescriptionSignature(cart) === prescriptionSignature(state.cart)
            ? state.prescription
            : { status: 'idle', signature: '' },
      }));
    return {
      ...initialState(),
      addProduct: (product) => {
        const state = get();
        if (state.paymentStatus === 'processing' || !product.inStock) return false;
        const current = state.cart.find((line) => line.product.id === product.id);
        const quantity = (current?.quantity ?? 0) + 1;
        if (!validQuantity(quantity, product.availableQuantity)) return false;
        updateCart(
          current
            ? state.cart.map((line) =>
                line.product.id === product.id ? { ...line, quantity } : line
              )
            : [...state.cart, { product, quantity }]
        );
        return true;
      },
      changeQuantity: (id, quantity) => {
        const state = get();
        const line = state.cart.find((entry) => entry.product.id === id);
        if (
          state.paymentStatus === 'processing' ||
          !line ||
          !validQuantity(quantity, line.product.availableQuantity)
        )
          return false;
        updateCart(
          state.cart.map((entry) => (entry.product.id === id ? { ...entry, quantity } : entry))
        );
        return true;
      },
      removeProduct: (id) => {
        if (get().paymentStatus !== 'processing')
          updateCart(get().cart.filter((line) => line.product.id !== id));
      },
      setFulfillment: (fulfillment) => {
        if (get().paymentStatus !== 'processing') set({ fulfillment, paymentStatus: 'idle' });
      },
      setContactAndPayment: (contact, paymentMethod) => {
        if (get().paymentStatus !== 'processing')
          set({ contact, paymentMethod, paymentStatus: 'idle' });
      },
      reset: () => {
        if (get().paymentStatus !== 'processing') set(initialState());
      },
    };
  });
export const salesStore = createSalesStore();
export const useSalesStore = <T>(selector: (state: SalesState) => T): T =>
  useStore(salesStore, selector);
