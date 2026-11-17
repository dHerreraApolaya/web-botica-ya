import { z } from 'zod';

const boundedText = (max: number) => z.string().min(1).max(max);
const integer = z.number().int().min(0).max(2147483647);
export const categorySchema = z.object({
  id: z.uuid(),
  name: boundedText(100),
  slug: boundedText(200),
});
export const categoriesSchema = z.array(categorySchema).max(1000);
export const catalogProductSchema = z
  .object({
    id: boundedText(100),
    sku: boundedText(100),
    name: boundedText(300),
    category: boundedText(100),
    categoryId: z.uuid(),
    brand: z.string().max(100),
    brandId: z.uuid().nullable(),
    presentation: boundedText(300),
    priceInCents: integer,
    currency: z.literal('PEN'),
    availableQuantity: integer,
    inStock: z.boolean(),
    requiresPrescription: z.boolean(),
    isFeatured: z.boolean(),
    image: z
      .object({
        bucket: boundedText(100),
        storagePath: boundedText(500),
        altText: z.string().max(300),
      })
      .nullable(),
  })
  .refine((product) => product.inStock === product.availableQuantity > 0);
export const catalogPageSchema = z.object({
  items: z.array(catalogProductSchema).max(50),
  page: z.number().int().min(1).max(1000),
  totalPages: z.number().int().min(1),
  total: integer,
});
export const catalogRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(3)
    .max(128)
    .refine((query) => query.split(/\s+/).length <= 12)
    .optional(),
  categoryIds: z.array(z.uuid()).max(6).optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  page: z.number().int().min(1).max(1000),
  pageSize: z.number().int().min(1).max(50),
});
