import { afterEach, expect, it, vi } from 'vitest';
import { canStartRumPilot, startRumPilot } from './rumPilot.util';
import { rumEnvSchema } from '@/config/env.config';

const config = {
  enabled: true,
  privacyReviewed: true,
  applicationToken: 'synthetic-public-tag-token',
};
const location = { origin: 'http://127.0.0.1:4174', pathname: '/rum-pilot/', search: '', hash: '' };
const signals = { referrer: '', doNotTrack: null, globalPrivacyControl: false };
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.getElementById('betterstack-rum-pilot')?.remove();
  delete (window as Window & { betterstack?: unknown }).betterstack;
});

it('defaults to disabled and validates boolean flags and browser token format', () => {
  expect(rumEnvSchema.parse({})).toEqual({
    VITE_BETTERSTACK_RUM_PILOT_ENABLED: false,
    VITE_BETTERSTACK_RUM_PRIVACY_REVIEWED: false,
  });
  expect(rumEnvSchema.safeParse({ VITE_BETTERSTACK_RUM_PILOT_ENABLED: 'yes' }).success).toBe(false);
  expect(
    rumEnvSchema.safeParse({ VITE_BETTERSTACK_RUM_APPLICATION_TOKEN: 'https://evil.test/script' })
      .success
  ).toBe(false);
});
it('permits only the consented and privacy-reviewed isolated local pilot', async () => {
  expect(canStartRumPilot(config, location, signals)).toBe(true);
  expect(canStartRumPilot({ ...config, enabled: false }, location, signals)).toBe(false);
  expect(canStartRumPilot({ ...config, privacyReviewed: false }, location, signals)).toBe(false);
  expect(canStartRumPilot({ ...config, applicationToken: undefined }, location, signals)).toBe(
    false
  );
  await expect(startRumPilot(config, false)).resolves.toBe(false);
});
it.each(['/checkout/payment', '/carrito', '/registro', '/iniciar-sesion', '/confirmacion', '/'])(
  'rejects real application route %s',
  (pathname) => {
    expect(canStartRumPilot(config, { ...location, pathname }, signals)).toBe(false);
  }
);
it('blocks production, query strings, hashes, referrers and privacy opt-outs', () => {
  expect(
    canStartRumPilot(config, { ...location, origin: 'https://web-botica-ya.vercel.app' }, signals)
  ).toBe(false);
  expect(canStartRumPilot(config, { ...location, search: '?email=ficticio' }, signals)).toBe(false);
  expect(canStartRumPilot(config, { ...location, hash: '#dato' }, signals)).toBe(false);
  expect(
    canStartRumPilot(config, location, { ...signals, referrer: 'https://example.test/' })
  ).toBe(false);
  expect(canStartRumPilot(config, location, { ...signals, doNotTrack: '1' })).toBe(false);
  expect(canStartRumPilot(config, location, { ...signals, globalPrivacyControl: true })).toBe(
    false
  );
});
it('loads only the fixed vendor URL once and initializes without automatic pageviews', async () => {
  vi.stubGlobal('location', location);
  const result = startRumPilot(config, true);
  const script = document.getElementById('betterstack-rum-pilot') as HTMLScriptElement;
  expect(script.src).toBe('https://betterstack.net/b.js?t=synthetic-public-tag-token');
  expect(script.referrerPolicy).toBe('no-referrer');
  expect((window as Window & { betterstack?: { q: unknown[][] } }).betterstack?.q).toEqual([
    ['config', { crossDomainCookie: false }],
    ['init', { environment: 'isolated-evaluation', autoPageview: false, debug: false }],
  ]);
  script.dispatchEvent(new Event('load'));
  await expect(result).resolves.toBe(true);
  await expect(startRumPilot(config, true)).resolves.toBe(false);
});
it('does not throw or expose the token when the remote script fails', async () => {
  vi.stubGlobal('location', location);
  const result = startRumPilot(config, true);
  document.getElementById('betterstack-rum-pilot')!.dispatchEvent(new Event('error'));
  await expect(result).resolves.toBe(false);
  expect(document.getElementById('betterstack-rum-pilot')).toBeNull();
});
