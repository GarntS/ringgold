import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './id';

afterEach(() => vi.unstubAllGlobals());

describe('createId', () => {
  it('uses a UUID-shaped Web Crypto fallback when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => bytes.fill(1) });
    expect(createId()).toMatch(/^01010101-0101-4101-8101-010101010101$/);
  });
});
