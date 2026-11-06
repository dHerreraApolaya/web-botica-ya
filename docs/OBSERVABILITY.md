# Observabilidad con privacidad por diseño

## Estado

La aplicación utiliza un puerto `TechnicalLogger` inyectable. Por defecto se compone con
`NOOP_LOGGER`: no captura, almacena ni envía datos. Las excepciones técnicas de los adaptadores
de ventas y acceso emiten únicamente constantes de su módulo; nunca reciben el error original.
El catálogo de productos tiene su catálogo de códigos reservado para adaptadores futuros;
las búsquedas, categorías y productos elegidos no se registran.

Patrones: Ports and Adapters, Strategy e inyección de dependencias. `createObservability`
centraliza la política y construye una copia con una lista cerrada de campos. Un adaptador
recibe exclusivamente `module`, `code` y `level`; no hay mensajes libres ni contexto arbitrario.
Los códigos se definen en `features/<module>/constants/*Logs.constants.ts` y se registran
en la lista permitida central. Los consumidores dependen del puerto, no del SDK de un proveedor.
Un cliente futuro se cambia en la composición, no en los módulos.

Antes de cada envío se consulta consentimiento, DNT y GPC. Si se deniega, se descarta el evento
sin cola ni reenvío posterior. Fallos del proveedor se contienen, sin escribir errores a consola.
No se interceptan globalmente consola, errores, DOM, red, formularios ni navegación.
No se transmiten nombres, correos, teléfonos, direcciones, recetas, productos, búsquedas,
órdenes, credenciales, URLs, stacks ni identificadores de usuario/sesión. Tampoco se añade
una marca temporal individual desde el navegador.

## Política obligatoria para nuevos desarrollos

Cada funcionalidad nueva o modificada debe definir en su especificación su objetivo de monitoreo,
las señales necesarias, responsable, destino, retención y pruebas de privacidad. Debe instrumentar
las operaciones y fallos relevantes mediante los puertos centrales. Si no requiere una señal,
debe justificarlo; no se exige registrar cada clic, render, validación o acción exitosa.
Los SDK de proveedores solo pertenecen a adaptadores y a la composición; están prohibidos
los `console.log`, `console.error` o llamadas directas al proveedor como monitoreo de producción.
Los logs de aplicación no sustituyen auditorías de seguridad ni historiales transaccionales.

### Semántica: qué señal utilizar

| Tipo            | Propósito                                                           | Ejemplo de constante                          | Tratamiento                                                                                                   |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Log técnico API | Fallo de transporte, timeout, respuesta inválida o indisponibilidad | `SALES_LOGS.API_REQUEST_TIMED_OUT`            | `warn` si se recupera mediante reintento acotado; `error` si impide completar la operación                    |
| Log funcional   | Regla de negocio esperada que impide avanzar                        | `SALES_LOGS.OPERATION_REJECTED`               | `info`, agregado solo si ayuda a detectar fricción; nunca motivo clínico ni contenido de la compra            |
| Validación      | Formulario o entrada no válida                                      | `USER_LOGS.FORM_VALIDATION_REJECTED`          | Feedback local primero; conteos agregados opcionales, sin valores, nombres de campos ni errores del validador |
| Funnel          | Transición confirmada entre etapas de un flujo                      | `SALES_FUNNEL_EVENTS.CHECKOUT_STEP_COMPLETED` | Evento de producto, no log de error; requiere revisión de privacidad y puerto independiente                   |
| UX              | Fricción o respuesta de una interacción                             | `PRODUCT_UX_EVENTS.CATEGORY_DRAWER_OPENED`    | Evento de UX, no fallo técnico; sin categoría seleccionada ni texto de búsqueda                               |
| Trace           | Duración y relación causal de operaciones técnicas                  | `SALES_SPANS.API_REQUEST`                     | Span con inicio y fin, resultado técnico acotado y duración; no grabación de sesión                           |
| Métrica         | Tendencia o proporción agregada                                     | `SALES_METRICS.API_REQUEST_FAILURE_COUNT`     | Contador/histograma con dimensiones cerradas; sin identidad ni etiquetas dinámicas                            |

Los ejemplos de esta tabla son una convención para desarrollos futuros: NO están registrados ni
habilitados en el contrato actual. Un resultado esperado (credenciales incorrectas, formulario
incompleto, stock insuficiente o rechazo funcional) no se clasifica automáticamente como `error`.
No registrar un `401` o `4xx` como indisponibilidad sin interpretar su contrato. Nunca convertir
una búsqueda, diagnóstico, receta o medicamento en nombre de evento, etiqueta o dimensión.

