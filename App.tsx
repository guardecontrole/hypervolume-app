import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlanItem, 
  WorkoutSplit, 
  WorkoutExercise,
  WorkoutLog,
  PeriodizationPhase,
  Exercise,
  WorkoutSet
} from './types';
import { 
  PREDEFINED_EXERCISES, 
  DAYS_OF_WEEK, 
  MUSCLE_SORT_ORDER,
  MUSCULOS_GRANDES,
  SECONDARY_MUSCLES,
  PERIODIZATION_PHASES,
  CATEGORY_ORDER
} from './constants';
import { 
  getVolumeLevelData, 
  getMuscleEmoji, 
  classifyExercise,
  calculateStrengthLevel,
  sortExercisesSmartly,
  checkRecuperationRisk,
  getShortMuscleName,
  analyzeTrends,
  calculateDetailedMuscleMetrics,
  calculateMuscleVolumeForLog,
  suggestSmartLoad,
  calculateGlobalStrengthLevel,
  calculate1RM,
  getExerciseCategory
} from './utils/helpers';
import { ExerciseSelectorModal } from './components/ExerciseSelectorModal';
import { PlanImporterModal } from './components/PlanImporterModal';
import { WorkoutRow } from './components/WorkoutRow';
import { ReturnToTrainingModal } from './components/ReturnToTrainingModal';
import { AchievementModal } from './components/AchievementModal';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { AICoach } from './components/AICoach';

