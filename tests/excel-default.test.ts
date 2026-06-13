import { expect, test } from 'vitest';
import resultFile from './fixtures/excel-default-result.json';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';

test('default UI state matches the unmodified Excel workbook', () => {
  const expected = resultFile.results[0];
  const actual = calculate(structuredClone(DEFAULT_PARAMS));
  expect(actual.cost).toBeCloseTo(expected.cost_thousand_rub, 4);
  expect(actual.term).toBeCloseTo(expected.term_days, 2);
  expect(actual.area_m2).toBeCloseTo(expected.area_m2, 4);
});
