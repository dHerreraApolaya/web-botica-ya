# Publicación en Vercel

1. Importar el repositorio `dHerreraApolaya/web-botica-ya` desde GitHub en Vercel.
2. Usar la raíz del repositorio como directorio del proyecto y Vite como framework.
3. Seleccionar Node.js 22.x en la configuración del proyecto.
4. Dejar que Vercel detecte pnpm desde `pnpm-lock.yaml`; el proyecto declara pnpm 9.15.4.
5. La compilación usa `pnpm build` y publica `dist`, según `vercel.json`.
6. Si se quiere publicar el estado de desarrollo como sitio principal del MVP, configurar `develop` como Production Branch. Los cambios deben estar subidos a esa rama antes de desplegar.

La regla de rutas permite abrir y recargar `/carrito`, `/iniciar-sesion`, `/registro` y `/checkout/fulfillment` sin un error 404 del servidor.

El MVP actual utiliza datos locales y no requiere variables de entorno para ejecutarse. La sesión, las cuentas nuevas y el carrito se conservan en memoria hasta recargar; los pagos son simulados.

Después de publicar, comprobar la portada, la búsqueda, el carrito, el registro, el inicio de sesión y el pago simulado. Abrir directamente `/registro` y recargar para validar las rutas.

Referencia: https://vercel.com/docs/frameworks/frontend/vite
