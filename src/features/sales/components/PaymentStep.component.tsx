import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CheckoutField } from '@/components/ui/molecules/CheckoutField.component';
import { useSalesStore } from '../state/sales.store';
import { contactSchema, paymentMethodSchema } from '../utils/checkout.util';

const paymentFormSchema = contactSchema.extend({ paymentMethod: paymentMethodSchema });
interface PaymentFields {
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: string;
}
export const PaymentStep: FC = () => {
  const contact = useSalesStore((state) => state.contact);
  const method = useSalesStore((state) => state.paymentMethod);
  const save = useSalesStore((state) => state.setContactAndPayment);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PaymentFields>({
    defaultValues: {
      fullName: contact?.fullName ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      paymentMethod: method ?? '',
    },
  });
  return (
    <form
      noValidate
      aria-label="Contacto y pago"
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        const parsed = paymentFormSchema.safeParse(values);
        if (!parsed.success) {
          parsed.error.issues.forEach((issue) =>
            setError(
              issue.path[0] as keyof PaymentFields,
              {
                message:
                  issue.path[0] === 'paymentMethod'
                    ? 'Selecciona un medio de pago de prueba.'
                    : issue.message,
              },
              { shouldFocus: true }
            )
          );
          return;
        }
        const { fullName, email, phone, paymentMethod } = parsed.data;
        save({ fullName, email, phone }, paymentMethod);
        navigate('/checkout/review');
      })}
    >
      <p className="text-sm text-text-muted">
        Compra como invitado. Completa solo datos ficticios para este prototipo.
      </p>
      <CheckoutField
        id="contact-name"
        label="Nombre completo"
        required
        maxLength={120}
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <CheckoutField
        id="contact-email"
        label="Correo electrónico"
        type="email"
        required
        maxLength={254}
        error={errors.email?.message}
        {...register('email')}
      />
      <CheckoutField
        id="contact-phone"
        label="Teléfono"
        type="tel"
        required
        maxLength={20}
        error={errors.phone?.message}
        {...register('phone')}
      />
      <fieldset
        className="space-y-3"
        aria-describedby={errors.paymentMethod ? 'method-error' : undefined}
      >
        <legend className="mb-3 font-semibold">Pasarela de pagos de prueba</legend>
        <p className="text-sm text-text-muted">
          No ingreses datos bancarios. No se realizará ningún cobro.
        </p>
        <label className="flex min-h-14 items-center gap-3 rounded-md border border-border p-4 has-checked:border-primary has-checked:bg-primary-surface">
          <input type="radio" value="demo-card" {...register('paymentMethod')} />
          Tarjeta de prueba · terminación 4242
        </label>
        <label className="flex min-h-14 items-center gap-3 rounded-md border border-border p-4 has-checked:border-primary has-checked:bg-primary-surface">
          <input type="radio" value="demo-wallet" {...register('paymentMethod')} />
          Billetera digital de prueba
        </label>
        {errors.paymentMethod ? (
          <p id="method-error" role="alert" className="text-sm text-error">
            {errors.paymentMethod.message}
          </p>
        ) : null}
      </fieldset>
      <button
        type="submit"
        className="min-h-12 rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
      >
        Revisar compra
      </button>
    </form>
  );
};
