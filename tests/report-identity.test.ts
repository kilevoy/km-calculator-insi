import { describe, expect, test } from 'vitest';
import {
  createCalculationNumber,
  createReportFilename,
} from '../src/utils/report-identity';

describe('commercial proposal identity', () => {
  test('creates a unique, readable calculation number', () => {
    const date = new Date(2026, 5, 14, 9, 8, 7);

    expect(createCalculationNumber(date, 0)).toBe('KM-20260614-090807-0000');
    expect(createCalculationNumber(date, 0.5)).toMatch(
      /^KM-20260614-090807-[0-9A-Z]{4}$/,
    );
  });

  test('uses project, system, area and calculation number in a safe filename', () => {
    expect(createReportFilename({
      calculationNumber: 'KM-20260614-090807-AB12',
      projectName: 'Склад: Север / очередь 1',
      system: 'Атлант-М',
      areaM2: 291.6,
    })).toBe(
      'КМ_Склад_Север_очередь_1_Атлант-М_291,6м2_KM-20260614-090807-AB12.pdf',
    );
  });
});
