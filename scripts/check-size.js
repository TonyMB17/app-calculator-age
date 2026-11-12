import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const files = (await readdir('dist/assets')).filter((file) => /\.(js|css)$/.test(file));
const sizes = await Promise.all(
  files.map(async (file) => gzipSync(await readFile(`dist/assets/${file}`)).length),
);
const total = sizes.reduce((sum, size) => sum + size, 0);
console.log(`JavaScript + CSS (gzip): ${(total / 1024).toFixed(2)} KiB / 100 KiB.`);
if (total >= 100 * 1024) throw new Error('El build supera el presupuesto de recursos.');
