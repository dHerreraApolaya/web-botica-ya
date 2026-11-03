import type { FC } from 'react';
import { useSalesStore } from '../state/sales.store';

export const CartLink: FC = () => {
  const count = useSalesStore((state) => state.cart.reduce((sum, line) => sum + line.quantity, 0));
  return (
    <span
      key={count}
      aria-live="polite"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors duration-normal ${count ? 'cart-feedback border-primary bg-primary-surface text-primary-surface-text' : 'border-border text-text-main'}`}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span>{count}</span>
    </span>
  );
};
