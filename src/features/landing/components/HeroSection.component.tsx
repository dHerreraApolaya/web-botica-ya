import type { FC } from 'react';
import { CategoryIcon } from '../../products/components/CategoryIcon.component';

import { PRODUCT_CATEGORIES, type ProductCategory } from '../../products/domain/Product';

interface HeroSectionProps {
  query: string;
  activeCategory?: ProductCategory;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onCategorySelect: (category: ProductCategory) => void;
}

export const HeroSection: FC<HeroSectionProps> = ({
  query,
  activeCategory,
  onQueryChange,
  onSearch,
  onCategorySelect,
}) => {
  return (
    <section className="relative w-full bg-bg-app py-16 max-md:py-10">
      <div className="mx-auto max-w-6xl px-6 text-center max-md:px-4">
        <div className="inline-flex items-center gap-2 rounded-radius-full bg-primary-surface px-4 py-1.5 text-xs font-semibold text-primary-surface-text">
          <span className="h-2 w-2 rounded-radius-full bg-primary" />
          <span>Farmacia Digital Autorizada • Envíos en menos de 45 min</span>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl lg:text-6xl">
          Tu farmacia digital de confianza,{' '}
          <span className="text-primary">rápida y al mejor precio</span>
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg text-text-muted sm:text-xl">
          Encuentra tus medicamentos recetados, productos de cuidado de la salud y bienestar con
          atención farmacéutica profesional y entrega directa en tu puerta.
        </p>

        <div className="mx-auto mt-8 max-w-3xl">
          <form
            role="search"
            aria-label="Buscar productos"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1 text-left">
              <label
                htmlFor="product-search"
                className="mb-2 block text-sm font-semibold text-text-main"
              >
                Buscar productos
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  id="product-search"
                  type="search"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Nombre, marca, categoría o SKU (ej. Paracetamol)..."
                  className="w-full rounded-radius-md border border-border bg-surface py-3.5 pl-11 pr-4 text-base text-text-main placeholder-text-muted shadow-subtle transition-all duration-fast focus-visible:outline-2 focus-visible:outline-focus-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-radius-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-contrast shadow-card transition-all duration-fast hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              Buscar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Explora por categoría:</span>
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => onCategorySelect(category)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-radius-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-main shadow-subtle transition-all duration-fast hover:border-primary hover:bg-primary-surface hover:text-primary-surface-text aria-pressed:border-primary aria-pressed:bg-primary-surface aria-pressed:text-primary-surface-text"
              >
                <CategoryIcon category={category} />
                <span>{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
