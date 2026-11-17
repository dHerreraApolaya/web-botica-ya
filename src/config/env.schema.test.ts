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
it.each([
  'not-a-url',
  'https://user:password@example.test/api',
  'https://example.test/api?token=private',
  'http://example.test/api',
  'https://example.test/api#private',
])('rejects unsafe API bases without exposing them', (url) => {
  expect(() => validateClientEnvironment({ VITE_API_BASE_URL: url })).toThrow(
    'Invalid client environment configuration.'
  );
});
it('accepts a public HTTPS base or local development API', () => {
  expect(
    validateClientEnvironment({ VITE_API_BASE_URL: 'https://example.test/api' }).VITE_API_BASE_URL
  ).toBe('https://example.test/api');
  expect(
    validateClientEnvironment({ VITE_API_BASE_URL: 'http://127.0.0.1:8081/api' }).VITE_API_BASE_URL
  ).toBe('http://127.0.0.1:8081/api');
});
