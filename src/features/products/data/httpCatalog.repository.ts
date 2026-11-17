import type { CatalogRepository, CatalogRequest } from '../domain/Catalog';
import { catalogPageSchema, catalogRequestSchema, categoriesSchema } from './catalog.schema';
import { NOOP_LOGGER, type TechnicalLogger } from '@/shared/observability/observability.service';
import { PRODUCT_LOGS } from '../constants/productLogs.constants';

export class CatalogUnavailable extends Error {
  constructor() {
    super('No se pudo consultar el catálogo.');
    this.name = 'CatalogUnavailable';
  }
}
interface HttpCatalogOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  logger?: TechnicalLogger;
}
export const createHttpCatalogRepository = ({
  baseUrl = '/api',
  fetcher = (...args) => fetch(...args),
  logger = NOOP_LOGGER,
}: HttpCatalogOptions = {}): CatalogRepository => {
  const get = async (path: string, signal?: AbortSignal): Promise<unknown> => {
    try {
      if (signal?.aborted) throw new CatalogUnavailable();
      const timeout = AbortSignal.timeout(10000);
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      if (!response.ok) throw new CatalogUnavailable();
      return await response.json();
    } catch {
      if (signal?.aborted) throw new DOMException('Consulta cancelada.', 'AbortError');
      throw new CatalogUnavailable();
    }
  };
  const execute = async <T>(operation: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
    try {
      return await operation();
    } catch {
      if (signal?.aborted) throw new DOMException('Consulta cancelada.', 'AbortError');
      try {
        logger.log(PRODUCT_LOGS.ADAPTER_FAILED);
      } catch {
        throw new CatalogUnavailable();
      }
      throw new CatalogUnavailable();
    }
  };
  return {
    categories: (signal) =>
      execute(async () => categoriesSchema.parse(await get('/categories', signal)), signal),
    find: (request: CatalogRequest, signal) =>
      execute(async () => {
        const input = catalogRequestSchema.parse(request);
        const params = new URLSearchParams({
          page: String(input.page),
          pageSize: String(input.pageSize),
        });
        if (input.query) params.set('q', input.query);
        if (input.categoryIds?.length)
          params.set('categoryIds', [...new Set(input.categoryIds)].sort().join(','));
        if (input.featured !== undefined) params.set('featured', String(input.featured));
        if (input.inStock !== undefined) params.set('inStock', String(input.inStock));
        const result = catalogPageSchema.parse(await get(`/products/catalog?${params}`, signal));
        if (
          result.page !== input.page ||
          result.items.length > Math.min(input.pageSize, result.total) ||
          new Set(result.items.map((product) => product.id)).size !== result.items.length ||
          result.totalPages !== Math.max(1, Math.ceil(result.total / input.pageSize))
        )
          throw new CatalogUnavailable();
        return result;
      }, signal),
  };
};
