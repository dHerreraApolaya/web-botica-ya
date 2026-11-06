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
