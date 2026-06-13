import type { MutableRefObject } from 'react';
import type { CalculatorParams, CalculatorResult } from '../types/calculator';
import { formatCurrency, formatDate, formatDays, formatRubles, formatWeight } from '../utils/formatters';

interface PDFReportProps {
  params: CalculatorParams;
  result: CalculatorResult;
  reportRef: MutableRefObject<HTMLDivElement | null>;
}

const roofLabels: Record<CalculatorParams['roof_type'], string> = {
  one_slope: 'Односкатная',
  two_slope: 'Двускатная',
  flat: 'Плоская',
  multi_slope: 'Многоскатная с внутренним водостоком',
};

const yesNo = (value: boolean) => value ? 'Да' : 'Нет';

export function PDFReport({ params, result, reportRef }: PDFReportProps) {
  const calculationNumber = `KM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;
  const enabledMezzanines = params.mezzanines.filter(({ enabled }) => enabled);
  const stairCount = [...params.stairs.concrete, ...params.stairs.metal].reduce((sum, value) => sum + value, 0);

  const rows: Array<[string, string]> = [
    ['Система / кровля', `${params.system} / ${roofLabels[params.roof_type]}`],
    ['Пролёты', params.span_widths_m.map((value) => `${value} м`).join(' + ')],
    ['Длина / высота', `${params.building_length_m} м / ${params.height_m} м`],
    ['Шаг рам', `${params.frame_step_mode === 'same' ? 'одинаковый' : 'разный'}: ${params.frame_steps_m.join(', ')} м`],
    ['Площадь расчёта', `${result.area_m2.toLocaleString('ru-RU')} м²`],
    ['Нормативы / сейсмика', `${params.country === 'snip' ? 'СНиП / СП' : 'Еврокод'}, ${params.seismic} баллов`],
    ['Разделы', [params.project_sections.km && 'КМ', params.project_sections.as && 'АС'].filter(Boolean).join(', ')],
    ['Перекрытия', params.floor.enabled ? `${params.floor.spans_m.join(', ')} м; этажей: ${params.floor.storeys}; нагрузка ${params.floor.load_mode === 'same' ? 'одинаковая' : 'разная'}` : 'Нет'],
    ['Антресоли', enabledMezzanines.length ? enabledMezzanines.map((item, index) => `№${index + 1}: ${item.length_m}×${item.width_m} м, ${item.storeys} эт.`).join('; ') : 'Нет'],
    ['Опорный / подвесной кран', `${yesNo(params.support_crane.enabled)} / ${yesNo(params.suspension_crane.enabled)}`],
    ['Кровля', `${params.roof_cladding}; снегозадержание: ${yesNo(params.has_snow_retention)}; ограждение: ${yesNo(params.has_roof_railing)}; водосток: ${yesNo(params.has_drainage)}`],
    ['Стены', `${params.walls.cladding}, ${params.walls.thickness_mm} мм, ${params.walls.orientation === 'horizontal' ? 'горизонтально' : 'вертикально'}`],
    ['Проёмы', `окна ${params.walls.windows.count}, ворота ${params.walls.gates.count}, двери ${params.walls.doors.count}`],
    ['Перегородки', params.partitions.filter(({ enabled }) => enabled).map(({ kind, area_m2 }) => `${kind}: ${area_m2} м²`).join('; ') || 'Нет'],
    ['Парапеты', `продольные стороны: ${params.parapet.long_sides}; торцы: ${params.parapet.end_sides}; вынос: ${yesNo(params.parapet.has_overhang)}`],
    ['Лестницы', stairCount ? `${stairCount} шт.` : 'Нет'],
  ];

  return (
    <div className="pdf-render-host" aria-hidden="true">
      <div ref={reportRef} className="pdf-report">
        <header className="pdf-header">
          <div className="pdf-brand"><b>ИНСИ</b><span>Проектирование металлоконструкций</span></div>
          <div><strong>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</strong><span>Расчёт {calculationNumber} от {formatDate(new Date())}</span></div>
        </header>

        <h1>Разработка проектной документации марки КМ</h1>
        {(params.client || params.project_name) && (
          <p className="pdf-lead">{params.project_name || 'Проект'}{params.client ? ` · Заказчик: ${params.client}` : ''}</p>
        )}

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

        <h2>Структура стоимости</h2>
        <table className="pdf-table">
          <thead><tr><th>Раздел</th><th>Коэффициент</th><th>Доля</th><th>Стоимость</th></tr></thead>
          <tbody>
            {result.breakdown.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.coefficient.toFixed(3)}</td><td>{item.percentage.toFixed(1)}%</td><td>{formatRubles(item.value)}</td>
              </tr>
            ))}
            <tr className="pdf-total"><td>Итого</td><td>{result.trace.total_coefficient.toFixed(3)}</td><td>100%</td><td>{formatRubles(result.cost * 1000)}</td></tr>
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
