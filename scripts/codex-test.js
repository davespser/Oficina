import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const requiredDirectories = ['public/dibujos', 'src/ui', 'server'];

let failed = false;

for (const relativePath of requiredDirectories) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    const info = await stat(absolutePath);
    if (!info.isDirectory()) throw new Error('La ruta no es un directorio.');
    console.log(`OK  ${relativePath}`);
  } catch {
    failed = true;
    console.error(`FALTA  ${relativePath}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('Todas las rutas requeridas existen.');
}
