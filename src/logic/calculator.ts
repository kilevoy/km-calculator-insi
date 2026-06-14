import {
  CALCULATOR_COEFFICIENTS,
  type CalculatorCoefficientModel,
} from '../data/coefficients';
import type {
  CalculatorParams,
  CalculatorResult,
  CostBreakdownItem,
  SystemType,
} from '../types/calculator';
import { validateParams } from './validation';

type Coefficients = Record<string, number>;

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const ceilingSteps = (value: number, threshold: number, step: number) =>
  value > threshold ? Math.ceil((value - threshold) / step) : 0;

function tableValue(
  rows: ReadonlyArray<{ max?: number; above?: number; coef: number; step?: number }>,
  value: number,
): number {
  for (const row of rows) {
    if (row.max !== undefined && value <= row.max) return row.coef;
    if (row.above !== undefined && value > row.above) {
      return row.step
        ? row.coef * Math.max(1, Math.ceil((value - row.above) / row.step))
        : row.coef;
    }
  }
  return 0;
}

function systemData(system: SystemType, model: CalculatorCoefficientModel) {
  return model.systems[system];
}

function baseCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const data = systemData(params.system, model);
  const base = data.base_coef[params.roof_type as keyof typeof data.base_coef] ?? 0;
  if (!('multi_span' in data) || params.span_widths_m.length === 1) return base;
  const multiSpan = data.multi_span[params.roof_type as keyof typeof data.multi_span];
  if (!multiSpan) return base;
  return multiSpan.first_span + (params.span_widths_m.length - 1) * multiSpan.additional_span;
}

function spanCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const spanTable = systemData(params.system, model).span;
  const isMultiSpanSystem = !['Спринт-М', 'Спринт-2М', 'Крон'].includes(params.system);
  const rows = spanTable[
    (isMultiSpanSystem ? 'two_slope' : params.roof_type) as keyof CalculatorCoefficientModel['systems'][SystemType]['span']
  ] as ReadonlyArray<{ max?: number; above?: number; coef: number; new_span_coef?: number; step?: number }> | undefined ??
    spanTable.two_slope as ReadonlyArray<{ max?: number; above?: number; coef: number; new_span_coef?: number; step?: number }>;

  const seenWidths = new Set<number>();
  const total = params.span_widths_m.reduce((sum, span) => {
    const bracket = rows.find((row) => (row.max !== undefined ? span <= row.max : row.above !== undefined && span > row.above));
    if (!bracket) return sum;
    const over = bracket.above === undefined
      ? bracket.coef
      : bracket.coef * Math.max(1, Math.ceil((span - bracket.above) / (bracket.step ?? 1)));
    const isDifferentWidth = seenWidths.size > 0 && !seenWidths.has(span);
    seenWidths.add(span);
    return sum + over + (isDifferentWidth ? bracket.new_span_coef ?? 0 : 0);
  }, 0);
  if (!isMultiSpanSystem || params.span_widths_m.length === 1 || seenWidths.size > 1) return total;

  const repeatedSpan = params.span_widths_m[0];
  const repeatedBracket = rows.find((row) => (
    row.max !== undefined ? repeatedSpan <= row.max : row.above !== undefined && repeatedSpan > row.above
  ));
  return total + (repeatedBracket?.new_span_coef ?? 0);
}

function heightCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const data = systemData(params.system, model);
  const rows = data.height[params.roof_type as keyof typeof data.height] ??
    data.height.two_slope;
  const isMultiSpanSystem = !['Спринт-М', 'Спринт-2М', 'Крон'].includes(params.system);
  if (!isMultiSpanSystem || params.span_widths_m.length === 1) return tableValue(rows, params.height_m);

  const extraSpans = params.span_widths_m.length - 1;
  const height = params.height_m;
  if (params.roof_type === 'one_slope') {
    const extra = 0.15 * extraSpans ** 2;
    if (height <= 4) return -0.15 + extra;
    if (height <= 6) return 0.4 + extra;
    if (height <= 8) return 0.65 + extra;
    if (height <= 10) return 1.3 + extra;
    return 0.45 + extra + 0.45 * Math.ceil((height - 10) / 3);
  }

  const extra = 0.1 * extraSpans ** 2;
  if (height <= 6) return -0.1 + extra;
  if (height <= 7) return 0.4 + extra;
  if (height <= 9) return 0.8 + extra;
  if (height <= 12) return 1.45 + extra;
  return 0.45 + extra + 0.75 * Math.ceil((height - 12) / 3);
}

