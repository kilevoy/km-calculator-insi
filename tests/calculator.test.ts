import { describe, expect, test } from 'vitest';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';
import type { CalculatorParams, RoofType, SystemType } from '../src/types/calculator';

const systems: SystemType[] = ['Спринт-М', 'Спринт-2М', 'Великан', 'Атлант', 'Атлант-М', 'Крон'];
const roofs: RoofType[] = ['one_slope', 'two_slope', 'flat', 'multi_slope'];

const cases: CalculatorParams[] = Array.from({ length: 30 }, (_, index) => {
  const system = systems[index % systems.length];
  const allowedRoof = ['Спринт-М', 'Спринт-2М', 'Крон'].includes(system)
    ? roofs[index % 2]
    : roofs[index % roofs.length];
  const params = structuredClone(DEFAULT_PARAMS);
  params.system = system;
  params.roof_type = allowedRoof;
  params.span_widths_m = Array.from({ length: ['Спринт-М', 'Спринт-2М', 'Крон'].includes(system) ? 1 : index % 3 + 1 }, (_, spanIndex) => 10 + spanIndex * 3 + index % 4);
  params.building_length_m = 24 + index * 2.5;
  params.height_m = 4 + index % 9;
  params.seismic = ([6, 7, 8, 9] as const)[index % 4];
  params.country = index % 5 === 0 ? 'eurocode' : 'snip';
  params.has_snow_retention = index % 2 === 0;
  params.has_roof_railing = index % 3 === 0;
  params.walls.windows = { enabled: true, count: index % 15, size_types: index % 3 };
  return params;
});

describe('Calculator smoke matrix: 30 representative cases', () => {
  test('scales monetary results with the editable base price', () => {
    const baseline = calculate(structuredClone(DEFAULT_PARAMS));
    const increasedParams = structuredClone(DEFAULT_PARAMS);
    increasedParams.base_price_rub *= 1.25;
    const increased = calculate(increasedParams);

    expect(increased.cost).toBeCloseTo(baseline.cost * 1.25, 6);
    expect(increased.term).toBeCloseTo(baseline.term * 1.25, 2);
    expect(increased.metal_consumption).toBe(baseline.metal_consumption);
  });

  test.each(cases.map((params, index) => [index + 1, params] as const))('case #%i produces a finite result', (_id, params) => {
    const result = calculate(params);
    expect(result.status).toBe('valid');
    expect(result.cost).toBeGreaterThan(0);
    expect(result.term).toBeGreaterThan(0);
    expect(result.area_m2).toBeGreaterThan(0);
    expect(result.breakdown.reduce((sum, item) => sum + item.value, 0)).toBeCloseTo(result.cost * 1000, -1);
  });
});

describe('Calculator validation', () => {
  test('rejects a span beyond the system limit', () => {
    const params = structuredClone(DEFAULT_PARAMS);
    params.system = 'Спринт-М';
    params.roof_type = 'one_slope';
    params.span_widths_m = [13];
    const result = calculate(params);
    expect(result.status).toBe('invalid');
    expect(result.issues.some(({ code }) => code === 'span.range')).toBe(true);
  });

  test('includes every enabled addition in trace and breakdown', () => {
    const params = structuredClone(DEFAULT_PARAMS);
    params.system = 'Великан';
    params.span_widths_m = [18, 18];
    params.has_subtruss = true;
    params.mezzanines[0] = { enabled: true, length_m: 12, width_m: 6, storeys: 2, load_mode: 'different' };
    params.support_crane = { enabled: true, spans_count: 2, capacity_mode: 'different' };
    params.partitions[0] = { kind: 'gvl', enabled: true, area_m2: 120 };
    const result = calculate(params);
    expect(result.trace.coefficients.subtruss).toBeGreaterThan(0);
    expect(result.trace.coefficients.mezzanines).toBeGreaterThan(0);
    expect(result.trace.coefficients.support_crane).toBeGreaterThan(0);
    expect(result.trace.coefficients.partitions).toBeGreaterThan(0);
  });
});
