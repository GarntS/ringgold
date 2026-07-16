import './styles.css';
import { createCompatibility, createDefaultConfiguration, gridTotal, typeOrdinal } from './configuration';
import type { PersistedState, QuiltConfiguration, SquareType } from './models';
import { persistState, restoreState } from './persistence';
import { addRedistributedType, redistributeCounts, removeRedistributedType } from './redistribution';
import { configurationFingerprint, validateConfiguration } from './validation';
import { SolverClient } from './solver-client';
import { createId } from './id';

const restored = restoreState();
let configuration: QuiltConfiguration = restored?.configuration ?? createDefaultConfiguration();
let solution = restored?.solution ?? null;
let visibleLayout = 0;
let solveStatus = '';
let isSolving = false;
const solverClient = new SolverClient();
const app = document.querySelector<HTMLDivElement>('#app')!;

function save(): void {
  const state: PersistedState = { version: 1, configuration, solution };
  persistState(state);
}

function updateConfiguration(next: QuiltConfiguration): void {
  configuration = { ...next, compatibility: createCompatibility(next.squareTypes) };
  save();
  render();
}

function render(): void {
  const validation = validateConfiguration(configuration);
  const stale = solution && solution.configurationFingerprint !== configurationFingerprint(configuration);
  app.innerHTML = `
    <section class="app-shell" aria-labelledby="app-title">
      <header><h1 id="app-title">Quilt Layout Solver</h1><p>Arrange exact fabric counts with no matching edge neighbors.</p></header>
      <form id="configuration-form" novalidate>
        <fieldset class="grid-controls"><legend>Grid</legend>
          <label>Width <input name="width" type="number" inputmode="numeric" min="1" max="20" step="1" value="${configuration.width}" aria-describedby="tile-total" /></label>
          <label>Height <input name="height" type="number" inputmode="numeric" min="1" max="20" step="1" value="${configuration.height}" aria-describedby="tile-total" /></label>
          <output id="tile-total">${gridTotal(configuration)} tiles required</output>
        </fieldset>
        <fieldset><legend>Square types</legend>
          <div id="types">${configuration.squareTypes.map((type, index) => typeControl(type, index)).join('')}</div>
          <button type="button" data-action="add-type" class="secondary">Add square type</button>
        </fieldset>
        <div class="validation" role="alert">${validation.issues.map((issue) => `<p>${issue.message}</p>`).join('')}</div>
        ${stale ? '<p class="stale" role="status">Displayed solution uses stale parameters.</p>' : ''}
        <button id="find-solution" type="button" ${!validation.valid || isSolving ? 'disabled' : ''}>${isSolving ? 'Finding layouts…' : 'Find solution'}</button>
        ${isSolving ? '<button id="cancel-solution" type="button" class="secondary">Cancel search</button>' : ''}
      </form>
      <section id="solution" aria-live="polite">${renderSolution()}</section>
      ${renderDiagnostics()}
    </section>`;
  drawSolutionCanvas();
}

function renderDiagnostics(): string {
  const isolated = window.crossOriginIsolated === true;
  const sharedMemory = typeof SharedArrayBuffer !== 'undefined';
  const controlled = !!navigator.serviceWorker?.controller;
  return `<details class="diagnostics"><summary>Solver diagnostics</summary><dl>
    <dt>Secure context</dt><dd>${window.isSecureContext ? 'yes' : 'no'}</dd>
    <dt>Cross-origin isolated</dt><dd>${isolated ? 'yes' : 'no'}</dd>
    <dt>SharedArrayBuffer</dt><dd>${sharedMemory ? 'available' : 'unavailable'}</dd>
    <dt>Offline service worker active</dt><dd>${controlled ? 'yes' : 'no'}</dd>
  </dl><p>Include these values and the displayed solver error when reporting an issue.</p></details>`;
}

function renderSolution(): string {
  if (!solution) return solveStatus ? `<p role="status">${solveStatus}</p>` : '';
  const resultConfiguration = solution.configuration;
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions(resultConfiguration);
  const legend = resultConfiguration.squareTypes.map((type, index) => `<li><span class="legend-swatch" style="background:${type.color}"></span>${typeOrdinal(index)}: ${escapeHtml(type.name)}</li>`).join('');
  const navigator = solution.layouts.length > 1 ? `<div class="solution-navigation"><button type="button" data-action="previous-layout" ${visibleLayout === 0 ? 'disabled' : ''}>Previous layout</button><span>Layout ${visibleLayout + 1} of ${solution.layouts.length}</span><button type="button" data-action="next-layout" ${visibleLayout + 1 === solution.layouts.length ? 'disabled' : ''}>Next layout</button></div>` : '';
  return `${solveStatus ? `<p role="status">${solveStatus}</p>` : ''}${navigator}<canvas id="solution-grid" class="quilt-grid" width="${canvasWidth}" height="${canvasHeight}" role="img" aria-label="Quilt layout ${visibleLayout + 1} of ${solution.layouts.length}" aria-describedby="solution-legend"></canvas><button type="button" data-action="save-pattern" class="secondary">Save pattern as JPG</button><ul id="solution-legend" class="legend" aria-label="Fabric legend">${legend}</ul>`;
}

