import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout.layout';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('returns to the top on route changes without resetting scroll for query changes', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  render(
    <MemoryRouter>
      <MainLayout>
        <Link to="/carrito">Abrir carrito</Link>
        <Link to="/carrito?detalle=1">Ver detalle</Link>
        <Link to="/">Regresar</Link>
      </MainLayout>
    </MemoryRouter>
  );
  scroll.mockClear();
  fireEvent.click(screen.getByRole('link', { name: 'Abrir carrito' }));
  expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  expect(scroll).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('link', { name: 'Ver detalle' }));
  expect(scroll).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('link', { name: 'Regresar' }));
  expect(scroll).toHaveBeenCalledTimes(2);
});
