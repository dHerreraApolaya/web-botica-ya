import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import { LOCAL_PRODUCTS } from '@/features/products/data/products.data';
import { PRODUCT_CATEGORIES } from '@/features/products/domain/Product';
import { searchProducts } from '@/features/products/utils/productSearch.util';
import type { CatalogProduct, CatalogRepository } from '@/features/products/domain/Catalog';
import { FEATURED_REQUEST } from '@/features/products/application/catalog.config';

export const TEST_CATEGORIES = PRODUCT_CATEGORIES.map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name,
  slug: `category-${index + 1}`,
}));
const products: CatalogProduct[] = LOCAL_PRODUCTS.map((product) => ({
  ...product,
  categoryId: TEST_CATEGORIES.find((category) => category.name === product.category)!.id,
  brandId: null,
  currency: 'PEN',
}));
export const catalogFixtureRepository: CatalogRepository = {
  categories: async () => TEST_CATEGORIES,
  find: async (request) => {
    const names = TEST_CATEGORIES.filter((category) =>
      request.categoryIds?.includes(category.id)
    ).map((category) => category.name);
    const selected = searchProducts(products, {
      query: request.query ?? '',
      categories: names,
    }).filter(
      (product) =>
        (request.featured === undefined || product.isFeatured === request.featured) &&
        (request.inStock === undefined || product.inStock === request.inStock)
    );
    return {
      items: selected.slice((request.page - 1) * request.pageSize, request.page * request.pageSize),
      total: selected.length,
      page: request.page,
      totalPages: Math.max(1, Math.ceil(selected.length / request.pageSize)),
    };
  },
};
export const renderWithCatalog = (
  element: ReactElement
): RenderResult & { client: QueryClient } => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  client.setQueryData(['catalog-categories'], TEST_CATEGORIES);
  const featured = products.filter((product) => product.isFeatured && product.inStock);
  client.setQueryData(['catalog', FEATURED_REQUEST], {
    items: featured.slice(0, 8),
    total: featured.length,
    totalPages: Math.max(1, Math.ceil(featured.length / 8)),
    page: 1,
  });
  return {
    ...render(<QueryClientProvider client={client}>{element}</QueryClientProvider>),
    client,
  };
};
