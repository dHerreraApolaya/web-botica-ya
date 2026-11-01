import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckoutField } from '@/components/ui/molecules/CheckoutField.component';
import { useSalesStore } from '../state/sales.store';
import { CHECKOUT_DATA, formatPrice, fulfillmentSchema } from '../utils/checkout.util';

interface FulfillmentFields {
  district: string;
  address: string;
  reference: string;
  pharmacyId: string;
}
export const FulfillmentStep: FC = () => {
  const saved = useSalesStore((state) => state.fulfillment);
  const save = useSalesStore((state) => state.setFulfillment);
  const [mode, setMode] = useState<'delivery' | 'pickup'>(saved?.type ?? 'delivery');
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<FulfillmentFields>({
    defaultValues: {
      district: saved?.type === 'delivery' ? saved.district : '',
      address: saved?.type === 'delivery' ? saved.address : '',
      reference: saved?.type === 'delivery' ? saved.reference : '',
      pharmacyId: saved?.type === 'pickup' ? saved.pharmacyId : '',
    },
  });
  return (
    <form
      noValidate
      aria-label="Entrega o recojo"
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        clearErrors();
        const parsed = fulfillmentSchema.safeParse({ ...values, type: mode });
        if (!parsed.success) {
          parsed.error.issues.forEach((issue) =>
            setError(
              issue.path[0] as keyof FulfillmentFields,
              { message: issue.message },
              { shouldFocus: true }
            )
          );
          return;
        }
        save(parsed.data);
        navigate('/checkout/payment');
      })}
    >
      <fieldset className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <legend className="mb-3 text-sm font-semibold">¿Cómo quieres recibir tu compra?</legend>
        {(['delivery', 'pickup'] as const).map((value) => (
          <label
            key={value}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-border p-4 has-checked:border-primary has-checked:bg-primary-surface"
          >
            <input
              type="radio"
              name="fulfillment-mode"
              value={value}
              checked={mode === value}
              onChange={() => {
                setMode(value);
                clearErrors();
                const values = getValues();
                save(
                  value === 'pickup'
                    ? { type: 'pickup', pharmacyId: values.pharmacyId }
                    : {
                        type: 'delivery',
                        district: values.district,
                        address: values.address,
                        reference: values.reference,
                      }
                );
              }}
            />
            {value === 'delivery'
              ? `Envío a domicilio · ${formatPrice(CHECKOUT_DATA.deliveryFeeInCents)}`
              : 'Recojo en botica · gratis'}
          </label>
        ))}
      </fieldset>
      {mode === 'delivery' ? (
        <div className="space-y-5">
          <div className="rounded-lg bg-primary-surface p-5 text-sm text-primary-surface-text">
            <p className="font-semibold">Ubicación de entrega</p>
            <p className="mt-2">
              Ingresa una dirección ficticia dentro de la cobertura de prueba. No se usa tu
              ubicación actual.
            </p>
          </div>
          <div>
            <label htmlFor="district" className="mb-2 block text-sm font-semibold">
              Distrito de prueba
            </label>
            <select
              id="district"
              {...register('district')}
              aria-invalid={Boolean(errors.district)}
              aria-describedby={errors.district ? 'district-error' : undefined}
              className="min-h-12 w-full rounded-md border border-border bg-surface p-3"
            >
              <option value="">Selecciona un distrito</option>
              {CHECKOUT_DATA.districts.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
            {errors.district ? (
              <p id="district-error" className="mt-2 text-sm text-error">
                {errors.district.message}
              </p>
            ) : null}
          </div>
          <CheckoutField
            id="address"
            label="Dirección de prueba"
            maxLength={200}
            required
            error={errors.address?.message}
            {...register('address')}
          />
          <CheckoutField
            id="reference"
            label="Referencia (opcional)"
            maxLength={200}
            error={errors.reference?.message}
            {...register('reference')}
          />
        </div>
      ) : (
        <fieldset
          className="space-y-3"
          aria-describedby={errors.pharmacyId ? 'pharmacy-error' : undefined}
        >
          <legend className="mb-3 font-semibold">Elige una botica de prueba</legend>
          {CHECKOUT_DATA.pharmacies.map((pharmacy) => (
            <label
              key={pharmacy.id}
              className="flex min-h-14 gap-3 rounded-lg border border-border p-4 has-checked:border-primary has-checked:bg-primary-surface has-disabled:opacity-50"
            >
              <input
                {...register('pharmacyId')}
                type="radio"
                value={pharmacy.id}
                disabled={!pharmacy.available}
                className="mt-1 shrink-0"
              />
              <span className="min-w-0 text-sm">
                <strong className="block">{pharmacy.name}</strong>
                <span className="mt-1 block">{pharmacy.address}</span>
                <span className="mt-1 block text-text-muted">{pharmacy.schedule}</span>
              </span>
            </label>
          ))}
          {errors.pharmacyId ? (
            <p id="pharmacy-error" role="alert" className="text-sm text-error">
              {errors.pharmacyId.message}
            </p>
          ) : null}
        </fieldset>
      )}
      <button
        type="submit"
        className="min-h-12 rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
      >
        Continuar al pago
      </button>
    </form>
  );
};
