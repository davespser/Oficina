import { readdir, writeFile } from 'node:fs/promises';

const directory = 'public/dibujos';
const output = `${directory}/manifest.json`;

const extensions = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'
]);

const files = await readdir(directory, { withFileTypes: true });

const images = files
  .filter((file) => file.isFile())
  .map((file) => file.name)
  .filter((name) => {
    const dot = name.lastIndexOf('.');
    return dot > 0 && extensions.has(name.slice(dot).toLowerCase());
  })
  .sort((a, b) => a.localeCompare(b, 'es'));

await writeFile(
  output,
  JSON.stringify(images, null, 2) + '\n',
  'utf8'
);

console.log(`Catálogo generado: ${images.length} imagen(es).`);
