import { useRef, useState } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { SystemSelector } from './components/SystemSelector';
import { RoofSelector } from './components/RoofSelector';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultCard } from './components/ResultCard';
import { SavedCalculations } from './components/SavedCalculations';
import { PDFReport } from './components/PDFReport';
import { Calculator, Settings, History, FileText } from 'lucide-react';
import { formatCurrency, formatDays } from './utils/formatters';
import { createCalculationNumber } from './utils/report-identity';
import { AdminASModelPage } from './components/AdminASModelPage';
import { AdminKMModelPage } from './components/AdminKMModelPage';

function CalculatorApp() {
  const {
    params,
    setParams,
    updateParam,
    result,
    validationAlerts,
    shareUrl,
  } = useCalculator();

  const reportRef = useRef<HTMLDivElement | null>(null);
  const mobileWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const [calculationNumber] = useState(() => createCalculationNumber());

  // Tab state for mobile layout
  const [activeTab, setActiveTab] = useState<'params' | 'result' | 'drafts'>('params');
  const selectMobileTab = (tab: 'params' | 'result' | 'drafts') => {
    setActiveTab(tab);
    window.setTimeout(() => {
      mobileWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-insi-slate-50 flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-insi-slate-200/80 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-insi-blue text-white rounded-xl shadow-md shadow-insi-blue/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-insi-slate-900 leading-none">
                ИНСИ • Калькулятор КМ
              </h1>
              <span className="text-[10px] text-insi-slate-400 font-bold uppercase tracking-wider block mt-1">
                Расчет стоимости проектных работ КМ
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-xs font-medium text-insi-slate-500 sm:flex">
            <a href="?admin=km" className="font-semibold text-orange-600 hover:underline">Модель КМ</a>
            <a href="?admin=as" className="font-semibold text-insi-blue hover:underline">Модель АС</a>
            <span>Базовая цена: {params.base_price_rub.toLocaleString('ru-RU')} руб.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-600 font-semibold">Все системы активны</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Intro Info Banner */}
        <section className="bg-gradient-to-r from-insi-blue/5 to-transparent border border-insi-blue/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-insi-slate-900">Быстрый старт расчета сметы</h2>
            <p className="hidden text-xs text-insi-slate-500 leading-normal max-w-2xl sm:block">
              Выберите конструктивную систему каркаса здания ниже, заполните геометрические параметры и надстройки в форме. Результат, срок и структура стоимости рассчитаются автоматически.
            </p>
            <p className="text-xs text-insi-slate-500 sm:hidden">
              Система → параметры → готовое коммерческое предложение.
            </p>
          </div>
          <div className="text-[10px] text-insi-slate-400 font-medium border border-insi-slate-200 bg-white px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
            Версия Excel-калькулятора: <span className="font-bold text-insi-slate-700">R2.0.1</span>
          </div>
          <div className="flex gap-2 sm:hidden">
            <a href="?admin=km" className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-bold text-orange-700">Модель КМ</a>
            <a href="?admin=as" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">Модель АС</a>
          </div>
        </section>

        {/* Responsive Mobile Tabs (displayed on screens under lg) */}
        <div ref={mobileWorkspaceRef} className="scroll-mt-[73px] lg:hidden" />
        <div
          className="sticky top-[73px] z-20 -mx-4 border-y border-insi-slate-200 bg-insi-slate-50/95 px-4 py-2 backdrop-blur lg:hidden"
        >
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-insi-slate-200/70 p-1">
            <button
              onClick={() => selectMobileTab('params')}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold transition-colors ${
                activeTab === 'params' ? 'bg-white text-insi-blue shadow-sm' : 'text-insi-slate-500'
              }`}
            >
              <Settings className="h-4 w-4" />
              Параметры
            </button>
            <button
              onClick={() => selectMobileTab('result')}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold transition-colors ${
                activeTab === 'result' ? 'bg-white text-insi-blue shadow-sm' : 'text-insi-slate-500'
              }`}
            >
              <FileText className="h-4 w-4" />
              Результат
            </button>
            <button
              onClick={() => selectMobileTab('drafts')}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold transition-colors ${
                activeTab === 'drafts' ? 'bg-white text-insi-blue shadow-sm' : 'text-insi-slate-500'
              }`}
            >
              <History className="h-4 w-4" />
              Черновики
            </button>
          </div>
        </div>

        {/* Step 1: System Selection */}
        <section className={`space-y-3 ${activeTab === 'params' ? '' : 'hidden lg:block'}`}>
          <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
            Шаг 1 — Конструктивная система
          </h2>
          <SystemSelector selected={params.system} onChange={(sys) => updateParam('system', sys)} />
        </section>

        {/* Step 2: Roof Selection */}
        <section className={`space-y-3 ${activeTab === 'params' ? '' : 'hidden lg:block'}`}>
          <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
            Шаг 2 — Тип кровли здания
          </h2>
          <RoofSelector selected={params.roof_type} system={params.system} onChange={(roof) => updateParam('roof_type', roof)} />
        </section>

        {/* Two-Column Form & Sticky Result Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Parameter Form (Left, 60% on desktop) */}
          <div className={`lg:col-span-7 space-y-6 ${activeTab !== 'params' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
              Шаг 3 — Параметры объекта
            </h2>
            <CalculatorForm
              params={params}
              onChange={setParams}
              validationAlerts={validationAlerts}
            />

            {/* Local Storage drafts section directly underneath on desktop */}
            <div className="hidden lg:block">
              <SavedCalculations
                currentParams={params}
                currentCost={result.cost}
                onLoad={setParams}
              />
            </div>
          </div>

          {/* Column 2: Sticky Result Card (Right, 40% on desktop) */}
          <div className={`lg:col-span-5 ${activeTab !== 'result' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5 lg:mb-3">
              <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
              Шаг 4 — Коммерческое предложение
            </h2>
            <ResultCard
              params={params}
              result={result}
              shareUrl={shareUrl}
              reportRef={reportRef}
              calculationNumber={calculationNumber}
            />
          </div>

          {/* Drafts section displayed on tab in mobile */}
          <div className={`lg:hidden ${activeTab !== 'drafts' ? 'hidden' : ''}`}>
            <SavedCalculations
              currentParams={params}
              currentCost={result.cost}
              onLoad={(loaded) => {
                setParams(loaded);
                selectMobileTab('params');
              }}
            />
          </div>
        </div>
      </main>

      {/* Hidden printable A4 report component for PDF output rendering */}
      <PDFReport
        params={params}
        result={result}
        reportRef={reportRef}
        calculationNumber={calculationNumber}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-insi-slate-200/80 px-6 pb-24 pt-6 mt-12 text-center text-xs text-insi-slate-400 lg:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} ИНСИ. Все права защищены. Калькулятор стоимости проектных работ марки КМ.</span>
          <div className="flex gap-4">
            <a href="https://www.insi.ru" target="_blank" rel="noopener noreferrer" className="hover:text-insi-blue transition-colors">Официальный сайт ИНСИ</a>
            <span>•</span>
            <span className="text-insi-slate-500">Отдел металлоконструкций</span>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-insi-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-insi-slate-400">
              {result.status === 'valid' ? 'Стоимость и срок' : 'Нужна проверка'}
            </p>
            <p className="truncate text-base font-extrabold text-insi-slate-900">
              {result.status === 'valid'
                ? `${formatCurrency(result.cost)} · ${formatDays(result.term)}`
                : `${result.issues.filter(({ severity }) => severity === 'error').length} ошибок`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => selectMobileTab(activeTab === 'result' ? 'params' : 'result')}
            className="shrink-0 rounded-xl bg-insi-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-insi-blue-dark"
          >
            {activeTab === 'result' ? 'К параметрам' : 'Результат'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const adminPage = searchParams.get('admin');
  if (adminPage === 'km') return <AdminKMModelPage />;
  if (adminPage === 'as') return <AdminASModelPage />;
  return <CalculatorApp />;
}

export default App;
