# Better Stack RUM: registro de evaluación

La evaluación local confirmó conectividad y recepción de `session-start`; no confirmó
recepción de Web Vitals ni anonimización. La aplicación de evaluación se creó en el plan Free.
Los límites comerciales deben verificarse en Billing antes de cualquier activación futura.

La decisión vigente y los requisitos para continuar están en
[OBSERVABILITY.md](./OBSERVABILITY.md#better-stack-limitación-comprobada).
Las instrucciones históricas de activación se retiraron para evitar reactivar el SDK por error;
el historial de Git conserva la evaluación anterior.

Para verificar localmente el bloqueo: `pnpm rum:pilot` y abrir
`http://127.0.0.1:4174/rum-pilot/`. La compilación aislada usa `pnpm rum:build`.
Ninguna de estas acciones habilita el envío remoto en la implementación actual.

Referencias específicas del proveedor:

- https://betterstack.com/docs/rum/js-tag/installation/
- https://betterstack.com/docs/errors/js-tag/configure/
- https://betterstack.com/pricing

Para gestión de credenciales se aplica [SECURITY.md](./SECURITY.md).
