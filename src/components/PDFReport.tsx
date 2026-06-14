import type { MutableRefObject } from 'react';
import type { CalculatorParams, CalculatorResult } from '../types/calculator';
import { formatCurrency, formatDate, formatDays, formatRubles, formatWeight } from '../utils/formatters';
import {
  PARTITION_KIND_LABELS,
  ROOF_CLADDING_LABELS,
  WALL_CLADDING_LABELS,
} from '../utils/calculator-labels';

interface PDFReportProps {
  params: CalculatorParams;
  result: CalculatorResult;
  reportRef: MutableRefObject<HTMLDivElement | null>;
  calculationNumber: string;
}

const roofLabels: Record<CalculatorParams['roof_type'], string> = {
  one_slope: 'Односкатная',
  two_slope: 'Двускатная',
  flat: 'Плоская',
  multi_slope: 'Многоскатная с внутренним водостоком',
};

const yesNo = (value: boolean) => value ? 'Да' : 'Нет';
const loadModeLabel = (value: CalculatorParams['floor']['load_mode']) =>
  value === 'same' ? 'одинаковая' : 'разная';
const formatNumber = (value: number) => value.toLocaleString('ru-RU', {
  maximumFractionDigits: 3,
});

export function PDFReport({
  params,
  result,
  reportRef,
  calculationNumber,
}: PDFReportProps) {
  const enabledMezzanines = params.mezzanines.filter(({ enabled }) => enabled);
  const totalWidth = params.span_widths_m.reduce((sum, value) => sum + value, 0);
  const footprintArea = totalWidth * params.building_length_m;
  const stairDetails = [
    ...params.stairs.concrete.map((count, index) => count > 0 ? `под ж/б ступени, ${index + 1} марш.: ${count}` : ''),
    ...params.stairs.metal.map((count, index) => count > 0 ? `металлические, ${index + 1} марш.: ${count}` : ''),
  ].filter(Boolean);
  const wallOpenings = [
    params.walls.windows.enabled && `окна: ${params.walls.windows.count} шт. / ${params.walls.windows.size_types} тип.`,
    params.walls.gates.enabled && `ворота: ${params.walls.gates.count} шт. / ${params.walls.gates.size_types} тип.`,
    params.walls.doors.enabled && `двери: ${params.walls.doors.count} шт. / ${params.walls.doors.size_types} тип.`,
  ].filter(Boolean);
  const partitionOpenings = [
    params.partition_openings.enabled && `окна и двери: ${params.partition_openings.count} шт.`,
    params.partition_gates.enabled && `ворота: ${params.partition_gates.count} шт.`,
  ].filter(Boolean);
  const craneDetails = [
    params.support_crane.enabled &&
      `опорный: ${params.support_crane.spans_count} прол., нагрузка ${loadModeLabel(params.support_crane.capacity_mode)}`,
    params.suspension_crane.enabled &&
      `подвесной: ${params.suspension_crane.spans_count} прол., нагрузка ${loadModeLabel(params.suspension_crane.capacity_mode)}`,
  ].filter(Boolean);

  const rows: Array<[string, string]> = [
    ['Конструктивная система', params.system],
    ['Тип кровли', roofLabels[params.roof_type]],
    ['Ширина здания', `${formatNumber(totalWidth)} м`],
    ['Длина здания', `${formatNumber(params.building_length_m)} м`],
    ['Высота до низа конструкций', `${formatNumber(params.height_m)} м`],
    ['Количество пролётов', `${params.span_widths_m.length}`],
    ['Ширины пролётов', params.span_widths_m.map((value) => `${formatNumber(value)} м`).join(' + ')],
    ['Шаг рам', `${params.frame_step_mode === 'same' ? 'одинаковый' : 'разный'}: ${params.frame_steps_m.map(formatNumber).join(', ')} м`],
    ['Площадь застройки', `${formatNumber(footprintArea)} м²`],
    ['Площадь расчёта', `${formatNumber(result.area_m2)} м²`],
    ['Нормативная база', params.country === 'snip' ? 'СНиП / СП' : 'Еврокод'],
    ['Сейсмичность', `${params.seismic} баллов`],
    ['Степень огнестойкости', params.fire_resistance === 'v' ? 'V' : 'Ниже V'],
    ['Разделы проекта', [params.project_sections.km && 'КМ', params.project_sections.as && 'АС'].filter(Boolean).join(', ')],
    ['Подстропильные фермы', yesNo(params.has_subtruss)],
    ['Перекрытия', params.floor.enabled ? `${params.floor.spans_m.map(formatNumber).join(', ')} м; этажей: ${params.floor.storeys}; нагрузка ${loadModeLabel(params.floor.load_mode)}` : 'Нет'],
    ['Антресоли', enabledMezzanines.length ? enabledMezzanines.map((item, index) => `№${index + 1}: ${item.length_m}×${item.width_m} м, ${item.storeys} эт.`).join('; ') : 'Нет'],
    ['Краны', craneDetails.join('; ') || 'Нет'],
    ['Кровля', `${ROOF_CLADDING_LABELS[params.roof_cladding]}; снегозадержание: ${yesNo(params.has_snow_retention)}; ограждение: ${yesNo(params.has_roof_railing)}; водосток: ${yesNo(params.has_drainage)}`],
    ['Стены', params.walls.cladding === 'none' ? 'Нет' : `${WALL_CLADDING_LABELS[params.walls.cladding]}, ${params.walls.thickness_mm} мм, ${params.walls.orientation === 'horizontal' ? 'горизонтально' : 'вертикально'}`],
    ['Проёмы в стенах', wallOpenings.join('; ') || 'Нет'],
    ['Перегородки', params.partitions.filter(({ enabled }) => enabled).map(({ kind, area_m2 }) => `${PARTITION_KIND_LABELS[kind]}: ${area_m2} м²`).join('; ') || 'Нет'],
    ['Проёмы в перегородках', partitionOpenings.join('; ') || 'Нет'],
    ['Парапеты', params.parapet.long_sides || params.parapet.end_sides ? `продольные стороны: ${params.parapet.long_sides}; торцы: ${params.parapet.end_sides}; вынос: ${yesNo(params.parapet.has_overhang)}` : 'Нет'],
    ['Лестницы', stairDetails.join('; ') || 'Нет'],
  ];

  return (
    <div className="pdf-render-host" aria-hidden="true">
      <div ref={reportRef} className="pdf-report">
        <header className="pdf-header">
          <div className="pdf-brand"><b>ИНСИ</b><span>Проектирование металлоконструкций</span></div>
          <div><strong>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</strong><span>Расчёт {calculationNumber} от {formatDate(new Date())}</span></div>
        </header>

        <h1>Разработка проектной документации марки КМ</h1>
        <section className="pdf-project-meta">
          <div><span>Проект</span><strong>{params.project_name || 'Не указан'}</strong></div>
          <div><span>Заказчик</span><strong>{params.client || 'Не указан'}</strong></div>
          <div><span>Менеджер</span><strong>{params.manager || 'Не указан'}</strong></div>
        </section>

        <section className="pdf-summary">
          <div><span>Стоимость</span><strong>{formatCurrency(result.cost)}</strong></div>
          <div><span>Срок</span><strong>{formatDays(result.term)}</strong></div>
          <div><span>Вес металлоконструкций</span><strong>{formatWeight(result.total_weight_tons)}</strong></div>
          <div><span>Удельная стоимость</span><strong>{result.cost_per_ton.toFixed(2)} тыс. руб./т</strong></div>
        </section>

        <h2>Параметры объекта</h2>
        <table className="pdf-table">
          <tbody>{rows.map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody>
        </table>

        <div className="pdf-page-break" />
        <div className="pdf-continuation-header">
          <strong>ИНСИ · Коммерческое предложение</strong>
          <span>{calculationNumber} · Структура стоимости</span>
        </div>
        <h2>Структура стоимости</h2>
        <table className="pdf-table">
          <thead><tr><th>Раздел</th><th>Доля</th><th>Стоимость</th></tr></thead>
          <tbody>
            {result.breakdown.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.percentage.toFixed(1)}%</td><td>{formatRubles(item.value)}</td>
              </tr>
            ))}
            <tr className="pdf-total"><td>Итого</td><td>100%</td><td>{formatRubles(result.cost * 1000)}</td></tr>
          </tbody>
        </table>

        <aside className="pdf-note">
          Стоимость ориентировочная и уточняется после получения технического задания. Расчёт выполнен по модели Excel R2.0.1.
        </aside>
        <footer className="pdf-footer">
          <span>{params.manager ? `Менеджер: ${params.manager}` : 'ИНСИ · Отдел металлоконструкций'}</span>
          <span>insi.ru · info@insi.ru</span>
        </footer>
      </div>
    </div>
  );
}
