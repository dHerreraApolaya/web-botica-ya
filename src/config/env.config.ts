import { validateClientEnvironment } from './env.schema';
export { rumEnvSchema } from './env.schema';

export const envConfig = validateClientEnvironment(import.meta.env);
