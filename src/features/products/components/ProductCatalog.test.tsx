import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LandingScreen } from '../../landing/screens/Landing.screen';
import { ProductCard } from './ProductCard.component';
import { LOCAL_PRODUCTS } from '../data/products.data';

afterEach(cleanup);

const submitSearch = (query: string): void => {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('search'));
};

const results = (): HTMLElement => screen.getByRole('region', { name: 'Resultados de búsqueda' });

describe('landing product catalog', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
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
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });
});
