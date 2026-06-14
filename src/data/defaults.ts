import type { CalculatorParams, MezzanineParams, OpeningParams, PartitionParams } from '../types/calculator';
import { CALCULATOR_COEFFICIENTS } from './coefficients';

const emptyOpening = (): OpeningParams => ({ enabled: false, count: 0, size_types: 0 });
const emptyMezzanine = (): MezzanineParams => ({
  enabled: false,
  length_m: 0,
  width_m: 0,
  storeys: 1,
  load_mode: 'same',
});
const emptyPartition = (kind: PartitionParams['kind']): PartitionParams => ({
  kind,
  enabled: false,
  area_m2: 0,
});

export const DEFAULT_PARAMS: CalculatorParams = {
  model_version: 2,
  system: 'Атлант',
  roof_type: 'two_slope',
  country: 'snip',
  seismic: 6,
  fire_resistance: 'below_v',
  project_sections: { km: true, as: false },
  base_price_rub: CALCULATOR_COEFFICIENTS._meta.base_price_rub,
  overhead_rate: 0,

  span_widths_m: [12],
  building_length_m: 24.3,
  frame_step_mode: 'same',
  frame_steps_m: [6.075],
  height_m: 3.15,

  has_subtruss: false,
  floor: { enabled: false, spans_m: [], storeys: 1, load_mode: 'same' },
  mezzanines: [emptyMezzanine(), emptyMezzanine(), emptyMezzanine()],
  support_crane: { enabled: false, spans_count: 0, capacity_mode: 'same' },
  suspension_crane: { enabled: false, spans_count: 0, capacity_mode: 'same' },
  stairs: { concrete: [0, 0, 0, 0], metal: [0, 0, 0, 0] },

  roof_cladding: 'sandwich',
  has_snow_retention: false,
  has_roof_railing: false,
  has_drainage: false,
  parapet: { long_sides: 0, end_sides: 0, has_overhang: false },
  walls: {
    cladding: 'sandwich',
    thickness_mm: 150,
    orientation: 'horizontal',
    windows: { enabled: true, count: 13, size_types: 3 },
    gates: emptyOpening(),
    doors: { enabled: true, count: 3, size_types: 2 },
  },
  partitions: [
    emptyPartition('gvl'),
    emptyPartition('sandwich_layer'),
    emptyPartition('sandwich'),
  ],
  partition_openings: emptyOpening(),
  partition_gates: emptyOpening(),
  manager: '',
  client: '',
  project_name: '',
};
