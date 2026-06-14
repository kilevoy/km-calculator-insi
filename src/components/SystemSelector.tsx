import React from 'react';
import type { SystemType } from '../types/calculator';
import { Shield, HardHat, Building2, Factory, Construction, Compass, Check, HelpCircle } from 'lucide-react';

interface SystemSelectorProps {
  selected: SystemType;
  onChange: (system: SystemType) => void;
}

interface SystemItem {
  name: SystemType;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}

const SYSTEMS: SystemItem[] = [
  {
    name: 'Спринт-М',
    description: 'Быстровозводимые здания на основе оцинкованных С-образных профилей. Легкие ферменные конструкции.',
    features: ['Пролеты до 24м', 'Высота до 8м', 'Минимальный фундамент'],
    icon: Compass,
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600',
    badge: 'Популярно',
  },
  {
    name: 'Спринт-2М',
    description: 'Второе поколение серии Спринт с оптимизированной металлоемкостью и ускоренным монтажом каркаса.',
    features: ['Пролеты до 24м', 'Облегченный вес', 'Высокая прочность'],
    icon: Shield,
    color: 'from-sky-500/10 to-cyan-500/10 border-sky-500/20 text-sky-600',
    badge: 'Эффективно',
  },
  {
    name: 'Великан',
    description: 'Тяжелые большепролетные здания на основе сварной двутавровой балки переменного сечения.',
    features: ['Пролеты до 36м+', 'Опорные/подвесные краны', 'Подстропильные фермы'],
    icon: Factory,
    color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-600',
    badge: 'Сверхпрочно',
  },
  {
    name: 'Атлант',
    description: 'Большепролетные рамные конструкции из сварных балок. Идеально для крупных складов и цехов.',
    features: ['Пролеты до 36м+', 'Крановые нагрузки', 'Свободная планировка'],
    icon: Building2,
    color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-600',
    badge: 'Премиум',
  },
  {
    name: 'Атлант-М',
    description: 'Модернизированная версия Атлант с уменьшенным весом рам при сохранении несущей способности.',
    features: ['Пролеты до 36м+', 'Оптимизированный узел', 'Любые типы кровли'],
    icon: Construction,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600',
    badge: 'Новинка',
  },
  {
    name: 'Крон',
    description: 'Мощная система рамных каркасов для жестких климатических и сейсмических нагрузок.',
    features: ['Пролеты до 30м', 'Высокая сейсмостойкость', 'Двускатная/односкатная'],
    icon: HardHat,
    color: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-600',
    badge: 'Сейсмостойко',
  },
];

export const SystemSelector: React.FC<SystemSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {SYSTEMS.map((sys, index) => {
        const Icon = sys.icon;
        const isSelected = selected === sys.name;
        const mobileTooltipAlignment =
          index % 2 === 0 ? 'left-0 right-auto translate-x-0' : 'left-auto right-0 translate-x-0';
        const tabletTooltipAlignment =
          index % 3 === 0
            ? 'sm:left-0 sm:right-auto sm:translate-x-0'
            : index % 3 === 1
              ? 'sm:left-1/2 sm:right-auto sm:-translate-x-1/2'
              : 'sm:left-auto sm:right-0 sm:translate-x-0';
        const desktopTooltipAlignment =
          index === 0
            ? 'xl:left-0 xl:right-auto xl:translate-x-0'
            : index === SYSTEMS.length - 1
              ? 'xl:left-auto xl:right-0 xl:translate-x-0'
              : 'xl:left-1/2 xl:right-auto xl:-translate-x-1/2';
        const tooltipAlignment = `${mobileTooltipAlignment} ${tabletTooltipAlignment} ${desktopTooltipAlignment}`;

        return (
          <div key={sys.name} className="group relative">
            <button
              type="button"
              onClick={() => onChange(sys.name)}
              aria-pressed={isSelected}
              aria-describedby={`system-help-${index}`}
              className={`relative flex min-h-[82px] w-full overflow-hidden rounded-xl border bg-white px-3 py-3 text-left shadow-sm transition-all duration-200 ${
                isSelected
                  ? 'scale-[1.01] border-insi-blue bg-gradient-to-br from-white to-insi-blue/5 ring-2 ring-insi-blue/20'
                  : 'border-insi-slate-200/80 hover:-translate-y-0.5 hover:border-insi-slate-300 hover:shadow-md'
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${sys.color} transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                }`}
              />
              <span
                className={`absolute -bottom-6 right-0 h-20 w-20 rounded-full bg-gradient-to-br ${sys.color} opacity-60 blur-2xl transition-transform duration-500 group-hover:scale-125`}
              />

              <span className="relative flex w-full items-start gap-2.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${sys.color} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-1">
                    <span className="block truncate text-sm font-bold leading-5 text-insi-slate-900 transition-colors group-hover:text-insi-blue">
                      {sys.name}
                    </span>
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? 'border-insi-blue bg-insi-blue text-white'
                          : 'border-insi-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-medium leading-4 text-insi-slate-500">
                    {sys.features[0]}
                  </span>
                  <span
                    className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                      isSelected ? 'bg-insi-blue text-white' : 'bg-insi-slate-100 text-insi-slate-500'
                    }`}
                  >
                    {sys.badge}
                  </span>
                </span>

                <HelpCircle className="absolute bottom-0 right-0 h-3.5 w-3.5 text-insi-slate-300 transition-colors group-hover:text-insi-blue" />
              </span>
            </button>

            <div
              id={`system-help-${index}`}
              role="tooltip"
              className={`pointer-events-none invisible absolute top-[calc(100%+8px)] z-50 w-72 translate-y-1 rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-white opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${tooltipAlignment}`}
            >
              <span className="block text-sm font-bold">{sys.name}</span>
              <span className="mt-1.5 block text-xs leading-5 text-slate-300">{sys.description}</span>
              <span className="mt-3 block space-y-1.5">
                {sys.features.map((feature) => (
                  <span key={feature} className="flex items-start gap-2 text-[11px] font-medium leading-4 text-slate-200">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {feature}
                  </span>
                ))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default SystemSelector;
