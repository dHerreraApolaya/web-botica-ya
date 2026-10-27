import { z } from 'zod';

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.email('Ingresa un correo electrónico válido.').max(254, 'El correo es demasiado largo.'));
const passwordSchema = z
  .string()
  .min(8, 'Usa al menos 8 caracteres.')
  .max(128, 'Usa como máximo 128 caracteres.');

export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });

export const registrationSchema = loginSchema
  .extend({
    fullName: z
      .string()
      .trim()
      .min(2, 'Ingresa tu nombre completo.')
      .max(120, 'Usa como máximo 120 caracteres.'),
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Las contraseñas deben coincidir.',
  });
