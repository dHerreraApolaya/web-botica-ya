import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error('❌ Environment Variable Validation Error:', _env.error.format());
  throw new Error('Invalid environment configuration.');
}

export const envConfig = _env.data;
