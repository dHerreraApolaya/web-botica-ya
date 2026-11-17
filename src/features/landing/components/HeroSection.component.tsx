import type { FC } from 'react';
import { CategoryFilter } from '../../products/components/CategoryFilter.component';

import type { CatalogCategory } from '../../products/domain/Catalog';

interface HeroSectionProps {
  categories: readonly CatalogCategory[];
  query: string;
  activeCategories: readonly string[];
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onCategoriesClose: () => void;
  onCategorySelect: (category: string) => void;
}

export const HeroSection: FC<HeroSectionProps> = ({
  categories,
  query,
  activeCategories,
  onQueryChange,
  onSearch,
  onCategoriesClose,
  onCategorySelect,
}) => {
  return (
    <section className="relative w-full bg-bg-app py-16 max-md:py-10">
      <div className="mx-auto max-w-6xl px-6 text-center max-md:px-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl lg:text-6xl">
          Tu farmacia digital de confianza,{' '}
          <span className="text-primary">rápida y al mejor precio</span>
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg text-text-muted sm:text-xl">
          Encuentra tus medicamentos recetados, productos de cuidado de la salud y bienestar con
          atención farmacéutica profesional y entrega directa en tu puerta.
        </p>

        <div id="catalog-filters" className="mx-auto mt-8 max-w-3xl">
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
                  maxLength={128}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Nombre, marca, categoría o SKU (ej. Paracetamol)..."
                  className="w-full rounded-md border border-border bg-surface py-3.5 pl-11 pr-4 text-base text-text-main placeholder-text-muted shadow-subtle transition-all duration-fast focus-visible:outline-2 focus-visible:outline-focus-ring"
                />
              </div>
            </div>
          </form>

          <CategoryFilter
            categories={categories}
            selected={activeCategories}
            onToggle={onCategorySelect}
            onClose={onCategoriesClose}
          />
        </div>
      </div>
    </section>
  );
};
