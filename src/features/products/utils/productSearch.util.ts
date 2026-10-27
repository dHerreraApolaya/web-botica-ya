import type { Product, ProductPage, ProductSearch } from '../domain/Product';

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const WHITESPACE_PATTERN = /\s+/g;
const PAGE_SIZE = 12;

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(WHITESPACE_PATTERN, ' ');

export const searchProducts = (
  products: readonly Product[],
  { query, category }: ProductSearch
): readonly Product[] => {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);

  return products.filter((product) => {
    if (category && product.category !== category) return false;
    const searchableText = normalizeSearch(
      `${product.name} ${product.brand} ${product.category} ${product.presentation} ${product.sku}`
    );
    return terms.every((term) => searchableText.includes(term));
  });
};

export const paginateProducts = (
  products: readonly Product[],
  requestedPage: number
): ProductPage => {
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * PAGE_SIZE;

  return { items: products.slice(start, start + PAGE_SIZE), page, totalPages };
};
