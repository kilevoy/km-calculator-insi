import type { CalculatorCoefficientModel } from '../data/coefficients';

export type KMModelStatus = 'draft' | 'review' | 'approved';
export type KMModelSection =
  | 'systems'
  | 'global_modifiers'
  | 'additional_elements'
  | 'geometry_rules';

export interface KMModelDocument {
  schemaVersion: 1;
  name: string;
  revision: string;
  status: KMModelStatus;
  owner: string;
  reason: string;
  updatedAt: string;
  coefficients: CalculatorCoefficientModel;
}

export interface KMNumericCoefficient {
  path: string;
  section: KMModelSection | 'meta';
  label: string;
  value: number;
  referenceValue: number;
  changed: boolean;
}

export interface KMModelDiff {
  path: string;
  label: string;
  before: number;
  after: number;
  deltaPercent: number | null;
}
