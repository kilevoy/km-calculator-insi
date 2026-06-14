import type {
  ASInputField,
  ASModel,
  ASModelEstimate,
  ASWorkPackage,
} from '../types/as-model';

export type ASPreviewValues = Record<string, number | string | boolean>;

export function defaultASPreviewValues(fields: ASInputField[]): ASPreviewValues {
  return Object.fromEntries(fields.map((field) => [field.id, field.defaultValue]));
}

function numericValue(value: number | string | boolean | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fieldMultiplier(field: ASInputField, value: number | string | boolean | undefined): number {
  if (field.type === 'select') {
    return field.options?.find((option) => option.id === value)?.multiplier ?? 1;
  }
  return 1;
}

export function calculateASPackageHours(
  workPackage: ASWorkPackage,
  values: ASPreviewValues,
): number {
  if (!workPackage.enabled) return 0;
  const driverValue = numericValue(
    workPackage.driverFieldId ? values[workPackage.driverFieldId] : 0,
  );
  const unitSize = Math.max(workPackage.unitSize ?? 1, Number.EPSILON);
  const hoursPerUnit = Math.max(workPackage.hoursPerUnit ?? 0, 0);
  let variableHours = 0;

  if (workPackage.coefficientMode === 'per_unit') {
    variableHours = driverValue / unitSize * hoursPerUnit;
  }
  if (workPackage.coefficientMode === 'range') {
    variableHours = Math.ceil(driverValue / unitSize) * hoursPerUnit;
  }

  return Math.max(
    0,
    (workPackage.baseHours + variableHours) * workPackage.complexityMultiplier,
  );
}

export function estimateASModel(
  model: ASModel,
  values: ASPreviewValues,
): ASModelEstimate {
  const packageHours = model.workPackages.reduce(
    (sum, workPackage) => sum + calculateASPackageHours(workPackage, values),
    0,
  );
  const globalMultiplier = model.inputFields.reduce(
    (product, field) => product * fieldMultiplier(field, values[field.id]),
    1,
  );
  const hours = packageHours * globalMultiplier;
  const markupMultiplier =
    1 + model.overheadPercent / 100 + model.riskReservePercent / 100;
  const rawPrice = Math.max(
    model.minimumPriceRub,
    hours * model.baseHourlyRateRub * markupMultiplier,
  );
  const roundingStep = Math.max(model.roundingStepRub, 1);
  const priceRub = Math.ceil(rawPrice / roundingStep) * roundingStep;
  const completedProjects = model.calibrationProjects.filter(
    ({ actualHours, actualPriceRub }) => actualHours > 0 && actualPriceRub > 0,
  );
  const calibrationAverageRateRub = completedProjects.length
    ? completedProjects.reduce(
      (sum, project) => sum + project.actualPriceRub / project.actualHours,
      0,
    ) / completedProjects.length
    : null;

  return {
    hours: Math.round(hours * 10) / 10,
    priceRub,
    enabledPackages: model.workPackages.filter(({ enabled }) => enabled).length,
    calibrationAverageRateRub,
  };
}

export function validateASModel(model: ASModel): string[] {
  const issues: string[] = [];
  if (!model.name.trim()) issues.push('Укажите название методики.');
  if (model.baseHourlyRateRub <= 0) issues.push('Часовая ставка должна быть больше нуля.');
  if (!model.workPackages.some(({ enabled }) => enabled)) {
    issues.push('Включите хотя бы один состав работ.');
  }
  const fieldIds = new Set(model.inputFields.map(({ id }) => id));
  model.workPackages.forEach((workPackage) => {
    if (
      workPackage.coefficientMode !== 'fixed' &&
      (!workPackage.driverFieldId || !fieldIds.has(workPackage.driverFieldId))
    ) {
      issues.push(`Для работы «${workPackage.name}» не выбрано исходное поле.`);
    }
  });
  return issues;
}
