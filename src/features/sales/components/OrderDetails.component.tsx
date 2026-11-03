import type { FC } from 'react';
import type { OrderDraft } from '../domain/Sales';
import { CHECKOUT_DATA, formatPrice } from '../utils/checkout.util';
import { PriceSummary } from './PriceSummary.component';

export const OrderDetails: FC<{ order: OrderDraft }> = ({ order }) => {
  const fulfillment = order.fulfillment;
  const pharmacy =
    fulfillment.type === 'pickup'
      ? CHECKOUT_DATA.pharmacies.find((entry) => entry.id === fulfillment.pharmacyId)
      : null;
  return (
    <div className="space-y-6">
      <section aria-label="Productos del pedido">
        <h2 className="mb-3 text-lg font-bold">Productos</h2>
        <ul className="divide-y divide-border">
          {order.items.map((line) => (
            <li key={line.product.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
              <span className="min-w-0 break-words">
                {line.product.name} × {line.quantity}
              </span>
              <strong>{formatPrice(line.product.priceInCents * line.quantity)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-bold">
          {fulfillment.type === 'delivery' ? 'Entrega a domicilio' : 'Recojo en botica'}
        </h2>
        {fulfillment.type === 'delivery' ? (
          <div className="mt-2 break-words text-sm text-text-muted">
            <p>{fulfillment.address}</p>
            <p>{fulfillment.district}</p>
            {fulfillment.reference ? <p>Referencia: {fulfillment.reference}</p> : null}
          </div>
        ) : (
          <div className="mt-2 text-sm text-text-muted">
            <p>{pharmacy?.name}</p>
            <p>{pharmacy?.address}</p>
            <p>{pharmacy?.schedule}</p>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-lg font-bold">Datos de contacto</h2>
        <div className="mt-2 break-words text-sm text-text-muted">
          <p>{order.contact.fullName}</p>
          <p>{order.contact.email}</p>
          <p>{order.contact.phone}</p>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Pago de prueba</h2>
        <p className="mt-2 text-sm text-text-muted">
          {order.paymentMethod === 'demo-card'
            ? 'Tarjeta de prueba · terminación 4242'
            : 'Billetera digital de prueba'}
        </p>
      </section>
      {order.prescription.status === 'approved' ? (
        <p className="rounded-md bg-primary-surface p-3 text-sm text-primary-surface-text">
          Receta aprobada en la simulación.
        </p>
      ) : null}
      <PriceSummary pricing={order.pricing} fulfillmentChosen />
    </div>
  );
};
