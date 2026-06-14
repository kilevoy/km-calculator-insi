import { describe, expect, test } from 'vitest';
import { DEFAULT_AS_MODEL } from '../src/data/as-model-defaults';
import {
  calculateASPackageHours,
  defaultASPreviewValues,
  estimateASModel,
  validateASModel,
} from '../src/logic/as-model';

describe('AS model constructor', () => {
  test('calculates fixed, per-unit and range packages', () => {
    const values = defaultASPreviewValues(DEFAULT_AS_MODEL.inputFields);
    const fixed = DEFAULT_AS_MODEL.workPackages.find(({ id }) => id === 'general_data')!;
    const perUnit = DEFAULT_AS_MODEL.workPackages.find(({ id }) => id === 'plans')!;
    const range = DEFAULT_AS_MODEL.workPackages.find(({ id }) => id === 'facades_sections')!;

    expect(calculateASPackageHours(fixed, values)).toBe(16);
    expect(calculateASPackageHours(perUnit, values)).toBe(42);
    expect(calculateASPackageHours(range, values)).toBe(46);
  });

  test('applies select multiplier, markups, minimum price and rounding', () => {
    const model = structuredClone(DEFAULT_AS_MODEL);
    const values = defaultASPreviewValues(model.inputFields);
    values.building_purpose = 'administrative';
    const estimate = estimateASModel(model, values);

    expect(estimate.hours).toBeGreaterThan(0);
    expect(estimate.priceRub).toBeGreaterThanOrEqual(model.minimumPriceRub);
    expect(estimate.priceRub % model.roundingStepRub).toBe(0);
    expect(estimate.enabledPackages).toBe(
      model.workPackages.filter(({ enabled }) => enabled).length,
    );
  });

  test('calculates actual average hourly rate from calibration projects', () => {
    const model = structuredClone(DEFAULT_AS_MODEL);
    model.calibrationProjects = [
      {
        id: 'one',
        name: 'Объект 1',
        buildingType: 'Склад',
        areaM2: 1_000,
        storeys: 1,
        actualHours: 100,
        actualPriceRub: 250_000,
        notes: '',
      },
      {
        id: 'two',
        name: 'Объект 2',
        buildingType: 'Производство',
        areaM2: 2_000,
        storeys: 1,
        actualHours: 200,
        actualPriceRub: 600_000,
        notes: '',
      },
    ];

    expect(
      estimateASModel(model, defaultASPreviewValues(model.inputFields))
        .calibrationAverageRateRub,
    ).toBe(2_750);
  });

  test('reports broken driver links', () => {
    const model = structuredClone(DEFAULT_AS_MODEL);
    model.workPackages[1].driverFieldId = 'missing_field';

    expect(validateASModel(model)).toContain(
      'Для работы «Планы этажей» не выбрано исходное поле.',
    );
  });
});
