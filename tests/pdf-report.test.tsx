import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { PDFReport } from '../src/components/PDFReport';
import { DEFAULT_PARAMS } from '../src/data/defaults';
import { calculate } from '../src/logic/calculator';

describe('commercial proposal content', () => {
  test('contains core building parameters without internal pricing inputs', () => {
    const params = structuredClone(DEFAULT_PARAMS);
    params.span_widths_m = [12, 18];
    params.building_length_m = 60;
    params.height_m = 8;
    const result = calculate(params);
    const html = renderToStaticMarkup(
      <PDFReport params={params} result={result} reportRef={{ current: null }} />,
    );

    expect(html).toContain('Ширина здания');
    expect(html).toContain('30 м');
    expect(html).toContain('Длина здания');
    expect(html).toContain('Высота до низа конструкций');
    expect(html).toContain('Количество пролётов');
    expect(html).toContain('Ширины пролётов');
    expect(html).toContain('Площадь застройки');
    expect(html).toContain('Нормативная база');
    expect(html).toContain('Степень огнестойкости');
    expect(html).not.toContain('Базовая цена');
    expect(html).not.toContain('Коэффициент');
  });
});
