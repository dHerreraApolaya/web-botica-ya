import type { Product } from './Product';

export interface CatalogCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}
export interface CatalogProduct extends Product {
  readonly categoryId: string;
  readonly brandId: string | null;
  readonly currency: 'PEN';
}
export interface CatalogRequest {
  readonly query?: string;
  readonly categoryIds?: readonly string[];
  readonly featured?: boolean;
  readonly inStock?: boolean;
  readonly page: number;
  readonly pageSize: number;
}
export interface CatalogPage {
  readonly items: readonly CatalogProduct[];
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
}
export interface CatalogRepository {
  find(request: CatalogRequest, signal?: AbortSignal): Promise<CatalogPage>;
  categories(signal?: AbortSignal): Promise<readonly CatalogCategory[]>;
}
