import type { FC } from 'react';
import type { ProductPage } from '../domain/Product';
import { ProductCard } from './ProductCard.component';

interface ProductResultsProps {
  resultPage: ProductPage;
  total: number;
  onPageChange: (page: number) => void;
  onClear: () => void;
}

const PAGINATION_BUTTON_CLASS =
  'min-h-11 rounded-radius-md border border-border bg-surface px-4 py-2 font-semibold text-text-main transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50';

export const ProductResults: FC<ProductResultsProps> = ({
  resultPage,
  total,
  onPageChange,
  onClear,
}) => (
  <section aria-labelledby="results-heading">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id="results-heading" className="text-3xl font-bold text-text-main">
          Resultados de búsqueda
        </h2>
        <p role="status" aria-atomic="true" className="mt-2 text-text-muted">
          {total} productos encontrados · Página {resultPage.page} de {resultPage.totalPages}
        </p>
      </div>
      <button type="button" onClick={onClear} className={PAGINATION_BUTTON_CLASS}>
        Limpiar búsqueda
      </button>
    </div>
    {total === 0 ? (
      <div className="mt-6 rounded-radius-lg border border-border bg-surface p-8 text-center">
        <h3 className="text-xl font-bold text-text-main">No encontramos productos</h3>
        <p className="mt-2 text-text-muted">
          Prueba con otro nombre, marca o categoría, o limpia la búsqueda.
        </p>
      </div>
    ) : (
      <div className="mt-6 grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {resultPage.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    )}
    {resultPage.totalPages > 1 ? (
      <nav
        aria-label="Paginación de productos"
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <button
          type="button"
          disabled={resultPage.page === 1}
          onClick={() => onPageChange(resultPage.page - 1)}
          className={PAGINATION_BUTTON_CLASS}
        >
          Anterior
        </button>
        <span className="text-sm text-text-muted">
          Página {resultPage.page} de {resultPage.totalPages}
        </span>
        <button
          type="button"
          disabled={resultPage.page === resultPage.totalPages}
          onClick={() => onPageChange(resultPage.page + 1)}
          className={PAGINATION_BUTTON_CLASS}
        >
          Siguiente
        </button>
      </nav>
    ) : null}
  </section>
);
