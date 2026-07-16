import type { QuiltConfiguration, SolverWorkerResponse } from './models';
import { createId } from './id';

export class SolverClient {
  private worker: Worker | null = null;
  private pending: ((response: SolverWorkerResponse) => void) | null = null;
  private requestId: string | null = null;

  solve(configuration: QuiltConfiguration, timeoutMs = 15_000): Promise<SolverWorkerResponse> {
    this.cancel();
    const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    const requestId = createId();
    this.requestId = requestId;
    return new Promise((resolve) => {
      this.pending = resolve;
      worker.addEventListener('message', (event: MessageEvent<SolverWorkerResponse>) => {
        if (event.data.requestId !== requestId) return;
        this.finish(worker, event.data);
      });
      worker.addEventListener('error', (event) => {
        this.finish(worker, { kind: 'error', requestId, message: event.message || 'The solver worker failed to start.' });
      }, { once: true });
      worker.postMessage({ kind: 'solve', requestId, configuration, timeoutMs, maxSolutions: 8 });
    });
  }

  cancel(): void {
    if (!this.worker || !this.requestId) return;
    const worker = this.worker;
    this.finish(worker, { kind: 'cancelled', requestId: this.requestId });
  }

  private finish(worker: Worker, response: SolverWorkerResponse): void {
    worker.terminate();
    if (this.worker === worker) this.worker = null;
    this.requestId = null;
    const resolve = this.pending;
    this.pending = null;
    resolve?.(response);
  }
}
