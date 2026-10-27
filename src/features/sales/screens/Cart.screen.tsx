import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useSalesStore } from '../state/sales.store';
import { calculatePricing, formatPrice } from '../utils/checkout.util';
import { earliestIncompleteStep } from '../state/checkout.state';
import { PriceSummary } from '../components/PriceSummary.component';

const CartScreen: FC = () => {
  const state = useSalesStore((value) => value);
  const locked = state.paymentStatus === 'processing';
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 max-md:px-4">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center font-semibold text-primary-surface-text"
      >
        ← Seguir comprando
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-text-main">Tu carrito</h1>
      <p className="mt-2 text-sm text-text-muted">
        Compra de demostración. Stock, precios y requisitos de receta son ficticios.
      </p>
      {state.cart.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
          <h2 className="text-xl font-bold">Tu carrito está vacío</h2>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary-surface-text"
          >
            Buscar productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-8 max-md:grid-cols-1">
          <div className="space-y-4">
            {state.cart.map(({ product, quantity }) => (
              <article
                key={product.id}
                className="min-w-0 rounded-lg border border-border bg-surface p-5"
              >
                <h2 className="break-words text-lg font-bold">{product.name}</h2>
                <p className="mt-1 text-sm text-text-muted">
                  {product.presentation} · {formatPrice(product.priceInCents)} por unidad
                </p>
                {product.requiresPrescription ? (
                  <p className="mt-2 text-sm font-semibold text-primary-surface-text">
                    Requiere receta · simulación
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-3"
                    role="group"
                    aria-label={`Cantidad de ${product.name}`}
                  >
                    <button
                      type="button"
                      aria-label={`Restar ${product.name}`}
                      disabled={locked || quantity === 1}
                      onClick={() => state.changeQuantity(product.id, quantity - 1)}
                      className="min-h-11 min-w-11 rounded-md border border-border disabled:opacity-50"
                    >
                      −
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Sumar ${product.name}`}
                      disabled={locked || quantity >= product.availableQuantity}
                      onClick={() => state.changeQuantity(product.id, quantity + 1)}
                      className="min-h-11 min-w-11 rounded-md border border-border disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold">{formatPrice(product.priceInCents * quantity)}</p>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => state.removeProduct(product.id)}
                    aria-label={`Eliminar ${product.name}`}
                    className="min-h-11 px-3 text-sm font-semibold text-error disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  Hasta {product.availableQuantity} unidades de prueba.
                </p>
              </article>
            ))}
          </div>
          <aside className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-6 text-xl font-bold">Resumen de compra</h2>
            <PriceSummary
              pricing={calculatePricing(state.cart, state.fulfillment)}
              fulfillmentChosen={Boolean(state.fulfillment)}
            />
            {locked ? (
              <p role="status" className="mt-5 text-sm">
                Pago de prueba en proceso. Espera para editar el carrito.
              </p>
            ) : (
              <Link
                to={`/checkout/${earliestIncompleteStep(state)}`}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 font-semibold text-primary-contrast"
              >
                Continuar compra
              </Link>
            )}
          </aside>
        </div>
      )}
    </section>
  );
};
export default CartScreen;