function lengthAndStepCoefficient(params: CalculatorParams): number {
  const averageStep = params.frame_steps_m.reduce((sum, step) => sum + step, 0) / params.frame_steps_m.length;
  const frameBays = Math.max(1, Math.ceil(params.building_length_m / averageStep));
  const hasCrane = params.support_crane.enabled || params.suspension_crane.enabled;
  const systemIsSprint = ['Спринт-М', 'Спринт-2М', 'Крон'].includes(params.system);
  const perBay = systemIsSprint ? 0.035 : hasCrane ? 0.07 : 0.05 + 0.02 * (params.span_widths_m.length - 1);
  const length = Math.max(0, frameBays - 5) * perBay;
  return length + (params.frame_step_mode === 'different' ? 0.2 : 0);
}

function additionsCoefficients(
  params: CalculatorParams,
  model: CalculatorCoefficientModel,
): Coefficients {
  const averageStep = params.frame_steps_m.reduce((sum, step) => sum + step, 0) / params.frame_steps_m.length;
  const frameBays = Math.max(1, Math.ceil(params.building_length_m / averageStep));
  const floor = params.floor.enabled
    ? 0.75 * params.floor.spans_m.length +
      0.04 * Math.max(0, frameBays - 6) +
      (params.floor.load_mode === 'different' ? 0.5 * Math.max(0, params.floor.storeys - 1) : 0)
    : 0;
  const mezzanines = params.mezzanines.reduce((sum, item) => {
    if (!item.enabled) return sum;
    return sum + 0.55 +
      (item.load_mode === 'different' ? 0.5 * Math.max(0, item.storeys - 1) : 0);
  }, 0);
  const subtruss = params.has_subtruss && params.system === 'Великан'
    ? 0.5 * Math.max(1, params.span_widths_m.length - 1)
    : 0;

  const selectedSystem = systemData(params.system, model) as ReturnType<typeof systemData> & {
    crane?: Record<string, number>;
  };
  const craneData = selectedSystem.crane;
  const crane = (kind: 'support' | 'suspension') => {
    const selected = kind === 'support' ? params.support_crane : params.suspension_crane;
    if (!selected.enabled || !craneData) return 0;
    const prefix = kind === 'support' ? 'support' : 'suspension';
    const single = kind === 'support'
      ? params.roof_type === 'one_slope' ? 0.9 : 0.75
      : params.roof_type === 'one_slope' ? 0.7 : 0.6;
    const perSpan = craneData[`${prefix}_per_span` as keyof typeof craneData] ?? 0;
    const different = craneData[`${prefix}_diff_capacity` as keyof typeof craneData] ?? 0;
    return Number(single) + Math.max(0, selected.spans_count - 1) * Number(perSpan) +
      (selected.capacity_mode === 'different' && selected.spans_count > 1 ? Number(different) : 0);
  };

  const stairTables = model.additional_elements.stairs;
  const concreteValues = Object.values(stairTables.concrete_steps);
  const metalValues = Object.values(stairTables.metal_steps);
  const stairs =
    params.stairs.concrete.reduce((sum, count, index) => sum + count * concreteValues[index], 0) +
    params.stairs.metal.reduce((sum, count, index) => sum + count * metalValues[index], 0);

  return {
    floor,
    mezzanines,
    subtruss,
    support_crane: crane('support'),
    suspension_crane: crane('suspension'),
    stairs,
  };
}

function roofCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const accessories =
    (params.has_snow_retention ? 0.04 : 0) +
    (params.has_roof_railing ? 0.04 : 0);
  if (params.roof_cladding === 'sandwich') return 0.05 + accessories;
  if (params.roof_cladding === 'sandwich_layer') return accessories;
  if (params.roof_cladding === 'pvc') return 0.05 + accessories;

  const totalWidth = params.span_widths_m.reduce((sum, value) => sum + value, 0);
  const roofArea = totalWidth * params.building_length_m;
  const slopeKey = params.roof_type === 'one_slope' ? 'one_slope' : 'two_slope';
  const key = `${slopeKey}_profile` as keyof CalculatorCoefficientModel['additional_elements']['roof_cladding'];
  const table = model.additional_elements.roof_cladding[key];
  let coefficient = table ? tableValue(table.span_ranges, totalWidth) : 0;
  if (table && roofArea > table.area_over_400.threshold) {
    coefficient += ceilingSteps(roofArea, table.area_over_400.threshold, table.area_over_400.step) *
      table.area_over_400.coef_per_step;
  }
  return coefficient + accessories;
}

