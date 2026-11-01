import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CheckoutFacade } from '../application/checkout.facade';
import { useSalesStore } from '../state/sales.store';
import { calculatePricing } from '../utils/checkout.util';
import { OrderDetails } from './OrderDetails.component';

export const ReviewStep: FC<{ facade: CheckoutFacade }> = ({ facade }) => {
  const state = useSalesStore((value) => value);
  const navigate = useNavigate();
  if (!state.fulfillment || !state.contact || !state.paymentMethod) return null;
  const locked = state.paymentStatus === 'processing';
  return (
    <div className="space-y-6">
      <OrderDetails
        order={{
          items: state.cart,
          contact: state.contact,
          fulfillment: state.fulfillment,
          paymentMethod: state.paymentMethod,
          prescription: state.prescription,
          pricing: calculatePricing(state.cart, state.fulfillment),
        }}
      />
      {!locked ? (
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-primary-surface-text">
          <Link to="/carrito" className="inline-flex min-h-11 items-center">
            Editar productos
          </Link>
          <Link to="/checkout/fulfillment" className="inline-flex min-h-11 items-center">
            Editar entrega
          </Link>
          <Link to="/checkout/payment" className="inline-flex min-h-11 items-center">
            Editar contacto o pago
          </Link>
        </div>
      ) : null}
      <div role="status" aria-atomic="true" className="text-sm text-primary-surface-text">
        {locked ? 'Procesando pago de prueba… No cierres esta vista.' : ''}
      </div>
      {state.paymentStatus === 'declined' || state.paymentStatus === 'error' ? (
        <p role="alert" className="rounded-md border border-error p-4 text-sm text-error">
          {state.paymentStatus === 'declined'
            ? 'El pago de prueba fue rechazado. Puedes cambiar el medio de pago o reintentar.'
            : 'La pasarela de prueba no está disponible. Inténtalo nuevamente.'}
        </p>
      ) : null}
      <p className="text-xs text-text-muted">
        Al confirmar se creará un pedido ficticio. No habrá un cobro ni una entrega real.
      </p>
      <button
        type="button"
        disabled={locked}
        onClick={() =>
          void facade.confirmOrder().then((order) => {
            if (order) navigate('/confirmacion');
          })
        }
        className="min-h-12 w-full rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-50"
      >
        {locked ? 'Procesando…' : 'Confirmar compra de prueba'}
      </button>
    </div>
  );
};
