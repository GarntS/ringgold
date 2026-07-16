// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultConfiguration } from './configuration';
import { configurationFingerprint } from './validation';

async function render(state?: unknown): Promise<void> {
  vi.resetModules();
  document.body.innerHTML = '<main id="app"></main>';
  localStorage.clear();
  if (state) localStorage.setItem('offline-quilt-solver/v1', JSON.stringify(state));
  await import('./main');
}

beforeEach(() => {
  vi.stubGlobal('crypto', { randomUUID: () => 'new-type-id' });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

describe('configuration UI', () => {
  it('redistributes counts and updates the required tile total on resize', async () => {
    await render();
    const width = document.querySelector<HTMLInputElement>('input[name="width"]')!;
    width.value = '5';
    width.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector('#tile-total')?.textContent).toContain('20 tiles required');
    const counts = [...document.querySelectorAll<HTMLInputElement>('input[data-field="count"]')].map((input) => Number(input.value));
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(20);
  });

  it('gates solving for invalid counts and exposes labeled touch controls', async () => {
    await render();
    const count = document.querySelector<HTMLInputElement>('input[data-field="count"]')!;
    count.value = '20';
    count.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector<HTMLButtonElement>('#find-solution')?.disabled).toBe(true);
    expect(document.querySelector('label')?.textContent).toContain('Width');
    expect(document.querySelector<HTMLButtonElement>('[data-action="add-type"]')?.textContent).toContain('Add square type');
  });

  it('shows stale-solution and solver outcome messaging', async () => {
    const configuration = createDefaultConfiguration();
    await render({
      version: 1,
      configuration,
      solution: {
        version: 1,
        configuration,
        configurationFingerprint: configurationFingerprint(configuration),
        layouts: [{ cells: ['type-a', 'type-b', 'type-b', 'type-a', 'type-a', 'type-b', 'type-b', 'type-a', 'type-a', 'type-b', 'type-b', 'type-a', 'type-a', 'type-b', 'type-b', 'type-a'] }],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const count = document.querySelector<HTMLInputElement>('input[data-field="count"]')!;
    count.value = '7';
    count.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector('.stale')?.textContent).toContain('stale parameters');
    expect(document.querySelector('[role="img"]')).not.toBeNull();
    expect(document.querySelector('[data-action="save-pattern"]')?.textContent).toContain('Save pattern as JPG');
  });
});
