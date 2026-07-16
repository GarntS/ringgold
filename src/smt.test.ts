import { init } from 'z3-solver';
import { describe, expect, it } from 'vitest';
import { createCompatibility } from './configuration';
import type { QuiltConfiguration, QuiltLayout, SquareType } from './models';
import { buildLayoutQuery, cellSymbol } from './smt';

const types: SquareType[] = [
  { id: 'a', name: 'A', color: '#000000', count: 2 },
  { id: 'b', name: 'B', color: '#ffffff', count: 2 },
];

function config(counts = [2, 2]): QuiltConfiguration {
  const squareTypes = types.map((type, index) => ({ ...type, count: counts[index] }));
  return { version: 1, width: 2, height: 2, squareTypes, compatibility: createCompatibility(squareTypes) };
}

async function solve(configuration: QuiltConfiguration, blocked: QuiltLayout[] = []): Promise<QuiltLayout | null> {
  const { Context } = await init();
  const { Solver, Int } = new Context(`test-${crypto.randomUUID()}`);
  const solver = new Solver();
  solver.fromString(buildLayoutQuery(configuration, blocked));
  if (await solver.check() !== 'sat') return null;
  const model = solver.model();
  return { cells: Array.from({ length: 4 }, (_, index) => configuration.squareTypes[Number(model.eval(Int.const(cellSymbol(index)), true).toString())].id) };
}

describe('SMT layout query', () => {
  it('uses every requested count without equal orthogonal neighbors', async () => {
    const layout = await solve(config());
    expect(layout).not.toBeNull();
    expect(layout!.cells.filter((id) => id === 'a')).toHaveLength(2);
    expect(layout!.cells.filter((id) => id === 'b')).toHaveLength(2);
    expect(layout!.cells[0]).not.toBe(layout!.cells[1]);
    expect(layout!.cells[0]).not.toBe(layout!.cells[2]);
    expect(layout!.cells[1]).not.toBe(layout!.cells[3]);
    expect(layout!.cells[2]).not.toBe(layout!.cells[3]);
  });

  it('allows equal diagonal tiles and uses default compatibility', async () => {
    const matrix = createCompatibility(types);
    expect(matrix.a.a).toBe(false);
    expect(matrix.a.b).toBe(true);
    const layout = await solve(config());
    expect(layout!.cells[0]).toBe(layout!.cells[3]);
  });

  it('proves an excessive same-type count unsatisfiable', async () => {
    expect(await solve(config([3, 1]))).toBeNull();
  });

  it('blocks a prior model to enumerate a distinct result', async () => {
    const first = await solve(config());
    const second = await solve(config(), [first!]);
    expect(second).not.toBeNull();
    expect(second!.cells).not.toEqual(first!.cells);
  });
});
