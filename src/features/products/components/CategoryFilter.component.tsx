import { useEffect, useRef, useState, type FC } from 'react';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../domain/Product';
import { normalizeSearch } from '../utils/productSearch.util';
import { CategoryIcon } from './CategoryIcon.component';

interface Props {
  selected: readonly ProductCategory[];
  onToggle: (category: ProductCategory) => void;
  onClose?: () => void;
}
const SORTED_CATEGORIES = [...PRODUCT_CATEGORIES].sort((left, right) =>
  left.localeCompare(right, 'es')
);

const BUTTON_STYLE =
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-main transition-colors duration-fast hover:border-primary hover:bg-primary-surface aria-pressed:border-primary aria-pressed:bg-primary-surface aria-pressed:text-primary-surface-text';

export const CategoryFilter: FC<Props> = ({ selected, onToggle, onClose }) => {
  const row = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    const element = row.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => setOverflow(element.scrollWidth > element.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  const close = (): void => dialog.current?.close();
  const renderCategory = (category: ProductCategory) => (
    <button
      key={category}
      type="button"
      aria-pressed={selected.includes(category)}
      onClick={() => onToggle(category)}
      className={BUTTON_STYLE}
    >
      <CategoryIcon category={category} />
      <span>{category}</span>
    </button>
  );
  const matches = SORTED_CATEGORIES.filter((category) =>
    normalizeSearch(category).includes(normalizeSearch(filter))
  );
  return (
    <div className="mt-4 text-left">
      <p className="mb-2 text-xs font-semibold text-text-muted">
        Explora por categoría · puedes elegir varias
      </p>
      <div className="flex min-w-0 items-start gap-2">
        <div
          ref={row}
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible"
        >
          {SORTED_CATEGORIES.map(renderCategory)}
        </div>
        {overflow ? (
          <button
            ref={trigger}
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              setFilter('');
              dialog.current?.showModal();
            }}
            className="min-h-11 shrink-0 whitespace-nowrap rounded-md border border-primary bg-surface px-3 text-xs font-semibold text-primary-surface-text sm:hidden"
          >
            Ver categorías{selected.length ? ` (${selected.length})` : ''}
          </button>
        ) : null}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="category-drawer-title"
        onClose={() => {
          trigger.current?.focus();
          onClose?.();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="category-drawer m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-xl border border-border bg-surface p-0 text-text-main shadow-overlay backdrop:bg-text-main/40"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <h2 id="category-drawer-title" className="text-lg font-bold">
            Categorías
          </h2>
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-text-muted">
            Selecciona varias o vuelve a pulsar para desmarcar.
          </p>
          <label className="block text-sm font-semibold">
            Buscar categoría
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              type="search"
              className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-4 text-text-main"
            />
          </label>
          <div className="flex flex-wrap gap-2">{matches.map(renderCategory)}</div>
          {!matches.length ? (
            <p role="status" className="text-sm text-text-muted">
              No encontramos categorías. Prueba con otro nombre.
            </p>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="min-h-12 w-full rounded-md border border-primary bg-primary px-4 font-semibold text-primary-contrast"
          >
            Ver productos{selected.length ? ` (${selected.length} categorías)` : ''}
          </button>
        </div>
      </dialog>
    </div>
  );
};
