export type WorkbookCell = string | number | boolean | null;

export type WorkbookSheet = readonly (readonly WorkbookCell[])[];

export interface WorkbookSnapshot {
  readonly sourceFile: string;
  readonly generatedAt: string;
  readonly sheets: Record<string, WorkbookSheet>;
  readonly dimensions: Record<string, { rows: number; columns: number; formulas: number }>;
  readonly formulaCount: number;
}

export interface CellAddress {
  sheet: number;
  col: number;
  row: number;
}
