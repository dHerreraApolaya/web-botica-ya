import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

const navigate = (path: string): void => {
  window.history.replaceState({}, '', path);
};
afterEach(() => {
  cleanup();
  navigate('/');
});

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
