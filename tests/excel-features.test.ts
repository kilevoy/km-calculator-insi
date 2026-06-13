import { describe, expect, test } from 'vitest';
import scenariosFile from './fixtures/excel-feature-scenarios.json';
import resultsFile from './fixtures/excel-feature-results.json';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';
import type { CalculatorParams } from '../src/types/calculator';

interface FeatureScenario {
  id: number;
  feature: string;
}

function baseline(): CalculatorParams {
  const params = structuredClone(DEFAULT_PARAMS);
  params.system = 'Атлант';
  params.roof_type = 'two_slope';
  params.country = 'snip';
  params.seismic = 7;
  params.span_widths_m = [18];
  params.building_length_m = 45.6;
  params.frame_steps_m = [6];
  params.height_m = 5;
  params.walls.cladding = 'none';
  params.walls.windows.enabled = false;
  params.walls.gates.enabled = false;
  params.walls.doors.enabled = false;
  params.roof_cladding = 'sandwich';
  return params;
}

function paramsFor(feature: string): CalculatorParams {
  const params = baseline();
  const stairMatch = feature.match(/^stair_(concrete|metal)_([1-4])$/);
  if (stairMatch) {
    const kind = stairMatch[1] as 'concrete' | 'metal';
    const index = Number(stairMatch[2]) - 1;
    params.stairs[kind][index] = 1;
    return params;
  }

  switch (feature) {
    case 'floor':
      params.floor = { enabled: true, spans_m: [12], storeys: 2, load_mode: 'same' };
      break;
    case 'floor_different_load':
      params.floor = { enabled: true, spans_m: [12], storeys: 3, load_mode: 'different' };
      break;
    case 'mezzanine_1':
      params.mezzanines[0] = { enabled: true, length_m: 12, width_m: 6, storeys: 2, load_mode: 'same' };
      break;
    case 'mezzanine_2':
      params.mezzanines[1] = { enabled: true, length_m: 10, width_m: 5, storeys: 2, load_mode: 'same' };
      break;
    case 'mezzanine_3':
      params.mezzanines[2] = { enabled: true, length_m: 8, width_m: 5, storeys: 3, load_mode: 'different' };
      break;
    case 'support_crane':
    case 'support_crane_different':
      params.support_crane = { enabled: true, spans_count: 1, capacity_mode: feature.endsWith('different') ? 'different' : 'same' };
      break;
    case 'suspension_crane':
    case 'suspension_crane_different':
      params.suspension_crane = { enabled: true, spans_count: 1, capacity_mode: feature.endsWith('different') ? 'different' : 'same' };
      break;
    case 'roof_profile':
      params.roof_cladding = 'profile';
      break;
    case 'roof_layered':
      params.roof_cladding = 'sandwich_layer';
      break;
    case 'roof_pvc':
      params.roof_cladding = 'pvc';
      break;
    case 'roof_snow':
      params.has_snow_retention = true;
      break;
    case 'roof_railing':
      params.has_roof_railing = true;
      break;
    case 'roof_drainage':
      params.has_drainage = true;
      break;
    case 'walls_profile':
      params.walls.cladding = 'profile';
      break;
    case 'walls_layered_150':
      params.walls.cladding = 'sandwich_layer';
      params.walls.thickness_mm = 150;
      break;
    case 'walls_factory_horizontal':
    case 'walls_factory_vertical':
      params.walls.cladding = 'sandwich';
      params.walls.thickness_mm = 150;
      params.walls.orientation = feature.endsWith('vertical') ? 'vertical' : 'horizontal';
      break;
    case 'wall_windows':
      params.walls.cladding = 'sandwich';
      params.walls.windows = { enabled: true, count: 10, size_types: 3 };
      break;
    case 'wall_gates':
      params.walls.cladding = 'sandwich';
      params.walls.gates = { enabled: true, count: 2, size_types: 2 };
      break;
    case 'wall_doors':
      params.walls.cladding = 'sandwich';
      params.walls.doors = { enabled: true, count: 4, size_types: 2 };
      break;
    case 'partition_gvl':
      params.partitions[0] = { kind: 'gvl', enabled: true, area_m2: 120 };
      break;
    case 'partition_layered':
      params.partitions[1] = { kind: 'sandwich_layer', enabled: true, area_m2: 120 };
      break;
    case 'partition_factory':
      params.partitions[2] = { kind: 'sandwich', enabled: true, area_m2: 120 };
      break;
    case 'partition_openings':
      params.partitions[0] = { kind: 'gvl', enabled: true, area_m2: 120 };
      params.partition_openings.enabled = true;
      break;
    case 'partition_gates':
      params.partitions[0] = { kind: 'gvl', enabled: true, area_m2: 120 };
      params.partition_gates.enabled = true;
      break;
    case 'parapet_long_one':
      params.parapet.long_sides = 1;
      break;
    case 'parapet_long_two_overhang':
      params.parapet.long_sides = 2;
      params.parapet.has_overhang = true;
      break;
    case 'parapet_end_one':
      params.parapet.end_sides = 1;
      break;
    case 'parapet_end_two':
      params.parapet.end_sides = 2;
      break;
    case 'fire_resistance_v':
      params.fire_resistance = 'v';
      break;
    case 'different_frame_step':
      params.frame_step_mode = 'different';
      break;
    case 'architecture_section':
      params.project_sections.as = true;
      break;
    case 'architecture_only':
      params.project_sections = { km: false, as: true };
      break;
  }
  return params;
}

describe('Excel R2.0.1 feature coverage', () => {
  test.each((scenariosFile.scenarios as FeatureScenario[]).map((scenario, index) => [
    scenario.feature,
    resultsFile.results[index],
  ] as const))('%s matches the Excel feature scenario', (feature, expected) => {
    const actual = calculate(paramsFor(feature));
    const difference = Math.abs(actual.cost - expected.cost_thousand_rub) / Math.max(expected.cost_thousand_rub, 1) * 100;
    expect(difference, `${feature}: ${actual.cost} vs ${expected.cost_thousand_rub}`).toBeLessThan(3);
  });
});
