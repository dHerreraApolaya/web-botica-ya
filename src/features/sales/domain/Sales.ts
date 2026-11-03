import type { Product } from '../../products/domain/Product';

export interface CartLine {
  readonly product: Product;
  readonly quantity: number;
}
export interface Contact {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}
export type Fulfillment =
  | {
      readonly type: 'delivery';
      readonly district: string;
      readonly address: string;
      readonly reference: string;
    }
  | { readonly type: 'pickup'; readonly pharmacyId: string };
export type PaymentMethod = 'demo-card' | 'demo-wallet';
export type CheckoutStep = 'prescription' | 'fulfillment' | 'payment' | 'review';
export interface PrescriptionDocument {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}
export interface PrescriptionReview {
  readonly status: 'idle' | 'pending' | 'approved' | 'rejected' | 'error';
  readonly signature: string;
  readonly document?: PrescriptionDocument;
}
export interface Pricing {
  readonly subtotal: number;
  readonly delivery: number;
  readonly total: number;
}
export interface Order {
  readonly id: string;
  readonly items: readonly CartLine[];
  readonly fulfillment: Fulfillment;
  readonly contact: Contact;
  readonly paymentMethod: PaymentMethod;
  readonly pricing: Pricing;
  readonly prescription: PrescriptionReview;
}
export type OrderDraft = Omit<Order, 'id'>;
export type PaymentResult =
  | { readonly status: 'approved'; readonly orderId: string }
  | { readonly status: 'declined' | 'error' };
export interface PaymentAdapter {
  pay(order: OrderDraft): Promise<PaymentResult>;
}
export interface PrescriptionAdapter {
  review(document: PrescriptionDocument): Promise<'approved' | 'rejected' | 'error'>;
}
export interface CheckoutContext {
  readonly cart: readonly CartLine[];
  readonly prescription: PrescriptionReview;
  readonly fulfillment: Fulfillment | null;
  readonly contact: Contact | null;
  readonly paymentMethod: PaymentMethod | null;
}
