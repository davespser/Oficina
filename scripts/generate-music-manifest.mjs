import { readdir, writeFile } from 'node:fs/promises';

const directory = 'public/assets/music';
const output = `${directory}/manifest.json`;

const extensions = new Set([
  '.mp3', '.wav', '.ogg', '.oga', '.m4a',
  '.aac', '.flac', '.opus', '.weba', '.webm'
]);

const files = await readdir(directory, { withFileTypes: true });

const tracks = files
  .filter((file) => file.isFile())
  .map((file) => file.name)
  .filter((name) => {
    const dot = name.lastIndexOf('.');
    return dot > 0 && extensions.has(name.slice(dot).toLowerCase());
  })
  .sort((a, b) => a.localeCompare(b, 'es'));

await writeFile(output, JSON.stringify(tracks, null, 2) + '\n', 'utf8');
console.log(`Catálogo musical generado: ${tracks.length} pista(s).`);
