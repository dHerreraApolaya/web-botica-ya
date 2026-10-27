import { describe, expect, it } from 'vitest';
import { LOCAL_PRODUCTS } from '../data/products.data';
import { createLocalProductRepository } from '../data/localProduct.repository';
import { normalizeSearch, paginateProducts, searchProducts } from './productSearch.util';

describe('local catalog', () => {
  it('contains 500 deterministic, distinct, valid products across six categories', () => {
    expect(LOCAL_PRODUCTS).toHaveLength(500);
    expect(new Set(LOCAL_PRODUCTS.map(({ id }) => id)).size).toBe(500);
    expect(new Set(LOCAL_PRODUCTS.map(({ sku }) => sku)).size).toBe(500);
    expect(
      new Set(LOCAL_PRODUCTS.map(({ name, presentation }) => `${name} ${presentation}`)).size
    ).toBe(500);
    expect(new Set(LOCAL_PRODUCTS.map(({ category }) => category)).size).toBe(6);
    expect(
      LOCAL_PRODUCTS.every((product) => product.priceInCents > 0 && product.name && product.brand)
    ).toBe(true);
    expect(Object.isFrozen(LOCAL_PRODUCTS)).toBe(true);
    expect(LOCAL_PRODUCTS.every(Object.isFrozen)).toBe(true);
  });

  it('returns only available featured products, respecting the limit', () => {
    const repository = createLocalProductRepository(LOCAL_PRODUCTS);
    expect(repository.getFeatured()).toHaveLength(8);
    expect(repository.getFeatured().every((product) => product.isFeatured && product.inStock)).toBe(
      true
    );
    expect(repository.getFeatured(2)).toHaveLength(2);
    expect(repository.getFeatured(0)).toEqual([]);
    expect(createLocalProductRepository([]).getFeatured()).toEqual([]);
    expect(repository.search({ query: '' })).toHaveLength(500);
  });
});

describe('product search', () => {
  it('normalizes accents, case, and repeated whitespace', () => {
    expect(normalizeSearch('  MAMÁ   & BEBÉ  ')).toBe('mama & bebe');
  });

  it('matches every term across product fields', () => {
    const product = LOCAL_PRODUCTS[0];
    const query = `${product.name.toUpperCase()} ${product.brand} ${product.presentation} ${product.sku}`;
    expect(searchProducts(LOCAL_PRODUCTS, { query })).toEqual([product]);
    expect(searchProducts(LOCAL_PRODUCTS, { query: 'PARACETAMOL inexistente' })).toEqual([]);
  });

  it('searches categories and ignores blank queries', () => {
    expect(searchProducts(LOCAL_PRODUCTS, { query: '  ' })).toHaveLength(500);
    const results = searchProducts(LOCAL_PRODUCTS, { query: 'mama bebe' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === 'Mamá & Bebé')).toBe(true);
  });

  it('combines a precise category filter and text without mutating data', () => {
    const before = [...LOCAL_PRODUCTS];
    const results = searchProducts(LOCAL_PRODUCTS, { query: '', category: 'Medicamentos' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === 'Medicamentos')).toBe(true);
    expect(
      searchProducts(LOCAL_PRODUCTS, { query: 'paracetamol', category: 'Mamá & Bebé' })
    ).toEqual([]);
    expect(LOCAL_PRODUCTS).toEqual(before);
  });

  it('handles empty input data and treats special characters as literal text', () => {
    expect(searchProducts([], { query: '' })).toEqual([]);
    expect(searchProducts(LOCAL_PRODUCTS, { query: '<script>.*[' })).toEqual([]);
  });
});

describe('pagination', () => {
  it('returns distinct pages and a partial final page', () => {
    const first = paginateProducts(LOCAL_PRODUCTS, 1);
    const second = paginateProducts(LOCAL_PRODUCTS, 2);
    expect(first.items).toHaveLength(12);
    expect(first.totalPages).toBe(42);
    expect(second.items).toEqual(LOCAL_PRODUCTS.slice(12, 24));
    expect(second.items.some((product) => first.items.includes(product))).toBe(false);
    expect(paginateProducts(LOCAL_PRODUCTS, 42).items).toHaveLength(8);
  });

  it('clamps invalid pages and supports empty results', () => {
    expect(paginateProducts(LOCAL_PRODUCTS, -3).page).toBe(1);
    expect(paginateProducts(LOCAL_PRODUCTS, 200).page).toBe(42);
    expect(paginateProducts([], 1)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
