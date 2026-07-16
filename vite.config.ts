import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const certificate = '.local-certs/dev.pem';
const key = '.local-certs/dev-key.pem';
const localHttps = existsSync(certificate) && existsSync(key)
  ? { cert: readFileSync(certificate), key: readFileSync(key) }
  : undefined;
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  define: { global: 'globalThis' },
  server: { https: localHttps, headers: isolationHeaders },
  preview: { https: localHttps, headers: isolationHeaders },
  base: './',
  build: { target: 'es2022', outDir: 'doc' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
