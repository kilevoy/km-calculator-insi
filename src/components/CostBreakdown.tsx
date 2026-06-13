import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { CostBreakdownItem } from '../types/calculator';
import { formatRubles } from '../utils/formatters';

interface CostBreakdownProps {
  data: CostBreakdownItem[];
}

const COLOR_MAP: Record<string, string> = {
  'Каркас (база + пролеты + высота + длина)': '#2563eb', // Blue
  'Крановое оборудование': '#ea580c', // Orange
  'Антресоли': '#8b5cf6', // Purple/Violet
  'Перекрытия': '#06b6d4', // Cyan
  'Лестницы': '#f43f5e', // Rose
  'Кровля (обшивка + ограждения)': '#10b981', // Emerald
  'Стены и проемы (окна, двери, ворота)': '#f59e0b', // Amber
  'Перегородки': '#64748b', // Slate
  'Парапеты': '#ec4899', // Pink
};

const DEFAULT_COLOR = '#94a3b8';

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ data }) => {
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-insi-slate-400 text-xs">
        Нет данных для отображения структуры стоимости
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    color: COLOR_MAP[item.name] || DEFAULT_COLOR
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Chart container */}
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height={192} minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | string | readonly (number | string)[] | undefined) => [
                formatRubles(Number(Array.isArray(value) ? value[0] : value ?? 0)),
                'Стоимость',
              ]}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontFamily: 'sans-serif',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Total indicator in the center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-insi-slate-400">Смета</span>
          <span className="text-sm font-black text-insi-slate-800">Разделы КМ</span>
        </div>
      </div>

      {/* Legend & List breakdown */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-insi-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-insi-slate-600 truncate" title={item.name}>{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-medium">
              <span className="text-insi-slate-400 text-[10px] bg-insi-slate-100 px-1.5 py-0.5 rounded-md">
                {item.percentage.toFixed(1)}%
              </span>
              <span className="text-insi-slate-800 font-semibold text-[11px]">
                {formatRubles(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CostBreakdown;