function canvasDimensions(configuration: QuiltConfiguration): { width: number; height: number } {
  const tileSize = 120;
  const gridWidth = configuration.width * tileSize;
  const minimumHeight = configuration.height * tileSize + canvasKeyHeight(configuration, gridWidth);
  // iPad portrait is 3:4. Round width to a multiple of three for an exact ratio.
  const width = Math.ceil(Math.max(gridWidth, minimumHeight * 0.75) / 3) * 3;
  return { width, height: (width / 3) * 4 };
}

function keyColumns(typeCount: number): number {
  return typeCount >= 4 ? 2 : 1;
}

function canvasKeyHeight(configuration: QuiltConfiguration, canvasWidth: number): number {
  const columns = keyColumns(configuration.squareTypes.length);
  const usableCharacters = Math.max(4, Math.floor((canvasWidth / columns - 64) / 10));
  const lineCounts = configuration.squareTypes.map((type, index) => {
    const nameLabel = `${typeOrdinal(index)}: ${type.name}`;
    return 1 + Math.max(1, Math.ceil(nameLabel.length / usableCharacters));
  });
  const rows = Math.ceil(lineCounts.length / columns);
  const lines = Array.from({ length: rows }, (_, row) => Math.max(...lineCounts.slice(row * columns, (row + 1) * columns)));
  return 32 + lines.reduce((total, count) => total + count * 30, 0);
}

function drawSolutionCanvas(): void {
  if (!solution) return;
  const canvas = app.querySelector<HTMLCanvasElement>('#solution-grid');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  const layout = solution.layouts[visibleLayout] ?? solution.layouts[0];
  const resultConfiguration = solution.configuration;
  const cellSize = 120;
  const gridWidth = resultConfiguration.width * cellSize;
  const gridX = (canvas.width - gridWidth) / 2;
  const types = new Map(resultConfiguration.squareTypes.map((type, index) => [type.id, { type, index }]));
  context.fillStyle = '#f7f3eb';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `600 ${Math.round(cellSize * 0.3)}px system-ui, sans-serif`;
  layout.cells.forEach((typeId, index) => {
    const column = index % resultConfiguration.width;
    const row = Math.floor(index / resultConfiguration.width);
    const entry = types.get(typeId);
    context.fillStyle = entry?.type.color ?? '#dddddd';
    context.fillRect(gridX + column * cellSize, row * cellSize, cellSize, cellSize);
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = Math.max(1, cellSize / 48);
    context.strokeRect(gridX + column * cellSize, row * cellSize, cellSize, cellSize);
    if (entry) {
      context.fillStyle = '#111111';
      context.fillText(typeOrdinal(entry.index), gridX + (column + 0.5) * cellSize, (row + 0.5) * cellSize);
    }
  });
  const gridHeight = resultConfiguration.height * cellSize;
  context.fillStyle = '#f7f3eb';
  context.fillRect(0, gridHeight, canvas.width, canvas.height - gridHeight);
  const footerHeight = canvas.height - gridHeight;
  const columns = keyColumns(resultConfiguration.squareTypes.length);
  const rows = Math.ceil(resultConfiguration.squareTypes.length / columns);
  const columnWidth = canvas.width / columns;
  let fontSize = Math.max(14, Math.floor((footerHeight - 32) / Math.max(1, rows * 1.2)));
  let entries: string[][] = [];
  let rowHeights: number[] = [];
  while (fontSize >= 14) {
    context.font = `600 ${fontSize}px system-ui, sans-serif`;
    const swatchSize = Math.round(fontSize * 1.1);
    entries = resultConfiguration.squareTypes.map((type, index) => [
      ...wrapCanvasText(context, `${typeOrdinal(index)}: ${type.name}`, columnWidth - 26 - swatchSize),
      `${type.count} squares`,
    ]);
    rowHeights = Array.from({ length: rows }, (_, row) => Math.max(...entries.slice(row * columns, (row + 1) * columns).map((lines) => lines.length)) * fontSize * 1.2);
    if (rowHeights.reduce((total, height) => total + height, 32) <= footerHeight) break;
    fontSize--;
  }
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = `600 ${fontSize}px system-ui, sans-serif`;
  let keyY = gridHeight + 16 + fontSize;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const type = resultConfiguration.squareTypes[index];
      if (!type) continue;
      const keyX = column * columnWidth;
      const lines = entries[index];
      const lineHeight = fontSize * 1.2;
      const textTop = keyY - fontSize;
      const textBottom = keyY + (lines.length - 1) * lineHeight + fontSize * 0.25;
      const swatchSize = Math.round(fontSize * 1.1);
      const swatchY = (textTop + textBottom - swatchSize) / 2;
      context.fillStyle = type.color;
      context.fillRect(keyX + 16, swatchY, swatchSize, swatchSize);
      context.strokeStyle = '#333333';
      context.lineWidth = 1;
      context.strokeRect(keyX + 16, swatchY, swatchSize, swatchSize);
      context.fillStyle = '#111111';
      lines.forEach((line, lineIndex) => context.fillText(line, keyX + 26 + swatchSize, keyY + lineIndex * lineHeight));
    }
    keyY += rowHeights[row];
  }
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function savePattern(): void {
  const canvas = app.querySelector<HTMLCanvasElement>('#solution-grid');
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quilt-layout-${visibleLayout + 1}.jpg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/jpeg', 0.4);
}

