import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileDiff,
  Filter,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PARAMS } from '../data/defaults';
import { CALCULATOR_COEFFICIENTS } from '../data/coefficients';
import { calculate } from '../logic/calculator';
import {
  createDefaultKMModel,
  diffKMModel,
  listKMNumericCoefficients,
  setKMCoefficient,
  validateKMModel,
} from '../logic/km-model';
import type { RoofType, SystemType } from '../types/calculator';
import type {
  KMModelDocument,
  KMModelSection,
  KMNumericCoefficient,
} from '../types/km-model';

const STORAGE_KEY = 'km-calculator:km-model:v1';
const SECTIONS: Array<{
  id: KMModelSection | 'meta';
  label: string;
  description: string;
}> = [
  { id: 'systems', label: 'Системы и геометрия', description: 'Базы, пролёты, высоты, многопролётность и металлоёмкость.' },
  { id: 'additional_elements', label: 'Дополнительные элементы', description: 'Кровля, стены, краны, лестницы, перегородки и парапеты.' },
  { id: 'global_modifiers', label: 'Глобальные множители', description: 'Страна, Еврокод, сейсмика и общие корректировки.' },
  { id: 'geometry_rules', label: 'Правила длины и шага', description: 'Доплаты за длину, разный шаг и ширину.' },
  { id: 'meta', label: 'Базовые параметры', description: 'Базовая цена и служебные числовые настройки модели.' },
];

const ROOF_LABELS: Record<RoofType, string> = {
  one_slope: 'Односкатная',
  two_slope: 'Двускатная',
  flat: 'Плоская',
  multi_slope: 'Многоскатная',
};

const readModel = (): KMModelDocument => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return createDefaultKMModel();
    const parsed = JSON.parse(value) as KMModelDocument;
    return parsed.schemaVersion === 1 ? parsed : createDefaultKMModel();
  } catch {
    return createDefaultKMModel();
  }
};

const formatRubles = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);

const inputNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const groupTitle = (entry: KMNumericCoefficient) => {
  const tokens = entry.path.split('.');
  if (entry.section === 'systems') return tokens[1] ?? 'Системы';
  if (entry.section === 'additional_elements') return tokens[1]?.replaceAll('_', ' ') ?? 'Элементы';
  if (entry.section === 'global_modifiers') return tokens[1]?.replaceAll('_', ' ') ?? 'Множители';
  if (entry.section === 'geometry_rules') return tokens[1]?.replaceAll('_', ' ') ?? 'Геометрия';
  return 'Основные параметры';
};

