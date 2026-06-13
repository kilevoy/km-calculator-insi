import type { CalculatorParams, RoofType, SystemType, ValidationIssue } from '../types/calculator';

const VALID_ROOFS: Record<SystemType, RoofType[]> = {
  'Спринт-М': ['one_slope', 'two_slope'],
  'Спринт-2М': ['one_slope', 'two_slope'],
  Великан: ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  Атлант: ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  'Атлант-М': ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  Крон: ['one_slope', 'two_slope'],
};

const issue = (
  code: string,
  field: string,
  message: string,
  severity: ValidationIssue['severity'] = 'error',
): ValidationIssue => ({ code, field, message, severity });

export function getMaximumSpan(system: SystemType, roof: RoofType): number {
  if (system === 'Спринт-М' || system === 'Спринт-2М') {
    return roof === 'one_slope' ? 12 : 24;
  }
  if (system === 'Крон') return 30;
  return 60;
}

export function validateParams(params: CalculatorParams): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const maximumSpan = getMaximumSpan(params.system, params.roof_type);

  if (!VALID_ROOFS[params.system].includes(params.roof_type)) {
    issues.push(issue('roof.unsupported', 'roof_type', `Система «${params.system}» не поддерживает выбранную кровлю.`));
  }
  if (!params.project_sections.km && !params.project_sections.as) {
    issues.push(issue('sections.empty', 'project_sections', 'Выберите хотя бы один раздел проектирования.'));
  }
  if (params.span_widths_m.length < 1 || params.span_widths_m.length > 5) {
    issues.push(issue('spans.count', 'span_widths_m', 'Excel-модель поддерживает от 1 до 5 пролётов.'));
  }
  params.span_widths_m.forEach((span, index) => {
    if (!Number.isFinite(span) || span <= 0 || span > maximumSpan) {
      issues.push(issue('span.range', `span_widths_m.${index}`, `Пролёт ${index + 1} должен быть больше 0 и не более ${maximumSpan} м.`));
    }
  });
  if (params.building_length_m <= 0 || params.building_length_m > 1000) {
    issues.push(issue('length.range', 'building_length_m', 'Длина здания должна быть от 0,1 до 1000 м.'));
  }
  if (params.height_m <= 0 || params.height_m > 60) {
    issues.push(issue('height.range', 'height_m', 'Высота должна быть от 0,1 до 60 м.'));
  }
  if (params.frame_steps_m.length < 1 || params.frame_steps_m.some((step) => step <= 0 || step > 24)) {
    issues.push(issue('steps.range', 'frame_steps_m', 'Шаги рам должны быть больше 0 и не более 24 м.'));
  }
  if (params.overhead_rate < -50 || params.overhead_rate > 150) {
    issues.push(issue('overhead.range', 'overhead_rate', 'Издержки должны быть в диапазоне от −50% до 150%.'));
  }
  if (params.has_subtruss && params.system !== 'Великан') {
    issues.push(issue('subtruss.system', 'has_subtruss', 'Подстропильные фермы предусмотрены Excel-моделью только для системы «Великан».'));
  }

  for (const [index, mezzanine] of params.mezzanines.entries()) {
    if (mezzanine.enabled && (mezzanine.length_m <= 0 || mezzanine.width_m <= 0 || mezzanine.storeys < 1)) {
      issues.push(issue('mezzanine.incomplete', `mezzanines.${index}`, `Заполните длину, ширину и этажность антресоли ${index + 1}.`));
    }
  }
  if (params.floor.enabled && (params.floor.spans_m.length < 1 || params.floor.storeys < 1)) {
    issues.push(issue('floor.incomplete', 'floor', 'Для перекрытия укажите хотя бы один пролёт и количество этажей.'));
  }

  const warnIfTypesExceedCount = (field: string, count: number, types: number) => {
    if (types > count && count >= 0) {
      issues.push(issue('openings.types', field, 'Количество типоразмеров не может превышать количество проёмов.', 'warning'));
    }
  };
  warnIfTypesExceedCount('walls.windows', params.walls.windows.count, params.walls.windows.size_types);
  warnIfTypesExceedCount('walls.gates', params.walls.gates.count, params.walls.gates.size_types);
  warnIfTypesExceedCount('walls.doors', params.walls.doors.count, params.walls.doors.size_types);

  return issues;
}

export function isValid(params: CalculatorParams): boolean {
  return !validateParams(params).some(({ severity }) => severity === 'error');
}
