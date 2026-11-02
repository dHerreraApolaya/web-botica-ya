import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\+?[\d -]{7,20}$/.test(value) && value.replace(/\D/g, '').length >= 7,
    'Ingresa un teléfono válido (7 a 20 caracteres).'
  );
