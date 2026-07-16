import { cp, mkdir } from 'node:fs/promises';

const source = 'node_modules/z3-solver/build';
const destination = 'public/solver';
await mkdir(destination, { recursive: true });
await Promise.all([
  cp(`${source}/z3-built.js`, `${destination}/z3-built.js`),
  cp(`${source}/z3-built.wasm`, `${destination}/z3-built.wasm`),
]);
