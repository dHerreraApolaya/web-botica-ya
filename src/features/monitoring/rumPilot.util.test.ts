import { afterEach, expect, it, vi } from 'vitest';
import { canStartRumPilot, getRumPilotBlocker, startRumPilot } from './rumPilot.util';
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
it('explains the blocker without exposing configuration values', () => {
  expect(getRumPilotBlocker(config, location, signals)).toBeUndefined();
  expect(getRumPilotBlocker({ ...config, enabled: false }, location, signals)).toContain(
    'desactivado'
  );
  expect(getRumPilotBlocker({ ...config, privacyReviewed: false }, location, signals)).toContain(
    'privacidad'
  );
  expect(getRumPilotBlocker({ ...config, applicationToken: '' }, location, signals)).toContain(
    'Application Token'
  );
  expect(getRumPilotBlocker(config, { ...location, pathname: '/' }, signals)).toContain(
    'exactamente'
  );
  expect(getRumPilotBlocker(config, { ...location, search: '?test' }, signals)).toContain(
    'parámetros'
  );
  expect(getRumPilotBlocker(config, location, { ...signals, doNotTrack: 'yes' })).toContain(
    'no rastrear'
  );
  expect(
    getRumPilotBlocker(config, location, { ...signals, referrer: 'https://example.test/' })
  ).toContain('pestaña nueva');
});
it('blocks direct vendor collection even with valid configuration and consent', async () => {
  vi.stubGlobal('location', location);
  const onBlocked = vi.fn();
  await expect(startRumPilot(config, true, onBlocked)).resolves.toBe(false);
  expect(onBlocked).toHaveBeenCalledWith(expect.stringContaining('backend'));
  expect(document.getElementById('betterstack-rum-pilot')).toBeNull();
  expect((window as Window & { betterstack?: unknown }).betterstack).toBeUndefined();
});
