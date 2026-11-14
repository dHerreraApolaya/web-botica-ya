import { z } from 'zod';

const portSchema = z.coerce.number().int().min(1).max(65535);
const booleanSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

const environmentSchema = z.object({
  BOTICAYA_DB_HOST: z.string().min(1).default('localhost'),
  BOTICAYA_DB_PORT: portSchema.default(5432),
  BOTICAYA_DB_NAME: z.string().min(1).default('boticaya_dev'),
  BOTICAYA_DB_USER: z.string().min(1),
  BOTICAYA_DB_PASSWORD: z.string().min(1),
  BOTICAYA_DB_SSL: booleanSchema.default(false),
  BOTICAYA_HOST: z.string().min(1).default('127.0.0.1'),
  PORT: portSchema.default(8081),
  BOTICAYA_ORDERS_ENABLED: booleanSchema.default(false),
});

export function readConfig(environment: NodeJS.ProcessEnv) {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return result.data;
}

export type ApiConfig = ReturnType<typeof readConfig>;
