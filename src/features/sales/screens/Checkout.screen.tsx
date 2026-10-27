import { useEffect, useRef, type FC } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSalesStore } from '../state/sales.store';
import { accessibleStep, CHECKOUT_STEPS } from '../state/checkout.state';
import { calculatePricing, formatCount, prescriptionSignature } from '../utils/checkout.util';
import { checkoutFacade } from '../application/checkout.config';
import type { CheckoutFacade } from '../application/checkout.facade';
import type { CheckoutStep } from '../domain/Sales';
import { PrescriptionStep } from '../components/PrescriptionStep.component';
import { FulfillmentStep } from '../components/FulfillmentStep.component';
import { PaymentStep } from '../components/PaymentStep.component';
import { ReviewStep } from '../components/ReviewStep.component';
import { PriceSummary } from '../components/PriceSummary.component';

const TITLES: Record<CheckoutStep, string> = {
  prescription: 'Receta médica de prueba',
  fulfillment: 'Entrega o recojo',
  payment: 'Contacto y pago',
  review: 'Revisa tu compra',
};
const CheckoutScreen: FC<{ facade?: CheckoutFacade }> = ({ facade = checkoutFacade }) => {
  const state = useSalesStore((value) => value);
  const { step: requested } = useParams();
  const locked = state.paymentStatus === 'processing';
  const step = locked ? 'review' : accessibleStep(requested, state);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  if (!state.cart.length)
    return <Navigate to={state.order ? '/confirmacion' : '/carrito'} replace />;
  if (requested !== step) return <Navigate to={`/checkout/${step}`} replace />;
  const steps = CHECKOUT_STEPS.filter(
    (entry) => entry !== 'prescription' || prescriptionSignature(state.cart)
  );
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
      {!locked ? (
        <Link
          to="/carrito"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-surface-text"
        >
          ← Volver al carrito
        </Link>
      ) : null}
      <p className="mt-3 text-sm text-text-muted">
        Prototipo de compra · usa únicamente datos ficticios.
      </p>
      <nav aria-label="Pasos de compra" className="my-6">
        <ol className="flex flex-wrap gap-3">
          {steps.map((entry, index) => (
            <li
              key={entry}
              className={`rounded-full border px-4 py-2 text-sm ${entry === step ? 'border-primary bg-primary-surface font-bold text-primary-surface-text' : 'border-border text-text-muted'}`}
              aria-current={entry === step ? 'step' : undefined}
            >
              {index + 1}. {TITLES[entry]}
            </li>
          ))}
        </ol>
      </nav>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-8 max-lg:grid-cols-1">
        <div className="min-w-0 rounded-xl border border-border bg-surface p-8 shadow-subtle max-sm:p-5">
          <h1 ref={heading} tabIndex={-1} className="mb-6 text-2xl font-bold text-text-main">
            {TITLES[step]}
          </h1>
          <fieldset disabled={locked} className="min-w-0">
            <legend className="sr-only">{TITLES[step]}</legend>
            {step === 'prescription' ? (
              <PrescriptionStep facade={facade} />
            ) : step === 'fulfillment' ? (
              <FulfillmentStep />
            ) : step === 'payment' ? (
              <PaymentStep />
            ) : (
              <ReviewStep facade={facade} />
            )}
          </fieldset>
        </div>
        <aside className="min-w-0 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-5 text-xl font-bold">Resumen de compra</h2>
          <p className="mb-4 text-sm text-text-muted">
            {formatCount(
              state.cart.reduce((sum, line) => sum + line.quantity, 0),
              'unidad',
              'unidades'
            )}{' '}
            · {formatCount(state.cart.length, 'producto', 'productos')}
          </p>
          <PriceSummary
            pricing={calculatePricing(state.cart, state.fulfillment)}
            fulfillmentChosen={Boolean(state.fulfillment)}
          />
          <p className="mt-5 text-xs text-text-muted">
            Precios y cobertura referenciales de demostración. El total se confirma antes del pago
            simulado.
          </p>
        </aside>
      </div>
    </section>
  );
};
export default CheckoutScreen;
