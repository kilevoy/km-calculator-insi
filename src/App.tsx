import { useRef, useState } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { SystemSelector } from './components/SystemSelector';
import { RoofSelector } from './components/RoofSelector';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultCard } from './components/ResultCard';
import { SavedCalculations } from './components/SavedCalculations';
import { PDFReport } from './components/PDFReport';
import { Calculator, Settings, History, FileText } from 'lucide-react';

function App() {
  const {
    params,
    setParams,
    updateParam,
    result,
    validationAlerts,
    shareUrl,
  } = useCalculator();

  const reportRef = useRef<HTMLDivElement | null>(null);

  // Tab state for mobile layout
  const [activeTab, setActiveTab] = useState<'params' | 'result' | 'drafts'>('params');

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
            <span>Базовая цена: 80 000 руб/т</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-600 font-semibold">Все системы активны</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Intro Info Banner */}
        <section className="bg-gradient-to-r from-insi-blue/5 to-transparent border border-insi-blue/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-insi-slate-900">Быстрый старт расчета сметы</h2>
            <p className="text-xs text-insi-slate-500 leading-normal max-w-2xl">
              Выберите конструктивную систему каркаса здания ниже, заполните геометрические параметры и надстройки в форме. Результат, срок и структура стоимости рассчитаются автоматически.
            </p>
          </div>
          <div className="text-[10px] text-insi-slate-400 font-medium border border-insi-slate-200 bg-white px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
            Версия Excel-калькулятора: <span className="font-bold text-insi-slate-700">R2.0.1</span>
          </div>
        </section>

        {/* Step 1: System Selection */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
            Шаг 1 — Конструктивная система
          </h2>
          <SystemSelector selected={params.system} onChange={(sys) => updateParam('system', sys)} />
        </section>

        {/* Step 2: Roof Selection */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-insi-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-insi-blue rounded-full" />
            Шаг 2 — Тип кровли здания
          </h2>
          <RoofSelector selected={params.roof_type} system={params.system} onChange={(roof) => updateParam('roof_type', roof)} />
        </section>

        {/* Responsive Mobile Tabs (displayed on screens under lg) */}
        <div className="lg:hidden border-b border-insi-slate-200 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('params')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'params' 
                ? 'border-insi-blue text-insi-blue bg-insi-blue/5 rounded-t-lg' 
                : 'border-transparent text-insi-slate-500'
            }`}
          >
            <Settings className="w-4 h-4" />
            Параметры
          </button>
          <button
            onClick={() => setActiveTab('result')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'result' 
                ? 'border-insi-blue text-insi-blue bg-insi-blue/5 rounded-t-lg' 
                : 'border-transparent text-insi-slate-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            Результаты ({Math.round(result.cost)} тыс.)
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'drafts' 
                ? 'border-insi-blue text-insi-blue bg-insi-blue/5 rounded-t-lg' 
                : 'border-transparent text-insi-slate-500'
            }`}
          >
            <History className="w-4 h-4" />
            Черновики
          </button>
        </div>

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
            />
          </div>

          {/* Drafts section displayed on tab in mobile */}
          <div className={`lg:hidden ${activeTab !== 'drafts' ? 'hidden' : ''}`}>
            <SavedCalculations
              currentParams={params}
              currentCost={result.cost}
              onLoad={(loaded) => {
                setParams(loaded);
                setActiveTab('params');
              }}
            />
          </div>
        </div>
      </main>

      {/* Hidden printable A4 report component for PDF output rendering */}
      <PDFReport params={params} result={result} reportRef={reportRef} />

      {/* Footer */}
      <footer className="bg-white border-t border-insi-slate-200/80 py-6 px-6 mt-12 text-center text-xs text-insi-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} ИНСИ. Все права защищены. Калькулятор стоимости проектных работ марки КМ.</span>
          <div className="flex gap-4">
            <a href="https://www.insi.ru" target="_blank" rel="noopener noreferrer" className="hover:text-insi-blue transition-colors">Официальный сайт ИНСИ</a>
            <span>•</span>
            <span className="text-insi-slate-500">Отдел металлоконструкций</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
