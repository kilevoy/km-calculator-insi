export type ASFieldType = 'number' | 'select' | 'boolean';
export type ASCoefficientMode = 'fixed' | 'per_unit' | 'range';

export interface ASOption {
  id: string;
  label: string;
  multiplier: number;
}

export interface ASInputField {
  id: string;
  label: string;
  description: string;
  type: ASFieldType;
  unit: string;
  required: boolean;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: ASOption[];
}

export interface ASWorkPackage {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  baseHours: number;
  coefficientMode: ASCoefficientMode;
  driverFieldId?: string;
  unitSize?: number;
  hoursPerUnit?: number;
  complexityMultiplier: number;
}

export interface ASCalibrationProject {
  id: string;
  name: string;
  buildingType: string;
  areaM2: number;
  storeys: number;
  actualHours: number;
  actualPriceRub: number;
  notes: string;
}

export interface ASModel {
  version: 1;
  name: string;
  status: 'draft' | 'review' | 'approved';
  owner: string;
  updatedAt: string;
  baseHourlyRateRub: number;
  overheadPercent: number;
  riskReservePercent: number;
  minimumPriceRub: number;
  roundingStepRub: number;
  inputFields: ASInputField[];
  workPackages: ASWorkPackage[];
  calibrationProjects: ASCalibrationProject[];
  notes: string;
}

export interface ASModelEstimate {
  hours: number;
  priceRub: number;
  enabledPackages: number;
  calibrationAverageRateRub: number | null;
}
