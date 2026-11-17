import process from 'node:process';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const required = /^>=(\d+)\.(\d+)\.(\d+)$/.exec(manifest.engines.node);
if (!required) throw new Error('Invalid minimum Node.js version in package.json.');
const minimum = required.slice(1).map(Number);
const current = process.versions.node.split('.').map(Number);
let supported = true;
for (let index = 0; index < minimum.length; index += 1) {
  if (current[index] !== minimum[index]) {
    supported = current[index] > minimum[index];
    break;
  }
}
if (!supported) {
  console.error(
    `Este proyecto requiere Node.js ${manifest.engines.node}. Ejecuta nvm use para cargar la versión de .nvmrc.`
  );
  process.exit(1);
}