Severidades: `debug` solo para diagnóstico local con datos sintéticos, desactivado por defecto;
`info` para resultados esperados que aportan señal; `warn` para degradación recuperable;
`error` para operación técnica fallida que requiere atención. El contrato actual solo admite
`error`; incorporar otras severidades exige ampliar esquema, pruebas y catálogo explícitamente.
Los eventos de funnel/UX no tienen severidad de error.

### Nombres y catálogo de constantes

Usar inglés, nombres estables y sin referencia al proveedor. La política del proyecto es:

- Objetos: `<MODULE>_LOGS`, `<MODULE>_FUNNEL_EVENTS`, `<MODULE>_UX_EVENTS`,
  `<MODULE>_SPANS` y `<MODULE>_METRICS`, en `features/<module>/constants/`.
- Claves: `UPPER_SNAKE_CASE`, con `<SUBJECT>_<ACTION_OR_OUTCOME>`.
  Logs y eventos usan resultado explícito en pasado: `API_REQUEST_FAILED`,
  `FORM_VALIDATION_REJECTED`, `CHECKOUT_STEP_COMPLETED`; spans describen la operación
  en curso: `API_REQUEST`, sin sufijos `STARTED`/`COMPLETED`.
- Códigos: `lower_snake_case`, sin duplicar el módulo: `api_request_timed_out`.
  La identidad completa es la tupla `(signal, module, code)`. En el contrato de logs
  actual, el tipo de señal lo determina el puerto y se envían solo `module`, `code`, `level`.
- Nada de `ERROR_1`, `EVENT_CLICK`, `SOMETHING_FAILED`, mensajes interpolados, URLs,
  nombres de componentes visuales, IDs ni códigos HTTP como nombres de constantes.
- Un código representa un significado. No reutilizarlo para otra condición ni cambiar su
  interpretación silenciosamente. Un cambio de esquema/semántica requiere migración explícita
  y actualización de consultas, alertas y documentación; evitar renombrados cosméticos.

`ADAPTER_FAILED` es el código genérico vigente y deliberadamente no distingue revisión de recetas
de pago, ni registro de inicio de sesión. Los códigos más específicos del ejemplo solo se incorporan
si aportan valor y su revisión confirma que no revelan información sensible por inferencia.

Cada entrada nueva debe documentar: señal, módulo, clave/código, significado y disparador exacto,
severidad si corresponde, campos permitidos, volumen/muestreo, destino/retención, responsable
y acción esperada al alertar. Las constantes deben ser inmutables y registrarse en la lista central
permitida. No basta con declarar una constante para autorizar su exportación.

### Dónde instrumentar y evitar duplicados

Registrar el fallo definitivo en el límite que conoce su resultado (facade/caso de uso o adaptador,
según el contrato), una sola vez. Los niveles inferiores propagan un resultado tipado; la UI
presenta el mensaje al cliente. No registrar la misma excepción en adaptador, facade y componente.
Los reintentos no equivalen a varios fallos definitivos: representar su número con un contador
acotado aprobado o un agregado. No capturar automáticamente el objeto `Error`, su `message`,
`stack`, request, response, headers ni body.

Los funnels emiten transiciones confirmadas por negocio, no renders, navegación tentativa ni
clics que luego fallan. Un intento, un completado y un rechazo son conceptos diferentes.
No implementar deduplicación con un ID de cliente, carrito u orden enviado al proveedor.
Con agregados anónimos se mide conversión entre conteos, no recorridos individuales exactos:
reconstruir funnels por persona requiere otra política y no está autorizado actualmente.

### Política de traces

Los desarrollos con I/O o múltiples dependencias deben prever trazas en un puerto independiente
`Tracer`/`Span`, compuesto junto al logger. No simular trazas escribiendo dos logs de inicio/fin.
Cerrar cada span exactamente una vez en `finally`, incluyendo rechazo, timeout y cancelación.
El nombre de span viene de constantes; resultados y atributos se limitan a enums técnicos.
La duración usa reloj monotónico. Prohibidos URLs completas, parámetros, cabeceras, credenciales,
contenido de formularios, nombres de archivos, producto/orden/usuario y mensajes de excepción.

