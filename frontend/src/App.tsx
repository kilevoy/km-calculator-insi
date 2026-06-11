import { AlertCircle, Calculator, Download, FileSpreadsheet, Gauge, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculate, defaultInputValues, type CalculationResult } from './domain/calculator';
import { groupInputs, inputSpecs, type InputSpec, type InputValues } from './domain/inputs';
import { workbookSnapshot } from './domain/workbook.generated';

export function App(): JSX.Element {
  const [values, setValues] = useState<InputValues>(() => defaultInputValues());
  const result = useMemo(() => calculate(values), [values]);

  function updateValue(id: string, value: number | boolean | string | null): void {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function reset(): void {
    setValues(defaultInputValues());
  }

  function exportScenario(): void {
    const payload = JSON.stringify({ values, result }, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'km-calculator-scenario.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <FileSpreadsheet />
          </div>
          <div>
            <h1>Калькулятор КМ / INSI</h1>
            <p>{workbookSnapshot.sourceFile}</p>
          </div>
        </div>
        <div className="actions">
          <button className="secondary" onClick={reset} type="button">
            <RotateCcw />
            Сбросить
          </button>
          <button className="secondary" onClick={exportScenario} type="button">
            <Download />
            Экспорт
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="results-panel">
          <Results data={result} />
        </aside>
        <section className="form-panel">
          {groupInputs().map((group) => (
            <InputGroup key={group} group={group} values={values} onChange={updateValue} />
          ))}
        </section>
      </main>
    </div>
  );
}

function Results({ data }: { data: CalculationResult }): JSX.Element {
  return (
    <>
      <div className="result-header">
        <Calculator />
        <h2>Расчет</h2>
      </div>
      <div className="metric-grid">
        <Metric className="price" label="Стоимость КМ" value={formatNumber(data.totalPrice, 2)} unit="тыс. руб." />
        <Metric className="days" label="Срок" value={formatNumber(data.totalDays, 1)} unit="раб. дней" />
        <Metric className="area" label="Расчетная площадь" value={formatNumber(data.area, 1)} unit="м2" />
      </div>
      {data.warnings.length > 0 && (
        <div className="warning">
          <AlertCircle />
          <span>{data.warnings.join('\n')}</span>
        </div>
      )}
      <div className="result-block">
        <h3>Конструктивы</h3>
        <div className="table compact">
          <div className="table-row table-head">
            <span>Тип</span>
            <span>кг/м2</span>
            <span>тыс. руб/т</span>
          </div>
          {data.constructives.map((row) => (
            <div className="table-row" key={row.label}>
              <span>{row.label}</span>
              <span>{formatNumber(row.metalIntensity, 0)}</span>
              <span>{formatNumber(row.pricePerTon, 2)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="result-block">
        <h3>Активные варианты</h3>
        <div className="table variants">
          <div className="table-row table-head">
            <span>Вариант</span>
            <span>Раздел</span>
            <span>Стоимость</span>
            <span>Срок</span>
          </div>
          {data.variants.slice(0, 8).map((row) => (
            <div className="table-row" key={`${row.section}-${row.name}`}>
              <span>{row.name}</span>
              <span>{row.section}</span>
              <span>{formatRubles(row.price)}</span>
              <span>{formatNumber(row.days, 1)}</span>
            </div>
          ))}
          {data.variants.length === 0 && <div className="empty-state">Нет активных вариантов</div>}
        </div>
      </div>
      <div className="engine-note">
        <Gauge />
        <span>{workbookSnapshot.formulaCount.toLocaleString('ru-RU')} формул из Excel пересчитываются в приложении.</span>
      </div>
    </>
  );
}

function Metric(props: { className: string; label: string; value: string; unit: string }): JSX.Element {
  return (
    <div className={`metric ${props.className}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.unit}</small>
    </div>
  );
}

function InputGroup(props: {
  group: string;
  values: InputValues;
  onChange: (id: string, value: number | boolean | string | null) => void;
}): JSX.Element {
  const specs = inputSpecs.filter((spec) => spec.group === props.group);

  return (
    <section className="group-section">
      <div className="group-title">
        <h2>{props.group}</h2>
        <span>{specs.length}</span>
      </div>
      <div className="input-grid">
        {specs.map((spec) => (
          <InputControl
            key={spec.id}
            spec={spec}
            value={props.values[spec.id]}
            onChange={(value) => props.onChange(spec.id, value)}
          />
        ))}
      </div>
    </section>
  );
}

function InputControl(props: {
  spec: InputSpec;
  value: number | boolean | string | null;
  onChange: (value: number | boolean | string | null) => void;
}): JSX.Element {
  const { spec, value } = props;

  if (spec.kind === 'boolean') {
    return (
      <label className="field switch-field">
        <span>{spec.label}</span>
        <input checked={value === true} onChange={(event) => props.onChange(event.target.checked)} type="checkbox" />
      </label>
    );
  }

  if (spec.kind === 'select') {
    return (
      <label className="field">
        <span>{spec.label}</span>
        <select value={String(value ?? '')} onChange={(event) => props.onChange(readSelectValue(event.target.value, spec))}>
          {(spec.options ?? []).map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {spec.note && <small>{spec.note}</small>}
      </label>
    );
  }

  return (
    <label className="field">
      <span>{spec.label}</span>
      <div className="number-wrap">
        <input
          max={spec.max}
          min={spec.min}
          onChange={(event) => props.onChange(event.target.value === '' ? null : Number(event.target.value))}
          step={spec.step ?? 'any'}
          type="number"
          value={value === null || value === undefined ? '' : Number(value)}
        />
        {spec.unit && <span className="unit">{spec.unit}</span>}
      </div>
      {spec.note && <small>{spec.note}</small>}
    </label>
  );
}

function readSelectValue(raw: string, spec: InputSpec): number | string {
  const option = spec.options?.find((item) => String(item.value) === raw);
  return typeof option?.value === 'number' ? option.value : raw;
}

function formatNumber(value: unknown, digits: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function formatRubles(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return '-';
}
