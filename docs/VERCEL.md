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

## Publicaciones manuales

`vercel.json` establece `git.deploymentEnabled: false`: los commits de ramas que contienen esta configuración no crean despliegues automáticos de Vercel, ni de producción ni de preview. Los workflows de validación de GitHub siguen funcionando.

Esta regla se aplica cuando la configuración está subida a GitHub. Integrarla en `develop`, `main` y las ramas activas antes de asumir que todos los pushes están bloqueados: una rama antigua sin la regla puede seguir generando despliegues. No basta con modificar el archivo localmente.

Las publicaciones se inician expresamente desde Vercel (crear despliegue desde una referencia Git o volver a desplegar una versión) o desde su CLI. Verificar siempre la rama y el commit elegidos; desplegar o promover a producción requiere una solicitud explícita del usuario.

No usar un cron ni un workflow de GitHub que publique automáticamente. Fuente: https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments
