import { MAX_GRID_DIMENSION, type ConfigurationValidation, type QuiltConfiguration } from './models';
import { gridTotal } from './configuration';

export function validateConfiguration(configuration: QuiltConfiguration): ConfigurationValidation {
  const issues: ConfigurationValidation['issues'] = [];
  for (const [field, value] of [['width', configuration.width], ['height', configuration.height]] as const) {
    if (!Number.isInteger(value) || value < 1 || value > MAX_GRID_DIMENSION) {
      issues.push({ code: field, message: `${field[0].toUpperCase()}${field.slice(1)} must be an integer from 1 to ${MAX_GRID_DIMENSION}.` });
    }
  }
  const total = gridTotal(configuration);
  const bound = Math.ceil(total / 2);
  let countSum = 0;
  for (const type of configuration.squareTypes) {
    if (!type.name.trim()) issues.push({ code: 'type-name', typeId: type.id, message: 'Every square type needs a name.' });
    if (!/^#[0-9a-f]{6}$/i.test(type.color)) issues.push({ code: 'type-color', typeId: type.id, message: 'Every square type needs a valid color.' });
    if (!Number.isInteger(type.count) || type.count < 0) {
      issues.push({ code: 'type-count', typeId: type.id, message: `${type.name || 'This type'} needs a non-negative integer count.` });
    }
    countSum += type.count;
    if (type.count > bound) {
      issues.push({ code: 'independent-set-bound', typeId: type.id, message: `${type.name || 'This type'} has too many tiles (${type.count}); at most ${bound} can avoid edge adjacency.` });
    }
  }
  if (countSum !== total) issues.push({ code: 'count-total', message: `Type counts total ${countSum}; the ${configuration.width} × ${configuration.height} grid requires ${total}.` });
  return { valid: issues.length === 0, issues };
}

export function configurationFingerprint(configuration: QuiltConfiguration): string {
  return JSON.stringify({
    version: configuration.version,
    width: configuration.width,
    height: configuration.height,
    squareTypes: configuration.squareTypes.map(({ id, count }) => ({ id, count })),
    compatibility: Object.keys(configuration.compatibility).sort().map((left) => [
      left,
      Object.keys(configuration.compatibility[left]).sort().map((right) => [right, configuration.compatibility[left][right]]),
    ]),
  });
}
