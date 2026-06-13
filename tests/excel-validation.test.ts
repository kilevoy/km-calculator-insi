import { describe, expect, test } from 'vitest';
import scenariosFile from './fixtures/excel-scenarios.json';
import resultsFile from './fixtures/excel-results.json';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';
import type { CalculatorParams, RoofType, SystemType } from '../src/types/calculator';

const systems: SystemType[] = ['Спринт-М', 'Спринт-2М', 'Великан', 'Атлант', 'Атлант-М', 'Крон'];
const roofs: RoofType[] = ['one_slope', 'two_slope', 'flat', 'multi_slope'];
const spanCells = ['B35', 'D35', 'F35', 'H35', 'J35'] as const;

interface ExcelScenario {
  id: number;
  cells: Record<string, number | boolean | null>;
}

function toParams(scenario: ExcelScenario): CalculatorParams {
  const cells = scenario.cells;
  const params = structuredClone(DEFAULT_PARAMS);
  params.system = systems[Number(cells.AM7) - 1];
  params.roof_type = roofs[Number(cells.AM11) - 1];
  params.country = Number(cells.AM5) === 2 ? 'eurocode' : 'snip';
  params.seismic = ([6, 7, 8, 9] as const)[Number(cells.AM6) - 1];
  params.span_widths_m = spanCells
    .slice(0, Number(cells.D33))
    .map((cell) => Number(cells[cell]));
  params.building_length_m = Number(cells.B38);
  params.frame_steps_m = [Number(cells.B40)];
  params.height_m = Number(cells.F43);
  params.walls.cladding = 'none';
  params.walls.windows.enabled = false;
  params.walls.gates.enabled = false;
  params.walls.doors.enabled = false;
  params.roof_cladding = 'sandwich';
  return params;
}

describe('Excel R2.0.1 independent validation', () => {
  test.each((scenariosFile.scenarios as ExcelScenario[]).map((scenario, index) => [
    scenario.id,
    scenario,
    resultsFile.results[index],
  ] as const))('case #%i is within 3%% of Excel', (_id, scenario, expected) => {
    const actual = calculate(toParams(scenario));
    const costDifference = Math.abs(actual.cost - expected.cost_thousand_rub) / expected.cost_thousand_rub * 100;
    const termDifference = Math.abs(actual.term - expected.term_days) / expected.term_days * 100;
    expect(costDifference, `cost: ${actual.cost} vs ${expected.cost_thousand_rub}`).toBeLessThan(3);
    expect(termDifference, `term: ${actual.term} vs ${expected.term_days}`).toBeLessThan(3);
    expect(actual.area_m2).toBeCloseTo(expected.area_m2, 4);
  });
});
