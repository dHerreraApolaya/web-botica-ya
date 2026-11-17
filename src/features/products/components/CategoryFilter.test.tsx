import { renderWithCatalog as render, catalogFixtureRepository } from '@/test/catalog.fixture';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LandingScreen } from '../../landing/screens/Landing.screen';

const enableDrawer = (): void => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: () => void) {}
      observe(element: HTMLElement): void {
        Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 1000 });
        Object.defineProperty(element, 'clientWidth', { configurable: true, value: 320 });
        this.callback();
      }
      disconnect(): void {}
    }
  );
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      fireEvent(this, new Event('close'));
    },
  });
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('orders categories alphabetically in both the row and drawer', () => {
  enableDrawer();
  render(<LandingScreen repository={catalogFixtureRepository} />);
  const names = [
    'Cuidado de la Piel',
    'Mamá & Bebé',
    'Medicamentos',
    'Primeros Auxilios',
    'Salud Digestiva',
    'Vitaminas & Suplementos',
  ];
  const categoryNames = (): string[] =>
    screen
      .getAllByRole('button', { pressed: false })
      .map((button) => button.textContent ?? '')
      .filter((name) => names.includes(name));
  expect(categoryNames()).toEqual(names);
  fireEvent.click(screen.getByRole('button', { name: 'Ver categorías' }));
  const drawer = screen.getByRole('dialog');
  expect(
    within(drawer)
      .getAllByRole('button', { pressed: false })
      .map((button) => button.textContent)
  ).toEqual(names);
});

it('selects multiple categories through the drawer and deselects them without losing the query', async () => {
  enableDrawer();
  render(<LandingScreen repository={catalogFixtureRepository} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ver categorías' }));
  const drawer = screen.getByRole('dialog', { name: 'Categorías' });
  fireEvent.click(within(drawer).getByRole('button', { name: 'Medicamentos' }));
  fireEvent.click(within(drawer).getByRole('button', { name: 'Vitaminas & Suplementos' }));
  expect(within(drawer).getByRole('button', { name: 'Medicamentos' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(within(drawer).getByRole('button', { name: /Ver productos/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const cards = within(
    await screen.findByRole('region', { name: 'Resultados de búsqueda' })
  ).getAllByRole('article');
  expect(cards.some((card) => card.textContent?.includes('Medicamentos'))).toBe(true);
  expect(cards.some((card) => card.textContent?.includes('Vitaminas & Suplementos'))).toBe(true);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'parace' } });
  fireEvent.submit(screen.getByRole('search'));
  await screen.findByRole('region', { name: 'Resultados de búsqueda' });
  fireEvent.click(screen.getByRole('button', { name: 'Medicamentos' }));
  expect(await screen.findByText('No encontramos productos')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Vitaminas & Suplementos' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('searchbox')).toHaveValue('parace');
  fireEvent.click(screen.getByRole('button', { name: 'Vitaminas & Suplementos' }));
  await screen.findByRole('region', { name: 'Resultados de búsqueda' });
  expect(screen.queryByText('No encontramos productos')).not.toBeInTheDocument();
});

it('shows an empty drawer search without changing selected filters and restores focus on close', () => {
  enableDrawer();
  render(<LandingScreen repository={catalogFixtureRepository} />);
  const trigger = screen.getByRole('button', { name: 'Ver categorías' });
  fireEvent.click(trigger);
  const drawer = screen.getByRole('dialog');
  fireEvent.change(within(drawer).getByRole('searchbox'), { target: { value: 'inexistente' } });
  expect(within(drawer).getByRole('status')).toHaveTextContent('No encontramos categorías');
  fireEvent.click(within(drawer).getByRole('button', { name: 'Cerrar' }));
  expect(trigger).toHaveFocus();
  expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeVisible();
});
