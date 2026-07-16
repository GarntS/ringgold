import {
  CONFIG_VERSION,
  type CompatibilityMatrix,
  type QuiltConfiguration,
  type SquareType,
} from './models';

const DEFAULT_TYPES: SquareType[] = [
  { id: 'type-a', name: 'Fabric A', color: '#d95d39', count: 8 },
  { id: 'type-b', name: 'Fabric B', color: '#457b9d', count: 8 },
];

export function createCompatibility(types: readonly SquareType[]): CompatibilityMatrix {
  return Object.fromEntries(types.map((left) => [
    left.id,
    Object.fromEntries(types.map((right) => [right.id, left.id !== right.id])),
  ]));
}

export function createDefaultConfiguration(): QuiltConfiguration {
  return {
    version: CONFIG_VERSION,
    width: 4,
    height: 4,
    squareTypes: DEFAULT_TYPES.map((type) => ({ ...type })),
    compatibility: createCompatibility(DEFAULT_TYPES),
  };
}

export function gridTotal(configuration: Pick<QuiltConfiguration, 'width' | 'height'>): number {
  return configuration.width * configuration.height;
}

export function typeOrdinal(index: number): string {
  let result = '';
  let value = index + 1;
  while (value > 0) {
    value--;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}
