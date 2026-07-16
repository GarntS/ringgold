/// <reference lib="webworker" />

import { init } from 'z3-solver';
import { MAX_SOLUTIONS, type QuiltLayout, type SolverWorkerRequest, type SolverWorkerResponse } from './models';
import { buildLayoutQuery, cellSymbol } from './smt';

declare const self: DedicatedWorkerGlobalScope;

type Z3Api = Awaited<ReturnType<typeof init>>;
let api: Z3Api | null = null;
const cancelled = new Set<string>();

function within<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), milliseconds)),
  ]);
}

async function getApi(): Promise<Z3Api> {
  if (!api) {
    if (!crossOriginIsolated) throw new Error('Z3 requires cross-origin isolation, but this page is not isolated. Reload after the offline assets finish installing.');
    if (typeof SharedArrayBuffer === 'undefined') throw new Error('This browser does not provide SharedArrayBuffer, which the bundled Z3 solver requires.');
    // z3-built.js is Emscripten's classic-worker glue. Evaluate it in the worker
    // global scope so this module worker can still expose its `initZ3` factory.
    const glue = await fetch('/solver/z3-built.js').then((response) => {
      if (!response.ok) throw new Error(`Unable to load Z3 glue (${response.status}).`);
      return response.text();
    });
    new Function(`${glue}\nglobalThis.initZ3 = initZ3;`)();
    type Z3Options = { mainScriptUrlOrBlob: string; locateFile: (path: string) => string };
    const initializeZ3 = (self as typeof self & { initZ3: (options: Z3Options) => unknown }).initZ3;
    (self as typeof self & { initZ3: () => unknown }).initZ3 = () => initializeZ3({
      mainScriptUrlOrBlob: '/solver/z3-built.js',
      locateFile: (path) => `/solver/${path}`,
    });
    api = await within(init(), 20_000, 'Z3 initialization timed out. This browser may not support the threaded WebAssembly solver.');
  }
  return api;
}

function post(message: SolverWorkerResponse): void {
  self.postMessage(message);
}

async function solve(request: Extract<SolverWorkerRequest, { kind: 'solve' }>): Promise<void> {
  try {
    const { Context } = await getApi();
    const { Solver, Int } = new Context(`quilt-${request.requestId}`);
    const solver = new Solver();
    solver.set('timeout', request.timeoutMs);
    const layouts: QuiltLayout[] = [];
    const limit = Math.min(request.maxSolutions, MAX_SOLUTIONS);
    while (layouts.length < limit && !cancelled.has(request.requestId)) {
      solver.reset();
      solver.fromString(buildLayoutQuery(request.configuration, layouts));
      const result = await solver.check();
      if (cancelled.has(request.requestId)) {
        post({ kind: 'cancelled', requestId: request.requestId });
        return;
      }
      if (result === 'unsat') break;
      if (result === 'unknown') {
        post({ kind: 'timeout', requestId: request.requestId });
        return;
      }
      const model = solver.model();
      const cells = Array.from({ length: request.configuration.width * request.configuration.height }, (_, index) => {
        const typeIndex = Number(model.eval(Int.const(cellSymbol(index)), true).toString());
        return request.configuration.squareTypes[typeIndex].id;
      });
      layouts.push({ cells });
    }
    post(layouts.length ? { kind: 'solved', requestId: request.requestId, layouts } : { kind: 'unsatisfiable', requestId: request.requestId });
  } catch (error) {
    post({ kind: 'error', requestId: request.requestId, message: error instanceof Error ? error.message : 'Unexpected solver failure.' });
  } finally {
    cancelled.delete(request.requestId);
  }
}

self.addEventListener('message', (event: MessageEvent<SolverWorkerRequest>) => {
  if (event.data.kind === 'cancel') {
    cancelled.add(event.data.requestId);
    return;
  }
  void solve(event.data);
});