const App: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'strength' | 'plan' | 'workouts' | 'analysis' | 'history' | 'periodization'>('strength');
  const [weeklyPlan, setWeeklyPlan] = useState<PlanItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSplit>({});
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [manualRir, setManualRir] = useState<number>(1);
  const [manualProgression, setManualProgression] = useState<'load' | 'reps' | 'volume' | 'mixed' | 'technique'>('mixed');
  const [manualMethodology, setManualMethodology] = useState<string>('');
  const [userName, setUserName] = useState<string>('Atleta');
  const [strengthProfiles, setStrengthProfiles] = useState<Record<string, number>>({});
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5));
  const [isDeloadActive, setIsDeloadActive] = useState(false);
  const [strengthInputs, setStrengthInputs] = useState({
    exercise: 'Supino',
    bw: 80,
    load: 0,
    reps: 0
  });

  const [superSetSelection, setSuperSetSelection] = useState<{ day: string, sourceId: number } | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [logName, setLogName] = useState('');
  const [targetDay, setTargetDay] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ exercise: WorkoutExercise, fromDay: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [analysisView, setAnalysisView] = useState<'realtime' | 'statistics' | 'ia'>('realtime');
  const [achievement, setAchievement] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedPlan = localStorage.getItem('hv_plan');
    const savedWorkouts = localStorage.getItem('hv_workouts');
    const savedHistory = localStorage.getItem('hv_workout_history');
    const savedPhase = localStorage.getItem('hv_active_phase');
    const savedWeek = localStorage.getItem('hv_current_week');
    const savedUser = localStorage.getItem('hv_user_name');
    const savedProfiles = localStorage.getItem('hv_strength_profiles');
    const savedBW = localStorage.getItem('hv_user_bw');
    const savedManualRir = localStorage.getItem('hv_manual_rir');
    const savedManualProg = localStorage.getItem('hv_manual_prog');
    const savedManualMethod = localStorage.getItem('hv_manual_method');
    const savedActiveDays = localStorage.getItem('hv_active_days');
    const savedDeload = localStorage.getItem('hv_is_deload');
    
    if (savedPlan) setWeeklyPlan(JSON.parse(savedPlan));
    if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
    if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));
    if (savedPhase && savedPhase !== "null") setActivePhaseId(savedPhase);
    if (savedWeek) setCurrentWeek(parseInt(savedWeek));
    if (savedUser) setUserName(savedUser);
    if (savedProfiles) setStrengthProfiles(JSON.parse(savedProfiles));
    if (savedBW) setStrengthInputs(prev => ({ ...prev, bw: parseFloat(savedBW) }));
    if (savedManualRir) setManualRir(parseInt(savedManualRir));
    if (savedManualProg) setManualProgression(savedManualProg as any);
    if (savedManualMethod) setManualMethodology(savedManualMethod);
    if (savedActiveDays) setActiveDays(JSON.parse(savedActiveDays));
    if (savedDeload) setIsDeloadActive(savedDeload === 'true');
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
    if (basePhase?.id === 'f_manual') {
      return { 
        ...basePhase, 
        rirTarget: manualRir, 
        progressionRule: manualProgression,
        description: manualMethodology || basePhase.description 
      };
    }
    return basePhase;
  }, [activePhaseId, manualRir, manualProgression, manualMethodology]);

  const globalStrength = useMemo(() => 
    calculateGlobalStrengthLevel(strengthProfiles, strengthInputs.bw || 80),
    [strengthProfiles, strengthInputs.bw]
  );

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

  const addExerciseToPlan = (name: string) => {
    const newItem: PlanItem = {
      id: Date.now(),
      name,
      series: 3
    };
    setWeeklyPlan([...weeklyPlan, newItem]);
  };

  const removeExerciseFromPlan = (id: number) => {
    setWeeklyPlan(weeklyPlan.filter(p => p.id !== id));
  };

  const addExerciseToDay = (day: string, name: string, series: number = 3) => {
    const exData = PREDEFINED_EXERCISES.find(e => e.name === name);
    const newEx: WorkoutExercise = {
      id: Date.now(),
      name,
      series,
      reps: 10,
      load: null,
      rir: activePhase?.rirTarget ?? 1,
      sets: Array.from({ length: series }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`,
        reps: 10,
        load: null,
        rir: activePhase?.rirTarget ?? 1,
        type: 'normal'
      }))
    };
    setWorkouts(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newEx]
    }));
  };

  const updateWorkoutExercise = (day: string, id: number, data: Partial<WorkoutExercise>) => {
    setWorkouts(prev => ({
      ...prev,
      [day]: prev[day].map(ex => ex.id === id ? { ...ex, ...data } : ex)
    }));
  };

  const removeWorkoutExercise = (day: string, id: number) => {
    setWorkouts(prev => ({
      ...prev,
      [day]: prev[day].filter(ex => ex.id !== id)
    }));
  };

  const saveWorkoutLog = () => {
    const totalSeries = Object.values(workouts).flat().reduce((acc, curr) => acc + (curr.sets?.length || curr.series || 0), 0);
    const newLog: WorkoutLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: logName || `Treino S${currentWeek}`,
      totalSeries,
      split: JSON.parse(JSON.stringify(workouts)),
      phase: activePhase?.name,
      week: currentWeek
    };
    setWorkoutHistory([newLog, ...workoutHistory]);
    setLogName('');
    alert('Treino salvo no histórico!');
  };

  const updateStrengthProfile = () => {
    const result = calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, strengthInputs.load, strengthInputs.reps);
    if (result.oneRM > 0) {
      const old1RM = strengthProfiles[strengthInputs.exercise] || 0;
      const oldRes = calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, old1RM, 1);
      
      setStrengthProfiles(prev => ({
        ...prev,
        [strengthInputs.exercise]: result.oneRM
      }));

      if (old1RM > 0 && result.oneRM > old1RM) {
        setAchievement({
          exercise: strengthInputs.exercise,
          old1RM,
          new1RM: result.oneRM,
          oldScore: oldRes.score,
          newScore: result.score,
          oldLevel: oldRes.level,
          newLevel: result.level,
          changedLevel: oldRes.level !== result.level
        });
      }
    }
  };

  const availablePlanItems = useMemo(() => {
    const used = Object.values(workouts).flat() as WorkoutExercise[];
    return weeklyPlan.map(item => {
      const scheduled = used.filter(u => u.name === item.name).reduce((acc, curr) => acc + (curr.sets?.length || curr.series || 0), 0);
      return { ...item, remaining: Math.max(0, item.series - scheduled) };
    }).filter(item => item.remaining > 0);
  }, [weeklyPlan, workouts]);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">HyperVolume</h1>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{globalStrength.fullLevel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">Semana Atual</span>
               <span className="text-xs font-black text-white">S{currentWeek} - {activePhase?.name || 'Manual'}</span>
             </div>
             <button onClick={() => setShowReturnModal(true)} className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Navegação de Abas */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'strength', label: 'Força', icon: '🦾' },
            { id: 'plan', label: 'Plano Semanal', icon: '📋' },
            { id: 'workouts', label: 'Diário', icon: '📓' },
            { id: 'analysis', label: 'Análise', icon: '📊' },
            { id: 'periodization', label: 'Ciclos', icon: '🔄' },
            { id: 'history', label: 'Histórico', icon: '🕒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'strength' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Calculadora de 1RM & Nível</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exercício</label>
                    <select value={strengthInputs.exercise} onChange={e => setStrengthInputs({...strengthInputs, exercise: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500">
                       {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada', 'Desenvolvimento'].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peso Corporal</label>
                    <input type="number" value={strengthInputs.bw} onChange={e => setStrengthInputs({...strengthInputs, bw: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carga (kg)</label>
                    <input type="number" value={strengthInputs.load} onChange={e => setStrengthInputs({...strengthInputs, load: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Repetições</label>
                    <input type="number" value={strengthInputs.reps} onChange={e => setStrengthInputs({...strengthInputs, reps: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <button onClick={updateStrengthProfile} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase py-5 rounded-2xl shadow-xl transition-all">Registrar Recorde</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(strengthProfiles).map(([ex, load]) => {
                  const res = calculateStrengthLevel(ex, strengthInputs.bw, load, 1);
                  return (
                    <div key={ex} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="font-black text-slate-300 uppercase tracking-tight">{ex}</h4>
                          <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${res.bg} ${res.color}`}>{res.level}</span>
                       </div>
                       <div>
                          <p className="text-3xl font-black text-white">{load}kg <span className="text-xs text-slate-500 uppercase">1RM</span></p>
                          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest italic">{res.prescription}</p>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black uppercase tracking-tight">Arquitetura Semanal</h3>
               <button onClick={() => setShowSelector(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all">+ Add Exercício</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {CATEGORY_ORDER.map(cat => (
                 <div key={cat} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
                   <div className="bg-slate-800/50 p-6 border-b border-slate-800">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat}</h4>
                   </div>
                   <div className="p-4 space-y-3">
                     {groupedPlan[cat]?.map(item => (
                       <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center group">
                         <div>
                            <span className="text-xs font-black text-white block truncate w-32">{item.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <button onClick={() => setWeeklyPlan(weeklyPlan.map(p => p.id === item.id ? {...p, series: Math.max(1, p.series-1)} : p))} className="text-slate-600 hover:text-white">-</button>
                               <span className="text-[10px] font-black text-indigo-400">{item.series}S</span>
                               <button onClick={() => setWeeklyPlan(weeklyPlan.map(p => p.id === item.id ? {...p, series: p.series+1} : p))} className="text-slate-600 hover:text-white">+</button>
                            </div>
                         </div>
                         <button onClick={() => removeExerciseFromPlan(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/></svg></button>
                       </div>
                     ))}
                     {(!groupedPlan[cat] || groupedPlan[cat].length === 0) && <p className="text-[9px] text-slate-700 font-black text-center py-4 uppercase">Vazio</p>}
                   </div>
                 </div>
               ))}
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Distribuição de Volume por Músculo</h4>
               <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {MUSCLE_SORT_ORDER.filter(m => muscleTotals[m] > 0).map(m => {
                    const data = getVolumeLevelData(m, muscleTotals[m], globalStrength.score);
                    return (
                      <div key={m} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                         <span className="text-2xl block mb-1">{getMuscleEmoji(m)}</span>
                         <span className="text-[8px] font-black text-slate-400 block truncate uppercase">{m}</span>
                         <span className="text-xl font-black text-white block my-1">{muscleTotals[m]}S</span>
                         <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${data.bg} ${data.color}`}>{data.label}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Registro de Sessão</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sincronize o volume com sua arquitetura semanal</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button onClick={() => saveWorkoutLog()} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 transition-all">Salvar Treino</button>
                   <button onClick={() => setWorkouts({})} className="p-4 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/></svg></button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
                    <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex justify-between items-center">
                       <h4 className="text-lg font-black text-white uppercase tracking-tighter">{day}</h4>
                       <div className="flex gap-2">
                          <button onClick={() => {setTargetDay(day); setShowImporter(true);}} className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Importar</button>
                          <button onClick={() => {setTargetDay(day); setShowSelector(true);}} className="bg-slate-950 text-white border border-slate-800 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">+ Add</button>
                       </div>
                    </div>
                    <div className="p-4 space-y-4">
                       {workouts[day]?.map(ex => (
                         <WorkoutRow 
                           key={ex.id} 
                           exercise={ex} 
                           day={day} 
                           activePhase={activePhase} 
                           currentWeek={currentWeek} 
                           workoutHistory={workoutHistory} 
                           strengthProfiles={strengthProfiles} 
                           onUpdate={updateWorkoutExercise} 
                           onDelete={removeWorkoutExercise}
                           isDeloadActive={isDeloadActive}
                           userLevel={globalStrength.fullLevel}
                         />
                       ))}
                       {(!workouts[day] || workouts[day].length === 0) && <div className="py-12 text-center text-[10px] text-slate-700 font-black uppercase border-2 border-dashed border-slate-800/50 rounded-3xl">Sem exercícios hoje</div>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex gap-4 p-2 bg-slate-900 rounded-2xl border border-slate-800 self-start">
               {['realtime', 'statistics', 'ia'].map(v => (
                 <button key={v} onClick={() => setAnalysisView(v as any)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${analysisView === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                   {v === 'realtime' ? 'Tempo Real' : v === 'statistics' ? 'Histórico 12S' : 'HyperCoach IA'}
                 </button>
               ))}
             </div>

             {analysisView === 'realtime' && (
               <div className="space-y-8">
                 <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">Volume Prescrito vs Realizado (S{currentWeek})</h3>
                    <div className="space-y-6">
                       {MUSCLE_SORT_ORDER.filter(m => muscleTotals[m] > 0).map(m => {
                         const currentVol = calculateMuscleVolumeForLog({ split: workouts } as any)[m] || 0;
                         const targetVol = muscleTotals[m] || 1;
                         const percent = Math.min(100, (currentVol / targetVol) * 100);
                         return (
                           <div key={m} className="space-y-2">
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                 <span className="text-slate-400">{getMuscleEmoji(m)} {m}</span>
                                 <span className={percent === 100 ? 'text-emerald-400' : 'text-indigo-400'}>{currentVol.toFixed(1)} / {targetVol} Séries</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                 <div className={`h-full transition-all duration-1000 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${percent}%` }}></div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               </div>
             )}

             {analysisView === 'statistics' && <StatisticsDashboard history={workoutHistory} />}
             {analysisView === 'ia' && <AICoach history={workoutHistory} plan={weeklyPlan} phase={activePhase} strengthProfiles={strengthProfiles} userName={userName} />}
          </div>
        )}

        {activeTab === 'periodization' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Engenharia de Ciclos</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Selecione a fase que melhor se adapta ao seu momento fisiológico</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {PERIODIZATION_PHASES.map(p => (
                     <button
                       key={p.id}
                       onClick={() => setActivePhaseId(p.id)}
                       className={`p-6 rounded-3xl border text-left transition-all ${activePhaseId === p.id ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                     >
                       <div className="flex justify-between items-center mb-4">
                          <h4 className={`text-sm font-black uppercase tracking-tighter ${activePhaseId === p.id ? 'text-white' : 'text-slate-100'}`}>{p.name}</h4>
                          <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase ${activePhaseId === p.id ? 'bg-white/20 text-white border-white/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{p.stage}</span>
                       </div>
                       <p className={`text-[10px] leading-relaxed italic ${activePhaseId === p.id ? 'text-indigo-100' : 'text-slate-500'}`}>{p.description}</p>
                       <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
                          <div className="text-center">
                             <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-1">RIR Alvo</span>
                             <span className="text-lg font-black text-white">{p.rirTarget}</span>
                          </div>
                          <div className="text-center">
                             <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-1">Progressão</span>
                             <span className="text-xs font-black text-white uppercase">{p.progressionRule}</span>
                          </div>
                       </div>
                     </button>
                   ))}
                </div>
                
                <div className="mt-10 pt-10 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Configuração de Deload</h4>
                      <button 
                        onClick={() => setIsDeloadActive(!isDeloadActive)}
                        className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border ${isDeloadActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                      >
                        {isDeloadActive ? '✅ Deload Ativo' : 'Ativar Semana de Deload'}
                      </button>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ajuste de Microciclo</h4>
                      <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                         <button onClick={() => setCurrentWeek(Math.max(1, currentWeek-1))} className="w-10 h-10 bg-slate-900 text-white rounded-lg">-</button>
                         <span className="flex-1 text-center font-black text-white">Semana {currentWeek}</span>
                         <button onClick={() => setCurrentWeek(currentWeek+1)} className="w-10 h-10 bg-slate-900 text-white rounded-lg">+</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-black uppercase tracking-tight">Linha do Tempo</h3>
             {workoutHistory.map(log => (
               <div key={log.id} className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-indigo-500/50 transition-all">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-slate-950 rounded-3xl border border-slate-800 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(log.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                        <span className="text-xl font-black text-white">{new Date(log.date).getDate()}</span>
                     </div>
                     <div>
                        <h4 className="font-black text-white text-lg leading-tight uppercase tracking-tighter">{log.name}</h4>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">S{log.week}</span>
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">•</span>
                           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{log.totalSeries} Séries Totais</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => {setWorkouts(log.split); setActiveTab('workouts');}} className="px-6 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Reaplicar Treino</button>
                     <button onClick={() => setWorkoutHistory(workoutHistory.filter(h => h.id !== log.id))} className="p-3 text-slate-700 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/></svg></button>
                  </div>
               </div>
             ))}
             {workoutHistory.length === 0 && <div className="py-24 text-center text-slate-700 uppercase font-black text-xs border-2 border-dashed border-slate-900 rounded-[3rem]">O seu legado começa hoje.</div>}
          </div>
        )}
      </main>

      {/* Modais */}
      <ExerciseSelectorModal 
        isOpen={showSelector} 
        onClose={() => setShowSelector(false)} 
        onSelect={(name) => {
          if (activeTab === 'plan') addExerciseToPlan(name);
          else if (targetDay) addExerciseToDay(targetDay, name);
        }} 
        catalog={PREDEFINED_EXERCISES} 
        activePhase={activePhase}
        currentDayExercises={targetDay ? workouts[targetDay] || [] : []}
        planItems={weeklyPlan}
        isAddingToPlan={activeTab === 'plan'}
      />

      <PlanImporterModal 
        isOpen={showImporter} 
        onClose={() => setShowImporter(false)} 
        onSelect={(name, series) => {
          if (targetDay) addExerciseToDay(targetDay, name, series);
        }} 
        planItems={availablePlanItems}
        dayName={targetDay || ''}
      />

      <ReturnToTrainingModal 
        isOpen={showReturnModal} 
        onClose={() => setShowReturnModal(false)} 
        workoutHistory={workoutHistory} 
        strengthProfiles={strengthProfiles}
        currentWorkouts={workouts}
        onApply={(newSplit, phaseId) => {
          setWorkouts(newSplit);
          setActivePhaseId(phaseId);
        }}
      />

      <AchievementModal 
        isOpen={achievement !== null} 
        onClose={() => setAchievement(null)} 
        data={achievement}
      />
    </div>
  );
};

export default App;