import type { QuiltConfiguration, QuiltLayout } from './models';

export function cellSymbol(index: number): string {
  return `cell_${index}`;
}

export function buildLayoutQuery(configuration: QuiltConfiguration, blocked: readonly QuiltLayout[] = []): string {
  const { width, height, squareTypes, compatibility } = configuration;
  const cellCount = width * height;
  const lines: string[] = ['(set-logic QF_LIA)'];
  for (let index = 0; index < cellCount; index++) lines.push(`(declare-fun ${cellSymbol(index)} () Int)`);
  for (let index = 0; index < cellCount; index++) lines.push(`(assert (and (<= 0 ${cellSymbol(index)}) (< ${cellSymbol(index)} ${squareTypes.length})))`);
  squareTypes.forEach((type, typeIndex) => {
    const terms = Array.from({ length: cellCount }, (_, index) => `(ite (= ${cellSymbol(index)} ${typeIndex}) 1 0)`);
    lines.push(`(assert (= (+ ${terms.join(' ')}) ${type.count}))`);
  });
  const neighbors: [number, number][] = [];
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    const index = row * width + column;
    if (column + 1 < width) neighbors.push([index, index + 1]);
    if (row + 1 < height) neighbors.push([index, index + width]);
  }
  for (const [left, right] of neighbors) {
    squareTypes.forEach((leftType, leftIndex) => squareTypes.forEach((rightType, rightIndex) => {
      if (!compatibility[leftType.id]?.[rightType.id]) {
        lines.push(`(assert (not (and (= ${cellSymbol(left)} ${leftIndex}) (= ${cellSymbol(right)} ${rightIndex}))))`);
      }
    }));
  }
  for (const layout of blocked) {
    const differingCells = layout.cells.map((typeId, index) => `(not (= ${cellSymbol(index)} ${squareTypes.indexOf(squareTypes.find((type) => type.id === typeId)!)}))`);
    lines.push(`(assert (or ${differingCells.join(' ')}))`);
  }
  return lines.join('\n');
}
