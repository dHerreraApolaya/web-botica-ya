import type { ComponentPropsWithRef, FC } from 'react';

type CheckoutFieldProps = ComponentPropsWithRef<'input'> & {
  id: string;
  label: string;
  error?: string;
};
export const CheckoutField: FC<CheckoutFieldProps> = ({ id, label, error, ...props }) => (
  <div className="min-w-0">
    <label htmlFor={id} className="mb-2 block text-sm font-semibold text-text-main">
      {label}
    </label>
    <input
      {...props}
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className="min-h-12 w-full min-w-0 rounded-md border border-border bg-surface px-4 py-3 text-base text-text-main"
    />
    {error ? (
      <p id={`${id}-error`} className="mt-2 text-sm text-error">
        {error}
      </p>
    ) : null}
  </div>
);
