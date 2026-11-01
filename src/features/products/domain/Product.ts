export const PRODUCT_CATEGORIES = [
  'Medicamentos',
  'Vitaminas & Suplementos',
  'Cuidado de la Piel',
  'Mamá & Bebé',
  'Primeros Auxilios',
  'Salud Digestiva',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly brand: string;
  readonly presentation: string;
  readonly priceInCents: number;
  readonly inStock: boolean;
  readonly availableQuantity: number;
  readonly requiresPrescription: boolean;
  readonly isFeatured: boolean;
}

export interface ProductSearch {
  readonly query: string;
  readonly category?: ProductCategory;
}

export interface ProductPage {
  readonly items: readonly Product[];
  readonly page: number;
  readonly totalPages: number;
}

export interface ProductRepository {
  getFeatured(limit?: number): readonly Product[];
  search(search: ProductSearch): readonly Product[];
}
