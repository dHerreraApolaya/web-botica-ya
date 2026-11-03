import { useState } from 'react';
import { envConfig } from '@/config/env.config';
import { startRumPilot } from './rumPilot.util';

export const RumPilot = () => {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('Sin activar: no se ha cargado Better Stack.');
  const [attempted, setAttempted] = useState(false);
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Evaluación aislada de Better Stack</h1>
      <p>
        Esta página no carga la tienda, usuarios, carrito ni recetas. Úsala únicamente con datos
        ficticios y desde la dirección local indicada en la documentación.
      </p>
      <p>
        Al activar, el navegador contactará con Better Stack, que recibirá tu IP y datos técnicos
        del navegador. Puede usar cookies. La captura depende también de la configuración remota del
        proveedor.
      </p>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          disabled={attempted}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1"
        />
        Acepto activar la prueba técnica durante esta página.
      </label>
      <button
        disabled={!consent || attempted}
        className="min-h-12 rounded-md border border-primary px-4 font-semibold disabled:opacity-50"
        onClick={() => {
          setAttempted(true);
          setStatus('Cargando la prueba…');
          void startRumPilot(
            {
              enabled: envConfig.VITE_BETTERSTACK_RUM_PILOT_ENABLED,
              privacyReviewed: envConfig.VITE_BETTERSTACK_RUM_PRIVACY_REVIEWED,
              applicationToken: envConfig.VITE_BETTERSTACK_RUM_APPLICATION_TOKEN,
            },
            consent
          ).then((started) =>
            setStatus(
              started
                ? 'Tag cargado. Comprueba la recepción y los datos enviados en Better Stack y en la pestaña Red del navegador.'
                : 'No se activó: configuración, privacidad o conexión no disponibles.'
            )
          );
        }}
      >
        Activar prueba técnica
      </button>
      <p role="status">{status}</p>
      <p>
        Para detener la prueba, cierra esta pestaña. No hay consentimiento persistente: una nueva
        visita requiere aceptarlo otra vez. Desactivar las variables de configuración no detiene un
        tag que ya está cargado.
      </p>
    </main>
  );
};
