import type { FC } from 'react';
import type { Product } from '../domain/Product';
import { ProductCard } from './ProductCard.component';

interface FeaturedProductsProps {
  products: readonly Product[];
}

export const FeaturedProducts: FC<FeaturedProductsProps> = ({ products }) => (
  <section aria-labelledby="featured-heading">
    <h2 id="featured-heading" className="text-3xl font-bold text-text-main">
      Productos destacados
    </h2>
    <p className="mt-2 text-text-muted">Explora una selección de nuestro catálogo local.</p>
    <div className="mt-6 grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);
