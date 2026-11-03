import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingScreen } from '../../landing/screens/Landing.screen';
import { ProductCard } from './ProductCard.component';
import { localProductRepository } from '../data/localProduct.repository';
import { salesStore } from '../../sales/state/sales.store';
import { LOCAL_PRODUCTS } from '../data/products.data';

afterEach(() => {
  cleanup();
  salesStore.getState().reset();
  vi.useRealTimers();
});

const submitSearch = (query: string): void => {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('search'));
};

const results = (): HTMLElement => screen.getByRole('region', { name: 'Resultados de búsqueda' });

describe('landing product catalog', () => {
  it('debounces rapid typing, skips repeated filtering, and cancels pending work on submit and clear', () => {
    vi.useFakeTimers();
    const search = vi.spyOn(localProductRepository, 'search');
    render(<LandingScreen />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'para' } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
    act(() => vi.advanceTimersByTime(299));
    expect(search).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(search).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitamina' } });
    expect(search).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByRole('search'));
    expect(search).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(300));
    expect(search).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    expect(search).toHaveBeenCalledTimes(2);
    search.mockRestore();
  });

  it('toggles the selected category off without clearing a typed query', () => {
    render(<LandingScreen />);
    const category = screen.getByRole('button', { name: 'Medicamentos' });
    fireEvent.click(category);
    fireEvent.click(category);
    expect(category).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    fireEvent.click(category);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
    fireEvent.click(category);
    expect(category).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('searchbox')).toHaveValue('parace');
    expect(within(results()).getAllByRole('article').length).toBeGreaterThan(0);
  });

  it('finds partial matches after a typing pause and restores featured products when cleared', () => {
    vi.useFakeTimers();
    render(<LandingScreen />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'PARACE' } });
    expect(
      screen.queryByRole('region', { name: 'Resultados de búsqueda' })
    ).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(within(results()).getAllByRole('article').length).toBeGreaterThan(0);
    expect(
      within(results())
        .getAllByRole('article')
        .every((card) => card.textContent?.includes('Paracetamol'))
    ).toBe(true);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });

  it('retains the category filter when typing a partial match and submitting', () => {
    render(<LandingScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Medicamentos' }));
    submitSearch('parace');
    expect(screen.getByRole('button', { name: 'Medicamentos' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      within(results())
        .getAllByRole('article')
        .every((card) => card.textContent?.includes('Paracetamol'))
    ).toBe(true);
  });

  it('shows eight featured products in the initial view', () => {
    render(<LandingScreen />);
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Paginación de productos' })
    ).not.toBeInTheDocument();
  });

  it('submits the search form, displays normalized matches, and resets', () => {
    render(<LandingScreen />);
    submitSearch('  PARACETAMOL  ');
    expect(within(results()).getAllByRole('article').length).toBeGreaterThan(0);
    expect(
      within(results())
        .getAllByRole('article')
        .every((card) => card.textContent?.includes('Paracetamol'))
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });

  it('browses all 500 products, paginates, and resets the page on a new query', () => {
    render(<LandingScreen />);
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('status')).toHaveTextContent('500 productos');
    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    const firstProduct = screen.getAllByRole('article')[0].textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Página 2 de 42')).toBeInTheDocument();
    expect(screen.getAllByRole('article')[0].textContent).not.toBe(firstProduct);
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getAllByRole('article')[0].textContent).toBe(firstProduct);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    submitSearch('  ');
    expect(screen.getByText('Página 1 de 42')).toBeInTheDocument();
    for (let page = 1; page < 42; page += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('filters by category, highlights selection, and resets pagination', () => {
    render(<LandingScreen />);
    submitSearch('');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mamá & Bebé' }));
    expect(screen.getByRole('button', { name: 'Mamá & Bebé' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 7');
    expect(
      within(results())
        .getAllByRole('article')
        .every((card) => card.textContent?.includes('Mamá & Bebé'))
    ).toBe(true);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('renders an empty state safely and can restore featured products', () => {
    render(<LandingScreen />);
    submitSearch('<script>missing</script>');
    expect(screen.getByRole('status')).toHaveTextContent('0 productos');
    expect(screen.getByText('No encontramos productos')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });
});

describe('product card', () => {
  it('turns the stock badge red when the cart exhausts stock and restores it when units are removed', () => {
    const product = { ...LOCAL_PRODUCTS[0], availableQuantity: 1 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Disponible')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: `Agregar ${product.name} al carrito` }));
    expect(screen.getByText('Agotado')).toHaveClass('bg-error', 'text-primary-contrast');
    expect(screen.queryByText('Disponible')).not.toBeInTheDocument();
    act(() => salesStore.getState().removeProduct(product.id));
    expect(screen.getByText('Disponible')).not.toHaveClass('bg-error');
  });

  it('shows local identity, PEN prices, presentation, and stock status', () => {
    const product = LOCAL_PRODUCTS[0];
    render(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { name: product.name })).toBeInTheDocument();
    expect(screen.getByText(product.presentation)).toBeInTheDocument();
    expect(screen.getByText(product.brand)).toBeInTheDocument();
    expect(screen.getByText(`SKU: ${product.sku}`)).toBeInTheDocument();
    expect(screen.getByText(/S\/\s*[\d,.]+/)).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('distinguishes unavailable products', () => {
    render(<ProductCard product={{ ...LOCAL_PRODUCTS[0], inStock: false }} />);
    expect(screen.getAllByText('Agotado')).toHaveLength(2);
  });
});
