import { readFileSync } from 'node:fs';
import { HyperFormula, DetailedCellError } from 'hyperformula';

const source = readFileSync(new URL('../src/domain/workbook.generated.ts', import.meta.url), 'utf8');
const start = source.indexOf('export const workbookSnapshot = ') + 'export const workbookSnapshot = '.length;
const end = source.lastIndexOf(' as const satisfies WorkbookSnapshot;');
const snapshot = JSON.parse(source.slice(start, end));

const hf = HyperFormula.buildFromSheets(
  Object.fromEntries(Object.entries(snapshot.sheets).map(([name, rows]) => [name, rows.map((row) => [...row])])),
  {
    licenseKey: 'gpl-v3',
    useArrayArithmetic: true,
    evaluateNullToZero: true,
  },
);

const sheet = hf.getSheetId('Сроки и стоимость');
if (sheet === undefined) {
  throw new Error('Main sheet was not loaded');
}

const z9 = hf.getCellValue({ sheet, col: 25, row: 8 });
const z10 = hf.getCellValue({ sheet, col: 25, row: 9 });

if (snapshot.formulaCount < 2500) {
  throw new Error(`Unexpectedly low formula count: ${snapshot.formulaCount}`);
}

if (z9 === null || z10 === null) {
  throw new Error(`Smoke calculation returned empty totals: Z9=${z9}, Z10=${z10}`);
}

if (z9 instanceof DetailedCellError || z10 instanceof DetailedCellError) {
  throw new Error(`Smoke calculation returned formula errors: Z9=${z9.value}, Z10=${z10.value}`);
}

console.log(`Smoke OK: ${snapshot.formulaCount} formulas, Z9=${z9}, Z10=${z10}`);
