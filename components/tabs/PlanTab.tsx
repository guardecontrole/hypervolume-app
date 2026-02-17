import React, { useState, useMemo } from 'react';
import { PlanItem } from '../../types';
import { PREDEFINED_EXERCISES, MUSCLE_SORT_ORDER, SECONDARY_MUSCLES, CATEGORY_ORDER } from '../../constants';
import { getVolumeLevelData, getShortMuscleName, sortExercisesSmartly, getExerciseCategory } from '../../utils/helpers';

interface Props {
  weeklyPlan: PlanItem[];
  setWeeklyPlan: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  isDeloadActive: boolean;
  globalStrengthScore: number;
  setShowSelector: (show: boolean) => void;
  setTargetDay: (day: string | null) => void;
}

export const PlanTab: React.FC<Props> = ({ weeklyPlan, setWeeklyPlan, isDeloadActive, globalStrengthScore, setShowSelector, setTargetDay }) => {
  const [showSecondary, setShowSecondary] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);

  const visibleMuscles = useMemo(() => showSecondary ? MUSCLE_SORT_ORDER : MUSCLE_SORT_ORDER.filter(m => !SECONDARY_MUSCLES.includes(m)), [showSecondary]);
  
  const muscleTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MUSCLE_SORT_ORDER.forEach(m => totals[m] = 0);
    weeklyPlan.forEach(item => {
      const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      if (ex) ex.muscles.forEach(m => totals[m.name] += (item.series || 0) * m.contribution);
    });
    return totals;
  }, [weeklyPlan]);

  const groupedPlan = useMemo(() => {
    const groups: Record<string, PlanItem[]> = {};
    CATEGORY_ORDER.forEach(cat => groups[cat] = []);
    weeklyPlan.forEach(item => {
      const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      const cat = ex ? getExerciseCategory(ex) : 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [weeklyPlan]);

  const updateSeries = (id: number, series: number) => setWeeklyPlan(prev => prev.map(p => p.id === id ? { ...p, series } : p));
  const removeFromPlan = (id: number) => setWeeklyPlan(prev => prev.filter(p => p.id !== id));
  const toggleCategory = (cat: string) => setCollapsedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white">Meta Semanal</h2>
            <div className="flex gap-3">
               <button onClick={() => setWeeklyPlan(prev => sortExercisesSmartly(prev))} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-indigo-400 border border-slate-700">Organizar</button>
               <button onClick={() => { setTargetDay(null); setShowSelector(true); }} className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold text-white shadow-lg">+ Adicionar</button>
            </div>
         </div>
         <div className="relative w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse border-spacing-0">
               <thead className="bg-slate-900 text-[10px] uppercase font-black text-slate-500 sticky top-0 z-40">
                  <tr>
                     <th className="p-4 w-64 bg-slate-950 sticky left-0 z-50 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50">Exercício</th>
                     <th className="p-4 w-20 text-center sticky left-64 z-50 bg-slate-950 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50">Séries</th>
                     {visibleMuscles.map(m => (
                        <th key={m} className="p-4 w-24 text-center min-w-[100px] text-purple-400 bg-purple-500/5">{getShortMuscleName(m)}</th>
                     ))}
                     <th className="p-4 w-12 sticky right-0 bg-slate-900 text-center cursor-pointer" onClick={() => setShowSecondary(!showSecondary)}>{showSecondary ? '[-]' : '[+]'}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {Object.entries(groupedPlan).map(([category, items]) => {
                     if (items.length === 0) return null;
                     const isCollapsed = collapsedCategories.includes(category);
                     const catTotal = items.reduce((a, b) => a + (b.series || 0), 0);
                     return (
                        <React.Fragment key={category}>
                           <tr className="group bg-slate-950 cursor-pointer hover:bg-slate-900 border-y border-slate-800/50" onClick={() => toggleCategory(category)}>
                              <td className="p-4 sticky left-0 bg-slate-950 z-30 font-black text-xs flex items-center gap-3 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 text-indigo-300">
                                 <span>{category.toUpperCase()}</span>
                                 {isCollapsed && <span className="ml-2 bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded text-[10px]">{catTotal}S</span>}
                              </td>
                              <td className="p-4 text-center font-black text-xs sticky left-64 bg-slate-950 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 text-indigo-400/60">{!isCollapsed && `${catTotal}S`}</td>
                              <td colSpan={visibleMuscles.length + 1} className="p-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest italic bg-slate-950">{items.length} exercícios</td>
                           </tr>
                           {!isCollapsed && items.map(item => {
                              const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
                              return (
                                 <tr key={item.id} className="group hover:bg-slate-800/30">
                                    <td className="p-3 pl-8 w-64 font-bold text-sm sticky left-0 z-30 flex items-center gap-2 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 bg-slate-950"><span className="truncate">{item.name}</span></td>
                                    <td className="p-2 w-20 sticky left-64 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 bg-slate-950"><input type="number" value={item.series} onChange={e => updateSeries(item.id, Number(e.target.value))} className="w-full bg-slate-800/50 border border-slate-700/30 rounded p-1 text-center text-indigo-400 font-black" /></td>
                                    {visibleMuscles.map(m => {
                                       const mData = ex?.muscles.find(x => x.name === m);
                                       const val = mData ? (item.series * mData.contribution).toFixed(1) : '-';
                                       return <td key={m} className={`p-2 text-center text-xs ${val !== '-' ? 'text-slate-100 font-bold' : 'text-slate-700 opacity-20'}`}>{val}</td>
                                    })}
                                    <td className="p-4 sticky right-0 bg-slate-950 text-center"><button onClick={() => removeFromPlan(item.id)} className="text-slate-700 hover:text-red-500">X</button></td>
                                 </tr>
                              );
                           })}
                        </React.Fragment>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
