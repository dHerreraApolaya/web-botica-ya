import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { CatalogNavigation } from '../components/CatalogNavigation.component';
import { scrollToCatalogSection } from '@/utils/catalogScroll.util';
import { HeroSection } from '../components/HeroSection.component';
import type { ProductCategory, ProductSearch } from '../../products/domain/Product';
import { localProductRepository } from '../../products/data/localProduct.repository';
import { paginateProducts } from '../../products/utils/productSearch.util';
import { FeaturedProducts } from '../../products/components/FeaturedProducts.component';
import { ProductResults } from '../../products/components/ProductResults.component';

const FEATURED_PRODUCTS = localProductRepository.getFeatured();

export const LandingScreen: FC = () => {
  const [query, setQuery] = useState<string>('');
  const [search, setSearch] = useState<ProductSearch | null>(null);
  const [page, setPage] = useState<number>(1);
  const pendingSearch = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingSearch = (): void => {
    if (pendingSearch.current !== null) {
      clearTimeout(pendingSearch.current);
      pendingSearch.current = null;
    }
  };
  useEffect(() => cancelPendingSearch, []);
  const products = useMemo(() => (search ? localProductRepository.search(search) : []), [search]);

  useEffect(() => {
    if (search && !document.querySelector('dialog[open]'))
      scrollToCatalogSection('catalog-filters');
  }, [search, page]);

  const updateQuery = (value: string): void => {
    setQuery(value);
    cancelPendingSearch();
    const nextSearch =
      value.trim() || search?.categories?.length
        ? { query: value, categories: search?.categories }
        : null;
    if (!value.trim()) {
      setSearch(nextSearch);
      setPage(1);
      return;
    }
    pendingSearch.current = setTimeout(() => {
      pendingSearch.current = null;
      setSearch(nextSearch);
      setPage(1);
    }, 300);
  };

  const submitSearch = (): void => {
    cancelPendingSearch();
    setSearch({ query, categories: search?.categories });
    setPage(1);
  };

  const selectCategory = (category: ProductCategory): void => {
    cancelPendingSearch();
    const current = search?.categories ?? [];
    const categories = current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category];
    setSearch(query.trim() || categories.length ? { query, categories } : null);
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
        query={query}
        activeCategories={search?.categories ?? []}
        onQueryChange={updateQuery}
        onSearch={submitSearch}
        onCategoriesClose={() => {
          if (search) scrollToCatalogSection('catalog-filters');
        }}
        onCategorySelect={selectCategory}
      />
      <div id="catalog-results" className="mx-auto max-w-6xl px-6 pb-16 max-md:px-4">
        {/* <p className="mb-6 rounded-md border border-border bg-surface p-4 text-sm text-text-muted">
          Catálogo de demostración: 500 productos ficticios y precios referenciales. No disponibles
          para compra.
        </p> */}
        {search ? (
          <ProductResults
            resultPage={paginateProducts(products, page)}
            total={products.length}
            onPageChange={setPage}
            onClear={clearSearch}
          />
        ) : (
          <FeaturedProducts products={FEATURED_PRODUCTS} />
        )}
      </div>
      <CatalogNavigation />
    </div>
  );
};
