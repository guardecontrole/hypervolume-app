
import React, { useState, useMemo } from 'react';
import { PlanItem } from '../types';
import { PREDEFINED_EXERCISES, CATEGORY_ORDER } from '../constants';
import { getMuscleEmoji, getExerciseCategory } from '../utils/helpers';

interface PlanImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string, series: number) => void;
  planItems: (PlanItem & { remaining?: number })[];
  dayName: string;
}

export const PlanImporterModal: React.FC<PlanImporterModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  planItems, 
  dayName 
}) => {
  const [selectedAmounts, setSelectedAmounts] = useState<Record<number, number>>({});
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<Record<number, boolean>>({});

  // Agrupa os itens por categoria (Push, Pull, Legs...)
  const groupedItems = useMemo(() => {
    const groups: Record<string, (PlanItem & { remaining?: number })[]> = {};
    CATEGORY_ORDER.forEach(cat => groups[cat] = []);

    planItems.forEach(item => {
      const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      const cat = ex ? getExerciseCategory(ex) : 'Outros';
      if (groups[cat]) {
        groups[cat].push(item);
      } else {
        groups['Outros'].push(item);
      }
    });

    return groups;
  }, [planItems]);

  if (!isOpen) return null;

  const handleImport = (item: (PlanItem & { remaining?: number })) => {
    const defaultAmount = item.remaining ?? item.series;
    const amountToImport = selectedAmounts[item.id] || defaultAmount;
    
    if (amountToImport > 0) {
      onSelect(item.name, amountToImport);
      
      // Feedback visual momentâneo
      setJustAdded(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setJustAdded(prev => ({ ...prev, [item.id]: false }));
      }, 1500);

      // Limpa a seleção de quantidade customizada para este item
      const newAmounts = { ...selectedAmounts };
      delete newAmounts[item.id];
      setSelectedAmounts(newAmounts);
    }
  };

  const updateAmount = (id: number, currentBalance: number, delta: number) => {
    const current = selectedAmounts[id] ?? currentBalance;
    const next = Math.max(1, Math.min(currentBalance, current + delta));
    setSelectedAmounts(prev => ({ ...prev, [id]: next }));
  };

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase">Importar do Plano</h3>
            <p className="text-slate-500 text-xs uppercase font-bold mt-1 tracking-widest">
              Destino: <span className="text-indigo-400">{dayName}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
            title="Fechar"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto space-y-6 no-scrollbar flex-1">
          {planItems.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <span className="text-6xl opacity-20">📋</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest">Sem saldo disponível no plano semanal.</p>
            </div>
          ) : (
            CATEGORY_ORDER.map(cat => {
              const items = groupedItems[cat];
              if (!items || items.length === 0) return null;
              const isCollapsed = collapsedCats.includes(cat);

              return (
                <div key={cat} className="space-y-3">
                  <button 
                    onClick={() => toggleCat(cat)}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div className={`w-1.5 h-6 rounded-full transition-colors ${isCollapsed ? 'bg-slate-700' : 'bg-indigo-500'}`}></div>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isCollapsed ? 'text-slate-600' : 'text-slate-400 group-hover:text-indigo-300'}`}>
                      {cat} ({items.length})
                    </h4>
                    <div className="flex-1 h-px bg-slate-800/50"></div>
                    <svg className={`w-4 h-4 text-slate-600 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-3">
                      {items.map(item => {
                        const exData = PREDEFINED_EXERCISES.find(e => e.name === item.name);
                        const primaryMuscle = exData?.muscles.find(m => m.type === 'principal')?.name || '';
                        const balance = item.remaining ?? item.series;
                        const currentAmount = selectedAmounts[item.id] ?? balance;
                        const isAdded = justAdded[item.id];

                        return (
                          <div 
                            key={item.id}
                            className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-all group gap-4"
                          >
                            <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                                {getMuscleEmoji(primaryMuscle)}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-black text-white truncate text-sm md:text-base">{item.name}</h5>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saldo: <span className="text-emerald-400">{balance} Séries</span></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="flex items-center bg-slate-900 rounded-2xl border border-slate-700 p-1">
                                <button 
                                  onClick={() => updateAmount(item.id, balance, -1)}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
                                </button>
                                <div className="w-10 text-center">
                                  <span className="text-lg font-black text-indigo-400 tabular-nums">{currentAmount}</span>
                                </div>
                                <button 
                                  onClick={() => updateAmount(item.id, balance, 1)}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                </button>
                              </div>

                              <button
                                onClick={() => handleImport(item)}
                                disabled={isAdded}
                                className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all min-w-[110px] ${
                                  isAdded 
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                }`}
                              >
                                {isAdded ? '✅ FEITO!' : 'ADD'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer com botão grande de conclusão */}
        <div className="p-8 bg-slate-900 border-t border-slate-800 space-y-4">
           <button 
             onClick={onClose}
             className="w-full py-6 bg-slate-800 hover:bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all group flex items-center justify-center gap-3 active:scale-[0.98]"
           >
             CONCLUIR IMPORTAÇÃO
             <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
             </svg>
           </button>
           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
            * O saldo é atualizado em tempo real com base nos exercícios já agendados.
          </p>
        </div>
      </div>
    </div>
  );
};
