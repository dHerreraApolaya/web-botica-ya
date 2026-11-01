import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { salesStore } from './features/sales/state/sales.store';

afterEach(() => {
  cleanup();
  salesStore.getState().reset();
  window.history.replaceState({}, '', '/');
});
describe('sales route integration', () => {
  it('connects product additions and cart navigation', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar .* al carrito/ })[0]);
    fireEvent.click(screen.getByRole('link', { name: 'Carrito de compras' }));
    expect(await screen.findByRole('heading', { name: 'Tu carrito' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Seguir comprando/ }));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Subir Receta' }));
    expect(await screen.findByRole('heading', { name: 'Entrega o recojo' })).toBeInTheDocument();
  });

  it('handles unknown routes and direct checkout entry', async () => {
    window.history.replaceState({}, '', '/missing');
    const view = render(<App />);
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Volver a la tienda' }));
    view.unmount();
    window.history.replaceState({}, '', '/confirmacion');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Tu carrito está vacío' })
    ).toBeInTheDocument();
  });
});

const navigate = (path: string): void => {
  window.history.replaceState({}, '', path);
};

describe('application routing', () => {
  it('preserves products and connects user entry and registration routes', async () => {
    navigate('/');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Ingresar' }));
    expect(await screen.findByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Regístrate' }));
    expect(await screen.findByRole('form', { name: 'Crear cuenta' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Volver a la tienda/ }));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
  });

  it('supports direct registration entry and unknown routes', async () => {
    navigate('/registro');
    const view = render(<App />);
    expect(await screen.findByRole('form', { name: 'Crear cuenta' })).toBeInTheDocument();
    view.unmount();
    navigate('/missing');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Volver a la tienda/ }));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
  });
});
