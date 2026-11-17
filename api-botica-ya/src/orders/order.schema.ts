import { z } from 'zod';

export const orderSchema = z
  .object({
    contact: z
      .object({
        fullName: z.string().trim().min(2).max(120),
        email: z.email().max(254),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9 ()-]{7,20}$/),
      })
      .strict(),
    fulfillment: z.discriminatedUnion('type', [
      z
        .object({
          type: z.literal('delivery'),
          district: z.string().trim().min(1).max(100),
          address: z.string().trim().min(1).max(250),
          reference: z.string().trim().max(250).default(''),
        })
        .strict(),
      z
        .object({ type: z.literal('pickup'), pharmacyId: z.string().trim().min(1).max(100) })
        .strict(),
    ]),
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(100),
            quantity: z.number().int().min(1).max(1000),
          })
          .strict()
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (order) => new Set(order.items.map((item) => item.productId)).size === order.items.length,
    {
      path: ['items'],
      message: 'Duplicate products are not allowed',
    }
  );

export const idempotencyKeySchema = z.uuid().transform((value) => value.toLowerCase());
export type OrderInput = z.infer<typeof orderSchema>;