function wallAndOpeningCoefficients(
  params: CalculatorParams,
  model: CalculatorCoefficientModel,
): Coefficients {
  if (params.walls.cladding === 'none') {
    return { walls: 0, wall_openings: 0 };
  }

  const width = params.span_widths_m.reduce((sum, value) => sum + value, 0);
  const heightOffset = params.system === 'Спринт-М' || params.system === 'Атлант' ? 0.5 : 1.5;
  const slopeRatio = params.system === 'Спринт-М' ? 0.27 : 0.1;
  const wallHeight = params.height_m + heightOffset;
  const gableArea = params.roof_type === 'one_slope'
    ? 2 * wallHeight * width + slopeRatio * width ** 2
    : params.roof_type === 'two_slope'
      ? 2 * wallHeight * width + 0.5 * slopeRatio * width ** 2
      : params.roof_type === 'multi_slope'
        ? params.span_widths_m.reduce(
          (sum, span) => sum + 2 * wallHeight * span + 0.5 * slopeRatio * span ** 2,
          0,
        )
        : 2 * wallHeight * width;
  const wallArea = gableArea + 2 * wallHeight * params.building_length_m;
  const areaSteps = ceilingSteps(wallArea, 300, 10);
  const wallsData = model.additional_elements.walls.types;
  let base: number;
  let perStep: number;

  if (params.walls.cladding === 'profile') {
    const profile = params.fire_resistance === 'v' ? wallsData.profile_V : wallsData.profile_II_III_IV;
    base = profile.base;
    perStep = profile.over_300;
  } else if (params.walls.cladding === 'sandwich') {
    base = params.seismic >= 7 ? 0.5 : wallsData.sandwich_horizontal.base;
    perStep = params.seismic >= 7 ? 0.0045 : 0.001;
  } else {
    const lookup = params.walls.thickness_mm <= 110
      ? wallsData.sandwich_layer_100
      : params.walls.thickness_mm === 150
        ? wallsData.sandwich_layer_150
        : wallsData.sandwich_layer_200_250;
    base = lookup.base;
    perStep = lookup.over_300;
  }

  const openingCoefficient = (opening: CalculatorParams['walls']['windows'], perUnit: number, perType: number) =>
    opening.enabled ? opening.count * perUnit + Math.max(0, opening.size_types - 1) * perType : 0;
  const wallOpenings =
    openingCoefficient(params.walls.windows, 0.02, 0.04) +
    openingCoefficient(params.walls.doors, 0.02, 0.04) +
    openingCoefficient(params.walls.gates, 0.05, 0.05);

  return { walls: base + areaSteps * perStep, wall_openings: wallOpenings };
}

function partitionsCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const data = model.additional_elements.partitions;
  const partitions = params.partitions.reduce((sum, partition) => {
    if (!partition.enabled) return sum;
    const item = data[partition.kind];
    return sum + item.base + ceilingSteps(partition.area_m2, 100, 30) * item.over_100;
  }, 0);
  const activeKinds = params.partitions.filter(({ enabled }) => enabled).map(({ kind }) => kind);
  const openingRate = activeKinds.length
    ? Math.max(...activeKinds.map((kind) => data.doors_windows[kind]))
    : 0;
  return partitions +
    (params.partition_openings.enabled ? params.partition_openings.count * openingRate : 0) +
    (params.partition_gates.enabled ? params.partition_gates.count * data.gates : 0);
}

function parapetCoefficient(params: CalculatorParams, model: CalculatorCoefficientModel): number {
  const data = model.additional_elements.parapet;
  let coefficient = 0;
  if (params.parapet.long_sides > 0) {
    const length = params.building_length_m * params.parapet.long_sides;
    const table = params.parapet.has_overhang ? data.long_with_overhang : data.long_without_overhang;
    coefficient += table.up_to_30m + ceilingSteps(length, 30, 6) * table.per_6m;
  }
  if (params.parapet.end_sides > 0) {
    const width = params.span_widths_m.reduce((sum, value) => sum + value, 0) * params.parapet.end_sides;
    coefficient += data.end.up_to_15m + ceilingSteps(width, 15, 3) * data.end.per_3m;
  }
  return coefficient;
}

