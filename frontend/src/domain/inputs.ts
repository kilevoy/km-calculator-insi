export type InputKind = 'number' | 'boolean' | 'select';

export interface SelectOption {
  value: number | string;
  label: string;
}

export interface InputSpec {
  id: string;
  cell: string;
  label: string;
  group: string;
  kind: InputKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[];
  note?: string;
  visibleWhen?: Record<string, unknown>;
}

export const inputSpecs: InputSpec[] = [
  { id: 'overhead', cell: 'X2', label: 'Издержки', group: 'Экономика', kind: 'number', unit: '%', min: 0, max: 100, step: 1, note: 'Excel хранит поле как долю: 10% = 0.10.' },
  { id: 'basePrice', cell: 'AM4', label: 'Базовая стоимость', group: 'Экономика', kind: 'number', unit: 'руб.', min: 0, step: 1000 },
  { id: 'country', cell: 'AM5', label: 'Нормативная база', group: 'Проект', kind: 'select', options: [
    { value: 1, label: 'Базовая' },
    { value: 2, label: 'Еврокод' },
  ] },
  { id: 'seismicity', cell: 'AM6', label: 'Сейсмика', group: 'Проект', kind: 'select', options: [
    { value: 1, label: 'До 6 баллов' },
    { value: 2, label: '7 баллов' },
    { value: 3, label: '8 баллов' },
    { value: 4, label: '9 баллов' },
  ] },
  { id: 'buildingType', cell: 'AM7', label: 'Конструктив', group: 'Проект', kind: 'select', options: [
    { value: 1, label: 'Спринт-М' },
    { value: 2, label: 'Спринт-2М' },
    { value: 3, label: 'Великан' },
    { value: 4, label: 'Атлант' },
    { value: 5, label: 'Атлант-М' },
    { value: 6, label: 'Крон' },
  ] },
  { id: 'km', cell: 'AM8', label: 'КМ', group: 'Проектирование', kind: 'boolean' },
  { id: 'as', cell: 'AM9', label: 'АС', group: 'Проектирование', kind: 'boolean' },
  { id: 'roofType', cell: 'AM11', label: 'Тип кровли', group: 'Здание', kind: 'select', options: [
    { value: 1, label: 'Односкатная' },
    { value: 2, label: 'Двускатная' },
    { value: 3, label: 'Плоская' },
    { value: 4, label: 'Многоскатная' },
  ] },
  { id: 'spanCount', cell: 'D33', label: 'Количество пролётов', group: 'Габариты', kind: 'number', min: 1, max: 5, step: 1 },
  { id: 'span1', cell: 'B35', label: 'Пролёт 1', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'span2', cell: 'D35', label: 'Пролёт 2', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'span3', cell: 'F35', label: 'Пролёт 3', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'span4', cell: 'H35', label: 'Пролёт 4', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'span5', cell: 'J35', label: 'Пролёт 5', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'length', cell: 'B38', label: 'Длина здания', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'frameStep', cell: 'B40', label: 'Шаг рам', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'height', cell: 'F43', label: 'Высота здания', group: 'Габариты', kind: 'number', unit: 'м', min: 0, step: 0.1 },

  { id: 'differentFrameStep', cell: 'AM13', label: 'Разный шаг рам', group: 'Каркас', kind: 'select', options: [
    { value: 1, label: 'Нет' },
    { value: 2, label: 'Да' },
  ] },
  { id: 'subrafter', cell: 'AM10', label: 'Подстропильная ферма', group: 'Каркас', kind: 'boolean' },
  { id: 'supportCrane', cell: 'AM18', label: 'Опорный кран', group: 'Краны', kind: 'boolean' },
  { id: 'supportCraneCapacity', cell: 'AM19', label: 'Грузоподъёмность опорного крана', group: 'Краны', kind: 'select', options: [
    { value: 1, label: 'Одинаковая' },
    { value: 2, label: 'Разная' },
  ] },
  { id: 'supportCraneSpans', cell: 'F61', label: 'Пролётов с опорным краном', group: 'Краны', kind: 'number', min: 1, max: 5, step: 1 },
  { id: 'suspendedCrane', cell: 'AM20', label: 'Подвесной кран', group: 'Краны', kind: 'boolean' },
  { id: 'suspendedCraneCapacity', cell: 'AM21', label: 'Грузоподъёмность подвесного крана', group: 'Краны', kind: 'select', options: [
    { value: 1, label: 'Одинаковая' },
    { value: 2, label: 'Разная' },
  ] },
  { id: 'suspendedCraneSpans', cell: 'F66', label: 'Пролётов с подвесным краном', group: 'Краны', kind: 'number', min: 1, max: 5, step: 1 },

  { id: 'floorEnabled', cell: 'AM14', label: 'Перекрытие', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'floorSpan1', cell: 'B46', label: 'Перекрытие, пролёт 1', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'floorSpan2', cell: 'D46', label: 'Перекрытие, пролёт 2', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'floorSpan3', cell: 'F46', label: 'Перекрытие, пролёт 3', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'floorSpan4', cell: 'H46', label: 'Перекрытие, пролёт 4', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'floorSpan5', cell: 'J46', label: 'Перекрытие, пролёт 5', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'floorLevels', cell: 'L46', label: 'Этажей перекрытия', group: 'Перекрытия и антресоли', kind: 'number', min: 1, step: 1 },
  { id: 'floorMultiLevels', cell: 'AM65', label: 'Несколько этажей перекрытия', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine1', cell: 'AM15', label: 'Антресоль 1', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine1Length', cell: 'B50', label: 'Антресоль 1, длина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine1Width', cell: 'F50', label: 'Антресоль 1, ширина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine1Levels', cell: 'L50', label: 'Антресоль 1, этажей', group: 'Перекрытия и антресоли', kind: 'number', min: 1, step: 1 },
  { id: 'mezzanine1MultiLevels', cell: 'AM66', label: 'Несколько этажей антресоли 1', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine2', cell: 'AM16', label: 'Антресоль 2', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine2Length', cell: 'B54', label: 'Антресоль 2, длина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine2Width', cell: 'F54', label: 'Антресоль 2, ширина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine2Levels', cell: 'L54', label: 'Антресоль 2, этажей', group: 'Перекрытия и антресоли', kind: 'number', min: 1, step: 1 },
  { id: 'mezzanine2MultiLevels', cell: 'AM67', label: 'Несколько этажей антресоли 2', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine3', cell: 'AM17', label: 'Антресоль 3', group: 'Перекрытия и антресоли', kind: 'boolean' },
  { id: 'mezzanine3Length', cell: 'B58', label: 'Антресоль 3, длина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine3Width', cell: 'F58', label: 'Антресоль 3, ширина', group: 'Перекрытия и антресоли', kind: 'number', unit: 'м', min: 0, step: 0.1 },
  { id: 'mezzanine3Levels', cell: 'L58', label: 'Антресоль 3, этажей', group: 'Перекрытия и антресоли', kind: 'number', min: 1, step: 1 },
  { id: 'mezzanine3MultiLevels', cell: 'AM68', label: 'Несколько этажей антресоли 3', group: 'Перекрытия и антресоли', kind: 'boolean' },

  { id: 'roofEnvelope', cell: 'AM31', label: 'Ограждение кровли', group: 'Ограждающие конструкции', kind: 'select', options: [
    { value: 1, label: 'СП / профлист' },
    { value: 2, label: 'СП послойной сборки' },
    { value: 3, label: 'Профлист' },
    { value: 4, label: 'Прочее' },
  ] },
  { id: 'snowGuard', cell: 'AM33', label: 'Снегозадержание', group: 'Ограждающие конструкции', kind: 'boolean' },
  { id: 'roofFence', cell: 'AM34', label: 'Ограждение кровли', group: 'Ограждающие конструкции', kind: 'boolean' },
  { id: 'wallEnvelope', cell: 'AM36', label: 'Стены', group: 'Ограждающие конструкции', kind: 'select', options: [
    { value: 1, label: 'СП горизонтально' },
    { value: 2, label: 'СП вертикально' },
    { value: 3, label: 'Профлист / вариант 3' },
  ] },
  { id: 'wallThickness', cell: 'AM37', label: 'Толщина стен', group: 'Ограждающие конструкции', kind: 'select', options: [
    { value: 1, label: '100 мм' },
    { value: 2, label: '150 мм' },
    { value: 3, label: '200 мм' },
    { value: 4, label: '250 мм' },
  ] },
  { id: 'windows', cell: 'AM38', label: 'Окна', group: 'Проёмы', kind: 'boolean' },
  { id: 'windowCount', cell: 'W51', label: 'Количество окон', group: 'Проёмы', kind: 'number', min: 0, step: 1 },
  { id: 'windowTypes', cell: 'W53', label: 'Типоразмеры окон', group: 'Проёмы', kind: 'number', min: 1, step: 1 },
  { id: 'gates', cell: 'AM40', label: 'Ворота', group: 'Проёмы', kind: 'boolean' },
  { id: 'gateCount', cell: 'W62', label: 'Количество ворот', group: 'Проёмы', kind: 'number', min: 0, step: 1, note: 'Поле сохранено из исходной формы; текущие формулы книги используют отдельные внутренние коэффициенты ворот.' },
  { id: 'doors', cell: 'AM41', label: 'Двери', group: 'Проёмы', kind: 'boolean' },
  { id: 'doorCount', cell: 'W61', label: 'Количество дверей', group: 'Проёмы', kind: 'number', min: 0, step: 1 },
  { id: 'doorTypes', cell: 'W63', label: 'Типоразмеры дверей', group: 'Проёмы', kind: 'number', min: 1, step: 1 },

  { id: 'stair', cell: 'AM22', label: 'Лестницы', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairConcrete1', cell: 'AM23', label: 'Ж/Б ступени, одномаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairConcrete1Count', cell: 'F71', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairConcrete2', cell: 'AM24', label: 'Ж/Б ступени, двухмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairConcrete2Count', cell: 'F73', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairConcrete3', cell: 'AM25', label: 'Ж/Б ступени, трёхмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairConcrete3Count', cell: 'F75', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairConcrete4', cell: 'AM26', label: 'Ж/Б ступени, четырёхмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairConcrete4Count', cell: 'F77', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairMetal1', cell: 'AM27', label: 'Металлические ступени, одномаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairMetal1Count', cell: 'N71', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairMetal2', cell: 'AM28', label: 'Металлические ступени, двухмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairMetal2Count', cell: 'N73', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairMetal3', cell: 'AM29', label: 'Металлические ступени, трёхмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairMetal3Count', cell: 'N75', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },
  { id: 'stairMetal4', cell: 'AM30', label: 'Металлические ступени, четырёхмаршевая', group: 'Лестницы', kind: 'boolean' },
  { id: 'stairMetal4Count', cell: 'N77', label: 'Количество', group: 'Лестницы', kind: 'number', min: 0, step: 1 },

  { id: 'partitionGvl', cell: 'AM42', label: 'Перегородки ГВЛ', group: 'Перегородки', kind: 'boolean' },
  { id: 'partitionLayered', cell: 'AM43', label: 'Сэндвич-панели послойной сборки', group: 'Перегородки', kind: 'boolean' },
  { id: 'partitionFactory', cell: 'AM44', label: 'Сэндвич-панели заводского изготовления', group: 'Перегородки', kind: 'boolean' },
  { id: 'partitionAreaGvl', cell: 'B81', label: 'Площадь ГВЛ', group: 'Перегородки', kind: 'number', unit: 'м²', min: 0, step: 1 },
  { id: 'partitionAreaLayered', cell: 'B85', label: 'Площадь СП послойной сборки', group: 'Перегородки', kind: 'number', unit: 'м²', min: 0, step: 1 },
  { id: 'partitionAreaFactory', cell: 'B88', label: 'Площадь СП заводского изготовления', group: 'Перегородки', kind: 'number', unit: 'м²', min: 0, step: 1 },
  { id: 'partitionOpenings', cell: 'AM45', label: 'Окна и двери в перегородках', group: 'Перегородки', kind: 'boolean' },
  { id: 'partitionOpeningsCount', cell: 'M81', label: 'Количество проёмов', group: 'Перегородки', kind: 'number', min: 0, step: 1 },
  { id: 'partitionGates', cell: 'AM46', label: 'Ворота в перегородках', group: 'Перегородки', kind: 'boolean' },

  { id: 'parapetLongSide', cell: 'AM59', label: 'Парапет по продольной стороне', group: 'Парапет и прочее', kind: 'select', options: [
    { value: 3, label: 'Нет' },
    { value: 1, label: 'Одна сторона' },
    { value: 2, label: 'Две стороны' },
  ] },
  { id: 'parapetEndSide', cell: 'AM60', label: 'Парапет в торце', group: 'Парапет и прочее', kind: 'select', options: [
    { value: 3, label: 'Нет' },
    { value: 1, label: 'Один торец' },
    { value: 2, label: 'Два торца' },
  ] },
  { id: 'parapetOverhang', cell: 'AM61', label: 'Парапет с выносом', group: 'Парапет и прочее', kind: 'boolean' },
  { id: 'fireResistance', cell: 'AM63', label: 'Степень огнестойкости', group: 'Парапет и прочее', kind: 'select', options: [
    { value: 1, label: 'Код 1' },
    { value: 2, label: 'Код 2' },
  ] },
  { id: 'panelPosition', cell: 'AM69', label: 'Расположение СП ограждения', group: 'Парапет и прочее', kind: 'select', options: [
    { value: 1, label: 'Код 1' },
    { value: 2, label: 'Код 2' },
  ] },
  { id: 'drainage', cell: 'AM70', label: 'Водосточная система', group: 'Парапет и прочее', kind: 'boolean' },
];

export type InputValues = Record<string, number | boolean | string | null>;

export function groupInputs(specs = inputSpecs): string[] {
  return Array.from(new Set(specs.map((spec) => spec.group)));
}
