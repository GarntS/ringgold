import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('offline PWA output', () => {
  it('precaches the application shell, worker, and Z3 assets', async () => {
    const serviceWorker = await readFile('dist/sw.js', 'utf8');
    expect(serviceWorker).toContain('index.html');
    expect(serviceWorker).toContain('solver.worker-');
    expect(serviceWorker).toContain('solver/z3-built.js');
    expect(serviceWorker).toContain('solver/z3-built.wasm');
  });
});
