import process from "node:process";

const requiredNodeVersion = 22;
const currentVersion = process.versions.node;
const majorVersion = parseInt(currentVersion.split(".")[0], 10);

if (majorVersion < requiredNodeVersion) {
  console.error("\n\x1b[41m%s\x1b[0m", " ❌ ERROR DE ENTORNO EN EL PROYECTO ");
  console.error(
    "\x1b[31m%s\x1b[0m",
    `Tu versión de Node.js es ${currentVersion}.`,
  );
  console.error(
    "\x1b[33m%s\x1b[0m",
    `Este proyecto requiere Node.js >= v${requiredNodeVersion}.0.0 para funcionar.`,
  );
  console.error(
    "\x1b[36m%s\x1b[0m",
    "\nPor favor regulariza tu entorno ejecutando:",
  );
  console.error(
    '   nvm use   (o "nvm install 22" si no la tienes instalada)\n',
  );
  console.error(
    "\x1b[35m%s\x1b[0m",
    "NO modifiques archivos de configuración del proyecto ni cambies dependencias.\n",
  );

  process.exit(1);
}
