import { describe, expect, test } from 'vitest';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';
import {
  createDefaultKMModel,
  diffKMModel,
  listKMNumericCoefficients,
  setKMCoefficient,
  validateKMModel,
} from '../src/logic/km-model';

describe('KM coefficient administration model', () => {
  test('contains the complete numeric Excel coefficient set', () => {
    const model = createDefaultKMModel();
    const entries = listKMNumericCoefficients(model.coefficients);

    expect(entries.length).toBeGreaterThan(100);
    expect(entries.some(({ path }) => path === 'systems.Атлант.base_coef.two_slope')).toBe(true);
    expect(entries.every(({ changed }) => !changed)).toBe(true);
  });

  test('updates an exact coefficient path without mutating the reference', () => {
    const model = createDefaultKMModel();
    const path = 'systems.Атлант.base_coef.two_slope';
    const updated = setKMCoefficient(model.coefficients, path, 2.1);

    expect(updated.systems.Атлант.base_coef.two_slope).toBe(2.1);
    expect(model.coefficients.systems.Атлант.base_coef.two_slope).toBe(1.6);
  });

  test('builds a human-readable diff against Excel R2.0.1', () => {
    const model = createDefaultKMModel();
    model.coefficients = setKMCoefficient(
      model.coefficients,
      'systems.Атлант.base_coef.two_slope',
      2,
    );
    const diff = diffKMModel(model.coefficients);

    expect(diff).toHaveLength(1);
    expect(diff[0]).toMatchObject({ before: 1.6, after: 2, deltaPercent: 25 });
    expect(validateKMModel(model)).toEqual([]);
  });

  test('uses the working coefficient model only when explicitly supplied', () => {
    const params = structuredClone(DEFAULT_PARAMS);
    params.system = 'Атлант';
    params.roof_type = 'two_slope';
    params.span_widths_m = [12];
    const reference = calculate(params);
    const model = createDefaultKMModel();
    model.coefficients = setKMCoefficient(
      model.coefficients,
      'systems.Атлант.base_coef.two_slope',
      2.6,
    );

    expect(calculate(params).cost).toBe(reference.cost);
    expect(calculate(params, model.coefficients).cost).toBeGreaterThan(reference.cost);
  });
});
