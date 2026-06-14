import {
  CALCULATOR_COEFFICIENTS,
  type CalculatorCoefficientModel,
} from '../data/coefficients';
import type {
  KMModelDiff,
  KMModelDocument,
  KMModelSection,
  KMNumericCoefficient,
} from '../types/km-model';

const PATH_LABELS: Record<string, string> = {
  systems: 'Системы',
  base_coef: 'Базовый коэффициент',
  span: 'Пролёт',
  height: 'Высота',
  multi_span: 'Многопролётность',
  first_span: 'Первый пролёт',
  additional_span: 'Дополнительный пролёт',
  metal_consumption_kg_m2: 'Металлоёмкость, кг/м²',
  crane: 'Краны',
  support_single_span: 'Опорный кран, один пролёт',
  support_per_span: 'Опорный кран, дополнительный пролёт',
  support_diff_capacity: 'Опорный кран, разная грузоподъёмность',
  suspension_single_span: 'Подвесной кран, один пролёт',
  suspension_per_span: 'Подвесной кран, дополнительный пролёт',
  suspension_diff_capacity: 'Подвесной кран, разная грузоподъёмность',
  global_modifiers: 'Глобальные множители',
  country: 'Страна',
  eurocode: 'Еврокод',
  seismic: 'Сейсмичность',
  global_multiplier: 'Общий множитель',
  additional_elements: 'Дополнительные элементы',
  roof_cladding: 'Кровля',
  walls: 'Стены',
  gates: 'Ворота',
  stairs: 'Лестницы',
  partitions: 'Перегородки',
  parapet: 'Парапеты',
  geometry_rules: 'Правила геометрии',
  length_steps: 'Длина и шаги рам',
  different_step: 'Разный шаг рам',
  width_steps: 'Ширина',
  two_slope: 'Двускатная',
  one_slope: 'Односкатная',
  flat: 'Плоская',
  multi_slope: 'Многоскатная',
  max: 'До значения',
  above: 'Свыше значения',
  coef: 'Коэффициент',
  step: 'Шаг',
  new_span_coef: 'Новый тип пролёта',
  base: 'Базовое значение',
  threshold: 'Порог',
  coef_per_step: 'Коэффициент за шаг',
  per_unit: 'За единицу',
  per_span: 'За пролёт',
  over_100: 'Свыше 100 м²',
  over_300: 'Свыше 300 м²',
  up_to_30m: 'До 30 м',
  up_to_15m: 'До 15 м',
  per_6m: 'За каждые 6 м',
  per_3m: 'За каждые 3 м',
  base_price_rub: 'Базовая цена, руб.',
};

const SECTION_KEYS = new Set<KMModelSection>([
  'systems',
  'global_modifiers',
  'additional_elements',
  'geometry_rules',
]);

const formatToken = (token: string) => {
  if (/^\d+$/.test(token)) return `Строка ${Number(token) + 1}`;
  return PATH_LABELS[token] ?? token.replaceAll('_', ' ');
};

export function coefficientLabel(path: string): string {
  return path.split('.').filter((token) => token !== '_meta').map(formatToken).join(' / ');
}

export function createDefaultKMModel(): KMModelDocument {
  return {
    schemaVersion: 1,
    name: 'Рабочая модель стоимости проектирования КМ',
    revision: 'R2.0.1-work',
    status: 'draft',
    owner: '',
    reason: '',
    updatedAt: new Date().toISOString(),
    coefficients: structuredClone(CALCULATOR_COEFFICIENTS) as CalculatorCoefficientModel,
  };
}

function numericLeaves(value: unknown, prefix = ''): Array<{ path: string; value: number }> {
  if (typeof value === 'number') return [{ path: prefix, value }];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) =>
    numericLeaves(child, prefix ? `${prefix}.${key}` : key),
  );
}

function sectionForPath(path: string): KMNumericCoefficient['section'] {
  const first = path.split('.')[0] as KMModelSection;
  return SECTION_KEYS.has(first) ? first : 'meta';
}

export function listKMNumericCoefficients(
  model: CalculatorCoefficientModel,
): KMNumericCoefficient[] {
  const reference = new Map(
    numericLeaves(CALCULATOR_COEFFICIENTS).map((entry) => [entry.path, entry.value]),
  );
  return numericLeaves(model).map(({ path, value }) => {
    const referenceValue = reference.get(path) ?? value;
    return {
      path,
      section: sectionForPath(path),
      label: coefficientLabel(path),
      value,
      referenceValue,
      changed: value !== referenceValue,
    };
  });
}

export function setKMCoefficient(
  model: CalculatorCoefficientModel,
  path: string,
  value: number,
): CalculatorCoefficientModel {
  const next = structuredClone(model);
  const tokens = path.split('.');
  let cursor: Record<string, unknown> | unknown[] = next as unknown as Record<string, unknown>;

  tokens.forEach((token, index) => {
    if (index === tokens.length - 1) {
      if (Array.isArray(cursor)) cursor[Number(token)] = value;
      else cursor[token] = value;
      return;
    }
    cursor = Array.isArray(cursor)
      ? cursor[Number(token)] as Record<string, unknown> | unknown[]
      : cursor[token] as Record<string, unknown> | unknown[];
  });

  return next;
}

export function diffKMModel(model: CalculatorCoefficientModel): KMModelDiff[] {
  return listKMNumericCoefficients(model)
    .filter(({ changed }) => changed)
    .map(({ path, label, value, referenceValue }) => ({
      path,
      label,
      before: referenceValue,
      after: value,
      deltaPercent: referenceValue === 0
        ? null
        : Math.round((value - referenceValue) / Math.abs(referenceValue) * 10_000) / 100,
    }));
}

export function validateKMModel(document: KMModelDocument): string[] {
  const issues: string[] = [];
  if (!document.name.trim()) issues.push('Укажите название модели.');
  if (!document.revision.trim()) issues.push('Укажите номер редакции.');
  if (document.coefficients._meta.base_price_rub <= 0) {
    issues.push('Базовая цена должна быть больше нуля.');
  }
  const invalid = listKMNumericCoefficients(document.coefficients)
    .filter(({ value }) => !Number.isFinite(value));
  if (invalid.length) issues.push(`Некорректных числовых значений: ${invalid.length}.`);
  return issues;
}
