import { useState, type ComponentPropsWithRef, type FC } from 'react';

type FormFieldProps = ComponentPropsWithRef<'input'> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export const FormField: FC<FormFieldProps> = ({
  id,
  label,
  error,
  hint,
  type = 'text',
  ...inputProps
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const isPassword = type === 'password';
  const descriptionIds = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-text-main">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
          className={`min-h-12 w-full min-w-0 rounded-md border border-border bg-surface px-4 py-3 text-base text-text-main disabled:opacity-60 ${isPassword ? 'pr-24' : ''}`}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 min-h-11 min-w-20 rounded-md px-3 text-sm font-semibold text-primary-surface-text"
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
};
