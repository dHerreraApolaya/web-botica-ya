import type { FC } from 'react';
import type { Product } from '../domain/Product';

const PRICE_FORMATTER = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

interface ProductCardProps {
  product: Product;
}

export const ProductCard: FC<ProductCardProps> = ({ product }) => (
  <article className="flex min-w-0 flex-col rounded-radius-lg border border-border bg-surface p-5 shadow-subtle">
    <div
      className="mb-5 flex h-28 items-center justify-center rounded-radius-md bg-primary-surface text-primary-surface-text"
      aria-hidden="true"
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="10" y="6" width="28" height="36" rx="4" />
        <path d="M10 15h28M24 22v12m-6-6h12" />
      </svg>
    </div>
    <p className="text-xs font-semibold text-primary-surface-text">{product.category}</p>
    <h3 className="mt-2 break-words text-lg font-bold text-text-main">{product.name}</h3>
    <p className="mt-1 text-sm text-text-muted">{product.brand}</p>
    <p className="mt-1 text-sm text-text-muted">{product.presentation}</p>
    <p className="mt-2 text-xs text-text-muted">SKU: {product.sku}</p>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
      <p className="text-xl font-bold text-text-main">
        {PRICE_FORMATTER.format(product.priceInCents / 100)}
      </p>
      <span className="rounded-radius-full bg-bg-app px-3 py-1 text-xs font-medium text-text-main">
        {product.inStock ? 'Disponible' : 'Agotado'}
      </span>
    </div>
  </article>
);
