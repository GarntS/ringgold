import type { SquareType } from './models';

function allocate(total: number, weights: readonly number[]): number[] {
  if (total <= 0 || weights.length === 0) return weights.map(() => 0);
  const weightTotal = weights.reduce((sum, value) => sum + Math.max(0, value), 0);
  const normalized = weightTotal === 0 ? weights.map(() => 1) : weights.map((value) => Math.max(0, value));
  const denominator = weightTotal === 0 ? normalized.length : weightTotal;
  const raw = normalized.map((weight) => (weight * total) / denominator);
  const result = raw.map(Math.floor);
  let remainder = total - result.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const item of order) {
    if (remainder-- <= 0) break;
    result[item.index]++;
  }
  return result;
}

export function redistributeCounts(types: readonly SquareType[], total: number): SquareType[] {
  const counts = allocate(total, types.map((type) => type.count));
  return types.map((type, index) => ({ ...type, count: counts[index] }));
}

export function addRedistributedType(types: readonly SquareType[], total: number, newType: SquareType): SquareType[] {
  const existingTarget = total - Math.floor(total / (types.length + 1));
  const redistributed = redistributeCounts(types, existingTarget);
  return [...redistributed, { ...newType, count: total - existingTarget }];
}

export function removeRedistributedType(types: readonly SquareType[], removeId: string, total: number): SquareType[] {
  const retained = types.filter((type) => type.id !== removeId);
  return redistributeCounts(retained, total);
}
