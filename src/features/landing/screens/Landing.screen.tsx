import { useEffect, useRef, useState, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CatalogNavigation } from '../components/CatalogNavigation.component';
import { scrollToCatalogSection } from '@/utils/catalogScroll.util';
import { HeroSection } from '../components/HeroSection.component';
import { catalogRepository, FEATURED_REQUEST } from '../../products/application/catalog.config';
import type { CatalogRepository, CatalogRequest } from '../../products/domain/Catalog';
import { FeaturedProducts } from '../../products/components/FeaturedProducts.component';
import { ProductResults } from '../../products/components/ProductResults.component';

interface ActiveSearch {
  query: string;
  categoryIds: readonly string[];
}
interface LandingScreenProps {
  repository?: CatalogRepository;
}

export const LandingScreen: FC<LandingScreenProps> = ({ repository = catalogRepository }) => {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<ActiveSearch | null>(null);
  const [page, setPage] = useState(1);
  const pendingSearch = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingSearch = (): void => {
    if (pendingSearch.current !== null) {
      clearTimeout(pendingSearch.current);
      pendingSearch.current = null;
    }
  };
  useEffect(() => cancelPendingSearch, []);
  const trimmedQuery = search?.query.trim() ?? '';
  const validQuery =
    !trimmedQuery ||
    (trimmedQuery.length >= 3 &&
      trimmedQuery.length <= 128 &&
      trimmedQuery.split(/\s+/).length <= 12);
  const request: CatalogRequest = search
    ? {
        ...(trimmedQuery ? { query: trimmedQuery } : {}),
        categoryIds: search.categoryIds,
        page,
        pageSize: 12,
      }
    : FEATURED_REQUEST;
  const catalog = useQuery({
    queryKey: ['catalog', request],
    queryFn: ({ signal }) => repository.find(request, signal),
    enabled: validQuery,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: ({ signal }) => repository.categories(signal),
    retry: false,
  });

  useEffect(() => {
    if (search && !document.querySelector('dialog[open]'))
      scrollToCatalogSection('catalog-filters');
  }, [search, page]);
  const activateSearch = (value: string): void => {
    const categoryIds = search?.categoryIds ?? [];
    setSearch(value.trim() || categoryIds.length ? { query: value, categoryIds } : null);
    setPage(1);
  };
  const updateQuery = (value: string): void => {
    setQuery(value);
    cancelPendingSearch();
    if (!value.trim()) {
      activateSearch(value);
      return;
    }
    pendingSearch.current = setTimeout(() => {
      pendingSearch.current = null;
      activateSearch(value);
    }, 300);
  };
  const submitSearch = (): void => {
    cancelPendingSearch();
    setSearch({ query, categoryIds: search?.categoryIds ?? [] });
    setPage(1);
  };
  const selectCategory = (id: string): void => {
    cancelPendingSearch();
    const current = search?.categoryIds ?? [];
    const categoryIds = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    setSearch(query.trim() || categoryIds.length ? { query, categoryIds } : null);
    setPage(1);
  };
  const clearSearch = (): void => {
    cancelPendingSearch();
    setQuery('');
    setSearch(null);
    setPage(1);
  };

  return (
    <div className="w-full">
      <HeroSection
        categories={categories.data ?? []}
        query={query}
        activeCategories={search?.categoryIds ?? []}
        onQueryChange={updateQuery}
        onSearch={submitSearch}
        onCategoriesClose={() => {
          if (search) scrollToCatalogSection('catalog-filters');
        }}
        onCategorySelect={selectCategory}
      />
      <div id="catalog-results" className="mx-auto max-w-6xl px-6 pb-16 max-md:px-4">
        <p className="mb-6 rounded-md border border-border bg-primary-surface p-4 text-sm text-primary-surface-text">
          Catálogo de demostración. Productos, precios, stock y requisitos de receta ficticios. No
          se realizan cobros ni entregas reales.
        </p>
        {categories.isPending ? (
          <p role="status" className="mb-4 text-text-muted">
            Cargando categorías…
          </p>
        ) : null}
        {categories.isError ? (
          <div role="alert" className="mb-4 rounded-md border border-border p-4">
            <p>No pudimos cargar las categorías.</p>
            <button
              type="button"
              onClick={() => void categories.refetch()}
              className="mt-2 min-h-11 font-semibold text-primary-surface-text"
            >
              Reintentar categorías
            </button>
          </div>
        ) : null}
        {!validQuery ? (
          <div role="status" className="rounded-md border border-border p-4">
            <p>Escribe entre 3 y 128 caracteres y hasta 12 palabras para buscar.</p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-2 min-h-11 font-semibold text-primary-surface-text"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : catalog.isPending ? (
          <p role="status" className="p-8 text-center text-text-muted">
            Cargando productos…
          </p>
        ) : catalog.isError ? (
          <div role="alert" className="rounded-md border border-border bg-surface p-6">
            <p>No pudimos cargar los productos. Inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => void catalog.refetch()}
              className="mt-3 min-h-11 font-semibold text-primary-surface-text"
            >
              Reintentar productos
            </button>
            {search ? (
              <button type="button" onClick={clearSearch} className="ml-4 min-h-11 font-semibold">
                Limpiar búsqueda
              </button>
            ) : null}
          </div>
        ) : search ? (
          <ProductResults
            resultPage={catalog.data}
            total={catalog.data.total}
            onPageChange={setPage}
            onClear={clearSearch}
          />
        ) : (
          <FeaturedProducts products={catalog.data.items} />
        )}
      </div>
      <CatalogNavigation />
    </div>
  );
};
