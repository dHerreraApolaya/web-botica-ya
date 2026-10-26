import type { FC } from 'react';

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
                className="min-h-11 rounded-radius-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-main shadow-subtle transition-all duration-fast hover:border-primary hover:bg-primary-surface hover:text-primary-surface-text aria-pressed:border-primary aria-pressed:bg-primary-surface aria-pressed:text-primary-surface-text"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-main">Entrega Express</p>
              <p className="text-xs text-text-muted">En tu puerta en &lt;45 minutos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-main">100% Certificados</p>
              <p className="text-xs text-text-muted">Garantía oficial DIGEMID</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-main">Químicos Colegiados</p>
              <p className="text-xs text-text-muted">Atención profesional 24/7</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-main">Receta Digital</p>
              <p className="text-xs text-text-muted">Sube tu foto y validamos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
