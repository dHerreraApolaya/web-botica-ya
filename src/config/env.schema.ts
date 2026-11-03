import { z } from 'zod';

const booleanFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const rumEnvSchema = z.object({
  VITE_BETTERSTACK_RUM_PILOT_ENABLED: booleanFlag,
  VITE_BETTERSTACK_RUM_PRIVACY_REVIEWED: booleanFlag,
  VITE_BETTERSTACK_RUM_APPLICATION_TOKEN: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,200}$/)
    .optional(),
});

export const envSchema = rumEnvSchema.extend({
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export const validateClientEnvironment = (values: Record<string, string | undefined>) => {
  if (
    Object.keys(values).some(
      (name) =>
        name.startsWith('VITE_') &&
        /SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|CREDENTIAL/i.test(name)
    )
  ) {
    throw new Error('Private credentials must not use the VITE_ prefix.');
  }
  const parsed = envSchema.safeParse(values);
  if (!parsed.success) throw new Error('Invalid client environment configuration.');
  return parsed.data;
};
