import { describe, expect, test } from 'vitest';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { hydrateCalculatorParams } from '../src/logic/params';
import { calculate } from '../src/logic/calculator';

describe('external calculator parameter hydration', () => {
  test('rejects forged enum values and malformed nested data', () => {
    const hydrated = hydrateCalculatorParams({
      model_version: 2,
      system: 'forged-system',
      roof_type: 'forged-roof',
      span_widths_m: 'not-an-array',
      walls: { windows: null, thickness_mm: 999 },
      stairs: { concrete: ['bad'], metal: null },
      mezzanines: { enabled: true },
    });

    expect(hydrated.system).toBe(DEFAULT_PARAMS.system);
    expect(hydrated.roof_type).toBe(DEFAULT_PARAMS.roof_type);
    expect(hydrated.span_widths_m).toEqual(DEFAULT_PARAMS.span_widths_m);
    expect(hydrated.walls.thickness_mm).toBe(DEFAULT_PARAMS.walls.thickness_mm);
    expect(() => calculate(hydrated)).not.toThrow();
  });

  test('preserves valid version 2 values while limiting unbounded arrays', () => {
    const hydrated = hydrateCalculatorParams({
      ...structuredClone(DEFAULT_PARAMS),
      system: 'Великан',
      span_widths_m: [12, 18, 24, 30, 36, 42],
      frame_steps_m: Array.from({ length: 200 }, () => 6),
    });

    expect(hydrated.system).toBe('Великан');
    expect(hydrated.span_widths_m).toEqual([12, 18, 24, 30, 36]);
    expect(hydrated.frame_steps_m).toHaveLength(100);
  });

  test('does not retain object references from external data', () => {
    const input = structuredClone(DEFAULT_PARAMS);
    const hydrated = hydrateCalculatorParams(input);
    input.walls.windows.count = 999;
    expect(hydrated.walls.windows.count).toBe(DEFAULT_PARAMS.walls.windows.count);
  });
});
