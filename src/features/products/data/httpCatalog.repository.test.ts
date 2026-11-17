import { describe, expect, it, vi } from 'vitest';
import { createHttpCatalogRepository, CatalogUnavailable } from './httpCatalog.repository';
import { PRODUCT_LOGS } from '../constants/productLogs.constants';

const categoryId = '00000000-0000-4000-8000-000000000001';
const product = {
  id: 'official-test-1',
  sku: 'TEST-1',
  name: 'Producto de prueba',
  category: 'Medicamentos',
  categoryId,
  brand: '',
  brandId: null,
  presentation: 'Caja',
  priceInCents: 100,
  currency: 'PEN',
  availableQuantity: 2,
  inStock: true,
  requiresPrescription: true,
  isFeatured: false,
  image: null,
};
const page = { items: [product], page: 1, totalPages: 1, total: 1 };
const request = { page: 1, pageSize: 12 };
const response = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe('HTTP catalog adapter', () => {
  it('encodes filters, returns validated data, omits credentials and forwards cancellation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(page));
    const abort = new AbortController();
    const repository = createHttpCatalogRepository({ baseUrl: '/api/', fetcher });
    const result = await repository.find(
      {
        ...request,
        query: 'Caja & marca',
        categoryIds: [categoryId, categoryId],
        featured: false,
        inStock: true,
      },
      abort.signal
    );
    expect(result.items[0]).toEqual(product);
    const [url, options] = fetcher.mock.calls[0];
    const params = new URL(String(url), 'https://example.test').searchParams;
    expect(params.get('q')).toBe('Caja & marca');
    expect(params.get('categoryIds')).toBe(categoryId);
    expect(params.get('featured')).toBe('false');
    expect(params.get('inStock')).toBe('true');
    expect(options?.credentials).toBe('omit');
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    abort.abort();
    expect(options?.signal?.aborted).toBe(true);
  });
  it('loads categories without interpreting HTML or fetching images', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response([{ id: categoryId, name: '<script>test</script>', slug: 'test' }])
      );
    expect(await createHttpCatalogRepository({ fetcher }).categories()).toEqual([
      { id: categoryId, name: '<script>test</script>', slug: 'test' },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/api/categories', expect.any(Object));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    response({}, false),
    response({ ...page, items: [{ ...product, currency: 'USD' }] }),
    response({ ...page, total: 0 }),
    response({ ...page, totalPages: 9 }),
    response({ ...page, page: 2 }),
    response({ ...page, items: [product, product], total: 2 }),
    response({ ...page, items: [{ ...product, inStock: false }] }),
  ])('rejects unavailable or inconsistent responses without exposing payloads', async (result) => {
    const logger = { log: vi.fn() };
    const repository = createHttpCatalogRepository({
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(result),
      logger,
    });
    await expect(repository.find(request)).rejects.toThrow(CatalogUnavailable);
    expect(logger.log).toHaveBeenCalledExactlyOnceWith(PRODUCT_LOGS.ADAPTER_FAILED);
  });
  it('handles network and malformed JSON failures without leaking raw exceptions', async () => {
    const logger = { log: vi.fn() };
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('synthetic-secret-url'));
    await expect(createHttpCatalogRepository({ fetcher, logger }).find(request)).rejects.toThrow(
      'No se pudo consultar el catálogo.'
    );
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('synthetic-secret-url');
    fetcher.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('private response');
      },
    } as unknown as Response);
    await expect(createHttpCatalogRepository({ fetcher }).categories()).rejects.toThrow(
      CatalogUnavailable
    );
  });
  it('does not log cancellation or send already aborted requests', async () => {
    const logger = { log: vi.fn() };
    const abort = new AbortController();
    abort.abort();
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      createHttpCatalogRepository({ fetcher, logger }).categories(abort.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });
  it('rejects invalid request limits before calling the server', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      createHttpCatalogRepository({ fetcher }).find({ ...request, pageSize: 51 })
    ).rejects.toThrow(CatalogUnavailable);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('contains a broken monitoring adapter', async () => {
    const logger = {
      log: () => {
        throw new Error('synthetic logger secret');
      },
    };
    await expect(
      createHttpCatalogRepository({
        fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error()),
        logger,
      }).categories()
    ).rejects.toThrow('No se pudo consultar el catálogo.');
  });
});
