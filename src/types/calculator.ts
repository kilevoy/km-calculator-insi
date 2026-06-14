export const SYSTEMS = ['Спринт-М', 'Спринт-2М', 'Великан', 'Атлант', 'Атлант-М', 'Крон'] as const;
export type SystemType = (typeof SYSTEMS)[number];

export const ROOF_TYPES = ['one_slope', 'two_slope', 'flat', 'multi_slope'] as const;
export type RoofType = (typeof ROOF_TYPES)[number];

export type CountryStandard = 'snip' | 'eurocode';
export type FireResistance = 'below_v' | 'v';
export type ProjectSection = 'km' | 'as';
export type LoadMode = 'same' | 'different';
export type FrameStepMode = 'same' | 'different';
export type RoofCladding = 'profile' | 'pvc' | 'sandwich_layer' | 'sandwich';
export type WallCladding = 'none' | 'profile' | 'sandwich_layer' | 'sandwich';
export type WallOrientation = 'horizontal' | 'vertical';
export type PartitionKind = 'gvl' | 'sandwich_layer' | 'sandwich';
export type ParapetSides = 0 | 1 | 2;

export interface FloorParams {
  enabled: boolean;
  spans_m: number[];
  storeys: number;
  load_mode: LoadMode;
}

export interface MezzanineParams {
  enabled: boolean;
  length_m: number;
  width_m: number;
  storeys: number;
  load_mode: LoadMode;
}

export interface CraneParams {
  enabled: boolean;
  spans_count: number;
  capacity_mode: LoadMode;
}

export interface StairCounts {
  concrete: [number, number, number, number];
  metal: [number, number, number, number];
}

export interface OpeningParams {
  enabled: boolean;
  count: number;
  size_types: number;
}

export interface WallParams {
  cladding: WallCladding;
  thickness_mm: 100 | 110 | 150 | 200 | 250;
  orientation: WallOrientation;
  windows: OpeningParams;
  gates: OpeningParams;
  doors: OpeningParams;
}

export interface PartitionParams {
  kind: PartitionKind;
  enabled: boolean;
  area_m2: number;
}

export interface ParapetParams {
  long_sides: ParapetSides;
  end_sides: ParapetSides;
  has_overhang: boolean;
}

export interface CalculatorParams {
  model_version: 2;
  system: SystemType;
  roof_type: RoofType;
  country: CountryStandard;
  seismic: 6 | 7 | 8 | 9;
  fire_resistance: FireResistance;
  project_sections: Record<ProjectSection, boolean>;
  base_price_rub: number;
  overhead_rate: number;

  span_widths_m: number[];
  building_length_m: number;
  frame_step_mode: FrameStepMode;
  frame_steps_m: number[];
  height_m: number;

  has_subtruss: boolean;
  floor: FloorParams;
  mezzanines: [MezzanineParams, MezzanineParams, MezzanineParams];
  support_crane: CraneParams;
  suspension_crane: CraneParams;
  stairs: StairCounts;

  roof_cladding: RoofCladding;
  has_snow_retention: boolean;
  has_roof_railing: boolean;
  has_drainage: boolean;
  parapet: ParapetParams;
  walls: WallParams;
  partitions: [PartitionParams, PartitionParams, PartitionParams];
  partition_openings: OpeningParams;
  partition_gates: OpeningParams;

  manager?: string;
  client?: string;
  project_name?: string;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  code: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
}

export interface CostBreakdownItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  coefficient: number;
}

export interface CalculationTrace {
  base_price_rub: number;
  total_coefficient: number;
  country_multiplier: number;
  seismic_multiplier: number;
  overhead_multiplier: number;
  coefficients: Record<string, number>;
}

export interface CalculatorResult {
  status: 'valid' | 'invalid';
  cost: number;
  term: number;
  area_m2: number;
  metal_consumption: number;
  total_weight_tons: number;
  cost_per_ton: number;
  breakdown: CostBreakdownItem[];
  issues: ValidationIssue[];
  trace: CalculationTrace;
}