La correlación técnica utiliza identificadores aleatorios efímeros, nunca IDs de negocio ni hashes
de PII. Un trace ID sigue siendo correlacionable: no constituye anonimización. Por la política actual,
las trazas detalladas se limitan al entorno propio con acceso y retención acotados; la exportación
externa solo puede contener agregados de duración/fallos sin IDs ni timestamps individuales,
tras aplicar umbral mínimo de volumen. Si se necesita exportar spans correlacionados, primero
se debe revisar explícitamente el requisito de anonimización. No se propagan cookies ni cabeceras
del cliente como contexto de trazas hacia terceros.

El puerto de traces, spans y la agregación del backend aún NO están implementados. La política
rige su diseño futuro y no habilita SDKs ni envío adicional en esta versión.

### Límites, validación y truncado

El contrato actual solo admite tres valores del catálogo y elimina todo campo extra. No admite
textos libres y no necesita truncarlos. Para futuros esquemas, definir antes de implementar límites
numéricos de tamaño de evento/lote, longitud de campo, cardinalidad, frecuencia, cola y retención.
Aplicarlos también en el backend. Rechazar valores desconocidos, tipos incorrectos, `NaN`, infinitos
y cargas excesivas. Las colas deben ser acotadas y respetar revocación; no persistir en storage.
No truncar códigos, enums, tokens ni datos personales para hacerlos pasar: rechazar el dato completo.
No agregar campos de texto libre sin un caso aprobado; truncar un texto no elimina datos sensibles.

### Criterios de revisión y pruebas

Antes de aceptar un desarrollo, comprobar códigos constantes registrados y sin magic strings,
ausencia de duplicados, severidad correcta, dependencia del puerto y ruta sin proveedor configurado.
Probar casos exitosos, fallos esperados, timeouts, rechazo y caída del adaptador. Incluir pruebas
negativas con PII/secretos sintéticos, campos extra, payload inválido, consentimiento ausente/revocado,
DNT/GPC y errores del propio monitoreo. Al implementar traces probar cierre único y propagación
segura. Las comprobaciones de red y payload recibido son necesarias antes de activar un destino.
Las alertas se basan en tasa, volumen mínimo y ventana sostenida; una validación aislada del cliente
no debe disparar una alerta de producción. Estos criterios se aplican proporcionalmente al cambio.

## Better Stack: limitación comprobada

La prueba local recibió `session-start` con IP, ubicación, identificador de sesión y URL,
aunque la captura de analítica estaba desactivada. No es telemetría anonimizada.
Por eso se bloqueó la carga del tag directo, incluso con consentimiento y variables activas.
Una pestaña que ya lo cargó debe cerrarse: modificar código/configuración no descarga el SDK.
La recepción comprobó conectividad; no acreditó anonimización ni recepción de Web Vitals.

No hay adaptador remoto activo. Para activar Better Stack bajo este requisito falta un backend:

1. Endpoint del mismo origen con validación estricta, límite de tamaño y frecuencia.
2. Sin cookies de sesión, identificadores, URL de origen ni cabeceras del visitante reenviadas al proveedor.
3. Descartar campos desconocidos; no registrar cuerpos ni IP de clientes en logs de aplicación.
4. Agregar conteos por código y ventanas temporales antes de exportar, con umbral mínimo de volumen
   para reducir vinculación de eventos individuales. No basta con aplicar hash a la IP.
5. Credencial de ingestión solo en el servidor y gestor de secretos, nunca `VITE_*`.
6. Verificar también logs de plataforma/proxy, retención, metadatos de transporte, acceso y cuotas gratuitas.
7. Inspeccionar el payload real y la recepción antes de habilitar el adaptador en la composición.

El navegador enviará su IP al servidor propio por necesidad del transporte; esto no equivale a
reenviarla a Better Stack. Un fetch directo a un tercero expone la IP aunque el JSON esté limpio.
Esta arquitectura minimiza datos; no constituye por sí sola una certificación de anonimización.

## Clarity: etapa futura independiente

No se instaló Clarity ni se habilitaron grabaciones. No debe capturar información sensible.
Su puerto de experiencia de usuario será independiente de los logs técnicos, con consentimiento
separado, enmascaramiento estricto y exclusión de autenticación, carrito, checkout, confirmación,
recetas y cualquier contenido que revele salud o identidad. La SPA exige validar el ciclo completo:
no basta con omitir la carga inicial en una ruta si el SDK sigue activo al navegar.
La posibilidad de detener/revocar realmente la captura debe comprobarse antes de integrar.
El puerto de logs no incorpora métodos de replay, identificación ni acceso al DOM.

Fuentes:

- https://betterstack.com/docs/rum/js-tag/installation/
- https://betterstack.com/docs/errors/js-tag/configure/
- https://clarity.microsoft.com/privacy
