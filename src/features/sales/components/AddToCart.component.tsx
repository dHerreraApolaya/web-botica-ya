import { type FC } from 'react';
import type { Product } from '../../products/domain/Product';
import { useSalesStore } from '../state/sales.store';

export const AddToCart: FC<{ product: Product }> = ({ product }) => {
  const addProduct = useSalesStore((state) => state.addProduct);
  const processing = useSalesStore((state) => state.paymentStatus === 'processing');
  const quantity = useSalesStore(
    (state) => state.cart.find((line) => line.product.id === product.id)?.quantity ?? 0
  );
  const changeQuantity = useSalesStore((state) => state.changeQuantity);
  const removeProduct = useSalesStore((state) => state.removeProduct);
  const remaining = product.inStock ? Math.max(0, product.availableQuantity - quantity) : 0;
  const atLimit = remaining === 0;
  return (
    <div className="mt-4">
      <p className="text-sm text-text-muted">
        Para agregar: {remaining} {remaining === 1 ? 'unidad' : 'unidades'}
      </p>
      <p className="mt-2 min-h-8 text-xs font-semibold leading-4 text-primary-surface-text">
        {product.requiresPrescription ? 'Requiere receta · simulación' : null}
      </p>
      <button
        type="button"
        disabled={!product.inStock || processing || atLimit}
        aria-label={`Agregar ${product.name} al carrito`}
        onClick={() => addProduct(product)}
        className="h-12 w-full rounded-radius-md bg-primary px-2 text-sm font-semibold text-primary-contrast transition-colors duration-fast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
      <div
        role="group"
        aria-label={`Cantidad de ${product.name}`}
        className="mt-2 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2"
      >
        <button
          type="button"
          aria-label={`Restar ${product.name}`}
          disabled={processing || quantity === 0}
          onClick={() =>
            quantity === 1 ? removeProduct(product.id) : changeQuantity(product.id, quantity - 1)
          }
          className="h-11 w-11 rounded-radius-md border border-border text-text-main transition-colors duration-fast hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          −
        </button>
        <span className="text-center text-sm font-semibold tabular-nums text-text-main">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Sumar ${product.name}`}
          disabled={processing || atLimit || !product.inStock}
          onClick={() => addProduct(product)}
          className="h-11 w-11 rounded-radius-md border border-border text-text-main transition-colors duration-fast hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
};
