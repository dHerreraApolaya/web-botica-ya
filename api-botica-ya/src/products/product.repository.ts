import type { Pool } from 'pg';

export const PRODUCT_QUERY = `
  SELECT id, sku, name, category, brand, presentation,
         price_in_cents AS "priceInCents",
         available_quantity AS "availableQuantity",
         available_quantity > 0 AS "inStock",
         requires_prescription AS "requiresPrescription",
         is_featured AS "isFeatured"
  FROM public.products
  ORDER BY id
`;

export async function getProducts(pool: Pool) {
  const result = await pool.query(PRODUCT_QUERY);
  return result.rows;
}

export async function getInventory(pool: Pool) {
  const result = await pool.query(`
    SELECT id AS "productId", sku,
           available_quantity AS "availableQuantity",
           available_quantity > 0 AS "inStock"
    FROM public.products
    ORDER BY id
  `);
  return result.rows;
}
