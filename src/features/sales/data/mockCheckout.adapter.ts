import type { PaymentAdapter, PaymentResult, PrescriptionAdapter } from '../domain/Sales';

interface MockOptions {
  delayMs?: number;
  payment?: PaymentResult['status'];
  prescription?: 'approved' | 'rejected' | 'error';
}
export const createMockCheckoutAdapters = ({
  delayMs = 450,
  payment = 'approved',
  prescription = 'approved',
}: MockOptions = {}): { payment: PaymentAdapter; prescription: PrescriptionAdapter } => {
  let nextOrder = 1;
  const wait = (): Promise<void> =>
    delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();
  return {
    payment: {
      async pay() {
        await wait();
        return payment === 'approved'
          ? { status: 'approved', orderId: `DEMO-${String(nextOrder++).padStart(6, '0')}` }
          : { status: payment };
      },
    },
    prescription: {
      async review() {
        await wait();
        return prescription;
      },
    },
  };
};
