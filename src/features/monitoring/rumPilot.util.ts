interface PilotConfig {
  enabled: boolean;
  privacyReviewed: boolean;
  applicationToken?: string;
}
interface PilotLocation {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}
interface PrivacySignals {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
  referrer: string;
}
type Tag = ((...args: unknown[]) => void) & { q?: unknown[][]; l?: number };
type PilotWindow = Window & { betterstack?: Tag };

export const canStartRumPilot = (
  config: PilotConfig,
  location: PilotLocation,
  signals: PrivacySignals
): boolean =>
  config.enabled &&
  config.privacyReviewed &&
  Boolean(config.applicationToken?.match(/^[a-zA-Z0-9_-]{1,200}$/)) &&
  location.origin === 'http://127.0.0.1:4174' &&
  location.pathname === '/rum-pilot/' &&
  !location.search &&
  !location.hash &&
  signals.doNotTrack !== '1' &&
  signals.doNotTrack !== 'yes' &&
  !signals.globalPrivacyControl &&
  !signals.referrer;

export const startRumPilot = (config: PilotConfig, consent: boolean): Promise<boolean> => {
  const signals = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (
    !consent ||
    !canStartRumPilot(config, window.location, {
      doNotTrack: navigator.doNotTrack,
      globalPrivacyControl: signals.globalPrivacyControl,
      referrer: document.referrer,
    })
  )
    return Promise.resolve(false);
  const target = window as PilotWindow;
  if (document.getElementById('betterstack-rum-pilot') || target.betterstack)
    return Promise.resolve(false);
  const tag: Tag = (...args) => {
    (tag.q ??= []).push(args);
  };
  tag.l = Date.now();
  target.betterstack = tag;
  tag('config', { crossDomainCookie: false });
  tag('init', { environment: 'isolated-evaluation', autoPageview: false, debug: false });
  const script = document.createElement('script');
  script.id = 'betterstack-rum-pilot';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  const url = new URL('https://betterstack.net/b.js');
  url.searchParams.set('t', config.applicationToken!);
  script.src = url.href;
  return new Promise((resolve) => {
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      delete target.betterstack;
      resolve(false);
    };
    document.head.appendChild(script);
  });
};