export function AdminKMModelPage() {
  const [document, setDocument] = useState<KMModelDocument>(readModel);
  const [section, setSection] = useState<KMModelSection | 'meta'>('systems');
  const [query, setQuery] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [importError, setImportError] = useState('');
  const [previewSystem, setPreviewSystem] = useState<SystemType>('Атлант');
  const [previewRoof, setPreviewRoof] = useState<RoofType>('two_slope');
  const [previewWidth, setPreviewWidth] = useState(24);
  const [previewLength, setPreviewLength] = useState(60);
  const [previewHeight, setPreviewHeight] = useState(8);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const previousTitle = documentTitle();
    window.document.title = 'ИНСИ — Редактор модели КМ';
    return () => { window.document.title = previousTitle; };
  }, []);

  const entries = useMemo(
    () => listKMNumericCoefficients(document.coefficients),
    [document.coefficients],
  );
  const differences = useMemo(
    () => diffKMModel(document.coefficients),
    [document.coefficients],
  );
  const issues = useMemo(() => validateKMModel(document), [document]);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    return entries.filter((entry) =>
      entry.section === section &&
      (!changedOnly || entry.changed) &&
      (!normalizedQuery ||
        entry.label.toLocaleLowerCase('ru-RU').includes(normalizedQuery) ||
        entry.path.toLocaleLowerCase('ru-RU').includes(normalizedQuery)),
    );
  }, [changedOnly, entries, query, section]);
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, KMNumericCoefficient[]>();
    filteredEntries.forEach((entry) => {
      const key = groupTitle(entry);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return [...groups.entries()];
  }, [filteredEntries]);

  const previewParams = useMemo(() => {
    const params = structuredClone(DEFAULT_PARAMS);
    params.system = previewSystem;
    params.roof_type = previewRoof;
    params.span_widths_m = [previewWidth];
    params.building_length_m = previewLength;
    params.height_m = previewHeight;
    params.base_price_rub = document.coefficients._meta.base_price_rub;
    params.project_sections = { km: true, as: false };
    return params;
  }, [document.coefficients._meta.base_price_rub, previewHeight, previewLength, previewRoof, previewSystem, previewWidth]);
  const referenceParams = useMemo(() => ({
    ...previewParams,
    base_price_rub: CALCULATOR_COEFFICIENTS._meta.base_price_rub,
  }), [previewParams]);
  const referenceResult = useMemo(() => calculate(referenceParams), [referenceParams]);
  const workingResult = useMemo(
    () => calculate(previewParams, document.coefficients),
    [document.coefficients, previewParams],
  );
  const priceDelta = workingResult.cost - referenceResult.cost;
  const priceDeltaPercent = referenceResult.cost
    ? priceDelta / referenceResult.cost * 100
    : 0;

  const patchDocument = (patch: Partial<KMModelDocument>) => {
    setDocument((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateCoefficient = (path: string, value: number) => {
    patchDocument({
      coefficients: setKMCoefficient(document.coefficients, path, value),
    });
  };

  const resetCoefficient = (entry: KMNumericCoefficient) => {
    updateCoefficient(entry.path, entry.referenceValue);
  };

  const save = () => {
    const next = { ...document, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDocument(next);
    setSavedAt(new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date()));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `KM-model-${document.revision || 'draft'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as KMModelDocument;
      if (parsed.schemaVersion !== 1 || !parsed.coefficients?.systems) {
        throw new Error('Файл не является моделью КМ версии 1.');
      }
      setDocument(parsed);
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось прочитать модель.');
    }
  };

  const resetAll = () => {
    setDocument(createDefaultKMModel());
    setSavedAt('');
    setImportError('');
  };

  return (
    <div className="as-admin min-h-screen bg-[#eef1f4] text-slate-900">
      <header className="border-b-4 border-orange-600 bg-[#111827] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <a href="./" className="mt-1 rounded-lg border border-white/20 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Вернуться в калькулятор">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">
                  ИНСИ · Управление расчётными нормативами
                </span>
                <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  Эталон Excel защищён
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Редактор расчётной модели КМ
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Корректировка рабочей копии коэффициентов R2.0.1 с контролем отличий
                и влияния на стоимость. Основной калькулятор продолжает использовать эталон.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="?admin=as" className="admin-dark-button">Модель АС</a>
            <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importJSON(event.target.files?.[0])} />
            <button className="admin-dark-button" onClick={() => importRef.current?.click()}><Upload className="h-4 w-4" /> Импорт</button>
            <button className="admin-dark-button" onClick={exportJSON}><Download className="h-4 w-4" /> Экспорт JSON</button>
            <button className="admin-primary-button !bg-orange-600 hover:!bg-orange-700" onClick={save}><Save className="h-4 w-4" /> Сохранить редакцию</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="order-2 space-y-5 lg:order-1">
          {(issues.length > 0 || importError) && (
            <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div>{importError && <p>{importError}</p>}{issues.map((issue) => <p key={issue}>{issue}</p>)}</div></div>
            </div>
          )}

          <section className="admin-sheet">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="admin-field xl:col-span-2"><span>Название рабочей модели</span><input value={document.name} onChange={(event) => patchDocument({ name: event.target.value })} /></label>
              <label className="admin-field"><span>Редакция</span><input value={document.revision} onChange={(event) => patchDocument({ revision: event.target.value })} /></label>
              <label className="admin-field"><span>Статус</span><select value={document.status} onChange={(event) => patchDocument({ status: event.target.value as KMModelDocument['status'] })}><option value="draft">Черновик</option><option value="review">На согласовании</option><option value="approved">Утверждена</option></select></label>
              <label className="admin-field"><span>Владелец</span><input value={document.owner} onChange={(event) => patchDocument({ owner: event.target.value })} placeholder="ФИО / должность" /></label>
              <label className="admin-field md:col-span-2 xl:col-span-5"><span>Причина корректировки</span><input value={document.reason} onChange={(event) => patchDocument({ reason: event.target.value })} placeholder="Например: актуализация трудозатрат по итогам I квартала" /></label>
            </div>
          </section>

          <section className="admin-sheet">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-2 text-orange-700"><SlidersHorizontal className="h-5 w-5" /></div>
                <div><h2 className="font-mono text-sm font-black uppercase tracking-[0.08em]">Коэффициенты модели</h2><p className="mt-1 text-xs text-slate-500">Изменённые значения подсвечиваются. Любую строку можно вернуть к Excel R2.0.1.</p></div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию или пути коэффициента" />
                </label>
                <label className="admin-check !self-auto"><input type="checkbox" checked={changedOnly} onChange={(event) => setChangedOnly(event.target.checked)} /><Filter className="h-4 w-4 text-slate-500" /><span>Только изменения</span></label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {SECTIONS.map((item) => {
                  const changedCount = entries.filter((entry) => entry.section === item.id && entry.changed).length;
                  return (
                    <button key={item.id} onClick={() => setSection(item.id)} className={`rounded-md border p-3 text-left transition ${section === item.id ? 'border-orange-400 bg-orange-50 text-orange-950' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <strong className="block text-xs">{item.label}</strong>
                      <span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.description}</span>
                      {changedCount > 0 && <em className="mt-2 inline-block rounded bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold not-italic text-white">{changedCount} изм.</em>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {groupedEntries.length === 0 && (
                <div className="border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">По выбранным условиям коэффициенты не найдены.</div>
              )}
              {groupedEntries.map(([title, group]) => (
                <details key={title} className="km-coef-group" open>
                  <summary><span>{title}</span><small>{group.length} параметров</small><ChevronDown className="h-4 w-4" /></summary>
                  <div className="divide-y divide-slate-200">
                    {group.map((entry) => (
                      <div key={entry.path} className={`grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_130px_130px_44px] md:items-center ${entry.changed ? 'bg-orange-50/70' : 'bg-white'}`}>
                        <div className="min-w-0">
                          <strong className="block text-xs text-slate-800">{entry.label}</strong>
                          <code className="mt-1 block truncate text-[9px] text-slate-400">{entry.path}</code>
                        </div>
                        <div><span className="admin-coef-label">Excel R2.0.1</span><output className="admin-coef-reference">{entry.referenceValue}</output></div>
                        <label><span className="admin-coef-label">Рабочее значение</span><input className="admin-coef-input" type="number" step="any" value={entry.value} onChange={(event) => updateCoefficient(entry.path, inputNumber(event.target.value, entry.value))} /></label>
                        <button className="admin-icon-button" disabled={!entry.changed} onClick={() => resetCoefficient(entry)} aria-label={`Вернуть ${entry.label} к эталону`}><RotateCcw className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-5 lg:self-start">
          <section className="overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-xl">
            <div className="border-b border-slate-800 p-5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400">Контроль влияния</span>
              <h2 className="mt-1 text-xl font-black">Тестовый расчёт КМ</h2>
            </div>
            <div className="grid gap-3 p-5">
              <label className="admin-dark-field"><span>Система</span><select value={previewSystem} onChange={(event) => setPreviewSystem(event.target.value as SystemType)}>{Object.keys(document.coefficients.systems).map((system) => <option key={system}>{system}</option>)}</select></label>
              <label className="admin-dark-field"><span>Кровля</span><select value={previewRoof} onChange={(event) => setPreviewRoof(event.target.value as RoofType)}>{Object.entries(ROOF_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <div className="grid grid-cols-3 gap-2">
                <label className="admin-dark-field"><span>Пролёт, м</span><input type="number" value={previewWidth} onChange={(event) => setPreviewWidth(inputNumber(event.target.value, previewWidth))} /></label>
                <label className="admin-dark-field"><span>Длина, м</span><input type="number" value={previewLength} onChange={(event) => setPreviewLength(inputNumber(event.target.value, previewLength))} /></label>
                <label className="admin-dark-field"><span>Высота, м</span><input type="number" value={previewHeight} onChange={(event) => setPreviewHeight(inputNumber(event.target.value, previewHeight))} /></label>
              </div>
            </div>
            <div className="border-t border-slate-800 bg-slate-900/70 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="admin-metric-label">Эталон</span><strong className="admin-metric-value">{referenceResult.cost.toLocaleString('ru-RU')} тыс.</strong></div>
                <div><span className="admin-metric-label">Рабочая модель</span><strong className="admin-metric-value text-orange-400">{workingResult.cost.toLocaleString('ru-RU')} тыс.</strong></div>
              </div>
              <div className="mt-5 border-t border-slate-700 pt-4">
                <span className="admin-metric-label">Изменение стоимости</span>
                <strong className={`mt-1 block text-2xl font-black ${priceDelta === 0 ? 'text-slate-300' : priceDelta > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {priceDelta > 0 ? '+' : ''}{priceDelta.toLocaleString('ru-RU')} тыс. · {priceDeltaPercent > 0 ? '+' : ''}{priceDeltaPercent.toFixed(1)}%
                </strong>
              </div>
            </div>
          </section>

          <section className="border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {issues.length === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              <strong className="text-sm">{issues.length === 0 ? 'Модель структурно корректна' : `Замечаний: ${issues.length}`}</strong>
            </div>
            <dl className="mt-4 space-y-2 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between"><dt>Числовых параметров</dt><dd>{entries.length}</dd></div>
              <div className="flex justify-between"><dt>Изменено</dt><dd className="font-bold text-orange-600">{differences.length}</dd></div>
              <div className="flex justify-between"><dt>Базовая цена</dt><dd>{formatRubles(document.coefficients._meta.base_price_rub)}</dd></div>
              <div className="flex justify-between"><dt>Сохранено</dt><dd>{savedAt || 'нет'}</dd></div>
            </dl>
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
              <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Изменения работают только в предпросмотре этой страницы. Эталон и основной калькулятор не меняются.</span></div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700" onClick={resetAll}><RotateCcw className="h-4 w-4" /> Сбросить всю редакцию</button>
          </section>

          {differences.length > 0 && (
            <section className="border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-2 text-orange-900"><FileDiff className="h-5 w-5" /><strong className="text-sm">Последние изменения</strong></div>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {differences.slice(0, 20).map((difference) => (
                  <div key={difference.path} className="border-b border-orange-200 pb-2 text-[10px]">
                    <strong className="block text-orange-950">{difference.label}</strong>
                    <span className="text-orange-700">{difference.before} → {difference.after}{difference.deltaPercent === null ? '' : ` (${difference.deltaPercent > 0 ? '+' : ''}${difference.deltaPercent}%)`}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </main>
    </div>
  );
}

function documentTitle() {
  return window.document.title;
}
