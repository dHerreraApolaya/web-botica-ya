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
export const getRumPilotBlocker = (
  config: PilotConfig,
  location: PilotLocation,
  signals: PrivacySignals
): string | undefined => {
  if (!config.enabled)
    return 'El piloto está desactivado. Revisa .env.local y reinicia el servidor.';
  if (!config.privacyReviewed) return 'Falta confirmar la revisión de privacidad en .env.local.';
  if (!config.applicationToken?.match(/^[a-zA-Z0-9_-]{1,200}$/))
    return 'Falta un Application Token válido en .env.local.';
  if (location.origin !== 'http://127.0.0.1:4174' || location.pathname !== '/rum-pilot/')
    return 'Abre exactamente http://127.0.0.1:4174/rum-pilot/.';
  if (location.search || location.hash)
    return 'Abre el piloto sin parámetros ni fragmentos en la dirección.';
  if (signals.doNotTrack === '1' || signals.doNotTrack === 'yes' || signals.globalPrivacyControl)
    return 'El navegador solicita no rastrear (DNT o GPC). Se respeta esa preferencia y no se activa la prueba.';
  if (signals.referrer)
    return 'La visita tiene una página de origen. Abre una pestaña nueva y escribe directamente la dirección del piloto.';
  return undefined;
};

export const canStartRumPilot = (
  config: PilotConfig,
  location: PilotLocation,
  signals: PrivacySignals
): boolean => !getRumPilotBlocker(config, location, signals);

export const startRumPilot = (
  config: PilotConfig,
  consent: boolean,
  onBlocked?: (reason: string) => void
): Promise<boolean> => {
  const signals = navigator as Navigator & { globalPrivacyControl?: boolean };
  const blocker = !consent
    ? 'Debes aceptar la prueba técnica antes de activarla.'
    : getRumPilotBlocker(config, window.location, {
        doNotTrack: navigator.doNotTrack,
        globalPrivacyControl: signals.globalPrivacyControl,
        referrer: document.referrer,
      });
  if (blocker) {
    onBlocked?.(blocker);
    return Promise.resolve(false);
  }
  onBlocked?.(
    'El tag directo está bloqueado: la prueba detectó IP, ubicación e identificadores de sesión. El envío requiere un backend que anonimice la telemetría antes de contactar con Better Stack.'
  );
  return Promise.resolve(false);
};
