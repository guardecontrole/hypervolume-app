import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlanItem, WorkoutSplit, WorkoutExercise, WorkoutLog, WorkoutSet } from './types';
import { PREDEFINED_EXERCISES, DAYS_OF_WEEK, PERIODIZATION_PHASES, CATEGORY_ORDER, MUSCLE_SORT_ORDER, SECONDARY_MUSCLES, MUSCULOS_GRANDES } from './constants';
import { calculateStrengthLevel, calculateGlobalStrengthLevel, classifyExercise, sortExercisesSmartly, calculate1RM, getExerciseCategory, getShortMuscleName, getMuscleEmoji, getVolumeLevelData } from './utils/helpers';

// COMPONENTS
import { ExerciseSelectorModal } from './components/ExerciseSelectorModal';
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
  const [manualProgression, setManualProgression] = useState<any>('mixed');
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
  const [achievement, setAchievement] = useState<any>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [focusedPlanExerciseId, setFocusedPlanExerciseId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedPlan = localStorage.getItem('hv_plan'); if (savedPlan) setWeeklyPlan(JSON.parse(savedPlan));
    const savedWorkouts = localStorage.getItem('hv_workouts'); if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
    const savedHistory = localStorage.getItem('hv_workout_history'); if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));
    const savedPhase = localStorage.getItem('hv_active_phase'); if (savedPhase && savedPhase !== "null") setActivePhaseId(savedPhase);
    const savedWeek = localStorage.getItem('hv_current_week'); if (savedWeek) setCurrentWeek(parseInt(savedWeek));
    const savedUser = localStorage.getItem('hv_user_name'); if (savedUser) setUserName(savedUser);
    const savedProfiles = localStorage.getItem('hv_strength_profiles'); if (savedProfiles) setStrengthProfiles(JSON.parse(savedProfiles));
    const savedBW = localStorage.getItem('hv_user_bw'); if (savedBW) setStrengthInputs(prev => ({ ...prev, bw: parseFloat(savedBW) }));
    const savedManualRir = localStorage.getItem('hv_manual_rir'); if (savedManualRir) setManualRir(parseInt(savedManualRir));
    const savedManualProg = localStorage.getItem('hv_manual_prog'); if (savedManualProg) setManualProgression(savedManualProg);
    const savedManualMethod = localStorage.getItem('hv_manual_method'); if (savedManualMethod) setManualMethodology(savedManualMethod);
    const savedActiveDays = localStorage.getItem('hv_active_days'); if (savedActiveDays) setActiveDays(JSON.parse(savedActiveDays));
    const savedDeload = localStorage.getItem('hv_is_deload'); if (savedDeload) setIsDeloadActive(savedDeload === 'true');
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('hv_plan', JSON.stringify(weeklyPlan));
    localStorage.setItem('hv_workouts', JSON.stringify(workouts));
    localStorage.setItem('hv_workout_history', JSON.stringify(workoutHistory));
    localStorage.setItem('hv_current_week', currentWeek.toString());
    localStorage.setItem('hv_active_phase', activePhaseId || "null");
    localStorage.setItem('hv_user_name', userName);
    localStorage.setItem('hv_strength_profiles', JSON.stringify(strengthProfiles));
    localStorage.setItem('hv_user_bw', strengthInputs.bw.toString());
    localStorage.setItem('hv_manual_rir', manualRir.toString());
    localStorage.setItem('hv_manual_prog', manualProgression);
    localStorage.setItem('hv_manual_method', manualMethodology);
    localStorage.setItem('hv_active_days', JSON.stringify(activeDays));
    localStorage.setItem('hv_is_deload', isDeloadActive.toString());
  }, [weeklyPlan, workouts, workoutHistory, activePhaseId, currentWeek, userName, strengthProfiles, strengthInputs.bw, manualRir, manualProgression, manualMethodology, activeDays, isDeloadActive, isMounted]);

  const activePhase = useMemo(() => {
    const basePhase = PERIODIZATION_PHASES.find(p => p.id === activePhaseId) || null;
    if (basePhase?.id === 'f_manual') return { ...basePhase, rirTarget: manualRir, progressionRule: manualProgression, description: manualMethodology || basePhase.description };
    return basePhase;
  }, [activePhaseId, manualRir, manualProgression, manualMethodology]);

  const globalStrength = useMemo(() => calculateGlobalStrengthLevel(strengthProfiles, strengthInputs.bw || 80), [strengthProfiles, strengthInputs.bw]);

  const strengthResult = useMemo(() => 
    calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, strengthInputs.load, strengthInputs.reps),
    [strengthInputs]
  );

  const visibleMuscles = useMemo(() => {
    return showSecondary ? MUSCLE_SORT_ORDER : MUSCLE_SORT_ORDER.filter(m => !SECONDARY_MUSCLES.includes(m));
  }, [showSecondary]);

  const muscleTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MUSCLE_SORT_ORDER.forEach(m => totals[m] = 0);
    weeklyPlan.forEach(item => {
      const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      if (ex) {
        ex.muscles.forEach(m => {
          totals[m.name] += (item.series || 0) * m.contribution;
        });
      }
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

  const addToPlan = (name: string) => setWeeklyPlan(prev => prev.find(p => p.name === name) ? prev : [...prev, { id: Date.now(), name, series: 0 }]);
  const updateSeries = (id: number, series: number) => setWeeklyPlan(prev => prev.map(p => p.id === id ? { ...p, series } : p));
  const removeFromPlan = (id: number) => setWeeklyPlan(prev => prev.filter(p => p.id !== id));
  const handleSortPlan = () => setWeeklyPlan(prev => sortExercisesSmartly(prev));

  const saveStrengthRecord = () => {
    if (strengthResult.oneRM > 0) {
      setStrengthProfiles(prev => ({ ...prev, [strengthInputs.exercise]: strengthResult.oneRM }));
      alert(`1RM de ${strengthInputs.exercise} atualizado: ${strengthResult.oneRM.toFixed(1)}kg`);
    }
  };

  const handleExportBackup = () => {
    const allData = { ...localStorage };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_hypervolume_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (window.confirm("Atenção: A importação substituirá todos os seus dados. Deseja continuar?")) {
          localStorage.clear();
          Object.keys(backupData).forEach(key => localStorage.setItem(key, backupData[key]));
          window.location.reload();
        }
      } catch (error) { alert('Erro ao ler o backup.'); }
    };
    reader.readAsText(file);
  };

  if (!isMounted) return null;

  return (
    <div className={`min-h-screen pb-24 md:pb-20 transition-colors duration-500 bg-slate-950`}>
      <header className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${isDeloadActive ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`${isDeloadActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-indigo-600 shadow-indigo-600/20'} p-1.5 rounded-lg shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h1 className={`text-lg md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${isDeloadActive ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-purple-500'} tracking-tighter uppercase`}>HYPERVOLUME</h1>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden lg:block"></div>
            <div className="flex items-center gap-4 bg-slate-800/30 px-4 py-2 rounded-2xl border border-slate-700/50">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isDeloadActive ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-purple-600'} flex items-center justify-center text-xs font-black shadow-lg`}>{userName.charAt(0).toUpperCase()}</div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-200 tracking-tight">{userName}</span>
                    <span className={`text-[10px] font-black ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'} px-2 py-0.5 rounded-md border uppercase tracking-tighter`}>PI: {globalStrength.score}</span>
                </div>
                <span className={`text-[9px] font-black ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'} uppercase tracking-widest`}>{globalStrength.fullLevel}</span>
              </div>
              <button onClick={() => setShowSettings(true)} className={`w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-all text-slate-500 ${isDeloadActive ? 'hover:text-emerald-400' : 'hover:text-indigo-400'}`}>
                <svg className="w-5 h-5 overflow-visible" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            </div>
          </div>
          <nav className="flex bg-slate-800/50 p-1 rounded-xl">
            {[{ id: 'strength', label: 'Força', icon: '🦾' }, { id: 'plan', label: 'Plano', icon: '📐' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? (isDeloadActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-slate-700') + ' text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {activeTab === 'strength' && (
           <StrengthTab isDeloadActive={isDeloadActive} globalStrength={globalStrength} strengthInputs={strengthInputs} setStrengthInputs={setStrengthInputs} strengthProfiles={strengthProfiles} onSaveRecord={saveStrengthRecord} />
        )}

        {activeTab === 'plan' && (
          <PlanTab 
            weeklyPlan={weeklyPlan} 
            setWeeklyPlan={setWeeklyPlan} 
            isDeloadActive={isDeloadActive} 
            globalStrengthScore={globalStrength.score} 
            setShowSelector={setShowSelector} 
            setTargetDay={setTargetDay} 
          />
        )}
      </main>

      {/* MODALS */}
      <ExerciseSelectorModal 
        isOpen={showSelector} 
        onClose={() => setShowSelector(false)} 
        onSelect={(name) => addToPlan(name)} 
        catalog={PREDEFINED_EXERCISES} 
        activePhase={activePhase}
        planItems={weeklyPlan}
        isAddingToPlan={true}
      />

      <AchievementModal isOpen={!!achievement} onClose={() => setAchievement(null)} data={achievement} />

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter flex justify-between items-center">
                  <span>Perfil do Atleta</span>
                  <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </h3>
                
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome de Guerra</label>
                      <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Peso Corporal (kg)</label>
                      <input type="number" value={strengthInputs.bw || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs(prev => ({ ...prev, bw: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Recordes de Força (1RM)</label>
                    <div className="grid grid-cols-2 gap-4">
                       {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => (
                          <div key={ex}>
                             <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">{ex}</label>
                             <input type="number" value={strengthProfiles[ex] ? Math.round(strengthProfiles[ex]) : ''} onChange={(e) => setStrengthProfiles(prev => ({ ...prev, [ex]: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                          </div>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Gestão de Dados</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button onClick={handleExportBackup} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                          <span className="text-2xl group-hover:scale-110">📤</span>
                          <span className="text-xs font-black uppercase text-slate-400 group-hover:text-white">Fazer Backup</span>
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                          <span className="text-2xl group-hover:scale-110">📥</span>
                          <span className="text-xs font-black uppercase text-slate-400 group-hover:text-white">Restaurar Backup</span>
                       </button>
                       <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImportBackup} />
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="bg-indigo-600 text-white px-4 py-3 rounded-xl mt-8 w-full font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">Salvar e Fechar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
