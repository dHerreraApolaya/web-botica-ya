# Better Stack RUM: evaluación de viabilidad

## Decisión

Viable para un piloto técnico con datos sintéticos. No habilitado en la tienda ni aprobado para datos de clientes. El proyecto publicado para clases no se modifica. No se instaló ninguna dependencia ni se cargó el tag contra Better Stack.

El proveedor declara SOC 2 Type 2 y cifrado en tránsito y reposo; estas medidas no garantizan que una configuración concreta sea adecuada para datos de salud. La documentación indica que todas las funciones del tag están activadas por defecto: replay del DOM, autocaptura, consola, errores, fingerprint y analítica. En sesiones captura URL, referrer y atribución; guarda identificadores en cookie con fallback a localStorage. Enmascarar el replay no enmascara la autocaptura.

Por tanto, pegar el snippet en `index.html` o activarlo únicamente por ruta dentro de la SPA no basta: el script seguiría vivo al navegar al checkout. Este piloto tiene una entrada y compilación separadas, en otro origen local, sin importar stores, productos, formularios ni la aplicación de la tienda. Aun así, el proveedor recibe IP y datos técnicos; no es anonimato completo.

## Plan gratuito

La página de precios consultada el 2 de noviembre de 2026 ofrece un nivel de $0 para proyectos personales: 100 000 excepciones/mes, 5 000 session replays y 3 GB de eventos web con retención de 3 días. Confirmar los límites y condiciones en la cuenta antes de activar: no asumir consumo ilimitado ni que los topes bloqueen automáticamente cargos. No activar upgrades, extensiones de retención ni funciones de pago. Para el piloto se recomienda desactivar replays y errores aunque el plan los incluya.

## Preparación de la cuenta, sin pagos

1. Crear una cuenta y una aplicación de evaluación en el nivel gratuito; confirmar en Billing el nivel de $0. No es necesario compartir credenciales con el agente.
2. En Frontend desactivar replays, autocaptura anónima e identificada, consola, fingerprint, heap, analítica automática y errores. Dejar solo Web Vitals para el primer ensayo.
3. Configurar retención mínima y el muestreo más bajo útil, y alertas/límites de uso disponibles en la cuenta. Si estas opciones no están disponibles en el plan gratuito, no activar el piloto hasta resolverlo.
4. Mantener deshabilitado el seguimiento entre dominios. Como defensa adicional, excluir `input`, `textarea`, `select`, `form`, `[data-pii]` y `[data-sensitive]` en el proveedor. No confiar en eso para habilitar la tienda.
5. Solo después de verificar estos ajustes, copiar el **Application Token del tag del navegador** (no un token API de administración). El identificador del tag es público: se verá en el navegador. Nunca poner tokens API privados en variables `VITE_*`.

## Ejecutar el piloto local

Crear `.env.local` (ignorado por Git) con:

```
VITE_BETTERSTACK_RUM_PILOT_ENABLED=false
VITE_BETTERSTACK_RUM_PRIVACY_REVIEWED=false
```

Después de revisar los ajustes, añadir localmente `VITE_BETTERSTACK_RUM_APPLICATION_TOKEN` con el identificador del tag y cambiar ambos indicadores a `true`. No usar identificadores inventados ni ejecutar solicitudes de prueba con datos reales.

Ejecutar `pnpm rum:pilot` y abrir directamente `http://127.0.0.1:4174/rum-pilot/` en una pestaña nueva sin referrer. No utilizar ese origen para la tienda o iniciar sesión. El piloto rechaza otros orígenes, rutas, parámetros y fragmentos de URL. También bloquea DNT/GPC, y requiere consentimiento de prueba con un clic. No persiste consentimiento. La compilación separada se verifica con `pnpm rum:build`; `pnpm build` solo produce la tienda habitual.

El consentimiento del piloto es técnico y local, no sustituye una política o mecanismo de consentimiento para clientes. Para detener la captura, cerrar la pestaña: quitar el script o cambiar una variable no garantiza que un SDK ya iniciado deje de recopilar.

## Validación pendiente con cuenta real

- Inspeccionar Network y los eventos recibidos: solo datos técnicos esperados; nunca estado de la tienda, textos de formularios, consola, replay o identificación.
- Confirmar que el navegador efectivamente recibe la configuración remota revisada y que los cambios no elevan la captura.
- Medir CPU, transferencia y Web Vitals antes y después; comprobar límite gratuito y retención efectiva.
- Probar sin consentimiento, DNT/GPC, URL con datos, script bloqueado, red caída y carga repetida.
- La documentación advierte que navegadores automatizados pueden no contabilizarse; verificar recepción final en un navegador normal con datos sintéticos.

No ampliar a la tienda hasta revisar la configuración efectiva, el DPA, acceso a la cuenta, condiciones del plan y tratamiento de datos de salud. Esta evaluación no certifica cumplimiento legal ni garantiza que un script remoto mantenga el mismo comportamiento en futuras versiones.

## Fuentes oficiales

- https://betterstack.com/docs/rum/js-tag/installation/
- https://betterstack.com/docs/errors/js-tag/configure/
- https://betterstack.com/security
- https://betterstack.com/privacy
- https://betterstack.com/pricing

## Secretos y controles OWASP

- `.env` y `.env.*` se excluyen de Git. No añadir valores reales a documentación, fixtures o comandos registrados.
- La configuración Vite de la tienda y del piloto valida variables antes de compilar. Se rechazan nombres `VITE_*` que indiquen credenciales privadas (`API_KEY`, `SECRET`, `PASSWORD`, etc.) sin imprimir sus valores. Esto es una defensa adicional, no un detector universal de secretos: cualquier variable `VITE_*` debe considerarse pública, aunque su nombre no coincida con esas reglas.
- El Application Token del tag del navegador es un identificador público de ingestión; un token de API de administración es secreto y nunca debe entregarse al frontend. No se configuró ningún token real en esta rama.
- No se persisten credenciales ni consentimiento en el código del piloto, ni se registran valores de configuración en consola. El proveedor puede usar cookies cuando se active, según la revisión remota pendiente.
- El tag solo se permite en el piloto, desde un origen y URL fijos. Al ser un script remoto que cambia con la configuración del proveedor, no se puede afirmar integridad inmutable con SRI para este endpoint. No habilitarlo en la tienda sin evaluar esa dependencia y la recopilación efectiva.
- Estos controles siguen prácticas OWASP de gestión de secretos y JavaScript de terceros; las pruebas no equivalen a una certificación de cumplimiento OWASP.

Referencias:
https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html
