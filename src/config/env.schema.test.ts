import { expect, it } from 'vitest';
import { validateClientEnvironment } from './env.schema';

it.each([
  'VITE_API_KEY',
  'VITE_PRIVATE_KEY',
  'VITE_AUTH_TOKEN',
  'VITE_CLIENT_SECRET',
  'VITE_PASSWORD',
  'VITE_CREDENTIAL',
])('rejects exposed credential variable %s without exposing its value', (name) => {
  const value = 'synthetic-sensitive-test-value';
  expect(() => validateClientEnvironment({ [name]: value })).toThrow(
    'Private credentials must not use the VITE_ prefix.'
  );
  try {
    validateClientEnvironment({ [name]: value });
  } catch (error) {
    expect(String(error)).not.toContain(value);
  }
});
it('accepts the public application identifier only and keeps monitoring disabled by default', () => {
  const parsed = validateClientEnvironment({
    VITE_BETTERSTACK_RUM_APPLICATION_TOKEN: 'synthetic-public-tag-id',
  });
  expect(parsed.VITE_BETTERSTACK_RUM_PILOT_ENABLED).toBe(false);
  expect(parsed.VITE_BETTERSTACK_RUM_PRIVACY_REVIEWED).toBe(false);
});
