import { HyperFormula, DetailedCellError } from 'hyperformula';
import { workbookSnapshot } from './workbook.generated';
import { inputSpecs, type InputValues } from './inputs';
import type { CellAddress, WorkbookCell } from './workbookTypes';

const MAIN_SHEET = 'Сроки и стоимость';
const RESULT_ROWS = [
  { row: 15, label: 'Спринт-М', metalCell: 'V15', priceCell: 'Z15' },
  { row: 16, label: 'Спринт-2М', metalCell: 'V16', priceCell: 'Z16' },
  { row: 17, label: 'Великан', metalCell: 'V17', priceCell: 'Z17' },
  { row: 18, label: 'Атлант', metalCell: 'V18', priceCell: 'Z18' },
  { row: 19, label: 'Атлант-М', metalCell: 'V19', priceCell: 'Z19' },
  { row: 20, label: 'Крон', metalCell: 'V20', priceCell: 'Z20' },
];

const VARIANT_COLUMNS_KM = ['AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ', 'BA', 'BB', 'BC', 'BD', 'BE', 'BF'];
const VARIANT_COLUMNS_AS = ['BL', 'BM', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BS', 'BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CB', 'CC'];

export interface ConstructiveResult {
  label: string;
  metalIntensity: OutputValue;
  pricePerTon: OutputValue;
}

export interface VariantResult {
  section: 'КМ' | 'АС';
  name: string;
  price: OutputValue;
  days: OutputValue;
}

export interface CalculationResult {
  totalPrice: OutputValue;
  totalDays: OutputValue;
  area: OutputValue;
  constructives: ConstructiveResult[];
  variants: VariantResult[];
  warnings: string[];
}

type OutputValue = number | string | boolean | null;

export function defaultInputValues(): InputValues {
  const hf = createFormulaEngine();
  const values: InputValues = {};

  for (const spec of inputSpecs) {
    const value = readCell(hf, spec.cell);
    if (spec.id === 'overhead' && typeof value === 'number') {
      values[spec.id] = value * 100;
    } else {
      values[spec.id] = normalizeCellValue(value);
    }
  }

  return values;
}

export function calculate(values: InputValues): CalculationResult {
  const hf = createFormulaEngine();
  const warnings: string[] = [];

  for (const spec of inputSpecs) {
    const raw = values[spec.id];
    const value = spec.id === 'overhead' && typeof raw === 'number' ? raw / 100 : raw;
    writeCell(hf, spec.cell, value);
  }

  const variants = [
    ...readVariantColumns(hf, 'КМ', VARIANT_COLUMNS_KM),
    ...readVariantColumns(hf, 'АС', VARIANT_COLUMNS_AS),
  ].filter((variant) => asNumber(variant.price) > 0 || asNumber(variant.days) > 0);

  const result: CalculationResult = {
    totalPrice: normalizeCellValue(readCell(hf, 'Z9')),
    totalDays: normalizeCellValue(readCell(hf, 'Z10')),
    area: normalizeCellValue(readCell(hf, 'AM3')),
    constructives: RESULT_ROWS.map((row) => ({
      label: row.label,
      metalIntensity: normalizeCellValue(readCell(hf, row.metalCell)),
      pricePerTon: normalizeCellValue(readCell(hf, row.priceCell)),
    })),
    variants: variants.sort((a, b) => asNumber(b.price) - asNumber(a.price)),
    warnings,
  };

  if (isErrorLike(result.totalPrice)) {
    warnings.push('Итоговая стоимость вернула ошибку формулы. Проверьте обязательные габариты и включённые опции.');
  }

  return result;
}

function createFormulaEngine(): HyperFormula {
  const sheets = Object.fromEntries(
    Object.entries(workbookSnapshot.sheets).map(([name, rows]) => [
      name,
      rows.map((row) => [...row]),
    ]),
  );

  return HyperFormula.buildFromSheets(sheets, {
    licenseKey: 'gpl-v3',
    useArrayArithmetic: true,
    evaluateNullToZero: true,
  });
}

function readVariantColumns(hf: HyperFormula, section: 'КМ' | 'АС', columns: string[]): VariantResult[] {
  return columns.map((column) => ({
    section,
    name: String(normalizeCellValue(readCell(hf, `${column}3`)) ?? column),
    price: normalizeCellValue(readCell(hf, `${column}79`)),
    days: normalizeCellValue(readCell(hf, `${column}80`)),
  }));
}

function readCell(hf: HyperFormula, ref: string): WorkbookCell | DetailedCellError {
  return hf.getCellValue(toAddress(hf, ref)) as WorkbookCell | DetailedCellError;
}

function writeCell(hf: HyperFormula, ref: string, value: unknown): void {
  const normalized = value === '' || value === undefined ? null : value;
  hf.setCellContents(toAddress(hf, ref), [[normalized as WorkbookCell]]);
}

function toAddress(hf: HyperFormula, ref: string): CellAddress {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) {
    throw new Error(`Unsupported cell reference: ${ref}`);
  }
  const sheet = hf.getSheetId(MAIN_SHEET);
  if (sheet === undefined) {
    throw new Error(`Missing sheet: ${MAIN_SHEET}`);
  }

  return {
    sheet,
    col: columnToIndex(match[1]),
    row: Number(match[2]) - 1,
  };
}

function columnToIndex(column: string): number {
  let index = 0;
  for (const char of column) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}

function normalizeCellValue(value: WorkbookCell | DetailedCellError): OutputValue {
  if (value instanceof DetailedCellError) {
    return value.value;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function isErrorLike(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('#');
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
