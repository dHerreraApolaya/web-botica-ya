import { useState, type FC } from 'react';
import type { Product } from '../../products/domain/Product';
import { useSalesStore } from '../state/sales.store';

export const AddToCart: FC<{ product: Product }> = ({ product }) => {
  const addProduct = useSalesStore((state) => state.addProduct);
  const processing = useSalesStore((state) => state.paymentStatus === 'processing');
  const quantity = useSalesStore(
    (state) => state.cart.find((line) => line.product.id === product.id)?.quantity ?? 0
  );
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const remaining = product.inStock ? Math.max(0, product.availableQuantity - quantity) : 0;
  const atLimit = remaining === 0;
  const unitsToAdd = Math.min(selectedQuantity, remaining);
  return (
    <div className="mt-4">
      <p className="text-sm text-text-muted">
        Para agregar: {remaining} {remaining === 1 ? 'unidad' : 'unidades'}
      </p>
      <p className="mt-2 min-h-8 text-xs font-semibold leading-4 text-primary-surface-text">
        {product.requiresPrescription ? 'Requiere receta · simulación' : null}
      </p>
      <div
        role="group"
        aria-label={`Cantidad de ${product.name}`}
        className="mt-2 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2"
      >
        <button
          type="button"
          aria-label={`Restar ${product.name}`}
          disabled={processing || unitsToAdd <= 1}
          onClick={() => setSelectedQuantity(unitsToAdd - 1)}
          className="h-11 w-11 rounded-radius-md border border-border text-text-main transition-colors duration-fast hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          −
        </button>
        <span className="text-center text-sm font-semibold tabular-nums text-text-main">
          {unitsToAdd}
        </span>
        <button
          type="button"
          aria-label={`Sumar ${product.name}`}
          disabled={processing || unitsToAdd >= remaining}
          onClick={() => setSelectedQuantity(unitsToAdd + 1)}
          className="h-11 w-11 rounded-radius-md border border-border text-text-main transition-colors duration-fast hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={!product.inStock || processing || atLimit}
        aria-label={`Agregar ${product.name} al carrito`}
        onClick={() => {
          if (addProduct(product, unitsToAdd)) setSelectedQuantity(1);
        }}
        className="mt-4 h-12 w-full rounded-radius-md bg-primary px-2 text-sm font-semibold text-primary-contrast transition-colors duration-fast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!product.inStock ? 'Agotado' : atLimit ? 'Límite de stock' : 'Agregar al carrito'}
      </button>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-center text-sm font-semibold text-primary-surface-text"
      >
        En tu carrito: {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
      </p>
    </div>
  );
};
