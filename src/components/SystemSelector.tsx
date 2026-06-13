import React from 'react';
import type { SystemType } from '../types/calculator';
import { Shield, HardHat, Building2, Factory, Construction, Compass } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {SYSTEMS.map((sys) => {
        const Icon = sys.icon;
        const isSelected = selected === sys.name;
        
        return (
          <button
            key={sys.name}
            type="button"
            onClick={() => onChange(sys.name)}
            className={`group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-300 sm:min-h-0 sm:p-5 ${
              isSelected 
                ? 'border-insi-blue ring-2 ring-insi-blue/20 bg-gradient-to-br from-white to-insi-blue/5 scale-[1.02]' 
                : 'border-insi-slate-200/80 hover:border-insi-slate-300 hover:shadow-md hover:scale-[1.01]'
            }`}
          >
            {/* Background Decorative Gradient */}
            <div className={`absolute -right-12 -bottom-12 w-28 h-28 rounded-full bg-gradient-to-br ${sys.color} blur-2xl group-hover:scale-125 transition-transform duration-500 opacity-60`} />
            
            <div>
              {/* Badge & Icon Header */}
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className={`rounded-xl bg-gradient-to-br p-2 sm:p-2.5 ${sys.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline ${
                  isSelected 
                    ? 'bg-insi-blue text-white' 
                    : 'bg-insi-slate-100 text-insi-slate-600 group-hover:bg-insi-slate-200'
                }`}>
                  {sys.badge}
                </span>
              </div>
              
              {/* Name & Description */}
              <h3 className="mb-1 text-sm font-bold text-insi-slate-900 transition-colors group-hover:text-insi-blue sm:mb-2 sm:text-base">
                {sys.name}
              </h3>
              <p className="mb-4 hidden text-xs leading-relaxed text-insi-slate-500 sm:block">
                {sys.description}
              </p>
            </div>
            
            {/* Features list */}
            <div className="mt-auto hidden w-full border-t border-insi-slate-100 pt-3 sm:block">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {sys.features.map((feat, idx) => (
                  <span key={idx} className="text-[10px] text-insi-slate-400 flex items-center">
                    <span className={`w-1 h-1 rounded-full mr-1.5 ${isSelected ? 'bg-insi-blue' : 'bg-insi-slate-300'}`} />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
export default SystemSelector;
