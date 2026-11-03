import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^9[0-9]{8}$/, 'Ingresa un celular de 9 dígitos que empiece con 9.');
