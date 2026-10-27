import type { CheckoutContext, CheckoutStep } from '../domain/Sales';
import { prescriptionSignature, validContact, validFulfillment } from '../utils/checkout.util';

interface CheckoutStateBehavior {
  complete: (context: CheckoutContext) => boolean;
}
const STATES: Record<CheckoutStep, CheckoutStateBehavior> = {
  prescription: {
    complete: ({ cart, prescription }) => {
      const signature = prescriptionSignature(cart);
      return (
        !signature || (prescription.status === 'approved' && prescription.signature === signature)
      );
    },
  },
  fulfillment: { complete: ({ fulfillment }) => validFulfillment(fulfillment) },
  payment: {
    complete: ({ contact, paymentMethod }) => validContact(contact) && paymentMethod !== null,
  },
  review: { complete: () => true },
};
export const CHECKOUT_STEPS: readonly CheckoutStep[] = [
  'prescription',
  'fulfillment',
  'payment',
  'review',
];
export const earliestIncompleteStep = (context: CheckoutContext): CheckoutStep =>
  CHECKOUT_STEPS.find((step) => !STATES[step].complete(context)) ?? 'review';
export const accessibleStep = (
  requested: string | undefined,
  context: CheckoutContext
): CheckoutStep => {
  const first = earliestIncompleteStep(context);
  const requestedIndex = CHECKOUT_STEPS.indexOf(requested as CheckoutStep);
  if (requestedIndex < 0 || requestedIndex > CHECKOUT_STEPS.indexOf(first)) return first;
  if (requested === 'prescription' && !prescriptionSignature(context.cart)) return 'fulfillment';
  return requested as CheckoutStep;
};