function typeControl(type: SquareType, index: number): string {
  const ordinal = typeOrdinal(index);
  return `<article class="type-control" data-type-id="${type.id}">
    <h2><span class="ordinal">${ordinal}</span> <span class="type-display-name">${escapeHtml(type.name || 'Unnamed')}</span></h2>
    <label>Name <input data-field="name" value="${escapeHtml(type.name)}" required /></label>
    <label>Color <input data-field="color" type="color" value="${type.color}" aria-label="${ordinal} color" /></label>
    <label>Count <input data-field="count" type="number" inputmode="numeric" min="0" step="1" value="${type.count}" /></label>
    <div class="type-action"><span>Actions</span><button type="button" data-action="remove-type" ${configuration.squareTypes.length === 1 ? 'disabled' : ''}>Remove ${ordinal}</button></div>
  </article>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

app.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement;
  if (target.name === 'width' || target.name === 'height') {
    const value = Number(target.value);
    const next = { ...configuration, [target.name]: value };
    if (Number.isInteger(value) && value >= 1 && value <= 20) {
      next.squareTypes = redistributeCounts(configuration.squareTypes, gridTotal(next));
    }
    updateConfiguration(next);
    return;
  }
  const control = target.closest<HTMLElement>('[data-type-id]');
  const field = target.dataset.field;
  if (!control || !field) return;
  const typeId = control.dataset.typeId!;
  const squareTypes = configuration.squareTypes.map((type) => type.id !== typeId ? type : {
    ...type,
    [field]: field === 'count' ? Number(target.value) : target.value,
  });
  updateConfiguration({ ...configuration, squareTypes });
});

app.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'add-type') {
    const id = `type-${createId()}`;
    const type: SquareType = { id, name: `Fabric ${typeOrdinal(configuration.squareTypes.length)}`, color: '#6d597a', count: 0 };
    updateConfiguration({ ...configuration, squareTypes: addRedistributedType(configuration.squareTypes, gridTotal(configuration), type) });
  }
  if (button.dataset.action === 'remove-type') {
    const typeId = button.closest<HTMLElement>('[data-type-id]')?.dataset.typeId;
    if (typeId && configuration.squareTypes.length > 1) {
      updateConfiguration({ ...configuration, squareTypes: removeRedistributedType(configuration.squareTypes, typeId, gridTotal(configuration)) });
    }
  }
  if (button.dataset.action === 'previous-layout') {
    visibleLayout--;
    render();
  }
  if (button.dataset.action === 'next-layout') {
    visibleLayout++;
    render();
  }
  if (button.dataset.action === 'save-pattern') savePattern();
});

app.addEventListener('click', async (event) => {
  if ((event.target as HTMLElement).closest('#cancel-solution')) {
    solverClient.cancel();
    return;
  }
  if (!(event.target as HTMLElement).closest('#find-solution')) return;
  isSolving = true;
  solveStatus = 'Finding layouts…';
  render();
  const response = await solverClient.solve(configuration);
  if (response.kind === 'solved') {
    solution = { version: 1, configuration: structuredClone(configuration), configurationFingerprint: configurationFingerprint(configuration), layouts: response.layouts, createdAt: new Date().toISOString() };
    visibleLayout = 0;
    solveStatus = `${response.layouts.length} layout${response.layouts.length === 1 ? '' : 's'} found.`;
    save();
  } else if (response.kind === 'unsatisfiable') {
    solveStatus = 'Layout impossible with these counts and nonadjacent-square rules.';
  } else if (response.kind === 'cancelled' || response.kind === 'timeout') {
    solveStatus = 'Search stopped before a layout was found.';
  } else if (response.kind === 'error') {
    solveStatus = `Solver error: ${response.message}`;
  }
  isSolving = false;
  render();
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('./sw.js');
}

render();
