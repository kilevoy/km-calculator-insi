import React from 'react';
import type { RoofType, SystemType } from '../types/calculator';

interface RoofSelectorProps {
  selected: RoofType;
  system: SystemType;
  onChange: (roof: RoofType) => void;
}

interface RoofItem {
  id: RoofType;
  label: string;
  description: string;
  iconSvg: React.ReactNode;
}

const ROOF_TYPES: RoofItem[] = [
  {
    id: 'one_slope',
    label: 'Односкатная',
    description: 'Уклон в одну сторону. Экономичное решение для небольших пристроек или складов.',
    iconSvg: (
      <svg className="w-12 h-8 stroke-current fill-none" viewBox="0 0 48 32">
        <path d="M 6 24 L 6 18 L 42 10 L 42 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'two_slope',
    label: 'Двускатная',
    description: 'Классическая симметричная кровля. Оптимальный сход снега, универсальное применение.',
    iconSvg: (
      <svg className="w-12 h-8 stroke-current fill-none" viewBox="0 0 48 32">
        <path d="M 6 24 L 6 18 L 24 8 L 42 18 L 42 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'flat',
    label: 'Плоская',
    description: 'Минимальный уклон. Современный вид, легкий монтаж СП панелей. Подходит для Атлант и Великан.',
    iconSvg: (
      <svg className="w-12 h-8 stroke-current fill-none" viewBox="0 0 48 32">
        <path d="M 6 24 L 6 14 L 42 14 L 42 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'multi_slope',
    label: 'Многоскатная',
    description: 'Сложная кровля с несколькими коньками или перепадами. Для составных широких цехов.',
    iconSvg: (
      <svg className="w-12 h-8 stroke-current fill-none" viewBox="0 0 48 32">
        <path d="M 6 24 L 6 18 L 15 10 L 24 18 L 33 10 L 42 18 L 42 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
];

export const RoofSelector: React.FC<RoofSelectorProps> = ({ selected, system, onChange }) => {
  const isSystemRestricted = (roofId: RoofType) => {
    // Sprint-M, Sprint-2M, and Kron only support one_slope and two_slope
    const restrictedSystems: SystemType[] = ['Спринт-М', 'Спринт-2М', 'Крон'];
    return restrictedSystems.includes(system) && (roofId === 'flat' || roofId === 'multi_slope');
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      {ROOF_TYPES.map((roof) => {
        const isRestricted = isSystemRestricted(roof.id);
        const isSelected = selected === roof.id;
        
        return (
          <div key={roof.id} className="relative group/tooltip">
            <button
              type="button"
              disabled={isRestricted}
              onClick={() => !isRestricted && onChange(roof.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left ${
                isRestricted
                  ? 'bg-insi-slate-100/50 border-insi-slate-200 text-insi-slate-400 cursor-not-allowed opacity-50'
                  : isSelected
                    ? 'border-insi-blue ring-2 ring-insi-blue/20 bg-insi-blue/5 text-insi-blue shadow-sm scale-[1.01]'
                    : 'border-insi-slate-200/80 bg-white hover:border-insi-slate-300 hover:shadow-sm text-insi-slate-700 hover:text-insi-blue'
              }`}
            >
              {/* Roof Icon Outline */}
              <div className={`mb-3 transition-transform duration-300 ${isRestricted ? '' : 'group-hover:translate-y-[-2px]'}`}>
                {roof.iconSvg}
              </div>
              
              <h4 className={`text-sm font-bold mb-1 ${isRestricted ? 'text-insi-slate-500' : isSelected ? 'text-insi-blue-dark' : 'text-insi-slate-900'}`}>
                {roof.label}
              </h4>
              
              <p className="text-[11px] leading-snug text-insi-slate-500 sm:block hidden">
                {roof.description}
              </p>
            </button>
            
            {/* Warning Tooltip for Restricted Options */}
            {isRestricted && (
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-insi-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none text-center">
                Система {system} не имеет плоского или многоскатного конструктива. Выберите Великан, Атлант или Атлант-М.
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-insi-slate-900" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default RoofSelector;
