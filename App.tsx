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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [logName, setLogName] = useState('');
  const [targetDay, setTargetDay] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [saveButtonText, setSaveButtonText] = useState('💾 Salvar Semana');
  const [draggedItem, setDraggedItem] = useState<{ exercise: WorkoutExercise, fromDay: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [analysisView, setAnalysisView] = useState<'realtime' | 'statistics' | 'ia'>('realtime');
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [focusedPlanExerciseId, setFocusedPlanExerciseId] = useState<number | null>(null);
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

  const strengthResult = useMemo(() => 
    calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, strengthInputs.load, strengthInputs.reps),
    [strengthInputs]
  );

  const globalStrength = useMemo(() => 
    calculateGlobalStrengthLevel(strengthProfiles, strengthInputs.bw || 80),
    [strengthProfiles, strengthInputs.bw]
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

  const focusedPlanExerciseData = useMemo(() => {
    if (!focusedPlanExerciseId) return null;
    const item = weeklyPlan.find(p => p.id === focusedPlanExerciseId);
    return item ? PREDEFINED_EXERCISES.find(ex => ex.name === item.name) : null;
  }, [focusedPlanExerciseId, weeklyPlan]);

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

  const recuperationRisks = useMemo(() => checkRecuperationRisk(workouts), [workouts]);
  const analysisData = useMemo(() => analyzeTrends(workoutHistory, globalStrength.score), [workoutHistory, globalStrength.score]);

  const macrocycles = useMemo(() => {
    const order = ['INÍCIO', 'FORÇA', 'REALIZAÇÃO', 'RESISTÊNCIA', 'HIPERTROFIA'];
    const stages = Array.from(new Set(PERIODIZATION_PHASES.map(p => p.stage)))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));
      
    return stages.map(stage => ({
      name: stage,
      phases: PERIODIZATION_PHASES.filter(p => p.stage === stage)
    }));
  }, []);

  const todayName = useMemo(() => {
    const idx = new Date().getDay();
    const normalizedIdx = idx === 0 ? 6 : idx - 1;
    return DAYS_OF_WEEK[normalizedIdx];
  }, []);

  const toggleDay = (day: string) => {
    setActiveDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)).concat(day).sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b))
    );
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ... (Other handlers unchanged for brevity, but needed in full file) ...
  const handleInitiateSuperSet = (day: string, id: number) => { if (isDeloadActive) return; setSuperSetSelection({ day, sourceId: id }); };
  const handleQuickLink = (day: string, currentId: number, nextId: number) => { if (isDeloadActive) return; const newSuperSetId = Math.random().toString(36).substr(2, 9); setWorkouts(prev => ({ ...prev, [day]: prev[day].map(ex => (ex.id === currentId || ex.id === nextId) ? { ...ex, superSetId: newSuperSetId } : ex) })); };
  const handleExerciseClick = (day: string, targetId: number) => { if (!superSetSelection || isDeloadActive) return; if (superSetSelection.day !== day) { alert("Selecione um exercício do mesmo dia."); setSuperSetSelection(null); return; } if (superSetSelection.sourceId === targetId) { setSuperSetSelection(null); return; } const targetEx = workouts[day].find(ex => ex.id === targetId); const exData = PREDEFINED_EXERCISES.find(e => e.name === targetEx?.name); if (exData?.isCompound && !exData?.isGuided) { alert("Proibido: Super Sets são permitidos apenas para exercícios Metabólicos (Máquinas ou Isolados)."); setSuperSetSelection(null); return; } const newSuperSetId = Math.random().toString(36).substr(2, 9); setWorkouts(prev => ({ ...prev, [day]: prev[day].map(ex => (ex.id === superSetSelection.sourceId || targetId === ex.id) ? { ...ex, superSetId: newSuperSetId } : ex) })); setSuperSetSelection(null); };
  const handleBreakSuperSet = (day: string, superSetId: string) => { setWorkouts(prev => ({ ...prev, [day]: prev[day].map(ex => ex.superSetId === superSetId ? { ...ex, superSetId: undefined } : ex) })); };

  const handleExportBackup = () => { const allData = { ...localStorage }; const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; const today = new Date().toISOString().split('T')[0]; link.download = `backup_hypervolume_${today}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const backupData = JSON.parse(e.target?.result as string); if (window.confirm("Atenção: A importação substituirá todos os seus dados atuais. O aplicativo será reiniciado. Deseja continuar?")) { localStorage.clear(); Object.keys(backupData).forEach((key) => { localStorage.setItem(key, backupData[key]); }); alert('Backup restaurado com sucesso! O app será reiniciado.'); window.location.reload(); } } catch (error) { alert('Erro ao ler o arquivo de backup. Verifique se é um JSON válido.'); console.error(error); } }; reader.readAsText(file); if (fileInputRef.current) fileInputRef.current.value = ''; };

  if (!isMounted) return null;

  const monitorPRs = (newLog: WorkoutLog) => {
    const exercisesToCheck = ['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'];
    const bw = strengthInputs.bw || 80;
    let updatedProfiles = { ...strengthProfiles };
    let foundNewPR = false;
    let achievementData = null;
    const oldGlobal = calculateGlobalStrengthLevel(updatedProfiles, bw);

    Object.values(newLog.split).flat().forEach((ex: WorkoutExercise) => {
      const baseExName = exercisesToCheck.find(base => ex.name.includes(base));
      if (baseExName) {
        const currentPR = updatedProfiles[baseExName] || 0;
        let best1RMInSesssion = 0;
        if (ex.sets && ex.sets.length > 0) { ex.sets.forEach(set => { if (set.load && set.reps > 0) { const calc = calculate1RM(set.load, set.reps); if (calc > best1RMInSesssion) best1RMInSesssion = calc; } }); } else if (ex.load && ex.reps > 0) { best1RMInSesssion = calculate1RM(ex.load, ex.reps); }
        if (best1RMInSesssion > currentPR + 0.1) { updatedProfiles[baseExName] = best1RMInSesssion; foundNewPR = true; const newGlobal = calculateGlobalStrengthLevel(updatedProfiles, bw); achievementData = { exercise: baseExName, old1RM: currentPR, new1RM: best1RMInSesssion, oldScore: oldGlobal.score, newScore: newGlobal.score, oldLevel: oldGlobal.fullLevel, newLevel: newGlobal.fullLevel, changedLevel: oldGlobal.name !== newGlobal.name }; }
      }
    });
    if (foundNewPR) { setStrengthProfiles(updatedProfiles); setAchievement(achievementData); }
  };

  const handleSaveExercise = (day: string, exercise: WorkoutExercise) => { const newLog: WorkoutLog = { id: Date.now(), date: new Date().toISOString(), name: `Log: ${exercise.name}`, totalSeries: exercise.sets?.length || exercise.series || 0, split: { [day]: [JSON.parse(JSON.stringify(exercise))] }, phase: activePhase?.name, week: currentWeek }; monitorPRs(newLog); setWorkoutHistory(prev => [newLog, ...prev]); };
  const saveStrengthRecord = () => { if (strengthResult.oneRM > 0) { setStrengthProfiles(prev => ({ ...prev, [strengthInputs.exercise]: strengthResult.oneRM })); alert(`1RM de ${strengthInputs.exercise} atualizado: ${strengthResult.oneRM.toFixed(1)}kg`); } };
  const handlePhaseActivation = (phaseId: string) => { setActivePhaseId(phaseId); setCurrentWeek(1); };
  const addToPlan = (name: string) => { setWeeklyPlan(prev => { if (prev.find(p => p.name === name)) return prev; return [...prev, { id: Date.now(), name, series: 0 }]; }); };
  const addToDay = (day: string, name: string, series?: number) => { const sCount = series || 3; const initialSets: WorkoutSet[] = Array.from({ length: sCount }).map(() => ({ id: Math.random().toString(36).substr(2, 9), reps: 10, load: null, rir: activePhase ? activePhase.rirTarget : null })); setWorkouts(prev => { const newEx: WorkoutExercise = { id: Date.now() + Math.random(), name, series: sCount, sets: initialSets, reps: 10, load: null, rir: activePhase ? activePhase.rirTarget : null }; const currentDayExs = prev[day] || []; return {...prev, [day]: [...currentDayExs, newEx]}; }); };
  const updateSeries = (id: number, series: number) => setWeeklyPlan(prev => prev.map(p => p.id === id ? { ...p, series } : p));
  const removeFromPlan = (id: number) => setWeeklyPlan(prev => prev.filter(p => p.id !== id));
  const updateWorkoutEx = (day: string, id: number, data: Partial<WorkoutExercise>) => setWorkouts(prev => ({ ...prev, [day]: prev[day].map(ex => ex.id === id ? { ...ex, ...data } : ex)}));
  const removeWorkoutEx = (day: string, id: number) => setWorkouts(prev => ({ ...prev, [day]: prev[day].filter(ex => ex.id !== id)}));
  
  const handleSaveWeek = () => {
    const allExs = (Object.values(workouts) as WorkoutExercise[][]).reduce((acc: WorkoutExercise[], v) => acc.concat(v), []);
    const totalSeries = allExs.reduce((acc, ex) => acc + (ex.sets?.length || ex.series || 0), 0);
    if (totalSeries === 0) return;
    const newLog: WorkoutLog = { id: Date.now(), date: new Date().toISOString(), name: logName || `S${currentWeek} - ${activePhase?.name || 'Geral'}`, totalSeries, split: JSON.parse(JSON.stringify(workouts)), phase: activePhase?.name, week: currentWeek };
    monitorPRs(newLog);
    setWorkoutHistory(prev => [newLog, ...prev]);
    setIsSaveModalOpen(false);
    setLogName('');
    setSaveButtonText('✅ Salvo!');
    setCurrentWeek(prev => prev < 4 ? prev + 1 : 1);
    setTimeout(() => setSaveButtonText('💾 Salvar Semana'), 2000);
  };

  const handleApplyReturn = (newSplit: WorkoutSplit, phaseId: string) => { setWorkouts(newSplit); setActivePhaseId(phaseId); setCurrentWeek(1); setActiveTab('workouts'); };
  const removeHistoryItem = (id: number) => { if (window.confirm("Tem certeza que deseja excluir este treino?")) { setWorkoutHistory(prev => prev.filter(item => item.id !== id)); } };
  const clearHistory = () => { if (window.confirm("Tem certeza que deseja apagar TODO o histórico? Essa ação é irreversível.")) { setWorkoutHistory([]); } };
  const handleDragStart = (exercise: WorkoutExercise, fromDay: string) => { if (isDeloadActive) return; setDraggedItem({ exercise, fromDay }); };
  const handleDragOver = (e: React.DragEvent, day: string) => { e.preventDefault(); if (isDeloadActive) return; setDragOverDay(day); };
  const handleDragLeave = () => { setDragOverDay(null); };
  const handleDrop = (e: React.DragEvent, toDay: string) => { e.preventDefault(); setDragOverDay(null); if (!draggedItem || draggedItem.fromDay === toDay || isDeloadActive) { setDraggedItem(null); return; } setWorkouts(prev => { const sourceDayExs = (prev[draggedItem.fromDay] || []).filter(ex => ex.id !== draggedItem.exercise.id); const targetDayExs = [...(prev[toDay] || []), draggedItem.exercise]; return { ...prev, [draggedItem.fromDay]: sourceDayExs, [toDay]: targetDayExs }; }); setDraggedItem(null); };
  const generateSmartSplit = () => { const split: WorkoutSplit = {}; const effectiveDays = activeDays.length > 0 ? activeDays : DAYS_OF_WEEK.slice(0, 4); effectiveDays.forEach(d => split[d] = []); const categories: Record<string, PlanItem[]> = { 'Push': [], 'Pull': [], 'Legs': [], 'Core/Accessory': [] }; weeklyPlan.filter(p => p.series > 0).forEach(item => { const cat = classifyExercise(item.name, PREDEFINED_EXERCISES); categories[cat].push(item); }); effectiveDays.forEach((day, idx) => { const rotationIdx = idx % 3; const targetCat = rotationIdx === 0 ? 'Push' : rotationIdx === 1 ? 'Pull' : 'Legs'; categories[targetCat].forEach(item => { const freq = Math.max(1, effectiveDays.length / 3); const seriesPerDay = Math.ceil(item.series / freq); const currentTotal = (Object.values(split) as WorkoutExercise[][]).flat().filter(ex => ex.name === item.name).reduce((a,b) => a + (b.sets?.length || b.series), 0); if (currentTotal < item.series) { const toAdd = Math.min(seriesPerDay, item.series - currentTotal); const initialSets: WorkoutSet[] = Array.from({ length: toAdd }).map(() => ({ id: Math.random().toString(36).substr(2, 9), reps: 10, load: null, rir: activePhase ? activePhase.rirTarget : null })); split[day].push({ id: Date.now() + Math.random(), name: item.name, series: toAdd, sets: initialSets, reps: 10, load: null, rir: activePhase ? activePhase.rirTarget : null }); } }); split[day] = sortExercisesSmartly(split[day]); }); setWorkouts(split); setActiveTab('workouts'); };
  const toggleExpandExercise = (id: number) => { setExpandedExerciseId(prev => prev === id ? null : id); };
  const getPhaseHeaderStyle = () => { if (isDeloadActive) return 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]'; if (!activePhase) return 'bg-slate-900 border-slate-800'; return 'bg-indigo-950/30 border-indigo-500/30 shadow-none'; };
  const getPhaseIconStyle = () => { if (isDeloadActive) return 'bg-emerald-600'; if (!activePhase) return 'bg-slate-700'; return 'bg-indigo-600'; };
  const getVolumeStatusColor = (status?: string) => { switch(status) { case 'MANUTENÇÃO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'; case 'PRODUTIVO': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; case 'OTIMIZADO': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'; case 'LIMITE': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'; default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; } };
  const handleSortPlan = () => { setWeeklyPlan(prev => sortExercisesSmartly(prev)); };
  const handleSortDay = (day: string) => { setWorkouts(prev => ({ ...prev, [day]: sortExercisesSmartly(prev[day]) })); };

  return (
    <div className={`min-h-screen pb-24 md:pb-20 transition-colors duration-500 ${isDeloadActive ? 'bg-slate-950' : 'bg-slate-950'}`}>
      <header className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${isDeloadActive ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`${isDeloadActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-indigo-600 shadow-indigo-600/20'} p-1.5 rounded-lg shadow-lg transition-colors`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h1 className={`text-lg md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${isDeloadActive ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-purple-500'} tracking-tighter uppercase transition-all`}>HYPERVOLUME</h1>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden lg:block"></div>

            <div className="flex items-center gap-4 bg-slate-800/30 px-4 py-2 rounded-2xl border border-slate-700/50">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isDeloadActive ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-purple-600'} flex items-center justify-center text-xs font-black shadow-lg transition-all`}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-200 tracking-tight">{userName}</span>
                    <span className={`text-[10px] font-black ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'} px-2 py-0.5 rounded-md border uppercase tracking-tighter transition-all`}>PI: {globalStrength.score}</span>
                </div>
                <span className={`text-[9px] font-black ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'} uppercase tracking-widest transition-all`}>{globalStrength.fullLevel}</span>
              </div>
              <button 
                onClick={() => setShowSettings(true)} 
                className={`w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-all text-slate-500 ${isDeloadActive ? 'hover:text-emerald-400' : 'hover:text-indigo-400'} active:scale-90`}
              >
                <svg className="w-5 h-5 overflow-visible" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
          <nav className="flex bg-slate-800/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'strength', label: 'Força', icon: '🦾' },
              { id: 'periodization', label: 'Estratégia', icon: '📖' },
              { id: 'plan', label: 'Plano', icon: '📐' },
              { id: 'workouts', label: 'Treinos', icon: '🏋️' },
              { id: 'analysis', label: 'Análise', icon: '📊' },
              { id: 'history', label: 'Histórico', icon: '🗓️' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? (isDeloadActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-slate-700') + ' text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {activeTab === 'analysis' && (
             <StatisticsDashboard history={workoutHistory} />
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-2xl transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
              <div className="p-5 md:p-8 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-black">Meta Semanal</h2>
                  <p className="text-slate-400 text-xs md:text-sm">Volume alvo por grupo muscular, organizado por categoria.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleSortPlan} className={`bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border transition-all ${isDeloadActive ? 'text-emerald-400 border-emerald-500/20' : 'text-indigo-400 border-indigo-500/20'}`}>
                    Organizar Tabela
                  </button>
                  <button onClick={() => { setTargetDay(null); setShowSelector(true); }} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}>
                    + Adicionar Exercício
                  </button>
                </div>
              </div>
              
              <div className="relative w-full overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse border-spacing-0">
                  <thead className="bg-slate-900 text-[10px] uppercase font-black text-slate-500 sticky top-0 z-40">
                    <tr>
                      <th className="p-4 w-64 bg-slate-950 sticky left-0 z-50 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50">Exercício</th>
                      <th className="p-4 w-20 text-center sticky left-64 z-50 bg-slate-950 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50">Séries</th>
                      {visibleMuscles.map(m => {
                        const isRelevantToFocusedEx = focusedPlanExerciseId ? (focusedPlanExerciseData?.muscles.some(mu => mu.name === m) ?? false) : false;
                        const isPrimary = focusedPlanExerciseId ? (focusedPlanExerciseData?.muscles.some(mu => mu.name === m && mu.type === 'principal') ?? false) : false;
                        return (
                          <th key={m} className={`p-4 w-24 text-center min-w-[100px] transition-all duration-300 ${focusedPlanExerciseId ? (isRelevantToFocusedEx ? (isPrimary ? (isDeloadActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10') : 'text-purple-400 bg-purple-500/10') : 'opacity-20 grayscale') : ''}`}>
                            {getShortMuscleName(m)}
                          </th>
                        );
                      })}
                      <th className="p-4 w-12 sticky right-0 bg-slate-900 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setShowSecondary(!showSecondary)}>{showSecondary ? '[-]' : '[+]'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {weeklyPlan.length === 0 ? (
                      <tr><td colSpan={visibleMuscles.length + 3} className="p-20 text-center text-slate-500 italic">Comece adicionando exercícios.</td></tr>
                    ) : (
                      (Object.entries(groupedPlan) as [string, PlanItem[]][]).map(([category, items]) => {
                        if (items.length === 0) return null;
                        const isCollapsed = collapsedCategories.includes(category);
                        const categorySeries = items.reduce((acc, item) => acc + (item.series || 0), 0);
                        return (
                          <React.Fragment key={category}>
                            <tr className="group bg-slate-950 cursor-pointer hover:bg-slate-900 transition-colors border-y border-slate-800/50" onClick={() => toggleCategory(category)}>
                              <td className={`p-4 sticky left-0 bg-slate-950 group-hover:bg-slate-900 z-30 font-black text-xs flex items-center gap-3 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 transition-colors ${isDeloadActive ? 'text-emerald-300' : 'text-indigo-300'}`}>
                                <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                <span>{category.toUpperCase()}</span>
                                {isCollapsed && <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-md ${isDeloadActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-indigo-900/50 text-indigo-400'}`}>{categorySeries}S</span>}
                              </td>
                              <td className={`p-4 text-center font-black text-xs sticky left-64 bg-slate-950 group-hover:bg-slate-900 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 transition-colors ${isDeloadActive ? 'text-emerald-400/60' : 'text-indigo-400/60'}`}>{!isCollapsed && `${categorySeries}S`}</td>
                              <td colSpan={visibleMuscles.length + 1} className="p-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest italic bg-slate-950 group-hover:bg-slate-900 transition-colors">{items.length} {items.length === 1 ? 'exercício' : 'exercícios'} neste grupo</td>
                            </tr>
                            {!isCollapsed && items.map(item => {
                              const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
                              const isExpanded = expandedExerciseId === item.id;
                              const isRowFocused = focusedPlanExerciseId === item.id;
                              return (
                                <React.Fragment key={item.id}>
                                  <tr className={`group transition-all hover:bg-slate-800/30 ${isExpanded ? 'bg-slate-800/40' : 'bg-slate-900'} ${focusedPlanExerciseId && !isRowFocused ? 'opacity-30 grayscale' : ''}`} onClick={() => toggleExpandExercise(item.id)}>
                                    <td className={`p-3 pl-8 w-64 font-bold text-sm sticky left-0 z-30 flex items-center gap-2 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 transition-colors bg-slate-950 group-hover:bg-slate-900`}>
                                      <div className={`w-1 h-4 rounded-full flex-shrink-0 transition-colors ${isRowFocused ? (isDeloadActive ? 'bg-emerald-400' : 'bg-indigo-400') : (isDeloadActive ? 'bg-emerald-500/20' : 'bg-indigo-500/20')}`}></div>
                                      <span className="truncate flex-1 min-w-0 cursor-pointer">{item.name}</span>
                                    </td>
                                    <td className={`p-2 w-20 sticky left-64 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 transition-colors bg-slate-950 group-hover:bg-slate-900`} onClick={(e) => e.stopPropagation()}>
                                      <input type="number" value={item.series || ''} onFocus={(e) => { e.target.select(); setFocusedPlanExerciseId(item.id); }} onBlur={() => setFocusedPlanExerciseId(null)} onChange={e => updateSeries(item.id, e.target.value === '' ? 0 : parseInt(e.target.value))} className={`w-full bg-slate-800/50 border rounded-lg p-1.5 text-center font-black outline-none transition-all ${isRowFocused ? (isDeloadActive ? 'border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20' : 'border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20') : (isDeloadActive ? 'border-slate-700/30 text-emerald-400' : 'border-slate-700/30 text-indigo-400')}`} />
                                    </td>
                                    {visibleMuscles.map(m => {
                                      const muscleData = ex?.muscles.find(mu => mu.name === m);
                                      const individualVolume = (item.series || 0) * (muscleData?.contribution || 0);
                                      const val = muscleData ? individualVolume.toFixed(1) : '-';
                                      const isCellRelevantToFocusedEx = isRowFocused && muscleData;
                                      const isPrimaryInCell = muscleData?.type === 'principal';
                                      return (
                                        <td key={m} className={`p-2 text-center text-xs relative transition-all duration-300 ${val !== '-' ? 'text-slate-100 font-bold' : 'text-slate-700 opacity-20'} ${isCellRelevantToFocusedEx ? (isPrimaryInCell ? (isDeloadActive ? 'bg-emerald-500/20 text-emerald-200 scale-110 shadow-lg shadow-emerald-500/10' : 'bg-indigo-500/20 text-indigo-200 scale-110 shadow-lg shadow-indigo-500/10') : 'bg-purple-500/10 text-purple-300 scale-105') : focusedPlanExerciseId && isRowFocused ? 'opacity-10 scale-95' : ''}`}>
                                          <span className="relative z-10">{val}</span>
                                          {isCellRelevantToFocusedEx && <div className={`absolute inset-0 border-x ${isPrimaryInCell ? (isDeloadActive ? 'border-emerald-500/30' : 'border-indigo-500/30') : 'border-purple-500/20'}`}></div>}
                                        </td>
                                      );
                                    })}
                                    <td className={`p-4 sticky right-0 text-center transition-colors bg-slate-950 group-hover:bg-slate-900`} onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => removeFromPlan(item.id)} className="text-slate-700 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </td>
                                  </tr>
                                  {isExpanded && ex && (
                                    <tr className={`bg-slate-900/60 border-l-4 transition-colors ${isDeloadActive ? 'border-emerald-500' : 'border-indigo-500'}`}>
                                      <td colSpan={visibleMuscles.length + 3} className="p-8">
                                        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-top-2">
                                          <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition-all ${isDeloadActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>Matriz de Contribuição: {ex.name}</span>
                                            <div className="h-px bg-slate-800 flex-1"></div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {ex.muscles.sort((a,b) => b.contribution - a.contribution).map((m, idx) => (
                                              <div key={idx} className={`p-5 rounded-3xl border transition-all ${m.type === 'principal' ? (isDeloadActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-indigo-500/5 border-indigo-500/20') : 'bg-slate-800/30 border-slate-700/50'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">{getMuscleEmoji(m.name)}</div>
                                                    <div><h5 className="font-black text-sm text-white">{m.name}</h5><span className={`text-[8px] font-black uppercase tracking-widest ${m.type === 'principal' ? (isDeloadActive ? 'text-emerald-400' : 'text-indigo-400') : 'text-slate-500'}`}>{m.type}</span></div>
                                                  </div>
                                                  <div className="text-right"><span className="text-lg font-black text-white">{Math.round(m.contribution * 100)}%</span><p className="text-[8px] text-slate-600 font-bold uppercase">Contribuição</p></div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className={`bg-slate-900 font-black border-t-2 sticky bottom-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-colors ${isDeloadActive ? 'border-emerald-500' : 'border-indigo-500'}`}>
                    <tr>
                      <td className="p-4 w-64 sticky left-0 bg-slate-950 z-40 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 text-xs">TOTAIS</td>
                      <td className={`p-4 w-20 text-center text-lg sticky left-64 bg-slate-950 z-40 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{weeklyPlan.reduce((a, b) => a + (b.series || 0), 0)}</td>
                      {visibleMuscles.map(m => (
                        <td key={m} className={`p-4 text-center tabular-nums transition-colors ${isDeloadActive ? 'text-emerald-300' : 'text-indigo-300'}`}>{muscleTotals[m].toFixed(1)}</td>
                      ))}
                      <td className="p-4 sticky right-0 bg-slate-900"></td>
                    </tr>
                    <tr className="border-t border-slate-800/50 bg-slate-950">
                      <td className="p-4 w-64 sticky left-0 bg-slate-950 text-[10px] text-slate-500 uppercase font-black shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50 z-40">SAÚDE DO PLANO</td>
                      <td className="p-4 w-20 sticky left-64 bg-slate-950 z-40 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-slate-800/50"></td>
                      {visibleMuscles.map(m => {
                        const { label, color, bg, icon } = getVolumeLevelData(m, muscleTotals[m], globalStrength.score);
                        return (
                          <td key={m} className="p-3 text-center uppercase bg-slate-950">
                             <div className={`flex flex-col items-center gap-1 ${bg} ${color} p-2 rounded-xl border border-white/5 shadow-inner transition-all duration-300`}>
                                <span className="text-xs leading-none">{icon}</span>
                                <span className="text-[8px] font-black tracking-tighter whitespace-nowrap">{label}</span>
                             </div>
                          </td>
                        );
                      })}
                      <td className="p-4 sticky right-0 bg-slate-900"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* --- RESTORED TABS: STRENGTH, WORKOUTS, PERIODIZATION, HISTORY --- */}
        {activeTab === 'strength' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 <div className={`lg:col-span-3 bg-slate-900 border rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                     <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full transition-colors ${isDeloadActive ? 'bg-emerald-600/5' : 'bg-indigo-600/5'}`}></div>
                     <div className="max-w-3xl relative z-10">
                     <span className={`${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'} font-black uppercase text-xs tracking-[0.4em] mb-4 block transition-colors`}>Power Matrix</span>
                     <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-6 tracking-tighter leading-none">Teste de Força</h2>
                     <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">Descubra seu 1RM estimado e salve para que o app sugira cargas em isolados.</p>
                     </div>
                 </div>
                 <div className={`bg-slate-900 border rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-center items-center text-center relative group overflow-hidden transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                     <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${isDeloadActive ? 'from-emerald-600/5 to-teal-600/5' : 'from-indigo-600/5 to-purple-600/5'}`}></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Status de Atleta</span>
                     <div className="relative mb-6">
                         <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                             <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                             <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className={isDeloadActive ? 'text-emerald-500' : 'text-indigo-500'} strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * globalStrength.score) / 100} strokeLinecap="round" />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-2xl font-black text-white leading-none">{globalStrength.score}</span>
                             <span className="text-[8px] font-bold text-slate-500">PTS</span>
                         </div>
                     </div>
                     <div className="space-y-1">
                         <h4 className={`text-xl font-black uppercase tracking-tighter transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{globalStrength.fullLevel}</h4>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                             {globalStrength.count}/4 Levantamentos salvos
                         </p>
                     </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white mb-4">Calculadora</h3>
                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Exercício Base</label>
                       <select value={strengthInputs.exercise} onChange={(e) => setStrengthInputs({...strengthInputs, exercise: e.target.value})} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all appearance-none ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}>
                           <option>Supino</option>
                           <option>Agachamento</option>
                           <option>Levantamento Terra</option>
                           <option>Remada Curvada</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Peso Corporal (kg)</label>
                       <input type="number" value={strengthInputs.bw || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs({...strengthInputs, bw: parseFloat(e.target.value) || 0})} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`} placeholder="Ex: 80" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Carga Utilizada (kg)</label>
                       <input type="number" value={strengthInputs.load || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs({...strengthInputs, load: parseFloat(e.target.value) || 0})} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`} placeholder="Carga total" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Repetições Máximas</label>
                       <input type="number" value={strengthInputs.reps || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs({...strengthInputs, reps: parseInt(e.target.value) || 0})} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`} placeholder="Ex: 8" />
                    </div>
                    <button onClick={saveStrengthRecord} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}>Salvar no Perfil de Força</button>
                 </div>
                 <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className={`bg-slate-900 border rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl group transition-all duration-500 ${isDeloadActive ? 'hover:border-emerald-500/50 border-emerald-900/40' : 'border-slate-800 hover:border-indigo-500/50'}`}>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estimativa de 1RM</span>
                          <span className={`text-6xl font-black tracking-tighter mb-2 tabular-nums transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{strengthResult.oneRM.toFixed(1)}<span className="text-2xl text-slate-600 ml-1">kg</span></span>
                          <p className="text-xs text-slate-500 font-medium">Sua força teórica para 1 repetição.</p>
                       </div>
                       <div className={`bg-slate-900 border rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl group transition-all duration-500 ${isDeloadActive ? 'hover:border-emerald-500/50 border-emerald-900/40' : 'border-slate-800 hover:border-indigo-500/50'}`}>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nível de Força</span>
                          <span className={`text-2xl font-black px-6 py-3 rounded-2xl mb-4 ${strengthResult.bg} ${strengthResult.color}`}>{strengthResult.level}</span>
                          <div className="flex gap-1 items-center"><span className="text-xs font-bold text-slate-400">Ratio:</span><span className="text-xs font-black text-white">{strengthResult.ratio.toFixed(2)}x BW</span></div>
                       </div>
                    </div>
                 </div>
              </div>
          </div>
        )}

        {activeTab === 'periodization' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className={`bg-slate-900 border rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full transition-colors ${isDeloadActive ? 'bg-emerald-600/5' : 'bg-indigo-600/5'}`}></div>
                <div className="max-w-3xl relative z-10">
                   <span className={`${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'} font-black uppercase text-xs tracking-[0.4em] mb-4 block transition-colors`}>Manual de Guerra</span>
                   <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-6 tracking-tighter leading-none">Periodização</h2>
                   <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">Escolha sua estratégia de progressão.</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {macrocycles.map((macro, i) => (
                    <div key={i} className="col-span-full space-y-8">
                        <div className="flex items-center gap-4"><h3 className="text-2xl font-black uppercase tracking-tight text-white">{macro.name}</h3><div className="h-px bg-slate-800 flex-1"></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {macro.phases.map(phase => (
                              <div key={phase.id} className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${activePhaseId === phase.id ? 'bg-indigo-600 border-indigo-400 shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`} onClick={() => handlePhaseActivation(phase.id)}>
                                 {activePhaseId === phase.id && <div className="absolute top-4 right-4 bg-white/20 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">Ativo</div>}
                                 <div><h4 className={`text-xl font-black ${activePhaseId === phase.id ? 'text-white' : 'text-slate-100'}`}>{phase.name}</h4><p className={`text-xs font-medium leading-relaxed mb-6 line-clamp-3 ${activePhaseId === phase.id ? 'text-white/80' : 'text-slate-500'}`}>{phase.description}</p></div>
                              </div>
                           ))}
                        </div>
                    </div>
                 ))}
             </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-3 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDeloadActive ? 'text-emerald-400' : 'text-slate-500'}`}>MODO DELOAD</span>
                <button onClick={() => setIsDeloadActive(!isDeloadActive)} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isDeloadActive ? 'bg-emerald-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDeloadActive ? 'left-6' : 'left-1'}`}></div></button>
              </div>
            </div>
            {isDeloadActive && <div className="bg-emerald-600/10 border border-emerald-500/30 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"><h2 className="text-3xl font-black text-white uppercase">Deload Estratégico</h2></div>}
            <div className={`p-6 md:p-8 rounded-[2.5rem] border space-y-8 shadow-xl transition-colors ${isDeloadActive ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="max-w-xl"><h2 className="text-2xl font-black uppercase">Organizador de Sessão</h2></div>
                <div className="flex flex-wrap justify-center gap-4">
                  {!isDeloadActive && <button onClick={generateSmartSplit} className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Otimizar Split</button>}
                  <button onClick={() => setIsSaveModalOpen(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}>{saveButtonText}</button>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800"><div className="flex flex-wrap gap-2">{DAYS_OF_WEEK.map(day => (<button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${activeDays.includes(day) ? (isDeloadActive ? 'bg-emerald-600 border-emerald-400' : 'bg-indigo-600 border-indigo-400') + ' text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>{day.split('-')[0]}</button>))}</div></div>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${activeDays.length <= 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-8`}>
              {DAYS_OF_WEEK.filter(day => activeDays.includes(day) || (workouts[day] && workouts[day].length > 0)).map(day => (
                 <div key={day} onDragOver={(e) => handleDragOver(e, day)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, day)} className={`rounded-[2.5rem] border p-10 shadow-lg group flex flex-col transition-all duration-300 ${day === todayName ? (isDeloadActive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-indigo-500/50 bg-indigo-500/5') : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-8"><h3 className={`text-2xl font-black uppercase tracking-tighter text-white`}>{day.split('-')[0]}</h3></div>
                    <div className="space-y-2 flex-1 relative">
                       {(workouts[day] || []).map((ex, index) => (
                          <div key={ex.id} className="relative group/row">
                             <WorkoutRow exercise={ex} day={day} onUpdate={updateWorkoutEx} onDelete={removeWorkoutEx} onSave={handleSaveExercise} activePhase={activePhase} currentWeek={currentWeek} workoutHistory={workoutHistory} strengthProfiles={strengthProfiles} onDragStart={() => handleDragStart(ex, day)} isDragging={draggedItem?.exercise.id === ex.id} onInitiateSuperSet={() => handleInitiateSuperSet(day, ex.id)} onBreakSuperSet={() => ex.superSetId && handleBreakSuperSet(day, ex.superSetId)} isSelectedForSuperSet={superSetSelection?.sourceId === ex.id} isDeloadActive={isDeloadActive} userLevel={globalStrength.fullLevel} />
                          </div>
                       ))}
                    </div>
                    <div className="mt-10 flex gap-3"><button onClick={() => { setTargetDay(day); setShowSelector(true); }} className={`flex-1 py-5 rounded-2xl transition-all border uppercase tracking-[0.15em] text-[11px] font-black bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/50`}>+ CATÁLOGO</button></div>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA HISTÓRICO RESTAURADA --- */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex justify-between items-center relative z-40 bg-slate-950/50 backdrop-blur-sm p-2 rounded-2xl">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Histórico de Performance</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Seus registros de treinamento semanais</p>
              </div>
              {workoutHistory.length > 0 && (
                <button onClick={clearHistory} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all shadow-lg active:scale-95">Limpar Tudo</button>
              )}
            </div>
            {workoutHistory.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-20 text-center space-y-4">
                <span className="text-6xl opacity-10">🗓️</span>
                <p className="text-slate-500 font-medium italic">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {workoutHistory.map((log) => (
                  <div key={log.id} className={`bg-slate-900 border rounded-[2rem] p-6 shadow-xl relative group overflow-hidden transition-all hover:border-indigo-500/50 ${isDeloadActive ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest mb-2 inline-block transition-colors ${isDeloadActive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-indigo-400/10 text-indigo-400'}`}>S{log.week} • {log.phase || 'Geral'}</span>
                        <h3 className="text-xl font-black text-white truncate">{log.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <button onClick={() => removeHistoryItem(log.id)} className="text-slate-400 hover:text-red-500 transition-all p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Volume Total</span><span className={`text-lg font-black transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{log.totalSeries} <span className="text-[10px] text-slate-600">Séries</span></span></div>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><span className="text-lg font-black text-slate-300">{(Object.values(log.split) as WorkoutExercise[][]).filter(d => d.length > 0).length} <span className="text-[10px] text-slate-600">Dias</span></span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODAIS DE SUPORTE --- */}
      <ExerciseSelectorModal isOpen={showSelector} onClose={() => setShowSelector(false)} onSelect={(name) => { if (targetDay) addToDay(targetDay, name); else addToPlan(name); }} catalog={PREDEFINED_EXERCISES} activePhase={activePhase} currentDayExercises={targetDay ? workouts[targetDay] || [] : []} planItems={weeklyPlan} isAddingToPlan={!targetDay} />
      <PlanImporterModal isOpen={showImporter} onClose={() => setShowImporter(false)} onSelect={(name, series) => targetDay && addToDay(targetDay, name, series)} planItems={weeklyPlan} dayName={targetDay || ''} />
      <ReturnToTrainingModal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} workoutHistory={workoutHistory} onApply={handleApplyReturn} strengthProfiles={strengthProfiles} currentWorkouts={workouts} />
      <AchievementModal isOpen={!!achievement} onClose={() => setAchievement(null)} data={achievement} />
      
      {/* --- MODAL DE CONFIGURAÇÕES (PERFIL DO ATLETA) REFEITO --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Perfil do Atleta</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
               </div>
               
               <div className="space-y-8">
                 {/* DADOS BÁSICOS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome de Guerra</label>
                     <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none transition-all text-white font-bold focus:ring-2 focus:ring-indigo-500" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Peso Corporal Atual (kg)</label>
                     <input type="number" value={strengthInputs.bw || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs(prev => ({ ...prev, bw: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none transition-all text-white font-bold focus:ring-2 focus:ring-indigo-500" />
                   </div>
                 </div>

                 {/* BACKUP */}
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Gestão de Dados (Backup)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button onClick={handleExportBackup} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                          <span className="text-lg">📥</span> <span className="text-xs font-black uppercase text-slate-400 group-hover:text-white">Exportar JSON</span>
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                          <span className="text-lg">📤</span> <span className="text-xs font-black uppercase text-slate-400 group-hover:text-white">Importar JSON</span>
                       </button>
                       <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImportBackup} />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2 text-center italic">O backup salva todos os seus dados. Ao importar, o app será reiniciado.</p>
                 </div>

                 <div className="w-full h-px bg-slate-800"></div>

                 {/* DASHBOARD DE FORÇA (NOVO DESIGN) */}
                 <div>
                    <div className="flex justify-between items-center mb-4">
                       <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-lg">💪</span> Dashboard de Força</h4>
                       <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30">Power Index: {globalStrength.score}</span>
                    </div>

                    <div className="space-y-3">
                       {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => {
                          const currentVal = strengthProfiles[ex] || 0;
                          const ratio = strengthInputs.bw > 0 ? (currentVal / strengthInputs.bw).toFixed(2) : '0.00';
                          return (
                             <div key={ex} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all">
                                <div>
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{ex}</label>
                                   <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        value={currentVal ? Math.round(currentVal) : ''} 
                                        onChange={(e) => setStrengthProfiles(prev => ({ ...prev, [ex]: parseFloat(e.target.value) || 0 }))}
                                        className="bg-transparent text-xl font-black text-white w-20 outline-none border-b border-slate-800 focus:border-indigo-500 transition-colors"
                                        placeholder="0"
                                      />
                                      <span className="text-[10px] font-bold text-slate-600">KG (1RM)</span>
                                   </div>
                                </div>
                                <div className="text-right">
                                   {currentVal > 0 ? (
                                      <>
                                         <span className="bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-800">Nível {calculateStrengthLevel(ex, strengthInputs.bw, currentVal, 1).level}</span>
                                         <p className="text-[9px] font-bold text-slate-500 mt-1">Ratio: {ratio}x BW</p>
                                      </>
                                   ) : (
                                      <span className="text-[9px] font-bold text-slate-700 bg-slate-900 px-2 py-1 rounded">DADOS INCOMPLETOS</span>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
