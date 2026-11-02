import type { FC } from 'react';
import type { ProductCategory } from '../domain/Product';

const CATEGORY_PATHS: Record<ProductCategory, string> = {
  Medicamentos: 'm9 15 6-6M5.5 18.5a5 5 0 0 1 0-7l6-6a5 5 0 0 1 7 7l-6 6a5 5 0 0 1-7 0Z',
  'Vitaminas & Suplementos':
    'M9 3h6M10 3v4l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 16l-5-9V3M8 13h8M12 15v4m-2-2h4',
  'Cuidado de la Piel': 'M12 3c-2 3-7 8-7 12a7 7 0 0 0 14 0c0-4-5-9-7-12ZM8 15a4 4 0 0 0 4 4',
  'Mamá & Bebé':
    'M9 4a3 3 0 0 1 6 0M5 10l-2 2m16-2 2 2M8 15h.01M16 15h.01M9 18c2 2 4 2 6 0M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  'Primeros Auxilios':
    'M9 7V4h6v3M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM12 11v6m-3-3h6',
  'Salud Digestiva':
    'M10 3v5c0 2-3 2-4 4-2 4 1 9 5 9h3a6 6 0 0 0 6-6v-3a5 5 0 0 0-5-5c-1 0-1-2-1-4M9 15c0 2 2 3 4 3',
};

export const CategoryIcon: FC<{ category: ProductCategory }> = ({ category }) => (
  <svg
    className="h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={CATEGORY_PATHS[category]} />
  </svg>
);
