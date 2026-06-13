import React, { useState } from 'react';
import type { CalculatorParams } from '../types/calculator';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { hydrateCalculatorParams } from '../logic/params';
import { Save, Trash2, FolderOpen, Edit3, Check, X } from 'lucide-react';

interface SavedCalculation {
  id: string;
  name: string;
  timestamp: number;
  params: CalculatorParams;
  cost: number;
}

interface SavedCalculationsProps {
  currentParams: CalculatorParams;
  currentCost: number;
  onLoad: (params: CalculatorParams) => void;
}

function hydrateSavedCalculations(value: unknown): SavedCalculation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const candidate = item as Partial<SavedCalculation>;
    if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return [];
    return [{
      id: candidate.id,
      name: candidate.name.slice(0, 200),
      timestamp: typeof candidate.timestamp === 'number' && Number.isFinite(candidate.timestamp)
        ? candidate.timestamp
        : Date.now(),
      params: hydrateCalculatorParams(candidate.params),
      cost: typeof candidate.cost === 'number' && Number.isFinite(candidate.cost) ? candidate.cost : 0,
    }];
  });
}

export const SavedCalculations: React.FC<SavedCalculationsProps> = ({
  currentParams,
  currentCost,
  onLoad,
}) => {
  const [savedCalcs, setSavedCalcs] = useLocalStorage<SavedCalculation[]>(
    'insi_saved_calculations_v2',
    [],
    hydrateSavedCalculations,
  );
  const [draftName, setDraftName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const area = currentParams.building_length_m * currentParams.span_widths_m.reduce((sum, span) => sum + span, 0);
    const name = draftName.trim() || `${currentParams.system}, ${Math.round(area)}м², ${formatDate(new Date())}`;
    
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      params: structuredClone(currentParams),
      cost: currentCost,
    };

    setSavedCalcs(prev => [newCalc, ...prev]);
    setDraftName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCalcs(prev => prev.filter(c => c.id !== id));
  };

  const startEditing = (calc: SavedCalculation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(calc.id);
    setEditingName(calc.name);
  };

  const saveEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      setSavedCalcs(prev =>
        prev.map(c => (c.id === id ? { ...c, name: editingName.trim() } : c))
      );
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-insi-slate-200/80 p-6 shadow-sm">
      <h3 className="text-base font-bold text-insi-slate-900 mb-4 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-insi-blue" />
        Сохраненные расчеты (черновики)
      </h3>

      {/* Save Draft Form */}
      <form onSubmit={handleSave} className="flex gap-2 mb-6">
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Название черновика (например, Склад Кран-балка)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-insi-slate-200 text-xs focus:ring-2 focus:ring-insi-blue/20 focus:border-insi-blue outline-none transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-insi-blue hover:bg-insi-blue-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          Сохранить
        </button>
      </form>

      {/* List */}
      {savedCalcs.length === 0 ? (
        <div className="text-center py-8 text-xs text-insi-slate-400">
          У вас пока нет сохраненных черновиков. Вы можете сохранить текущую конфигурацию выше.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {savedCalcs.map((calc) => (
            <div
              key={calc.id}
              onClick={() => onLoad(calc.params)}
              className="group/item flex items-center justify-between p-3.5 rounded-xl border border-insi-slate-100 hover:border-insi-blue/30 hover:bg-insi-blue/5 transition-all duration-200 cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                {editingId === calc.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-2 py-1 border border-insi-blue rounded-md text-xs focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => saveEditing(calc.id, e)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-insi-slate-800 truncate block">
                      {calc.name}
                    </span>
                    <button
                      onClick={(e) => startEditing(calc, e)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-insi-slate-400 hover:text-insi-blue hover:bg-insi-slate-100 rounded transition-all"
                      title="Переименовать"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-insi-slate-400 block mt-0.5">
                  {calc.params.system} • {Math.round(calc.params.building_length_m * calc.params.span_widths_m.reduce((sum, span) => sum + span, 0))} м² • {formatDate(new Date(calc.timestamp))}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-insi-slate-700">
                  {formatCurrency(calc.cost)}
                </span>
                <button
                  onClick={(e) => handleDelete(calc.id, e)}
                  className="p-1.5 text-insi-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Удалить черновик"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SavedCalculations;
