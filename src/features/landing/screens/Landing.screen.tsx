import { useState, type FC } from 'react';
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
  const products = search ? localProductRepository.search(search) : [];

  const submitSearch = (): void => {
    setSearch({ query });
    setPage(1);
  };

  const selectCategory = (category: ProductCategory): void => {
    setQuery('');
    setSearch({ query: '', category });
    setPage(1);
  };

  const clearSearch = (): void => {
    setQuery('');
    setSearch(null);
    setPage(1);
  };

  return (
    <div className="w-full">
      <HeroSection
        query={query}
        activeCategory={search?.category}
        onQueryChange={setQuery}
        onSearch={submitSearch}
        onCategorySelect={selectCategory}
      />
      <div className="mx-auto max-w-6xl px-6 pb-16 max-md:px-4">
        {/* <p className="mb-6 rounded-radius-md border border-border bg-surface p-4 text-sm text-text-muted">
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
    </div>
  );
};