function calculateArea(params: CalculatorParams): number {
  const width = params.span_widths_m.reduce((sum, value) => sum + value, 0);
  const footprint = width * params.building_length_m;
  const floor = params.floor.enabled
    ? params.floor.spans_m.reduce((sum, value) => sum + value, 0) * params.building_length_m * Math.max(1, params.floor.storeys - 1)
    : 0;
  const mezzanines = params.mezzanines.reduce(
    (sum, item) => sum + (item.enabled ? item.length_m * item.width_m * Math.max(1, item.storeys - 1) : 0),
    0,
  );
  return footprint + floor + mezzanines;
}

export function calculate(
  params: CalculatorParams,
  model: CalculatorCoefficientModel = CALCULATOR_COEFFICIENTS,
): CalculatorResult {
  const issues = validateParams(params);
  const basePrice = params.base_price_rub;
  const seismicCoefficient = params.seismic === 8 ? 0.2 : params.seismic === 9 ? 0.4 : 0;
  const coefficients: Coefficients = {
    frame: baseCoefficient(params, model) + spanCoefficient(params, model) + heightCoefficient(params, model) +
      lengthAndStepCoefficient(params) + seismicCoefficient,
    ...additionsCoefficients(params, model),
    roof: roofCoefficient(params, model),
    ...wallAndOpeningCoefficients(params, model),
    partitions: partitionsCoefficient(params, model),
    parapets: parapetCoefficient(params, model),
  };

  if (!params.project_sections.km) {
    Object.keys(coefficients).forEach((key) => { coefficients[key] = 0; });
  }
  if (params.project_sections.as) coefficients.architecture = 0.4 + 0.05 * params.span_widths_m.length;

  const totalCoefficient = Object.values(coefficients).reduce((sum, value) => sum + value, 0);
  const countryMultiplier = params.country === 'eurocode' ? 1.3 : 1;
  const seismicMultiplier = params.seismic >= 7 ? 1.05 : 1;
  const overheadMultiplier = 1 + params.overhead_rate / 100;
  const costRub = totalCoefficient * basePrice * countryMultiplier * seismicMultiplier * overheadMultiplier;
  const cost = costRub / 1000;
  const term = costRub / 180 / 1000 * 20;
  const area = calculateArea(params);
  const metalConsumption = systemData(params.system, model).metal_consumption_kg_m2;
  const totalWeight = area * metalConsumption / 1000;

  const labels: Record<string, string> = {
    frame: 'Каркас и геометрия',
    floor: 'Перекрытия',
    mezzanines: 'Антресоли',
    subtruss: 'Подстропильные фермы',
    support_crane: 'Опорные краны',
    suspension_crane: 'Подвесные краны',
    stairs: 'Лестницы',
    roof: 'Кровля',
    walls: 'Стены',
    wall_openings: 'Проёмы в стенах',
    partitions: 'Перегородки',
    parapets: 'Парапеты',
    architecture: 'Раздел АС',
  };
  const breakdown: CostBreakdownItem[] = Object.entries(coefficients)
    .filter(([, coefficient]) => coefficient > 0)
    .map(([id, coefficient]) => ({
      id,
      name: labels[id] ?? id,
      coefficient: round(coefficient, 4),
      value: Math.round(coefficient * basePrice * countryMultiplier * seismicMultiplier * overheadMultiplier),
      percentage: totalCoefficient > 0 ? round(coefficient / totalCoefficient * 100, 1) : 0,
    }));

  return {
    status: issues.some(({ severity }) => severity === 'error') ? 'invalid' : 'valid',
    cost: round(cost),
    term: round(term),
    area_m2: round(area),
    metal_consumption: metalConsumption,
    total_weight_tons: round(totalWeight),
    cost_per_ton: totalWeight > 0 ? round(cost / totalWeight) : 0,
    breakdown,
    issues,
    trace: {
      base_price_rub: basePrice,
      total_coefficient: round(totalCoefficient, 5),
      country_multiplier: countryMultiplier,
      seismic_multiplier: seismicMultiplier,
      overhead_multiplier: overheadMultiplier,
      coefficients,
    },
  };
}
