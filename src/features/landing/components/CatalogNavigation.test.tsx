import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CatalogNavigation } from './CatalogNavigation.component';
import { scrollToCatalogSection } from '@/utils/catalogScroll.util';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('shows a return button below filters and returns focus and scroll to the search section', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  const bounds = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ top: 200, bottom: 300, height: 100 } as DOMRect);
  render(
    <>
      <div id="catalog-filters">
        <input id="product-search" aria-label="Buscar productos" />
      </div>
      <CatalogNavigation />
    </>
  );
  expect(screen.queryByRole('button', { name: 'Volver a filtros' })).not.toBeInTheDocument();
  bounds.mockReturnValue({ top: -300, bottom: -100, height: 200 } as DOMRect);
  fireEvent.scroll(window);
  const button = screen.getByRole('button', { name: 'Volver a filtros' });
  fireEvent.click(button);
  expect(screen.getByRole('textbox')).toHaveFocus();
  expect(scroll).toHaveBeenCalled();
  bounds.mockReturnValue({ top: 200, bottom: 300, height: 100 } as DOMRect);
  fireEvent.scroll(window);
  expect(screen.queryByRole('button', { name: 'Volver a filtros' })).not.toBeInTheDocument();
});

it('accounts for header height and reduced motion and ignores missing targets', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(
    <>
      <header />
      <div id="catalog-results" />
    </>
  );
  vi.spyOn(screen.getByRole('banner'), 'getBoundingClientRect').mockReturnValue({
    height: 100,
  } as DOMRect);
  vi.spyOn(document.getElementById('catalog-results')!, 'getBoundingClientRect').mockReturnValue({
    top: 500,
  } as DOMRect);
  scrollToCatalogSection('catalog-results');
  expect(scroll).toHaveBeenCalledWith({ top: 384, behavior: 'instant' });
  scroll.mockClear();
  scrollToCatalogSection('missing');
  expect(scroll).not.toHaveBeenCalled();
});
