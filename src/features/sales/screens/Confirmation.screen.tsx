import type { FC } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSalesStore } from '../state/sales.store';
import { OrderDetails } from '../components/OrderDetails.component';

const ConfirmationScreen: FC = () => {
  const order = useSalesStore((state) => state.order);
  if (!order) return <Navigate to="/carrito" replace />;
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 max-md:px-4">
      <div className="mb-8 rounded-xl bg-primary-surface p-6 text-primary-surface-text">
        <p className="text-sm font-semibold">Pago de prueba aprobado</p>
        <h1 className="mt-2 text-3xl font-extrabold">¡Compra de prueba confirmada!</h1>
        <p className="mt-3 font-bold">Pedido {order.id}</p>
        <p className="mt-2 text-sm">
          Este pedido es una demostración. No se ha realizado ningún cobro ni se preparará una
          entrega.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <OrderDetails order={order} />
      </div>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
      >
        Volver a la tienda
      </Link>
    </section>
  );
};
export default ConfirmationScreen;
