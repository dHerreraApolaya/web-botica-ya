import type { Product, ProductRepository } from '../domain/Product';
import { searchProducts } from '../utils/productSearch.util';
import { LOCAL_PRODUCTS } from './products.data';

export const createLocalProductRepository = (products: readonly Product[]): ProductRepository => ({
  getFeatured: (limit = 8) =>
    products.filter((product) => product.isFeatured && product.inStock).slice(0, limit),
  search: (search) => searchProducts(products, search),
});

export const localProductRepository: ProductRepository =
  createLocalProductRepository(LOCAL_PRODUCTS);
