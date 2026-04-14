import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlanItem, WorkoutSplit, WorkoutExercise, WorkoutLog, WorkoutSet } from './types';
import { PREDEFINED_EXERCISES, DAYS_OF_WEEK, PERIODIZATION_PHASES, CATEGORY_ORDER, MUSCLE_SORT_ORDER, SECONDARY_MUSCLES, MUSCULOS_GRANDES } from './constants';
import { calculateStrengthLevel, calculateGlobalStrengthLevel, classifyExercise, sortExercisesSmartly, calculate1RM, getExerciseCategory, analyzeTrends, checkRecuperationRisk, getShortMuscleName, getMuscleEmoji, getVolumeLevelData } from './utils/helpers';

// COMPONENTS
import { ExerciseSelectorModal } from './components/ExerciseSelectorModal';
import { PlanImporterModal } from './components/PlanImporterModal';
import { AchievementModal } from './components/AchievementModal';

// TABS
import { StrengthTab } from './components/tabs/StrengthTab';
import { PlanTab } from './components/tabs/PlanTab';

const App: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'strength' | 'plan'>('strength');
  const [weeklyPlan, setWeeklyPlan] = useState<PlanItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSplit>({});
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [manualRir, setManualRir] = useState<number>(1);
  const [manualProgression, setManualProgression] = useState<string>('mixed');
  const [manualMethodology, setManualMethodology] = useState<string>('');
  const [userName, setUserName] = useState<string>('Atleta');
  const [strengthProfiles, setStrengthProfiles] = useState<Record<string, number>>({});
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5));
  const [isDeloadActive, setIsDeloadActive] = useState(false);
  const [strengthInputs, setStrengthInputs] = useState({ exercise: 'Supino', bw: 80, load: 0, reps: 0 });

  // UI States
  const [showSelector, setShowSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [targetDay, setTargetDay] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [focusedPlanExerciseId, setFocusedPlanExerciseId] = useState<number | null>(null);
  const [achievement, setAchievement] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const load = (key: string) => localStorage.getItem(key);
    if (load('hv_plan')) setWeeklyPlan(JSON.parse(load('hv_plan')!));
    if (load('hv_workouts')) setWorkouts(JSON.parse(load('hv_workouts')!));
    if (load('hv_workout_history')) setWorkoutHistory(JSON.parse(load('hv_workout_history')!));
    if (load('hv_active_phase') && load('hv_active_phase') !== "null") setActivePhaseId(load('hv_active_phase'));
    if (load('hv_current_week')) setCurrentWeek(parseInt(load('hv_current_week')!));
    if (load('hv_user_name')) setUserName(load('hv_user_name')!);
    if (load('hv_strength_profiles')) setStrengthProfiles(JSON.parse(load('hv_strength_profiles')!));
    if (load('hv_user_bw')) setStrengthInputs(prev => ({ ...prev, bw: parseFloat(load('hv_user_bw')!) }));
    if (load('hv_is_deload')) setIsDeloadActive(load('hv_is_deload') === 'true');
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('hv_plan', JSON.stringify(weeklyPlan));
    localStorage.setItem('hv_workouts', JSON.stringify(workouts));
    localStorage.setItem('hv_workout_history', JSON.stringify(workoutHistory));
    localStorage.setItem('hv_active_phase', activePhaseId || "null");
    localStorage.setItem('hv_user_name', userName);
    localStorage.setItem('hv_strength_profiles', JSON.stringify(strengthProfiles));
    localStorage.setItem('hv_user_bw', strengthInputs.bw.toString());
    localStorage.setItem('hv_is_deload', isDeloadActive.toString());
  }, [weeklyPlan, workouts, workoutHistory, activePhaseId, userName, strengthProfiles, strengthInputs.bw, isDeloadActive, isMounted]);

  const activePhase = useMemo(() => PERIODIZATION_PHASES.find(p => p.id === activePhaseId) || null, [activePhaseId]);
  const globalStrength = useMemo(() => calculateGlobalStrengthLevel(strengthProfiles, strengthInputs.bw || 80), [strengthProfiles, strengthInputs.bw]);
  const strengthResult = useMemo(() => calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, strengthInputs.load, strengthInputs.reps), [strengthInputs]);

  const muscleTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MUSCLE_SORT_ORDER.forEach(m => totals[m] = 0);
    weeklyPlan.forEach(item => {
      const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      if (ex) ex.muscles.forEach(m => { totals[m.name] += (item.series || 0) * m.contribution; });
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

  const visibleMuscles = useMemo(() => showSecondary ? MUSCLE_SORT_ORDER : MUSCLE_SORT_ORDER.filter(m => !SECONDARY_MUSCLES.includes(m)), [showSecondary]);
  const focusedPlanExerciseData = useMemo(() => focusedPlanExerciseId ? PREDEFINED_EXERCISES.find(ex => ex.name === weeklyPlan.find(p => p.id === focusedPlanExerciseId)?.name) : null, [focusedPlanExerciseId, weeklyPlan]);

  // ACTIONS
  const addToPlan = (name: string) => setWeeklyPlan(prev => prev.find(p => p.name === name) ? prev : [...prev, { id: Date.now(), name, series: 0 }]);
  const removeFromPlan = (id: number) => setWeeklyPlan(prev => prev.filter(p => p.id !== id));
  const updateSeries = (id: number, series: number) => setWeeklyPlan(prev => prev.map(p => p.id === id ? { ...p, series } : p));
  const saveStrengthRecord = () => {
    if (strengthResult.oneRM > 0) {
      setStrengthProfiles(prev => ({ ...prev, [strengthInputs.exercise]: strengthResult.oneRM }));
      alert(`Recorde de ${strengthInputs.exercise} atualizado!`);
    }
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ ...localStorage }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_hypervolume.json`;
    link.click();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (window.confirm("Substituir todos os dados?")) {
          localStorage.clear();
          Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
          window.location.reload();
        }
      } catch { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen pb-24 bg-slate-950 text-slate-200">
      <header className="backdrop-blur-md border-b sticky top-0 z-50 bg-slate-900/80 border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 tracking-tighter uppercase">HYPERVOLUME</h1>
            <div className="flex items-center gap-4 bg-slate-800/30 px-4 py-2 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-black">{userName.charAt(0).toUpperCase()}</div>
              <div className="flex flex-col">
                <span className="text-xs font-black">{userName}</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{globalStrength.fullLevel}</span>
              </div>
              <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
            </div>
          </div>
          <nav className="flex bg-slate-800/50 p-1 rounded-xl">
            {[
              { id: 'strength', label: 'Força', icon: '🦾' },
              { id: 'plan', label: 'Plano', icon: '📐' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {activeTab === 'strength' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full bg-indigo-600/5"></div>
                <div className="relative z-10">
                  <span className="text-indigo-400 font-black uppercase text-xs tracking-[0.4em] mb-4 block">Power Matrix</span>
                  <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-6 tracking-tighter">Teste de Força</h2>
                  <p className="text-slate-400 text-lg">Calcule seu 1RM e monitore sua evolução nos levantamentos básicos.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Status de Atleta</span>
                <div className="relative mb-4">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-500" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * globalStrength.score) / 100} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white leading-none">{globalStrength.score}</span>
                  </div>
                </div>
                <h4 className="text-xl font-black uppercase text-indigo-400">{globalStrength.fullLevel}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                <h3 className="text-lg font-black uppercase text-white">Calculadora</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Exercício</label>
                    <select value={strengthInputs.exercise} onChange={e => setStrengthInputs({...strengthInputs, exercise: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none">
                      <option>Supino</option><option>Agachamento</option><option>Levantamento Terra</option><option>Remada Curvada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Carga (kg)</label>
                    <input type="number" value={strengthInputs.load || ''} onChange={e => setStrengthInputs({...strengthInputs, load: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Reps</label>
                    <input type="number" value={strengthInputs.reps || ''} onChange={e => setStrengthInputs({...strengthInputs, reps: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" placeholder="0" />
                  </div>
                  <button onClick={saveStrengthRecord} className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all">Salvar Recorde</button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estimativa de 1RM</span>
                    <span className="text-6xl font-black tracking-tighter text-indigo-400">{strengthResult.oneRM.toFixed(1)}<span className="text-2xl text-slate-600 ml-1">kg</span></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Classificação</span>
                    <span className={`text-2xl font-black px-6 py-3 rounded-2xl ${strengthResult.bg} ${strengthResult.color}`}>{strengthResult.level}</span>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                  <h4 className="text-sm font-black text-white uppercase mb-6 tracking-widest">Banco de Força</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => (
                      <div key={ex} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[8px] text-slate-500 font-black uppercase block mb-1">{ex}</span>
                        <span className="text-lg font-black text-indigo-400">{strengthProfiles[ex]?.toFixed(1) || '--'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black">Volume Semanal Alvo</h2>
                  <p className="text-slate-400 text-sm">Organize as séries para atingir o volume adaptativo.</p>
                </div>
                <button onClick={() => { setTargetDay(null); setShowSelector(true); }} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-white shadow-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  Adicionar Exercício
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500">
                    <tr>
                      <th className="p-4 w-64 sticky left-0 bg-slate-950 border-r border-slate-800">Exercício</th>
                      <th className="p-4 w-20 text-center border-r border-slate-800">Séries</th>
                      {visibleMuscles.map(m => (
                        <th key={m} className={`p-4 text-center min-w-[90px] ${focusedPlanExerciseId && focusedPlanExerciseData?.muscles.some(mu => mu.name === m) ? 'text-indigo-400 bg-indigo-500/5' : ''}`}>
                          {getShortMuscleName(m)}
                        </th>
                      ))}
                      <th className="p-4 w-12 text-center cursor-pointer hover:bg-slate-800" onClick={() => setShowSecondary(!showSecondary)}>{showSecondary ? '[-]' : '[+]'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.entries(groupedPlan).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <React.Fragment key={category}>
                          <tr className="bg-slate-950/50">
                            <td colSpan={visibleMuscles.length + 3} className="p-3 pl-4 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{category}</td>
                          </tr>
                          {items.map(item => {
                            const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
                            return (
                              <tr key={item.id} className={`hover:bg-slate-800/30 transition-colors ${focusedPlanExerciseId === item.id ? 'bg-indigo-500/5' : ''}`}>
                                <td className="p-4 font-bold text-sm border-r border-slate-800/50 sticky left-0 bg-slate-900">{item.name}</td>
                                <td className="p-2 border-r border-slate-800/50">
                                  <input type="number" value={item.series || ''} onFocus={() => setFocusedPlanExerciseId(item.id)} onBlur={() => setFocusedPlanExerciseId(null)} onChange={e => updateSeries(item.id, parseInt(e.target.value) || 0)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1 text-center font-black outline-none focus:border-indigo-500" />
                                </td>
                                {visibleMuscles.map(m => {
                                  const mu = ex?.muscles.find(mu => mu.name === m);
                                  const val = mu ? ((item.series || 0) * mu.contribution).toFixed(1) : '-';
                                  return <td key={m} className={`p-2 text-center text-xs font-bold ${val === '-' ? 'text-slate-700' : 'text-slate-300'}`}>{val}</td>;
                                })}
                                <td className="p-4 text-center">
                                  <button onClick={() => removeFromPlan(item.id)} className="text-slate-600 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-950 font-black border-t-2 border-indigo-500 sticky bottom-0">
                    <tr>
                      <td className="p-4 text-xs">TOTAIS SEMANAIS</td>
                      <td className="p-4 text-center text-indigo-400">{weeklyPlan.reduce((a, b) => a + (b.series || 0), 0)}</td>
                      {visibleMuscles.map(m => {
                        const { label, color, bg } = getVolumeLevelData(m, muscleTotals[m], globalStrength.score);
                        return (
                          <td key={m} className="p-2 text-center">
                            <div className={`flex flex-col p-1 rounded-lg border border-white/5 ${bg} ${color}`}>
                              <span className="text-[9px]">{muscleTotals[m].toFixed(1)}</span>
                              <span className="text-[7px] tracking-tighter uppercase">{label}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* MODAIS */}
      <ExerciseSelectorModal isOpen={showSelector} onClose={() => setShowSelector(false)} onSelect={addToPlan} catalog={PREDEFINED_EXERCISES} planItems={weeklyPlan} isAddingToPlan={true} />
      
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter flex justify-between">
              <span>Perfil do Atleta</span>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">✕</button>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Nome</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Peso (kg)</label>
                  <input type="number" value={strengthInputs.bw} onChange={e => setStrengthInputs(prev => ({ ...prev, bw: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <button onClick={handleExportBackup} className="bg-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">📤 Exportar Backup</button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">📥 Importar Backup</button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="bg-indigo-600 text-white p-4 rounded-2xl mt-8 w-full font-black uppercase text-xs tracking-widest">Salvar e Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
