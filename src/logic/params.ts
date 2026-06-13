import { DEFAULT_PARAMS } from '../data/defaults';
import {
  ROOF_TYPES,
  SYSTEMS,
  type CalculatorParams,
  type OpeningParams,
} from '../types/calculator';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const record = (value: unknown): UnknownRecord => isRecord(value) ? value : {};
const boolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;
const finiteNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const text = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.slice(0, 500) : fallback;
const oneOf = <T extends readonly unknown[]>(value: unknown, allowed: T, fallback: T[number]): T[number] =>
  allowed.includes(value) ? value : fallback;
const numberArray = (value: unknown, fallback: number[], maximumLength: number) =>
  Array.isArray(value)
    ? value.slice(0, maximumLength).map((item, index) => finiteNumber(item, fallback[index] ?? fallback.at(-1) ?? 0))
    : [...fallback];

function opening(value: unknown, fallback: OpeningParams): OpeningParams {
  const source = record(value);
  return {
    enabled: boolean(source.enabled, fallback.enabled),
    count: finiteNumber(source.count, fallback.count),
    size_types: finiteNumber(source.size_types, fallback.size_types),
  };
}

export function hydrateCalculatorParams(value: unknown): CalculatorParams {
  const defaults = structuredClone(DEFAULT_PARAMS);
  const source = record(value);
  const projectSections = record(source.project_sections);
  const floor = record(source.floor);
  const supportCrane = record(source.support_crane);
  const suspensionCrane = record(source.suspension_crane);
  const stairs = record(source.stairs);
  const parapet = record(source.parapet);
  const walls = record(source.walls);

  const mezzanines = defaults.mezzanines.map((fallback, index) => {
    const item = record(Array.isArray(source.mezzanines) ? source.mezzanines[index] : undefined);
    return {
      enabled: boolean(item.enabled, fallback.enabled),
      length_m: finiteNumber(item.length_m, fallback.length_m),
      width_m: finiteNumber(item.width_m, fallback.width_m),
      storeys: finiteNumber(item.storeys, fallback.storeys),
      load_mode: oneOf(item.load_mode, ['same', 'different'] as const, fallback.load_mode),
    };
  }) as CalculatorParams['mezzanines'];

  const partitions = defaults.partitions.map((fallback, index) => {
    const item = record(Array.isArray(source.partitions) ? source.partitions[index] : undefined);
    return {
      kind: oneOf(item.kind, ['gvl', 'sandwich_layer', 'sandwich'] as const, fallback.kind),
      enabled: boolean(item.enabled, fallback.enabled),
      area_m2: finiteNumber(item.area_m2, fallback.area_m2),
    };
  }) as CalculatorParams['partitions'];

  return {
    model_version: 2,
    system: oneOf(source.system, SYSTEMS, defaults.system),
    roof_type: oneOf(source.roof_type, ROOF_TYPES, defaults.roof_type),
    country: oneOf(source.country, ['snip', 'eurocode'] as const, defaults.country),
    seismic: oneOf(source.seismic, [6, 7, 8, 9] as const, defaults.seismic),
    fire_resistance: oneOf(source.fire_resistance, ['below_v', 'v'] as const, defaults.fire_resistance),
    project_sections: {
      km: boolean(projectSections.km, defaults.project_sections.km),
      as: boolean(projectSections.as, defaults.project_sections.as),
    },
    overhead_rate: finiteNumber(source.overhead_rate, defaults.overhead_rate),
    span_widths_m: numberArray(source.span_widths_m, defaults.span_widths_m, 5),
    building_length_m: finiteNumber(source.building_length_m, defaults.building_length_m),
    frame_step_mode: oneOf(source.frame_step_mode, ['same', 'different'] as const, defaults.frame_step_mode),
    frame_steps_m: numberArray(source.frame_steps_m, defaults.frame_steps_m, 100),
    height_m: finiteNumber(source.height_m, defaults.height_m),
    has_subtruss: boolean(source.has_subtruss, defaults.has_subtruss),
    floor: {
      enabled: boolean(floor.enabled, defaults.floor.enabled),
      spans_m: numberArray(floor.spans_m, defaults.floor.spans_m, 5),
      storeys: finiteNumber(floor.storeys, defaults.floor.storeys),
      load_mode: oneOf(floor.load_mode, ['same', 'different'] as const, defaults.floor.load_mode),
    },
    mezzanines,
    support_crane: {
      enabled: boolean(supportCrane.enabled, defaults.support_crane.enabled),
      spans_count: finiteNumber(supportCrane.spans_count, defaults.support_crane.spans_count),
      capacity_mode: oneOf(supportCrane.capacity_mode, ['same', 'different'] as const, defaults.support_crane.capacity_mode),
    },
    suspension_crane: {
      enabled: boolean(suspensionCrane.enabled, defaults.suspension_crane.enabled),
      spans_count: finiteNumber(suspensionCrane.spans_count, defaults.suspension_crane.spans_count),
      capacity_mode: oneOf(suspensionCrane.capacity_mode, ['same', 'different'] as const, defaults.suspension_crane.capacity_mode),
    },
    stairs: {
      concrete: numberArray(stairs.concrete, defaults.stairs.concrete, 4) as CalculatorParams['stairs']['concrete'],
      metal: numberArray(stairs.metal, defaults.stairs.metal, 4) as CalculatorParams['stairs']['metal'],
    },
    roof_cladding: oneOf(source.roof_cladding, ['profile', 'pvc', 'sandwich_layer', 'sandwich'] as const, defaults.roof_cladding),
    has_snow_retention: boolean(source.has_snow_retention, defaults.has_snow_retention),
    has_roof_railing: boolean(source.has_roof_railing, defaults.has_roof_railing),
    has_drainage: boolean(source.has_drainage, defaults.has_drainage),
    parapet: {
      long_sides: oneOf(parapet.long_sides, [0, 1, 2] as const, defaults.parapet.long_sides),
      end_sides: oneOf(parapet.end_sides, [0, 1, 2] as const, defaults.parapet.end_sides),
      has_overhang: boolean(parapet.has_overhang, defaults.parapet.has_overhang),
    },
    walls: {
      cladding: oneOf(walls.cladding, ['none', 'profile', 'sandwich_layer', 'sandwich'] as const, defaults.walls.cladding),
      thickness_mm: oneOf(walls.thickness_mm, [100, 110, 150, 200, 250] as const, defaults.walls.thickness_mm),
      orientation: oneOf(walls.orientation, ['horizontal', 'vertical'] as const, defaults.walls.orientation),
      windows: opening(walls.windows, defaults.walls.windows),
      gates: opening(walls.gates, defaults.walls.gates),
      doors: opening(walls.doors, defaults.walls.doors),
    },
    partitions,
    partition_openings: opening(source.partition_openings, defaults.partition_openings),
    partition_gates: opening(source.partition_gates, defaults.partition_gates),
    manager: text(source.manager),
    client: text(source.client),
    project_name: text(source.project_name),
  };
}
