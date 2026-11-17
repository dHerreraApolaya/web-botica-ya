import { envConfig } from '@/config/env.config';
import { createHttpCatalogRepository } from '../data/httpCatalog.repository';
import type { CatalogRequest } from '../domain/Catalog';

export const FEATURED_REQUEST: CatalogRequest = Object.freeze({
  featured: true,
  inStock: true,
  page: 1,
  pageSize: 8,
});
export const catalogRepository = createHttpCatalogRepository({
  baseUrl: envConfig.VITE_API_BASE_URL ?? '/api',
});
