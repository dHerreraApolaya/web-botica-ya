import { scrollToCatalogSection } from '@/utils/catalogScroll.util';
import { useEffect, useState, type FC } from 'react';

export const CatalogNavigation: FC = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = (): void => {
      const filters = document.getElementById('catalog-filters');
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      setVisible(Boolean(filters && filters.getBoundingClientRect().bottom < headerHeight));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById('product-search')?.focus({ preventScroll: true });
        scrollToCatalogSection('catalog-filters');
      }}
      className="fixed bottom-6 right-4 z-sticky inline-flex min-h-12 items-center gap-2 rounded-full border border-primary bg-surface px-4 py-3 text-sm font-semibold text-primary-surface-text shadow-floating transition-colors hover:bg-primary-surface sm:right-6"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 12 6-6 6 6M12 6v14" />
      </svg>
      Volver a filtros
    </button>
  );
};
