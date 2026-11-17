import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render as renderUncached,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  renderWithCatalog,
  catalogFixtureRepository,
  TEST_CATEGORIES,
} from '@/test/catalog.fixture';
import { LandingScreen } from '../../landing/screens/Landing.screen';
import { ProductCard } from './ProductCard.component';
import { ProductResults } from './ProductResults.component';
import { salesStore } from '../../sales/state/sales.store';
import { LOCAL_PRODUCTS } from '../data/products.data';
import type { CatalogRepository } from '../domain/Catalog';

afterEach(() => {
  cleanup();
  salesStore.getState().reset();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const submitSearch = (query: string): void => {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('search'));
};
const results = () => screen.findByRole('region', { name: 'Resultados de búsqueda' });
const renderLanding = (repository: CatalogRepository = catalogFixtureRepository) =>
  renderWithCatalog(<LandingScreen repository={repository} />);

describe('API product catalog', () => {
  it('identifies fictional prices and stock before a purchase starts', async () => {
    renderLanding();
    expect(
      screen.getByText(/Catálogo de demostración\. Productos, precios, stock/)
    ).toBeInTheDocument();
    await screen.findAllByRole('article');
  });
  it('uses the production HTTP composition without substituting the local catalog', async () => {
    const product = {
      ...LOCAL_PRODUCTS[0],
      categoryId: TEST_CATEGORIES[0].id,
      brandId: null,
      currency: 'PEN',
      image: null,
    };
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async (input) =>
        ({
          ok: true,
          json: async () =>
            String(input).endsWith('/categories')
              ? TEST_CATEGORIES
              : { items: [product], total: 1, totalPages: 1, page: 1 },
        }) as Response
    );
    vi.stubGlobal('fetch', fetcher);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    renderUncached(
      <QueryClientProvider client={client}>
        <LandingScreen />
      </QueryClientProvider>
    );
    expect(await screen.findByRole('article')).toHaveTextContent(product.name);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/products/catalog?page=1&pageSize=8&featured=true&inStock=true',
      expect.objectContaining({ credentials: 'omit' })
    );
    expect(fetcher).toHaveBeenCalledWith('/api/categories', expect.any(Object));
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
  it('keeps exact totals and a bounded page window at the navigation limit', () => {
    renderWithCatalog(
      <ProductResults
        resultPage={{ items: [], page: 1000, totalPages: 2000 }}
        total={24000}
        onPageChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('Página 1000 de 2000')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Ir a la página/ })).toHaveLength(5);
    expect(screen.getByText('Refina la búsqueda para ver más resultados.')).toBeVisible();
  });
  it('shows eight explicitly supplied featured products and preserves the default graphic', () => {
    renderLanding();
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeVisible();
    expect(document.querySelectorAll('article img')).toHaveLength(0);
  });
  it('debounces rapid input and cancels pending work on submit, clear and unmount', async () => {
    vi.useFakeTimers();
    const find = vi.spyOn(catalogFixtureRepository, 'find');
    const view = renderLanding();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'para' } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
    act(() => vi.advanceTimersByTime(299));
    expect(find).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(find).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitamina' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('search'));
    });
    expect(find).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    act(() => vi.advanceTimersByTime(300));
    expect(find).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'otro' } });
    view.unmount();
    act(() => vi.advanceTimersByTime(300));
    expect(find).toHaveBeenCalledTimes(2);
  });
  it.each([
    { pause: 200, expected: ['alchol'] },
    { pause: 350, expected: ['alc', 'alcho', 'alchol'] },
  ])(
    'debounces the observed search sequence with $pause ms pauses',
    async ({ pause, expected }) => {
      vi.useFakeTimers();
      const find = vi.spyOn(catalogFixtureRepository, 'find');
      renderLanding();
      for (const query of ['alc', 'alcho', 'alchol']) {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
        await act(async () => {
          vi.advanceTimersByTime(pause);
        });
      }
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(find.mock.calls.map(([request]) => request.query)).toEqual(expected);
    }
  );
  it('retains filters, sends normalized search and restores featured products on clear', async () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Medicamentos' }));
    submitSearch('  PARACETAMOL  ');
    const region = await results();
    expect(
      within(region)
        .getAllByRole('article')
        .every((card) => card.textContent?.includes('Paracetamol'))
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Medicamentos' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Medicamentos' }));
    expect(screen.getByRole('searchbox')).toHaveValue('  PARACETAMOL  ');
    await results();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });
  it('navigates the complete server catalog and resets page when filters change', async () => {
    renderLanding();
    submitSearch('');
    await results();
    expect(screen.getByRole('status')).toHaveTextContent('500 productos encontrados');
    const first = screen.getAllByRole('article')[0].textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Ir a la página 2' }));
    await screen.findByText('Página 2 de 42');
    expect(screen.getByRole('button', { name: 'Ir a la página 2' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getAllByRole('article')[0].textContent).not.toBe(first);
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('Página 1 de 42');
    expect(screen.getAllByRole('article')[0].textContent).toBe(first);
    fireEvent.click(screen.getByRole('button', { name: 'Mamá & Bebé' }));
    await results();
    expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 7');
    expect(
      screen.getAllByRole('article').every((card) => card.textContent?.includes('Mamá & Bebé'))
    ).toBe(true);
  });
  it('renders a partial final page and respects exact totals', async () => {
    const repository: CatalogRepository = {
      ...catalogFixtureRepository,
      find: async (request, signal) => {
        const result = await catalogFixtureRepository.find(request, signal);
        return {
          ...result,
          total: 14,
          totalPages: 2,
          items: result.items.slice(0, request.page === 2 ? 2 : 12),
        };
      },
    };
    renderLanding(repository);
    submitSearch('');
    await results();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Página 2 de 2');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
  it('shows a genuine empty response and never invents products', async () => {
    renderLanding();
    submitSearch('<script>missing</script>');
    expect(await screen.findByText('No encontramos productos')).toBeVisible();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
  it('validates short input without sending an invalid search', async () => {
    const find = vi.spyOn(catalogFixtureRepository, 'find');
    renderLanding();
    submitSearch('pa');
    expect(screen.getByText(/Escribe entre 3 y 128/)).toBeVisible();
    expect(find).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });
  it('separates loading, product errors and retry without mock fallback', async () => {
    let reject: (error: Error) => void = () => undefined;
    const find = vi
      .fn<CatalogRepository['find']>()
      .mockImplementationOnce(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          })
      )
      .mockResolvedValue({ items: [], total: 0, totalPages: 1, page: 1 });
    renderLanding({ ...catalogFixtureRepository, find });
    submitSearch('');
    expect(screen.getByText('Cargando productos…')).toBeVisible();
    await act(async () => {
      reject(new Error('synthetic-private-error'));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(document.body).not.toHaveTextContent('synthetic-private-error');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar productos' }));
    await screen.findByText('No encontramos productos');
    expect(find).toHaveBeenCalledTimes(2);
  });
  it('shows separate category failure and retry while preserving products', async () => {
    const repository = {
      ...catalogFixtureRepository,
      categories: vi
        .fn<CatalogRepository['categories']>()
        .mockRejectedValueOnce(new Error('private'))
        .mockResolvedValue([]),
    };
    const { client } = renderLanding(repository);
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['catalog-categories'] });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las categorías');
    expect(screen.getAllByRole('article')).toHaveLength(8);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar categorías' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
  it('cancels an obsolete request instead of displaying its late response', async () => {
    let obsoleteSignal: AbortSignal | undefined;
    const repository: CatalogRepository = {
      ...catalogFixtureRepository,
      find: (request, signal) => {
        if (request.query === 'anterior') {
          obsoleteSignal = signal;
          return new Promise(() => undefined);
        }
        return catalogFixtureRepository.find(request, signal);
      },
    };
    renderLanding(repository);
    submitSearch('anterior');
    submitSearch('parace');
    await results();
    expect(obsoleteSignal?.aborted).toBe(true);
    expect(
      screen.getAllByRole('article').every((card) => card.textContent?.includes('Paracetamol'))
    ).toBe(true);
  });
});

describe('product card', () => {
  it('updates availability as the cart exhausts stock', () => {
    const product = { ...LOCAL_PRODUCTS[0], availableQuantity: 1 };
    renderWithCatalog(<ProductCard product={product} />);
    expect(screen.getByText('Disponible')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: `Agregar ${product.name} al carrito` }));
    expect(screen.getByText('Agotado')).toHaveClass('bg-error');
    act(() => salesStore.getState().removeProduct(product.id));
    expect(screen.getByText('Disponible')).toBeVisible();
  });
  it('shows product identity, PEN price and unavailable state', () => {
    const product = { ...LOCAL_PRODUCTS[0], inStock: false };
    renderWithCatalog(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { name: product.name })).toBeVisible();
    expect(screen.getByText(product.presentation)).toBeVisible();
    expect(screen.getByText(product.brand)).toBeVisible();
    expect(screen.getByText(`SKU: ${product.sku}`)).toBeVisible();
    expect(screen.getByText(/S\/\s*[\d,.]+/)).toBeVisible();
    expect(screen.getAllByText('Agotado')).toHaveLength(2);
  });
});
