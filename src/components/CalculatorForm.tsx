import { useState, type ReactNode } from 'react';
import {
  Boxes,
  ChevronDown,
  Construction,
  DoorOpen,
  Layers3,
  Ruler,
  ShieldAlert,
} from 'lucide-react';
import type {
  CalculatorParams,
  MezzanineParams,
  OpeningParams,
  ParapetSides,
  ValidationIssue,
} from '../types/calculator';

interface CalculatorFormProps {
  params: CalculatorParams;
  onChange: (params: CalculatorParams) => void;
  validationAlerts: ValidationIssue[];
}

interface SectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function Section({ id, title, subtitle, icon, open, onToggle, children }: SectionProps) {
  return (
    <section className="form-section" aria-labelledby={`${id}-title`}>
      <button type="button" className="section-trigger" onClick={onToggle} aria-expanded={open}>
        <span className="section-icon">{icon}</span>
        <span className="min-w-0 text-left">
          <strong id={`${id}-title`}>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="number-control">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        />
        {unit && <em>{unit}</em>}
      </span>
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`toggle-card ${checked ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span className="toggle-visual" aria-hidden="true"><i /></span>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}

function OpeningEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: OpeningParams;
  onChange: (value: OpeningParams) => void;
}) {
  return (
    <div className={`subcard ${value.enabled ? 'is-highlighted' : ''}`}>
      <Toggle label={title} checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} />
      {value.enabled && (
        <div className="field-grid two compact">
          <NumberField label="Количество" value={value.count} min={0} max={999} onChange={(count) => onChange({ ...value, count })} />
          <NumberField label="Типоразмеров" value={value.size_types} min={0} max={99} onChange={(size_types) => onChange({ ...value, size_types })} />
        </div>
      )}
    </div>
  );
}

const updateAt = <T,>(values: T[], index: number, value: T): T[] =>
  values.map((item, itemIndex) => itemIndex === index ? value : item);

export function CalculatorForm({ params, onChange, validationAlerts }: CalculatorFormProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    geometry: true,
    structures: true,
    envelope: true,
    openings: false,
    extras: false,
  });
  const patch = (changes: Partial<CalculatorParams>) => onChange({ ...params, ...changes });
  const toggle = (id: string) => setOpen((current) => ({ ...current, [id]: !current[id] }));

  const changeSpanCount = (count: number) => {
    const normalized = Math.max(1, Math.min(5, count));
    const spans = Array.from({ length: normalized }, (_, index) => params.span_widths_m[index] ?? params.span_widths_m.at(-1) ?? 12);
    patch({ span_widths_m: spans });
  };

  const updateMezzanine = (index: number, value: MezzanineParams) => {
    patch({ mezzanines: updateAt([...params.mezzanines], index, value) as CalculatorParams['mezzanines'] });
  };

  return (
    <div className="form-stack">
      {validationAlerts.length > 0 && (
        <div className="validation-panel" role="status">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <strong>Проверьте параметры</strong>
            {validationAlerts.map((alert) => (
              <p key={`${alert.code}-${alert.field}`} className={alert.severity}>{alert.message}</p>
            ))}
          </div>
        </div>
      )}

      <Section
        id="geometry"
        title="Геометрия здания"
        subtitle="Пролёты, длина, шаг рам и высота"
        icon={<Ruler className="h-5 w-5" />}
        open={open.geometry}
        onToggle={() => toggle('geometry')}
      >
        <div className="field-grid three">
          <NumberField label="Количество пролётов" value={params.span_widths_m.length} min={1} max={5} onChange={changeSpanCount} />
          <NumberField label="Длина здания" value={params.building_length_m} min={0.1} max={1000} step={0.1} unit="м" onChange={(building_length_m) => patch({ building_length_m })} />
          <NumberField label="Высота до низа конструкций" value={params.height_m} min={0.1} max={60} step={0.05} unit="м" onChange={(height_m) => patch({ height_m })} />
        </div>

        <div className="repeat-grid">
          {params.span_widths_m.map((span, index) => (
            <NumberField
              key={index}
              label={`Пролёт ${index + 1}`}
              value={span}
              min={1}
              max={60}
              step={0.1}
              unit="м"
              onChange={(value) => patch({ span_widths_m: updateAt(params.span_widths_m, index, value) })}
            />
          ))}
        </div>

        <div className="inline-choice">
          <span>Шаг рам</span>
          <label><input type="radio" checked={params.frame_step_mode === 'same'} onChange={() => patch({ frame_step_mode: 'same', frame_steps_m: [params.frame_steps_m[0] ?? 6] })} /> Одинаковый</label>
          <label><input type="radio" checked={params.frame_step_mode === 'different'} onChange={() => patch({ frame_step_mode: 'different', frame_steps_m: params.frame_steps_m.length > 1 ? params.frame_steps_m : [params.frame_steps_m[0] ?? 6, params.frame_steps_m[0] ?? 6] })} /> Разный</label>
        </div>
        <div className="repeat-grid">
          {params.frame_steps_m.map((step, index) => (
            <NumberField key={index} label={params.frame_step_mode === 'same' ? 'Шаг рам' : `Шаг ${index + 1}`} value={step} min={0.1} max={24} step={0.025} unit="м" onChange={(value) => patch({ frame_steps_m: updateAt(params.frame_steps_m, index, value) })} />
          ))}
          {params.frame_step_mode === 'different' && params.frame_steps_m.length < 5 && (
            <button type="button" className="add-field" onClick={() => patch({ frame_steps_m: [...params.frame_steps_m, params.frame_steps_m.at(-1) ?? 6] })}>+ Добавить шаг</button>
          )}
        </div>
      </Section>

      <Section
        id="structures"
        title="Перекрытия, антресоли и краны"
        subtitle="Все конструктивные надстройки Excel"
        icon={<Construction className="h-5 w-5" />}
        open={open.structures}
        onToggle={() => toggle('structures')}
      >
        <div className="toggle-grid">
          <Toggle
            label="Подстропильные фермы"
            description="Только система «Великан»"
            checked={params.has_subtruss}
            disabled={params.system !== 'Великан'}
            onChange={(has_subtruss) => patch({ has_subtruss })}
          />
          <Toggle label="Межэтажные перекрытия" checked={params.floor.enabled} onChange={(enabled) => patch({ floor: { ...params.floor, enabled } })} />
        </div>

        {params.floor.enabled && (
          <div className="subcard is-highlighted">
            <h4>Перекрытия</h4>
            <div className="field-grid three">
              <NumberField label="Количество пролётов" value={params.floor.spans_m.length} min={1} max={5} onChange={(count) => patch({ floor: { ...params.floor, spans_m: Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, index) => params.floor.spans_m[index] ?? params.span_widths_m[index] ?? 12) } })} />
              <NumberField label="Количество этажей" value={params.floor.storeys} min={1} max={20} onChange={(storeys) => patch({ floor: { ...params.floor, storeys } })} />
              <label className="field"><span>Нагрузка</span><select value={params.floor.load_mode} onChange={(event) => patch({ floor: { ...params.floor, load_mode: event.target.value as 'same' | 'different' } })}><option value="same">Одинаковая</option><option value="different">Разная</option></select></label>
            </div>
            <div className="repeat-grid">
              {params.floor.spans_m.map((span, index) => <NumberField key={index} label={`Пролёт ${index + 1}`} value={span} min={0.1} step={0.1} unit="м" onChange={(value) => patch({ floor: { ...params.floor, spans_m: updateAt(params.floor.spans_m, index, value) } })} />)}
            </div>
          </div>
        )}

        <div className="cards-grid">
          {params.mezzanines.map((mezzanine, index) => (
            <div className={`subcard ${mezzanine.enabled ? 'is-highlighted' : ''}`} key={index}>
              <Toggle label={`Антресоль ${index + 1}`} checked={mezzanine.enabled} onChange={(enabled) => updateMezzanine(index, { ...mezzanine, enabled })} />
              {mezzanine.enabled && (
                <div className="field-grid two compact">
                  <NumberField label="Длина" value={mezzanine.length_m} min={0.1} step={0.1} unit="м" onChange={(length_m) => updateMezzanine(index, { ...mezzanine, length_m })} />
                  <NumberField label="Ширина" value={mezzanine.width_m} min={0.1} step={0.1} unit="м" onChange={(width_m) => updateMezzanine(index, { ...mezzanine, width_m })} />
                  <NumberField label="Этажей" value={mezzanine.storeys} min={1} max={20} onChange={(storeys) => updateMezzanine(index, { ...mezzanine, storeys })} />
                  <label className="field"><span>Нагрузка</span><select value={mezzanine.load_mode} onChange={(event) => updateMezzanine(index, { ...mezzanine, load_mode: event.target.value as 'same' | 'different' })}><option value="same">Одинаковая</option><option value="different">Разная</option></select></label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="cards-grid two">
          {([
            ['Опорный кран', 'support_crane'],
            ['Подвесной кран', 'suspension_crane'],
          ] as const).map(([title, key]) => {
            const crane = params[key];
            return (
              <div className={`subcard ${crane.enabled ? 'is-highlighted' : ''}`} key={key}>
                <Toggle label={title} checked={crane.enabled} onChange={(enabled) => patch({ [key]: { ...crane, enabled } })} />
                {crane.enabled && (
                  <div className="field-grid two compact">
                    <NumberField label="Пролётов с краном" value={crane.spans_count} min={1} max={params.span_widths_m.length} onChange={(spans_count) => patch({ [key]: { ...crane, spans_count } })} />
                    <label className="field"><span>Грузоподъёмность</span><select value={crane.capacity_mode} onChange={(event) => patch({ [key]: { ...crane, capacity_mode: event.target.value as 'same' | 'different' } })}><option value="same">Одинаковая</option><option value="different">Разная</option></select></label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="envelope"
        title="Кровля и стены"
        subtitle="Ограждающие конструкции, парапеты и ориентация панелей"
        icon={<Layers3 className="h-5 w-5" />}
        open={open.envelope}
        onToggle={() => toggle('envelope')}
      >
        <div className="field-grid two">
          <label className="field"><span>Покрытие кровли</span><select value={params.roof_cladding} onChange={(event) => patch({ roof_cladding: event.target.value as CalculatorParams['roof_cladding'] })}><option value="profile">Профлист</option><option value="pvc">ПВХ-мембрана</option><option value="sandwich_layer">Сэндвич-панели послойной сборки</option><option value="sandwich">Сэндвич-панели заводские</option></select></label>
          <label className="field"><span>Стены</span><select value={params.walls.cladding} onChange={(event) => patch({ walls: { ...params.walls, cladding: event.target.value as CalculatorParams['walls']['cladding'] } })}><option value="none">Без стен</option><option value="profile">Профлист</option><option value="sandwich_layer">Сэндвич-панели послойной сборки</option><option value="sandwich">Сэндвич-панели заводские</option></select></label>
        </div>
        <div className="toggle-grid four">
          <Toggle label="Снегозадержание" checked={params.has_snow_retention} onChange={(has_snow_retention) => patch({ has_snow_retention })} />
          <Toggle label="Ограждение кровли" checked={params.has_roof_railing} onChange={(has_roof_railing) => patch({ has_roof_railing })} />
          <Toggle label="Водосточная система" checked={params.has_drainage} onChange={(has_drainage) => patch({ has_drainage })} />
          <Toggle label="Вынос парапета" checked={params.parapet.has_overhang} onChange={(has_overhang) => patch({ parapet: { ...params.parapet, has_overhang } })} />
        </div>
        <div className="field-grid four">
          <label className="field"><span>Толщина стен</span><select value={params.walls.thickness_mm} onChange={(event) => patch({ walls: { ...params.walls, thickness_mm: Number(event.target.value) as CalculatorParams['walls']['thickness_mm'] } })}>{[100, 110, 150, 200, 250].map((value) => <option key={value} value={value}>{value} мм</option>)}</select></label>
          <label className="field"><span>Ориентация панелей</span><select value={params.walls.orientation} onChange={(event) => patch({ walls: { ...params.walls, orientation: event.target.value as 'horizontal' | 'vertical' } })}><option value="horizontal">Горизонтальная</option><option value="vertical">Вертикальная</option></select></label>
          <label className="field"><span>Парапет по длинным сторонам</span><select value={params.parapet.long_sides} onChange={(event) => patch({ parapet: { ...params.parapet, long_sides: Number(event.target.value) as ParapetSides } })}><option value={0}>Нет</option><option value={1}>По одной стороне</option><option value={2}>По двум сторонам</option></select></label>
          <label className="field"><span>Парапет по торцам</span><select value={params.parapet.end_sides} onChange={(event) => patch({ parapet: { ...params.parapet, end_sides: Number(event.target.value) as ParapetSides } })}><option value={0}>Нет</option><option value={1}>По одному торцу</option><option value={2}>По двум торцам</option></select></label>
        </div>
      </Section>

      <Section
        id="openings"
        title="Проёмы и перегородки"
        subtitle="Количество и типоразмеры окон, ворот и дверей"
        icon={<DoorOpen className="h-5 w-5" />}
        open={open.openings}
        onToggle={() => toggle('openings')}
      >
        <div className="cards-grid three">
          <OpeningEditor title="Окна в стенах" value={params.walls.windows} onChange={(windows) => patch({ walls: { ...params.walls, windows } })} />
          <OpeningEditor title="Ворота в стенах" value={params.walls.gates} onChange={(gates) => patch({ walls: { ...params.walls, gates } })} />
          <OpeningEditor title="Двери в стенах" value={params.walls.doors} onChange={(doors) => patch({ walls: { ...params.walls, doors } })} />
        </div>
        <div className="cards-grid three">
          {params.partitions.map((partition, index) => (
            <div className={`subcard ${partition.enabled ? 'is-highlighted' : ''}`} key={partition.kind}>
              <Toggle label={['Перегородки ГВЛ', 'Перегородки послойной сборки', 'Перегородки заводские'][index]} checked={partition.enabled} onChange={(enabled) => patch({ partitions: updateAt([...params.partitions], index, { ...partition, enabled }) as CalculatorParams['partitions'] })} />
              {partition.enabled && <NumberField label="Площадь" value={partition.area_m2} min={0} step={1} unit="м²" onChange={(area_m2) => patch({ partitions: updateAt([...params.partitions], index, { ...partition, area_m2 }) as CalculatorParams['partitions'] })} />}
            </div>
          ))}
        </div>
        <div className="cards-grid two">
          <OpeningEditor title="Окна и двери в перегородках" value={params.partition_openings} onChange={(partition_openings) => patch({ partition_openings })} />
          <OpeningEditor title="Ворота в перегородках" value={params.partition_gates} onChange={(partition_gates) => patch({ partition_gates })} />
        </div>
      </Section>

      <Section
        id="extras"
        title="Лестницы и параметры проекта"
        subtitle="Восемь типов лестниц, состав проекта и служебные данные"
        icon={<Boxes className="h-5 w-5" />}
        open={open.extras}
        onToggle={() => toggle('extras')}
      >
        <div className="stairs-table">
          <div /><strong>1 марш</strong><strong>2 марша</strong><strong>3 марша</strong><strong>4 марша</strong>
          <span>Под ж/б ступени</span>
          {params.stairs.concrete.map((count, index) => <input key={`c-${index}`} aria-label={`Железобетонная лестница, ${index + 1} маршей`} type="number" min={0} value={count} onChange={(event) => patch({ stairs: { ...params.stairs, concrete: updateAt([...params.stairs.concrete], index, Number(event.target.value)) as CalculatorParams['stairs']['concrete'] } })} />)}
          <span>Металлические ступени</span>
          {params.stairs.metal.map((count, index) => <input key={`m-${index}`} aria-label={`Металлическая лестница, ${index + 1} маршей`} type="number" min={0} value={count} onChange={(event) => patch({ stairs: { ...params.stairs, metal: updateAt([...params.stairs.metal], index, Number(event.target.value)) as CalculatorParams['stairs']['metal'] } })} />)}
        </div>

        <div className="toggle-grid">
          <Toggle label="Раздел КМ" checked={params.project_sections.km} onChange={(km) => patch({ project_sections: { ...params.project_sections, km } })} />
          <Toggle label="Раздел АС" checked={params.project_sections.as} onChange={(as) => patch({ project_sections: { ...params.project_sections, as } })} />
        </div>
        <div className="field-grid three">
          <label className="field"><span>Степень огнестойкости</span><select value={params.fire_resistance} onChange={(event) => patch({ fire_resistance: event.target.value as CalculatorParams['fire_resistance'] })}><option value="below_v">Ниже V</option><option value="v">V</option></select></label>
          <NumberField label="Издержки" value={params.overhead_rate} min={-50} max={150} step={0.5} unit="%" onChange={(overhead_rate) => patch({ overhead_rate })} />
          <label className="field"><span>Название проекта</span><input value={params.project_name ?? ''} onChange={(event) => patch({ project_name: event.target.value })} placeholder="Например, складской комплекс" /></label>
          <label className="field"><span>Клиент</span><input value={params.client ?? ''} onChange={(event) => patch({ client: event.target.value })} /></label>
          <label className="field"><span>Менеджер</span><input value={params.manager ?? ''} onChange={(event) => patch({ manager: event.target.value })} /></label>
        </div>
      </Section>
    </div>
  );
}
