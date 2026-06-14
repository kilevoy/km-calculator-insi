import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson,
  FlaskConical,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_AS_MODEL } from '../data/as-model-defaults';
import {
  defaultASPreviewValues,
  estimateASModel,
  validateASModel,
  type ASPreviewValues,
} from '../logic/as-model';
import type {
  ASCalibrationProject,
  ASInputField,
  ASModel,
  ASWorkPackage,
} from '../types/as-model';

const STORAGE_KEY = 'km-calculator:as-model:v1';

const cloneDefaultModel = (): ASModel => structuredClone(DEFAULT_AS_MODEL);
const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const rubles = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
const numberValue = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;

function loadModel(): ASModel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultModel();
    const parsed = JSON.parse(raw) as ASModel;
    return parsed.version === 1 ? parsed : cloneDefaultModel();
  } catch {
    return cloneDefaultModel();
  }
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700">
          {icon}
        </div>
        <div>
          <h2 className="font-mono text-sm font-black uppercase tracking-[0.08em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function AdminASModelPage() {
  const [model, setModel] = useState<ASModel>(loadModel);
  const [previewValues, setPreviewValues] = useState<ASPreviewValues>(() =>
    defaultASPreviewValues(loadModel().inputFields),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const importRef = useRef<HTMLInputElement | null>(null);
  const issues = useMemo(() => validateASModel(model), [model]);
  const estimate = useMemo(
    () => estimateASModel(model, previewValues),
    [model, previewValues],
  );

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'ИНСИ — Конструктор модели АС';
    return () => { document.title = previousTitle; };
  }, []);

  const patchModel = (patch: Partial<ASModel>) => {
    setModel((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateField = (id: string, patch: Partial<ASInputField>) => {
    patchModel({
      inputFields: model.inputFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    });
  };

  const updatePackage = (id: string, patch: Partial<ASWorkPackage>) => {
    patchModel({
      workPackages: model.workPackages.map((workPackage) =>
        workPackage.id === id ? { ...workPackage, ...patch } : workPackage,
      ),
    });
  };

  const updateProject = (id: string, patch: Partial<ASCalibrationProject>) => {
    patchModel({
      calibrationProjects: model.calibrationProjects.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    });
  };

  const addField = () => {
    const field: ASInputField = {
      id: createId('field'),
      label: 'Новое исходное поле',
      description: '',
      type: 'number',
      unit: 'шт.',
      required: false,
      defaultValue: 0,
      min: 0,
      step: 1,
    };
    patchModel({ inputFields: [...model.inputFields, field] });
    setPreviewValues((current) => ({ ...current, [field.id]: field.defaultValue }));
  };

  const addPackage = () => {
    patchModel({
      workPackages: [
        ...model.workPackages,
        {
          id: createId('work'),
          name: 'Новый состав работ',
          description: '',
          enabled: true,
          baseHours: 8,
          coefficientMode: 'fixed',
          complexityMultiplier: 1,
        },
      ],
    });
  };

  const addProject = () => {
    patchModel({
      calibrationProjects: [
        ...model.calibrationProjects,
        {
          id: createId('project'),
          name: 'Новый объект',
          buildingType: 'Склад',
          areaM2: 1_000,
          storeys: 1,
          actualHours: 0,
          actualPriceRub: 0,
          notes: '',
        },
      ],
    });
  };

  const save = () => {
    const next = { ...model, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setModel(next);
    setSavedAt(new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date()));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(model, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `AS-model-v${model.version}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ASModel;
      if (parsed.version !== 1 || !Array.isArray(parsed.inputFields) || !Array.isArray(parsed.workPackages)) {
        throw new Error('Неподдерживаемая структура файла.');
      }
      setModel(parsed);
      setPreviewValues(defaultASPreviewValues(parsed.inputFields));
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось прочитать JSON.');
    }
  };

  const reset = () => {
    const next = cloneDefaultModel();
    setModel(next);
    setPreviewValues(defaultASPreviewValues(next.inputFields));
    setSavedAt(null);
    setImportError('');
  };

  return (
    <div className="as-admin min-h-screen bg-[#eef1f4] text-slate-900">
      <header className="border-b-4 border-blue-700 bg-[#111827] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <a
              href="./"
              className="mt-1 rounded-lg border border-white/20 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Вернуться в калькулятор"
            >
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300">
                  ИНСИ · Методология проектирования
                </span>
                <span className="rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-300">
                  Черновик модели
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Конструктор расчётной модели АС
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Рабочая форма руководителя проектной группы: исходные данные, состав выдачи,
                трудоёмкость, коэффициенты и калибровка по завершённым объектам.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void importJSON(event.target.files?.[0])}
            />
            <button className="admin-dark-button" onClick={() => importRef.current?.click()}>
              <Upload className="h-4 w-4" /> Импорт
            </button>
            <button className="admin-dark-button" onClick={exportJSON}>
              <Download className="h-4 w-4" /> Экспорт JSON
            </button>
            <button className="admin-primary-button" onClick={save}>
              <Save className="h-4 w-4" /> Сохранить модель
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="order-2 space-y-6 lg:order-1">
          {(importError || issues.length > 0) && (
            <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <strong className="block">Модель требует внимания</strong>
                  {importError && <p>{importError}</p>}
                  {issues.map((issue) => <p key={issue}>{issue}</p>)}
                </div>
              </div>
            </div>
          )}

          <section className="admin-sheet">
            <SectionHeader
              icon={<ClipboardList className="h-5 w-5" />}
              title="01 / Паспорт методики"
              description="Зафиксируйте владельца, статус и коммерческие параметры модели. Эти значения не попадают в калькулятор КМ."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="admin-field md:col-span-2">
                <span>Название методики</span>
                <input value={model.name} onChange={(e) => patchModel({ name: e.target.value })} />
              </label>
              <label className="admin-field">
                <span>Статус</span>
                <select value={model.status} onChange={(e) => patchModel({ status: e.target.value as ASModel['status'] })}>
                  <option value="draft">Черновик</option>
                  <option value="review">На согласовании</option>
                  <option value="approved">Утверждена</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Владелец методики</span>
                <input value={model.owner} onChange={(e) => patchModel({ owner: e.target.value })} placeholder="ФИО / должность" />
              </label>
              <label className="admin-field">
                <span>Стоимость нормо-часа</span>
                <input type="number" min="1" value={model.baseHourlyRateRub} onChange={(e) => patchModel({ baseHourlyRateRub: numberValue(e.target.value) })} />
                <em>руб./ч</em>
              </label>
              <label className="admin-field">
                <span>Накладные расходы</span>
                <input type="number" min="0" value={model.overheadPercent} onChange={(e) => patchModel({ overheadPercent: numberValue(e.target.value) })} />
                <em>%</em>
              </label>
              <label className="admin-field">
                <span>Резерв сложности</span>
                <input type="number" min="0" value={model.riskReservePercent} onChange={(e) => patchModel({ riskReservePercent: numberValue(e.target.value) })} />
                <em>%</em>
              </label>
              <label className="admin-field">
                <span>Минимальная стоимость</span>
                <input type="number" min="0" step="1000" value={model.minimumPriceRub} onChange={(e) => patchModel({ minimumPriceRub: numberValue(e.target.value) })} />
                <em>руб.</em>
              </label>
              <label className="admin-field">
                <span>Шаг округления</span>
                <input type="number" min="1" step="1000" value={model.roundingStepRub} onChange={(e) => patchModel({ roundingStepRub: numberValue(e.target.value) })} />
                <em>руб.</em>
              </label>
            </div>
          </section>

          <section className="admin-sheet">
            <SectionHeader
              icon={<Settings2 className="h-5 w-5" />}
              title="02 / Исходные поля калькулятора"
              description="Опишите данные, которые менеджер должен будет вводить для расчёта АС. Идентификатор используется для связи с пакетами работ."
              action={<button className="admin-outline-button" onClick={addField}><Plus className="h-4 w-4" /> Добавить поле</button>}
            />
            <div className="space-y-3">
              {model.inputFields.map((field, index) => (
                <article key={field.id} className="admin-record">
                  <div className="admin-record-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <label className="admin-field xl:col-span-2"><span>Название</span><input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} /></label>
                    <label className="admin-field"><span>Идентификатор</span><input value={field.id} disabled /></label>
                    <label className="admin-field"><span>Тип</span><select value={field.type} onChange={(e) => {
                      const type = e.target.value as ASInputField['type'];
                      updateField(field.id, {
                        type,
                        defaultValue: type === 'boolean' ? false : type === 'select' ? '' : 0,
                        options: type === 'select' ? field.options ?? [{ id: 'option_1', label: 'Вариант 1', multiplier: 1 }] : undefined,
                      });
                    }}><option value="number">Число</option><option value="select">Список</option><option value="boolean">Да / нет</option></select></label>
                    <label className="admin-field"><span>Единица</span><input value={field.unit} onChange={(e) => updateField(field.id, { unit: e.target.value })} /></label>
                    <label className="admin-check"><input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} /><span>Обязательное</span></label>
                    <label className="admin-field md:col-span-2 xl:col-span-5"><span>Пояснение руководителя</span><input value={field.description} onChange={(e) => updateField(field.id, { description: e.target.value })} /></label>
                    <button
                      className="admin-delete-button"
                      aria-label={`Удалить поле ${field.label}`}
                      onClick={() => {
                        patchModel({ inputFields: model.inputFields.filter(({ id }) => id !== field.id) });
                        setPreviewValues((current) => {
                          const next = { ...current };
                          delete next[field.id];
                          return next;
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Удалить
                    </button>
                    {field.type === 'number' && (
                      <div className="grid gap-3 border-t border-slate-200 pt-3 md:col-span-2 md:grid-cols-4 xl:col-span-6">
                        <label className="admin-field"><span>По умолчанию</span><input type="number" value={Number(field.defaultValue)} onChange={(e) => updateField(field.id, { defaultValue: numberValue(e.target.value) })} /></label>
                        <label className="admin-field"><span>Минимум</span><input type="number" value={field.min ?? 0} onChange={(e) => updateField(field.id, { min: numberValue(e.target.value) })} /></label>
                        <label className="admin-field"><span>Максимум</span><input type="number" value={field.max ?? ''} placeholder="Без ограничения" onChange={(e) => updateField(field.id, { max: e.target.value === '' ? undefined : numberValue(e.target.value) })} /></label>
                        <label className="admin-field"><span>Шаг</span><input type="number" min="0.01" value={field.step ?? 1} onChange={(e) => updateField(field.id, { step: numberValue(e.target.value) })} /></label>
                      </div>
                    )}
                    {field.type === 'select' && (
                      <div className="space-y-2 border-t border-slate-200 pt-3 md:col-span-2 xl:col-span-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-500">Варианты и множители</span>
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="admin-field min-w-44">
                              <span>По умолчанию</span>
                              <select value={String(field.defaultValue)} onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}>
                                <option value="">Не выбрано</option>
                                {field.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                              </select>
                            </label>
                            <button
                              className="admin-mini-button min-h-[38px]"
                              onClick={() => updateField(field.id, {
                                options: [
                                  ...(field.options ?? []),
                                  { id: createId('option'), label: 'Новый вариант', multiplier: 1 },
                                ],
                              })}
                            >
                              <Plus className="h-3.5 w-3.5" /> Вариант
                            </button>
                          </div>
                        </div>
                        {field.options?.map((option) => (
                          <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_120px_38px]">
                            <input
                              className="admin-compact-input"
                              value={option.label}
                              onChange={(e) => updateField(field.id, {
                                options: field.options?.map((item) =>
                                  item.id === option.id ? { ...item, label: e.target.value } : item,
                                ),
                              })}
                            />
                            <input
                              className="admin-compact-input"
                              type="number"
                              min="0"
                              step="0.05"
                              value={option.multiplier}
                              aria-label={`Множитель ${option.label}`}
                              onChange={(e) => updateField(field.id, {
                                options: field.options?.map((item) =>
                                  item.id === option.id
                                    ? { ...item, multiplier: numberValue(e.target.value) }
                                    : item,
                                ),
                              })}
                            />
                            <button
                              className="admin-icon-delete"
                              aria-label={`Удалить вариант ${option.label}`}
                              onClick={() => updateField(field.id, {
                                options: field.options?.filter(({ id }) => id !== option.id),
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {field.type === 'boolean' && (
                      <label className="admin-check border-t border-slate-200 pt-3 md:col-span-2 xl:col-span-6">
                        <input
                          type="checkbox"
                          checked={Boolean(field.defaultValue)}
                          onChange={(e) => updateField(field.id, { defaultValue: e.target.checked })}
                        />
                        <span>Значение по умолчанию: {field.defaultValue ? 'Да' : 'Нет'}</span>
                      </label>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-sheet">
            <SectionHeader
              icon={<Calculator className="h-5 w-5" />}
              title="03 / Состав работ и коэффициенты"
              description="Каждая строка формирует отдельную позицию расчёта. Для переменной работы выберите исходное поле, размер единицы и часы на единицу."
              action={<button className="admin-outline-button" onClick={addPackage}><Plus className="h-4 w-4" /> Добавить работу</button>}
            />
            <div className="space-y-3">
              {model.workPackages.map((workPackage, index) => (
                <article key={workPackage.id} className={`admin-record ${workPackage.enabled ? '' : 'opacity-55'}`}>
                  <div className="admin-record-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                    <label className="admin-check xl:col-span-1"><input type="checkbox" checked={workPackage.enabled} onChange={(e) => updatePackage(workPackage.id, { enabled: e.target.checked })} /><span>В расчёте</span></label>
                    <label className="admin-field xl:col-span-3"><span>Наименование работы</span><input value={workPackage.name} onChange={(e) => updatePackage(workPackage.id, { name: e.target.value })} /></label>
                    <label className="admin-field"><span>Базовые часы</span><input type="number" min="0" value={workPackage.baseHours} onChange={(e) => updatePackage(workPackage.id, { baseHours: numberValue(e.target.value) })} /></label>
                    <label className="admin-field"><span>Режим</span><select value={workPackage.coefficientMode} onChange={(e) => updatePackage(workPackage.id, { coefficientMode: e.target.value as ASWorkPackage['coefficientMode'] })}><option value="fixed">Фиксированный</option><option value="per_unit">За каждую единицу</option><option value="range">За диапазон</option></select></label>
                    <label className="admin-field"><span>Коэф. сложности</span><input type="number" min="0" step="0.05" value={workPackage.complexityMultiplier} onChange={(e) => updatePackage(workPackage.id, { complexityMultiplier: numberValue(e.target.value) })} /></label>
                    <label className="admin-field md:col-span-2 xl:col-span-3"><span>Описание результата</span><input value={workPackage.description} onChange={(e) => updatePackage(workPackage.id, { description: e.target.value })} /></label>
                    {workPackage.coefficientMode !== 'fixed' && (
                      <>
                        <label className="admin-field xl:col-span-2"><span>Исходное поле</span><select value={workPackage.driverFieldId ?? ''} onChange={(e) => updatePackage(workPackage.id, { driverFieldId: e.target.value })}><option value="">Не выбрано</option>{model.inputFields.filter(({ type }) => type === 'number').map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select></label>
                        <label className="admin-field"><span>Размер единицы</span><input type="number" min="0.01" value={workPackage.unitSize ?? 1} onChange={(e) => updatePackage(workPackage.id, { unitSize: numberValue(e.target.value) })} /></label>
                        <label className="admin-field"><span>Часов на единицу</span><input type="number" min="0" value={workPackage.hoursPerUnit ?? 0} onChange={(e) => updatePackage(workPackage.id, { hoursPerUnit: numberValue(e.target.value) })} /></label>
                      </>
                    )}
                    <button className="admin-delete-button xl:col-start-7" onClick={() => patchModel({ workPackages: model.workPackages.filter(({ id }) => id !== workPackage.id) })}>
                      <Trash2 className="h-4 w-4" /> Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-sheet">
            <SectionHeader
              icon={<FlaskConical className="h-5 w-5" />}
              title="04 / Калибровка по завершённым объектам"
              description="Заполните фактические часы и договорную стоимость. Для утверждения модели желательно не менее 10 репрезентативных объектов."
              action={<button className="admin-outline-button" onClick={addProject}><Plus className="h-4 w-4" /> Добавить объект</button>}
            />
            {model.calibrationProjects.length === 0 ? (
              <button className="admin-empty-state" onClick={addProject}>
                <Plus className="h-5 w-5" />
                Добавить первый завершённый объект
              </button>
            ) : (
              <div className="space-y-3">
                {model.calibrationProjects.map((project, index) => (
                  <article key={project.id} className="admin-record">
                    <div className="admin-record-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                      <label className="admin-field xl:col-span-2"><span>Объект</span><input value={project.name} onChange={(e) => updateProject(project.id, { name: e.target.value })} /></label>
                      <label className="admin-field"><span>Тип здания</span><input value={project.buildingType} onChange={(e) => updateProject(project.id, { buildingType: e.target.value })} /></label>
                      <label className="admin-field"><span>Площадь, м²</span><input type="number" min="1" value={project.areaM2} onChange={(e) => updateProject(project.id, { areaM2: numberValue(e.target.value) })} /></label>
                      <label className="admin-field"><span>Этажей</span><input type="number" min="1" value={project.storeys} onChange={(e) => updateProject(project.id, { storeys: numberValue(e.target.value) })} /></label>
                      <label className="admin-field"><span>Факт, часов</span><input type="number" min="0" value={project.actualHours} onChange={(e) => updateProject(project.id, { actualHours: numberValue(e.target.value) })} /></label>
                      <label className="admin-field"><span>Цена, руб.</span><input type="number" min="0" step="1000" value={project.actualPriceRub} onChange={(e) => updateProject(project.id, { actualPriceRub: numberValue(e.target.value) })} /></label>
                      <label className="admin-field md:col-span-2 xl:col-span-6"><span>Комментарий</span><input value={project.notes} onChange={(e) => updateProject(project.id, { notes: e.target.value })} /></label>
                      <button className="admin-delete-button" onClick={() => patchModel({ calibrationProjects: model.calibrationProjects.filter(({ id }) => id !== project.id) })}><Trash2 className="h-4 w-4" /> Удалить</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-sheet">
            <SectionHeader
              icon={<FileJson className="h-5 w-5" />}
              title="05 / Методические замечания"
              description="Запишите допущения, ограничения и решения, которые должен проверить технический директор."
            />
            <textarea
              className="min-h-36 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={model.notes}
              onChange={(e) => patchModel({ notes: e.target.value })}
            />
          </section>
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-5 lg:self-start">
          <section className="overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-xl">
            <div className="border-b border-slate-800 px-5 py-4">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Контрольный расчёт
              </span>
              <h2 className="mt-1 text-xl font-black">Предпросмотр модели</h2>
            </div>
            <div className="space-y-4 p-5">
              {model.inputFields.map((field) => (
                <label key={field.id} className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-300">
                    {field.label}
                    {field.unit && <em className="font-mono text-[9px] not-italic text-slate-500">{field.unit}</em>}
                  </span>
                  {field.type === 'number' && (
                    <input className="admin-preview-input" type="number" min={field.min} max={field.max} step={field.step} value={Number(previewValues[field.id] ?? 0)} onChange={(e) => setPreviewValues((current) => ({ ...current, [field.id]: numberValue(e.target.value) }))} />
                  )}
                  {field.type === 'select' && (
                    <select className="admin-preview-input" value={String(previewValues[field.id] ?? '')} onChange={(e) => setPreviewValues((current) => ({ ...current, [field.id]: e.target.value }))}>
                      <option value="">Выберите</option>
                      {field.options?.map((option) => <option key={option.id} value={option.id}>{option.label} ×{option.multiplier}</option>)}
                    </select>
                  )}
                  {field.type === 'boolean' && (
                    <button
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm font-bold transition ${previewValues[field.id] ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                      onClick={() => setPreviewValues((current) => ({ ...current, [field.id]: !current[field.id] }))}
                    >
                      {previewValues[field.id] ? 'Да' : 'Нет'}
                    </button>
                  )}
                </label>
              ))}
            </div>
            <div className="border-t border-slate-800 bg-slate-900/70 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="admin-metric-label">Трудоёмкость</span><strong className="admin-metric-value">{estimate.hours} ч</strong></div>
                <div><span className="admin-metric-label">Пакетов работ</span><strong className="admin-metric-value">{estimate.enabledPackages}</strong></div>
              </div>
              <div className="mt-5 border-t border-slate-700 pt-5">
                <span className="admin-metric-label">Расчётная стоимость АС</span>
                <strong className="mt-1 block text-3xl font-black tracking-tight text-blue-400">{rubles(estimate.priceRub)}</strong>
              </div>
              {estimate.calibrationAverageRateRub !== null && (
                <div className="mt-4 rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                  Средняя фактическая ставка: <strong>{rubles(estimate.calibrationAverageRateRub)}/ч</strong>
                </div>
              )}
            </div>
          </section>

          <section className="border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {issues.length === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              <strong className="text-sm">{issues.length === 0 ? 'Структура модели корректна' : `Замечаний: ${issues.length}`}</strong>
            </div>
            <dl className="mt-4 space-y-2 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between"><dt>Версия</dt><dd>v{model.version}</dd></div>
              <div className="flex justify-between"><dt>Исходных полей</dt><dd>{model.inputFields.length}</dd></div>
              <div className="flex justify-between"><dt>Работ</dt><dd>{model.workPackages.length}</dd></div>
              <div className="flex justify-between"><dt>Объектов калибровки</dt><dd>{model.calibrationProjects.length}</dd></div>
              <div className="flex justify-between"><dt>Последнее сохранение</dt><dd>{savedAt ?? 'нет'}</dd></div>
            </dl>
            <button className="mt-5 flex w-full items-center justify-center gap-2 border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Сбросить к шаблону
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
}
