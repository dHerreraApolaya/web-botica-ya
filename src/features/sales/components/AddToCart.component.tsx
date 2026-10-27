import { useState, type FC } from 'react';
import type { Product } from '../../products/domain/Product';
import { useSalesStore } from '../state/sales.store';

export const AddToCart: FC<{ product: Product }> = ({ product }) => {
  const addProduct = useSalesStore((state) => state.addProduct);
  const processing = useSalesStore((state) => state.paymentStatus === 'processing');
  const atLimit = useSalesStore(
    (state) =>
      (state.cart.find((line) => line.product.id === product.id)?.quantity ?? 0) >=
      product.availableQuantity
  );
  const [feedback, setFeedback] = useState<string>('');
  return (
    <div className="mt-4">
      {product.requiresPrescription ? (
        <p className="mb-3 text-xs font-semibold text-primary-surface-text">
          Requiere receta · simulación
        </p>
      ) : null}
      <button
        type="button"
        disabled={!product.inStock || processing || atLimit}
        aria-label={`Agregar ${product.name} al carrito`}
        onClick={() =>
          setFeedback(
            addProduct(product) ? 'Agregado al carrito.' : 'No se pudo agregar. Revisa el stock.'
          )
        }
        className="min-h-11 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {atLimit && product.inStock ? 'Límite de stock alcanzado' : 'Agregar al carrito'}
      </button>
      <span aria-live="polite" className="sr-only">
        {feedback}
      </span>
    </div>
  );
};
