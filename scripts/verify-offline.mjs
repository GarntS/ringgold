import { readFile } from 'node:fs/promises';

const serviceWorker = await readFile('docs/sw.js', 'utf8');
for (const asset of ['index.html', 'solver.worker-', 'solver/z3-built.js', 'solver/z3-built.wasm']) {
  if (!serviceWorker.includes(asset)) throw new Error(`Offline precache is missing ${asset}`);
}
const index = await readFile('docs/index.html', 'utf8');
if (/https?:\/\//.test(index)) throw new Error('The application shell has a remote network dependency.');
console.log('Offline build verification passed: shell, worker, Z3 glue, and WASM are precached.');
