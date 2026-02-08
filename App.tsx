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
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5)); // Padrão Seg-Sex
  const [isDeloadActive, setIsDeloadActive] = useState(false);
  const [strengthInputs, setStrengthInputs] = useState({
    exercise: 'Supino',
    bw: 80,
    load: 0,
    reps: 0
  });

  // Super Set Selection State
  const [superSetSelection, setSuperSetSelection] = useState<{ day: string, sourceId: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [logName, setLogName] = useState('');
  const [targetDay, setTargetDay] = useState<string | null>(null);
  const [numTrainingDays, setNumTrainingDays] = useState(4);
  const [showSecondary, setShowSecondary] = useState(false);
  const [saveButtonText, setSaveButtonText] = useState('💾 Salvar Semana');
  const [draggedItem, setDraggedItem] = useState<{ exercise: WorkoutExercise, fromDay: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [analysisView, setAnalysisView] = useState<'realtime' | 'statistics' | 'ia'>('realtime');
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [focusedPlanExerciseId, setFocusedPlanExerciseId] = useState<number | null>(null);

  // Achievements State
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

  // Lógica de Saldo para Importação de Planos
  const availablePlanItems = useMemo(() => {
    // 1. Calcular volume já alocado por exercício nos treinos atuais
    const scheduledVolume: Record<string, number> = {};
    Object.values(workouts).flat().forEach(ex => {
        const count = ex.sets?.length || ex.series || 0;
        scheduledVolume[ex.name] = (scheduledVolume[ex.name] || 0) + count;
    });

    // 2. Filtrar plano semanal pelos itens que têm saldo de séries a realizar
    return weeklyPlan.filter(item => {
        const scheduled = scheduledVolume[item.name] || 0;
        return item.series > scheduled;
    }).map(item => ({
        ...item,
        // Mantemos o nome original mas passamos apenas o saldo como sugestão de séries
        series: item.series - (scheduledVolume[item.name] || 0)
    }));
  }, [weeklyPlan, workouts]);

  const recuperationRisks = useMemo(() => checkRecuperationRisk(workouts), [workouts]);
  const analysisData = useMemo(() => analyzeTrends(workoutHistory, globalStrength.score), [workoutHistory, globalStrength.score]);

  const macrocycles = useMemo(() => {
    // Definir a ordem exata solicitada: INÍCIO, FORÇA, REALIZAÇÃO, RESISTÊNCIA, HIPERTROFIA
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

  // Super Set Selection Handlers
  const handleInitiateSuperSet = (day: string, id: number) => {
    if (isDeloadActive) return;
    setSuperSetSelection({ day, sourceId: id });
  };

  const handleQuickLink = (day: string, currentId: number, nextId: number) => {
    if (isDeloadActive) return;
    const newSuperSetId = Math.random().toString(36).substr(2, 9);
    setWorkouts(prev => ({
      ...prev,
      [day]: prev[day].map(ex => 
        (ex.id === currentId || ex.id === nextId)
          ? { ...ex, superSetId: newSuperSetId }
          : ex
      )
    }));
  };

  const handleExerciseClick = (day: string, targetId: number) => {
    if (!superSetSelection || isDeloadActive) return;

    if (superSetSelection.day !== day) {
      alert("Selecione um exercício do mesmo dia.");
      setSuperSetSelection(null);
      return;
    }

    if (superSetSelection.sourceId === targetId) {
      setSuperSetSelection(null);
      return;
    }

    const targetEx = workouts[day].find(ex => ex.id === targetId);
    const exData = PREDEFINED_EXERCISES.find(e => e.name === targetEx?.name);
    
    if (exData?.isCompound && !exData?.isGuided) {
      alert("Proibido: Super Sets são permitidos apenas para exercícios Metabólicos (Máquinas ou Isolados).");
      setSuperSetSelection(null);
      return;
    }

    const newSuperSetId = Math.random().toString(36).substr(2, 9);
    setWorkouts(prev => ({
      ...prev,
      [day]: prev[day].map(ex => 
        (ex.id === superSetSelection.sourceId || targetId === ex.id)
          ? { ...ex, superSetId: newSuperSetId }
          : ex
      )
    }));
    setSuperSetSelection(null);
  };

  const handleBreakSuperSet = (day: string, superSetId: string) => {
    setWorkouts(prev => ({
      ...prev,
      [day]: prev[day].map(ex => 
        ex.superSetId === superSetId 
          ? { ...ex, superSetId: undefined } 
          : ex
      )
    }));
  };

  // --- Funções de Exportação e Importação ---
  const handleExportData = () => {
    const backupData = {
      plan: weeklyPlan,
      workouts: workouts,
      history: workoutHistory,
      activePhaseId: activePhaseId,
      currentWeek: currentWeek,
      userName: userName,
      strengthProfiles: strengthProfiles,
      userBW: strengthInputs.bw,
      activeDays: activeDays,
      manualRir: manualRir,
      manualProgression: manualProgression,
      manualMethodology: manualMethodology,
      version: "2.5",
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hypervolume_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (window.confirm("Atenção: A importação substituirá todos os seus dados atuais. Deseja continuar?")) {
          // Atualiza os estados fundamentais
          if (data.plan) setWeeklyPlan(data.plan);
          if (data.workouts) setWorkouts(data.workouts);
          if (data.history) setWorkoutHistory(data.history);
          if (data.activePhaseId !== undefined) setActivePhaseId(data.activePhaseId);
          if (data.currentWeek !== undefined) setCurrentWeek(data.currentWeek);
          if (data.userName) setUserName(data.userName);
          if (data.strengthProfiles) setStrengthProfiles(data.strengthProfiles);
          if (data.userBW !== undefined) setStrengthInputs(prev => ({ ...prev, bw: data.userBW }));
          if (data.activeDays) setActiveDays(data.activeDays);
          
          // Novos campos de periodização manual
          if (data.manualRir !== undefined) setManualRir(data.manualRir);
          if (data.manualProgression) setManualProgression(data.manualProgression);
          if (data.manualMethodology !== undefined) setManualMethodology(data.manualMethodology);
          
          setShowSettings(false);
          alert("Dados importados com sucesso! O aplicativo foi atualizado.");
        }
      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro ao importar arquivo: Formato inválido ou corrompido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

        if (ex.sets && ex.sets.length > 0) {
          ex.sets.forEach(set => {
            if (set.load && set.reps > 0) {
              const calc = calculate1RM(set.load, set.reps);
              if (calc > best1RMInSesssion) best1RMInSesssion = calc;
            }
          });
        } else if (ex.load && ex.reps > 0) {
          best1RMInSesssion = calculate1RM(ex.load, ex.reps);
        }

        if (best1RMInSesssion > currentPR + 0.1) {
          updatedProfiles[baseExName] = best1RMInSesssion;
          foundNewPR = true;
          
          const newGlobal = calculateGlobalStrengthLevel(updatedProfiles, bw);
          achievementData = {
            exercise: baseExName,
            old1RM: currentPR,
            new1RM: best1RMInSesssion,
            oldScore: oldGlobal.score,
            newScore: newGlobal.score,
            oldLevel: oldGlobal.fullLevel,
            newLevel: newGlobal.fullLevel,
            changedLevel: oldGlobal.name !== newGlobal.name
          };
        }
      }
    });

    if (foundNewPR) {
      setStrengthProfiles(updatedProfiles);
      setAchievement(achievementData);
    }
  };

  const handleSaveExercise = (day: string, exercise: WorkoutExercise) => {
    const newLog: WorkoutLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: `Log: ${exercise.name}`,
      totalSeries: exercise.sets?.length || exercise.series || 0,
      split: { [day]: [JSON.parse(JSON.stringify(exercise))] },
      phase: activePhase?.name,
      week: currentWeek
    };
    monitorPRs(newLog);
    setWorkoutHistory(prev => [newLog, ...prev]);
  };

  const saveStrengthRecord = () => {
     if (strengthResult.oneRM > 0) {
        setStrengthProfiles(prev => ({
           ...prev,
           [strengthInputs.exercise]: strengthResult.oneRM
        }));
        alert(`1RM de ${strengthInputs.exercise} atualizado: ${strengthResult.oneRM.toFixed(1)}kg`);
     }
  };

  const updateProfileValue = (ex: string, val: string) => {
    const num = parseFloat(val) || 0;
    setStrengthProfiles(prev => ({ ...prev, [ex]: num }));
  };

  const handlePhaseActivation = (phaseId: string) => {
      setActivePhaseId(phaseId);
      setCurrentWeek(1);
  };

  const addToPlan = (name: string) => {
    setWeeklyPlan(prev => {
        if (prev.find(p => p.name === name)) return prev;
        return [...prev, { id: Date.now(), name, series: 0 }];
    });
  };

  const addToDay = (day: string, name: string, series?: number) => {
    const sCount = series || 3;
    const initialSets: WorkoutSet[] = Array.from({ length: sCount }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      reps: 10,
      load: null,
      rir: activePhase ? activePhase.rirTarget : null
    }));

    setWorkouts(prev => {
        const newEx: WorkoutExercise = { 
            id: Date.now() + Math.random(), 
            name, 
            series: sCount, 
            sets: initialSets,
            reps: 10, 
            load: null, 
            rir: activePhase ? activePhase.rirTarget : null 
        };
        const currentDayExs = prev[day] || [];
        return {...prev, [day]: [...currentDayExs, newEx]};
    });
  };

  const updateSeries = (id: number, series: number) => setWeeklyPlan(prev => prev.map(p => p.id === id ? { ...p, series } : p));
  const removeFromPlan = (id: number) => setWeeklyPlan(prev => prev.filter(p => p.id !== id));
  const updateWorkoutEx = (day: string, id: number, data: Partial<WorkoutExercise>) => setWorkouts(prev => ({ ...prev, [day]: prev[day].map(ex => ex.id === id ? { ...ex, ...data } : ex)}));
  const removeWorkoutEx = (day: string, id: number) => setWorkouts(prev => ({ ...prev, [day]: prev[day].filter(ex => ex.id !== id)}));

  const handleSaveWeek = () => {
    const allExs = (Object.values(workouts) as WorkoutExercise[][]).reduce((acc: WorkoutExercise[], v) => acc.concat(v), []);
    const totalSeries = allExs.reduce((acc, ex) => acc + (ex.sets?.length || ex.series || 0), 0);
    if (totalSeries === 0) return;

    const newLog: WorkoutLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: logName || `S${currentWeek} - ${activePhase?.name || 'Geral'}`,
      totalSeries,
      split: JSON.parse(JSON.stringify(workouts)),
      phase: activePhase?.name,
      week: currentWeek
    };
    
    monitorPRs(newLog);
    setWorkoutHistory(prev => [newLog, ...prev]);
    setIsSaveModalOpen(false);
    setLogName('');
    setSaveButtonText('✅ Salvo!');
    setCurrentWeek(prev => prev < 4 ? prev + 1 : 1);
    setTimeout(() => setSaveButtonText('💾 Salvar Semana'), 2000);
  };

  const handleApplyReturn = (newSplit: WorkoutSplit, phaseId: string) => {
    setWorkouts(newSplit);
    setActivePhaseId(phaseId);
    setCurrentWeek(1);
    setActiveTab('workouts');
  };

  const removeHistoryItem = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este treino?")) {
      setWorkoutHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const clearHistory = () => {
    if (window.confirm("Tem certeza que deseja apagar TODO o histórico? Essa ação é irreversível.")) {
      setWorkoutHistory([]);
    }
  };

  const handleDragStart = (exercise: WorkoutExercise, fromDay: string) => {
    if (isDeloadActive) return;
    setDraggedItem({ exercise, fromDay });
  };

  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    if (isDeloadActive) return;
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, toDay: string) => {
    e.preventDefault();
    setDragOverDay(null);
    if (!draggedItem || draggedItem.fromDay === toDay || isDeloadActive) {
      setDraggedItem(null);
      return;
    }

    setWorkouts(prev => {
      const sourceDayExs = (prev[draggedItem.fromDay] || []).filter(ex => ex.id !== draggedItem.exercise.id);
      const targetDayExs = [...(prev[toDay] || []), draggedItem.exercise];
      
      return {
        ...prev,
        [draggedItem.fromDay]: sourceDayExs,
        [toDay]: targetDayExs
      };
    });
    setDraggedItem(null);
  };

  const generateSmartSplit = () => {
    const split: WorkoutSplit = {};
    const effectiveDays = activeDays.length > 0 ? activeDays : DAYS_OF_WEEK.slice(0, 4);
    effectiveDays.forEach(d => split[d] = []);
    
    const categories: Record<string, PlanItem[]> = { 'Push': [], 'Pull': [], 'Legs': [], 'Core/Accessory': [] };
    weeklyPlan.filter(p => p.series > 0).forEach(item => {
        const cat = classifyExercise(item.name, PREDEFINED_EXERCISES);
        categories[cat].push(item);
    });
    
    effectiveDays.forEach((day, idx) => {
        const rotationIdx = idx % 3;
        const targetCat = rotationIdx === 0 ? 'Push' : rotationIdx === 1 ? 'Pull' : 'Legs';
        categories[targetCat].forEach(item => {
            const freq = Math.max(1, effectiveDays.length / 3);
            const seriesPerDay = Math.ceil(item.series / freq);
            const currentTotal = (Object.values(split) as WorkoutExercise[][]).flat().filter(ex => ex.name === item.name).reduce((a,b) => a + (b.sets?.length || b.series), 0);
            if (currentTotal < item.series) {
                const toAdd = Math.min(seriesPerDay, item.series - currentTotal);
                const initialSets: WorkoutSet[] = Array.from({ length: toAdd }).map(() => ({
                  id: Math.random().toString(36).substr(2, 9),
                  reps: 10,
                  load: null,
                  rir: activePhase ? activePhase.rirTarget : null
                }));
                split[day].push({ id: Date.now() + Math.random(), name: item.name, series: toAdd, sets: initialSets, reps: 10, load: null, rir: activePhase ? activePhase.rirTarget : null });
            }
        });
        split[day] = sortExercisesSmartly(split[day]);
    });
    setWorkouts(split);
    setActiveTab('workouts');
  };

  const toggleExpandExercise = (id: number) => {
    setExpandedExerciseId(prev => prev === id ? null : id);
  };

  const getPhaseHeaderStyle = () => {
    if (isDeloadActive) return 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]';
    if (!activePhase) return 'bg-slate-900 border-slate-800';
    // Estilo Uniforme e Sóbrio para todas as fases
    return 'bg-indigo-950/30 border-indigo-500/30 shadow-none';
  };

  const getPhaseIconStyle = () => {
    if (isDeloadActive) return 'bg-emerald-600';
    if (!activePhase) return 'bg-slate-700';
    // Ícone uniforme (Independente da fase ser Hipertrofia ou Força)
    return 'bg-indigo-600';
  };

  const getVolumeStatusColor = (status?: string) => {
    switch(status) {
      case 'MANUTENÇÃO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'PRODUTIVO': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'OTIMIZADO': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'LIMITE': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const handleSortPlan = () => {
    setWeeklyPlan(prev => sortExercisesSmartly(prev));
  };

  const handleSortDay = (day: string) => {
    setWorkouts(prev => ({
        ...prev,
        [day]: sortExercisesSmartly(prev[day])
    }));
  };

  return (
    <div className={`min-h-screen pb-24 md:pb-20 transition-colors duration-500 ${isDeloadActive ? 'bg-slate-950' : 'bg-slate-950'}`}>
      <header className={`backdrop-blur-md border-b sticky top-0 z-40 transition-colors duration-300 ${isDeloadActive ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-3xl border shadow-xl gap-4 transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                  <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black uppercase tracking-tight">Dashboard de Performance</h2>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest transition-all ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>Motor Reativo v2.0</span>
                    </div>
                  </div>
                  <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                      <button 
                        onClick={() => setAnalysisView('realtime')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisView === 'realtime' ? (isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Tempo Real
                      </button>
                      <button 
                        onClick={() => setAnalysisView('statistics')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisView === 'statistics' ? (isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Estatísticas
                      </button>
                      <button 
                        onClick={() => setAnalysisView('ia')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisView === 'ia' ? (isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Consultoria IA
                      </button>
                  </div>
                </div>

                {analysisView === 'ia' ? (
                  <AICoach history={workoutHistory} plan={weeklyPlan} phase={activePhase} strengthProfiles={strengthProfiles} userName={userName} />
                ) : analysisView === 'realtime' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
                                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className={isDeloadActive ? "text-emerald-500" : "text-indigo-500"} strokeDasharray="263.9" strokeDashoffset={263.9 - (263.9 * (analysisData?.recoveryScore || 0)) / 100} strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-3xl font-black">{analysisData?.recoveryScore || 0}%</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Resiliência Metabólica</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Prontidão Neuromuscular</p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between overflow-y-auto max-h-[400px] no-scrollbar">
                            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 sticky top-0 bg-slate-900 pb-2 z-10">Volume Adaptativo</h4>
                            <div className="space-y-4">
                                {(showSecondary ? MUSCLE_SORT_ORDER : MUSCULOS_GRANDES).map(m => {
                                    const currentVol = analysisData?.muscleTrends[m]?.[analysisData.muscleTrends[m].length - 1] || 0;
                                    const status = getVolumeLevelData(m, currentVol, globalStrength.score);
                                    return (
                                        <div key={m} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-slate-300">{m}</span>
                                                <span className={status.color}>{status.label} ({currentVol.toFixed(1)}S)</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className={`${status.level === 5 ? 'bg-red-500' : (isDeloadActive ? 'bg-emerald-500' : 'bg-indigo-500')} h-full transition-all duration-1000`} style={{ width: `${Math.min(100, (currentVol / (24 * (0.6 + globalStrength.score/100))) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Risk Matrix</h4>
                            <div className="space-y-3">
                                {isDeloadActive ? (
                                    <div className="flex gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                        <span className="text-emerald-400">🛡️</span>
                                        <p className="text-xs text-emerald-100 font-bold leading-tight">MÓDULO DE RECUPERAÇÃO ATIVO: Riscos de fadiga suspensos. Foco em restauração.</p>
                                    </div>
                                ) : (
                                    analysisData?.warnings.length === 0 ? (
                                        <p className="text-slate-500 text-sm italic py-4">Nenhum risco detectado. Ótima recuperação!</p>
                                    ) : (
                                        analysisData?.warnings.map((w, i) => (
                                            <div key={i} className="flex gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                                                <span className="text-red-400">⚠️</span>
                                                <p className="text-xs text-red-100 font-medium leading-tight">{w}</p>
                                            </div>
                                        ))
                                    )
                                )}
                                {!isDeloadActive && Object.entries(recuperationRisks).map(([day, muscles]) => (
                                    <div key={day} className="flex gap-3 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
                                        <span className="text-yellow-400">⏳</span>
                                        <p className="text-xs text-yellow-100 font-medium leading-tight">
                                            Conflito de descanso em <strong>{day}</strong>: {(muscles as string[]).join(', ')}.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-xl font-black uppercase tracking-tight">Workload Global (Tonelagem)</h3>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toneladas Movidas / Músculo</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {(showSecondary ? MUSCLE_SORT_ORDER : MUSCULOS_GRANDES).map(m => {
                                const data = analysisData?.workloadTrends[m] || [];
                                const maxVal = Math.max(...data, 1);
                                const currentWorkload = data[data.length - 1] || 0;
                                return (
                                    <div key={m} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <span>{getMuscleEmoji(m)}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{getShortMuscleName(m)}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400">{(currentWorkload / 1000).toFixed(1)}t</span>
                                        </div>
                                        <div className="flex items-end gap-1.5 h-16">
                                            {data.map((v, idx) => (
                                                <div key={idx} className={`${isDeloadActive ? 'bg-emerald-500/40 border-emerald-400' : 'bg-indigo-500/40 border-indigo-400'} flex-1 border-t-2 rounded-t-sm transition-all`} style={{ height: `${(v / maxVal) * 100}%` }}></div>
                                            ))}
                                            {data.length === 0 && <div className="text-slate-800 text-[10px] italic">Sem dados</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                ) : (
                  <StatisticsDashboard history={workoutHistory} />
                )}
            </div>
        )}

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
                      <select 
                        value={strengthInputs.exercise}
                        onChange={(e) => setStrengthInputs({...strengthInputs, exercise: e.target.value})}
                        className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all appearance-none ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                      >
                         <option>Supino</option>
                         <option>Agachamento</option>
                         <option>Levantamento Terra</option>
                         <option>Remada Curvada</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Peso Corporal (kg)</label>
                      <input 
                        type="number" 
                        value={strengthInputs.bw || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setStrengthInputs({...strengthInputs, bw: parseFloat(e.target.value) || 0})}
                        className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                        placeholder="Ex: 80"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Carga Utilizada (kg)</label>
                      <input 
                        type="number" 
                        value={strengthInputs.load || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setStrengthInputs({...strengthInputs, load: parseFloat(e.target.value) || 0})}
                        className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                        placeholder="Carga total"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Repetições Máximas</label>
                      <input 
                        type="number" 
                        value={strengthInputs.reps || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setStrengthInputs({...strengthInputs, reps: parseInt(e.target.value) || 0})}
                        className={`w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 transition-all ${isDeloadActive ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                        placeholder="Ex: 8"
                      />
                   </div>
                   <button 
                     onClick={saveStrengthRecord}
                     className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}
                   >
                     Salvar no Perfil de Força
                   </button>
                </div>
                <div className="lg:col-span-2 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className={`bg-slate-900 border rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl group transition-all duration-500 ${isDeloadActive ? 'hover:border-emerald-500/50 border-emerald-900/40' : 'border-slate-800 hover:border-indigo-500/50'}`}>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estimativa de 1RM</span>
                         <span className={`text-6xl font-black tracking-tighter mb-2 tabular-nums transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {strengthResult.oneRM.toFixed(1)}<span className="text-2xl text-slate-600 ml-1">kg</span>
                         </span>
                         <p className="text-xs text-slate-500 font-medium">Sua força teórica para 1 repetição.</p>
                      </div>
                      <div className={`bg-slate-900 border rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl group transition-all duration-500 ${isDeloadActive ? 'hover:border-emerald-500/50 border-emerald-900/40' : 'border-slate-800 hover:border-indigo-500/50'}`}>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nível de Força</span>
                         <span className={`text-2xl font-black px-6 py-3 rounded-2xl mb-4 ${strengthResult.bg} ${strengthResult.color}`}>
                            {strengthResult.level}
                         </span>
                         <div className="flex gap-1 items-center">
                            <span className="text-xs font-bold text-slate-400">Ratio:</span>
                            <span className="text-xs font-black text-white">{strengthResult.ratio.toFixed(2)}x BW</span>
                         </div>
                         <div className="mt-6 pt-4 border-t border-slate-800 w-full">
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                              {strengthResult.prescription}
                            </p>
                         </div>
                      </div>
                   </div>
                   <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl">
                      <h4 className="text-sm font-black text-white uppercase mb-6 tracking-widest">Seu Banco de Força</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => (
                            <div key={ex} className={`bg-slate-950/50 p-4 rounded-2xl border text-center transition-colors ${isDeloadActive ? 'border-emerald-500/20' : 'border-slate-800'}`}>
                               <span className="text-[8px] text-slate-500 font-black uppercase block mb-1">{ex}</span>
                               <span className={`text-lg font-black transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{strengthProfiles[ex]?.toFixed(1) || '--'} <span className="text-[9px] text-slate-600">kg</span></span>
                            </div>
                         ))}
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-6 italic">* Estas valores são usados pelo Smart Load para sugerir pesos em outros exercícios.</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex justify-between items-center relative z-40 bg-slate-950/50 backdrop-blur-sm p-2 rounded-2xl">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Histórico de Performance</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Seus registros de treinamento semanais</p>
              </div>
              {workoutHistory.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all shadow-lg active:scale-95"
                >
                  Limpar Tudo
                </button>
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
                      <button 
                        onClick={() => removeHistoryItem(log.id)}
                        className="text-slate-400 hover:text-red-500 transition-all p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Volume Total</span>
                        <span className={`text-lg font-black transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{log.totalSeries} <span className="text-[10px] text-slate-600">Séries</span></span>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                        <span className="text-lg font-black text-slate-300">{(Object.values(log.split) as WorkoutExercise[][]).filter(d => d.length > 0).length} <span className="text-[10px] text-slate-600">Dias</span></span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-800/50">
                       <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Distribuição de Músculos</h4>
                       <div className="flex flex-wrap gap-1.5">
                          {Object.entries(calculateMuscleVolumeForLog(log))
                            .filter(([_, vol]) => (vol as number) > 0)
                            .slice(0, 5)
                            .map(([muscle, _]) => (
                               <span key={muscle} className="text-[8px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">{getShortMuscleName(muscle)}</span>
                            ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
                    Organizar Tabela
                  </button>
                  <button onClick={() => { setTargetDay(null); setShowSelector(true); }} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    Adicionar Exercício
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/80 text-[10px] uppercase font-black text-slate-500 sticky top-0 z-20">
                    <tr>
                      <th className="p-4 w-52 bg-slate-900 sticky left-0 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.3)]">Exercício</th>
                      <th className="p-4 w-20 text-center sticky left-52 z-30 bg-slate-900 shadow-[4px_0_8px_rgba(0,0,0,0.3)]">Séries</th>
                      {visibleMuscles.map(m => {
                        const isRelevantToFocusedEx = focusedPlanExerciseId ? (focusedPlanExerciseData?.muscles.some(mu => mu.name === m) ?? false) : false;
                        const isPrimary = focusedPlanExerciseId ? (focusedPlanExerciseData?.muscles.some(mu => mu.name === m && mu.type === 'principal') ?? false) : false;
                        
                        return (
                          <th key={m} className={`p-4 w-24 text-center min-w-[100px] transition-all duration-300 ${focusedPlanExerciseId ? (isRelevantToFocusedEx ? (isPrimary ? (isDeloadActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10') : 'text-purple-400 bg-purple-500/10') : 'opacity-20 grayscale') : ''}`}>
                            {getShortMuscleName(m)}
                          </th>
                        );
                      })}
                      <th className="p-4 w-12 sticky right-0 bg-slate-900 text-center cursor-pointer" onClick={() => setShowSecondary(!showSecondary)}>{showSecondary ? '[-]' : '[+]'}</th>
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
                            <tr 
                              className="bg-slate-950/80 cursor-pointer hover:bg-slate-800/50 transition-colors border-y border-slate-800/50"
                              onClick={() => toggleCategory(category)}
                            >
                              <td className={`p-4 sticky left-0 bg-inherit z-20 font-black text-xs flex items-center gap-3 shadow-[4px_0_8px_rgba(0,0,0,0.15)] transition-colors ${isDeloadActive ? 'text-emerald-300' : 'text-indigo-300'}`}>
                                <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                <span>{category.toUpperCase()}</span>
                              </td>
                              <td className={`p-4 text-center font-black text-xs sticky left-52 bg-inherit z-20 shadow-[4px_0_8px_rgba(0,0,0,0.15)] transition-colors ${isDeloadActive ? 'text-emerald-400/60' : 'text-indigo-400/60'}`}>
                                {categorySeries}S
                              </td>
                              <td colSpan={visibleMuscles.length + 1} className="p-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                                {items.length} {items.length === 1 ? 'exercício' : 'exercícios'} neste grupo
                              </td>
                            </tr>
                            {!isCollapsed && items.map(item => {
                              const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
                              const isExpanded = expandedExerciseId === item.id;
                              const isRowFocused = focusedPlanExerciseId === item.id;
                              
                              return (
                                <React.Fragment key={item.id}>
                                  <tr className={`hover:bg-slate-800/20 group transition-all cursor-pointer ${isExpanded ? 'bg-slate-800/40' : ''} ${focusedPlanExerciseId && !isRowFocused ? 'opacity-30 grayscale' : ''}`} onClick={() => toggleExpandExercise(item.id)}>
                                    <td className="p-4 w-52 font-bold text-sm sticky left-0 bg-inherit z-10 flex items-center gap-2 shadow-[4px_0_8px_rgba(0,0,0,0.15)]">
                                      <div className={`w-1 h-4 rounded-full mr-1 transition-colors ${isRowFocused ? (isDeloadActive ? 'bg-emerald-400' : 'bg-indigo-400') : (isDeloadActive ? 'bg-emerald-500/20' : 'bg-indigo-500/20')}`}></div>
                                      <span className="truncate">{item.name}</span>
                                    </td>
                                    <td className="p-4 w-20 sticky left-52 bg-inherit z-10 shadow-[4px_0_8px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
                                      <input 
                                        type="number" 
                                        value={item.series || ''} 
                                        onFocus={(e) => { e.target.select(); setFocusedPlanExerciseId(item.id); }} 
                                        onBlur={() => setFocusedPlanExerciseId(null)}
                                        onChange={e => updateSeries(item.id, e.target.value === '' ? 0 : parseInt(e.target.value))} 
                                        className={`w-full bg-slate-800/30 border rounded-lg p-2 text-center font-black outline-none transition-all ${isRowFocused ? (isDeloadActive ? 'border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20' : 'border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20') : (isDeloadActive ? 'border-slate-700/30 text-emerald-400' : 'border-slate-700/30 text-indigo-400')}`} 
                                      />
                                    </td>
                                    {visibleMuscles.map(m => {
                                      const muscleData = ex?.muscles.find(mu => mu.name === m);
                                      const individualVolume = (item.series || 0) * (muscleData?.contribution || 0);
                                      const val = muscleData ? individualVolume.toFixed(1) : '-';
                                      
                                      const isCellRelevantToFocusedEx = isRowFocused && muscleData;
                                      const isPrimaryInCell = muscleData?.type === 'principal';
                                      
                                      return (
                                        <td key={m} className={`p-4 text-center text-xs relative transition-all duration-300 ${val !== '-' ? 'text-slate-100 font-bold' : 'text-slate-600 opacity-30'} ${isCellRelevantToFocusedEx ? (isPrimaryInCell ? (isDeloadActive ? 'bg-emerald-500/20 text-emerald-200 scale-110 shadow-lg shadow-emerald-500/10' : 'bg-indigo-500/20 text-indigo-200 scale-110 shadow-lg shadow-indigo-500/10') : 'bg-purple-500/10 text-purple-300 scale-105') : focusedPlanExerciseId && isRowFocused ? 'opacity-10 scale-95' : ''}`}>
                                          <span className="relative z-10">{val}</span>
                                          {isCellRelevantToFocusedEx && <div className={`absolute inset-0 border-x ${isPrimaryInCell ? (isDeloadActive ? 'border-emerald-500/30' : 'border-indigo-500/30') : 'border-purple-500/20'}`}></div>}
                                        </td>
                                      );
                                    })}
                                    <td className="p-4 sticky right-0 bg-inherit text-center" onClick={(e) => e.stopPropagation()}>
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
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
                                                      {getMuscleEmoji(m.name)}
                                                    </div>
                                                    <div>
                                                      <h5 className="font-black text-sm text-white">{m.name}</h5>
                                                      <span className={`text-[8px] font-black uppercase tracking-widest ${m.type === 'principal' ? (isDeloadActive ? 'text-emerald-400' : 'text-indigo-400') : 'text-slate-500'}`}>{m.type}</span>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <span className="text-lg font-black text-white">{Math.round(m.contribution * 100)}%</span>
                                                    <p className="text-[8px] text-slate-600 font-bold uppercase">Contribuição</p>
                                                  </div>
                                                </div>
                                                {m.importance && (
                                                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic border-t border-slate-700/30 pt-3 mt-3">
                                                    {m.importance}
                                                  </p>
                                                )}
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
                  <tfoot className={`bg-slate-900 font-black border-t-2 sticky bottom-0 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-colors ${isDeloadActive ? 'border-emerald-500' : 'border-indigo-500'}`}>
                    <tr>
                      <td className="p-4 w-52 sticky left-0 bg-slate-900 shadow-[4px_0_8px_rgba(0,0,0,0.3)]">TOTAIS</td>
                      <td className={`p-4 w-20 text-center text-lg sticky left-52 bg-slate-900 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.3)] transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{weeklyPlan.reduce((a, b) => a + (b.series || 0), 0)}</td>
                      {visibleMuscles.map(m => (
                        <td key={m} className={`p-4 text-center tabular-nums transition-colors ${isDeloadActive ? 'text-emerald-300' : 'text-indigo-300'}`}>{muscleTotals[m].toFixed(1)}</td>
                      ))}
                      <td className="p-4 sticky right-0 bg-slate-900"></td>
                    </tr>
                    <tr className="border-t border-slate-800/50">
                      <td className="p-4 w-52 sticky left-0 bg-slate-900 text-[10px] text-slate-500 uppercase font-black shadow-[4px_0_8px_rgba(0,0,0,0.3)]">SAÚDE DO PLANO</td>
                      <td className="p-4 w-20 sticky left-52 bg-slate-900 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.3)]"></td>
                      {visibleMuscles.map(m => {
                        const { label, color, bg, icon } = getVolumeLevelData(m, muscleTotals[m], globalStrength.score);
                        return (
                          <td key={m} className="p-3 text-center uppercase">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Status de Volume Base</h4>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">📉</span>
                    <div>
                      <span className="text-[10px] font-black text-blue-400 uppercase">MANUTENÇÃO (MEV)</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Mínimo Efetivo. Mantém a massa magra atual, mas gera pouco estímulo para novas adaptações.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">🚀</span>
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase">PRODUTIVO (MAV)</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Volume Adaptativo Médio. Zona ideal para hipertrofia contínua com boa recuperação.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Alta Intensidade de Volume</h4>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">💎</span>
                    <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase">OTIMIZADO (MRV Progressivo)</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Perto do limite recuperável. Recomendado para fases de pico de volume em atletas avançados.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">⚡</span>
                    <div>
                      <span className="text-[10px] font-black text-orange-400 uppercase">LIMITE (Overreaching)</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Volume de choque. Sustentável por pouco tempo. Requer semanas de deload após o uso.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Zonas de Alerta</h4>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">🛑</span>
                    <div>
                      <span className="text-[10px] font-black text-red-500 uppercase">OVERTRAINING</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Volume além da capacidade de síntese e recuperação. Risco iminente de lesão ou estagnação.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">⚪</span>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">SEM TREINO</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Nenhuma série direta ou indireta registrada para este grupo muscular no plano atual.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar for Workouts */}
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-3 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDeloadActive ? 'text-emerald-400' : 'text-slate-500'}`}>MODO DELOAD</span>
                <button 
                  onClick={() => setIsDeloadActive(!isDeloadActive)}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isDeloadActive ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDeloadActive ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {isDeloadActive && (
               <div className="bg-emerald-600/10 border border-emerald-500/30 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-full bg-emerald-500/5 -skew-x-12"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/40 animate-bounce">🛡️</div>
                    <div>
                       <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Deload Estratégico</h2>
                       <p className="text-emerald-200/70 font-bold uppercase text-[10px] tracking-[0.3em]">Ambiente Restaurador Ativo</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-emerald-500/20 max-w-md relative z-10">
                    <p className="text-xs text-emerald-100 font-medium leading-relaxed italic">
                      "A recuperação é onde o músculo realmente cresce. Respeite as cargas leves e o volume reduzido para voltar mais forte na próxima semana."
                    </p>
                  </div>
               </div>
            )}

            {activePhase && !isDeloadActive && (
              <div className="space-y-4">
                <div className={`p-6 rounded-[2rem] border ${getPhaseHeaderStyle()} shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-5xl ${getPhaseIconStyle()}`}>
                      {activePhase.id === 'f_manual' ? '🧪' : activePhase.stage === 'INÍCIO' ? '🌱' : activePhase.stage === 'FORÇA' ? '🦾' : activePhase.stage === 'HIPERTROFIA' ? (activePhase.id === 'm6_o_pico' ? '💀' : '🔱') : '💪'}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black uppercase text-white tracking-tighter">{activePhase.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Alvo Metabólico:</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${getVolumeStatusColor(activePhase.targetVolumeStatus)}`}>{activePhase.targetVolumeStatus || 'QUALQUER'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                    {[1, 2, 3, 4].map(w => (
                      <button key={w} onClick={() => setCurrentWeek(w)} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${currentWeek === w ? (isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                        S{w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exclusive Alert: Mesociclo 2: O Pico (Overreaching) */}
                {activePhaseId === 'm6_o_pico' && !isDeloadActive && (
                  <div className="bg-amber-600/10 border border-amber-500/30 p-5 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-xl animate-pulse shadow-lg">⚡</div>
                    <div>
                       <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-0.5">Alerta de Overreaching</h4>
                       <p className="text-[11px] text-amber-200/80 font-medium leading-tight">
                         O volume desta fase é altíssimo. Adicione um dia extra de treino (Full Body ou Pontos Fracos) para diluir a carga.
                       </p>
                    </div>
                  </div>
                )}

                {!isDeloadActive && (
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-3xl flex items-start gap-4">
                      <div className="text-2xl mt-1">💡</div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Advisor de Estratégia</h4>
                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                            {activePhase.id === 'f1_acumulacao' 
                              ? "Nesta fase, ignore os alertas de 'LIMITE' na aba de plano. O objetivo é justamente acumular fadiga controlada para supercompensação posterior."
                              : activePhase.id === 'f2_intensificacao'
                              ? "Cuidado com o volume excessivo. Priorize a carga. Se algum músculo entrar em 'OTIMIZADO', considere remover uma série para preservar a força."
                              : activePhase.targetVolumeStatus === 'MANUTENÇÃO'
                              ? "Mantenha o volume estritamente na faixa de Manutenção. Excesso de séries aqui prejudica a recuperação central necessária para o próximo bloco."
                              : activePhase.stage === 'HIPERTROFIA'
                              ? "BEM-VINDO AO PICO. Aqui o volume é extremo. Use técnicas de intensidade em todas as séries. Recuperação é sua prioridade #1 fora da academia."
                              : "Acompanhe a saúde do plano. Busque equilibrar os grupos musculares na faixa 'PRODUTIVA' para ganhos estéticos simétricos."
                            }
                        </p>
                      </div>
                  </div>
                )}
              </div>
            )}
            <div className={`p-6 md:p-8 rounded-[2.5rem] border space-y-8 shadow-xl transition-colors ${isDeloadActive ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-black uppercase">Organizador de Sessão</h2>
                  <p className="text-slate-400 text-sm">Monte seu treino diário e escolha seus dias ativos.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {activePhase?.id === 'fr_retorno' && !isDeloadActive && (
                    <button 
                      onClick={() => setShowReturnModal(true)} 
                      className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      ⏳ Ajustar Retorno
                    </button>
                  )}
                  {!isDeloadActive && <button onClick={generateSmartSplit} className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Otimizar Split</button>}
                  <button onClick={() => setIsSaveModalOpen(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'} text-white`}>
                    {saveButtonText}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Seus Dias de Treino:</label>
                 <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                       <button
                         key={day}
                         onClick={() => toggleDay(day)}
                         className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${activeDays.includes(day) ? (isDeloadActive ? 'bg-emerald-600 border-emerald-400' : 'bg-indigo-600 border-indigo-400') + ' text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                       >
                         {day.split('-')[0]}
                       </button>
                    ))}
                 </div>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 ${activeDays.length <= 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-8`}>
              {DAYS_OF_WEEK.filter(day => activeDays.includes(day) || (workouts[day] && workouts[day].length > 0)).map(day => {
                const isToday = day === todayName;
                const dailyExercises = workouts[day] || [];
                
                return (
                  <div 
                    key={day} 
                    onDragOver={(e) => handleDragOver(e, day)} 
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)} 
                    className={`rounded-[2.5rem] border p-10 shadow-lg group flex flex-col transition-all duration-300 ${isToday ? (isDeloadActive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-indigo-500/50 bg-indigo-500/5') + ' shadow-[0_0_50px_rgba(79,70,229,0.12)] ring-1 ring-white/5 scale-[1.01] z-10' : 'bg-slate-900 border-slate-800'} ${dragOverDay === day ? (isDeloadActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-indigo-500 bg-indigo-500/5') : ''}`}
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex flex-col">
                          {isToday && <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 animate-pulse transition-colors ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{isDeloadActive ? '🌿 RECUPERAÇÃO HOJE' : '🔥 TREINO DE HOJE'}</span>}
                          <h3 className={`text-2xl font-black uppercase tracking-tighter ${isToday ? (isDeloadActive ? 'text-emerald-300' : 'text-indigo-300') : 'text-white'}`}>{day.split('-')[0]}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleSortDay(day)}
                          title="Ordenação Inteligente"
                          className={`p-2 rounded-xl border border-white/5 transition-all active:scale-90 ${isDeloadActive ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
                        </button>
                        <span className={`text-[11px] font-black px-4 py-1.5 rounded-xl shadow-inner transition-all ${isToday ? (isDeloadActive ? 'bg-emerald-500' : 'bg-indigo-500') + ' text-white' : (isDeloadActive ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20' : 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20')}`}>{(workouts[day] || []).length} EXS</span>
                      </div>
                    </div>
                    <div className="space-y-2 flex-1 relative">
                      {dailyExercises.length === 0 ? (
                        <div className={`h-40 border-2 border-dashed rounded-3xl flex items-center justify-center uppercase text-xs font-black tracking-[0.2em] opacity-40 italic transition-colors ${isDeloadActive ? 'border-emerald-800/50 text-emerald-700' : 'border-slate-800/50 text-slate-700'}`}>{isDeloadActive ? 'Descanso Regenerativo' : 'Dia de Recuperação Ativa'}</div>
                      ) : (dailyExercises.map((ex, index) => {
                        const nextEx = dailyExercises[index + 1];
                        const prevEx = dailyExercises[index - 1];
                        const isPartofSuperSet = !!ex.superSetId && !isDeloadActive;
                        const isStart = isPartofSuperSet && (!prevEx || prevEx.superSetId !== ex.superSetId);
                        const isEnd = isPartofSuperSet && (!nextEx || nextEx.superSetId !== ex.superSetId);
                        const isMiddle = isPartofSuperSet && !isStart && !isEnd;

                        const curData = PREDEFINED_EXERCISES.find(e => e.name === ex.name);
                        const nxtData = nextEx ? PREDEFINED_EXERCISES.find(e => e.name === nextEx.name) : null;
                        
                        const curIsTensional = !!curData?.isCompound && !curData?.isGuided;
                        const nxtIsTensional = !!nxtData?.isCompound && !nxtData?.isGuided;
                        const isOndulatoria = activePhase?.id === 'm4_ondulatoria';
                        const forbiddenInOndulatoria = isOndulatoria && (curIsTensional || nxtIsTensional);

                        const canShowLinkButton = !!nextEx && !forbiddenInOndulatoria && !isDeloadActive;
                        const isLinkedToNext = canShowLinkButton && !!ex.superSetId && ex.superSetId === nextEx.superSetId;

                        return (
                          <div key={ex.id} className="relative group/row">
                            {isPartofSuperSet && (
                              <div className={`absolute -left-6 ${isStart ? 'top-4' : 'top-0'} ${isEnd ? 'bottom-4' : 'bottom-0'} w-1 bg-indigo-500/40 rounded-full transition-all group-hover/row:bg-indigo-500`}>
                                {isStart && <div className="absolute -top-1 -left-1.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white shadow-lg">1</div>}
                                {isEnd && <div className="absolute -bottom-1 -left-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white shadow-lg">2</div>}
                              </div>
                            )}
                            <div 
                              className={`transition-all duration-300 ${superSetSelection && superSetSelection.sourceId !== ex.id ? 'hover:scale-[1.02] cursor-pointer' : ''}`}
                              onClick={() => superSetSelection && handleExerciseClick(day, ex.id)}
                            >
                              <WorkoutRow 
                                exercise={ex} 
                                day={day} 
                                onUpdate={updateWorkoutEx} 
                                onDelete={removeWorkoutEx} 
                                onSave={handleSaveExercise}
                                activePhase={activePhase} 
                                currentWeek={currentWeek} 
                                workoutHistory={workoutHistory} 
                                strengthProfiles={strengthProfiles}
                                onDragStart={() => handleDragStart(ex, day)}
                                isDragging={draggedItem?.exercise.id === ex.id}
                                onInitiateSuperSet={() => handleInitiateSuperSet(day, ex.id)}
                                onBreakSuperSet={() => ex.superSetId && handleBreakSuperSet(day, ex.superSetId)}
                                isSelectedForSuperSet={superSetSelection?.sourceId === ex.id}
                                isDeloadActive={isDeloadActive}
                                userLevel={globalStrength.fullLevel}
                              />
                            </div>

                            {/* Botão de Vínculo Rápido (Inject Only) */}
                            {canShowLinkButton && (
                              <div className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 z-[35]">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLinkedToNext) handleBreakSuperSet(day, ex.superSetId!);
                                    else handleQuickLink(day, ex.id, nextEx.id);
                                  }}
                                  className={`w-7 h-7 rounded-full border shadow-xl flex items-center justify-center transition-all active:scale-90 ${isLinkedToNext ? 'bg-indigo-600 border-indigo-400 text-white rotate-90 scale-110' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50'}`}
                                  title={isLinkedToNext ? "Desvincular Super Set" : "Vincular Super Set"}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </button>
                              </div>
                            )}

                            {isPartofSuperSet && isStart && (
                              <div className="absolute -right-2 top-0 bottom-0 flex items-center pointer-events-none">
                                 <span className="bg-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg translate-x-1/2 whitespace-nowrap z-20">BI-SET LINKED</span>
                              </div>
                            )}
                          </div>
                        );
                      }))}
                    </div>
                    <div className="mt-10 flex gap-3">
                      <button onClick={() => { setTargetDay(day); setShowSelector(true); }} className={`flex-1 py-5 rounded-2xl transition-all border uppercase tracking-[0.15em] text-[11px] font-black ${isDeloadActive ? 'bg-emerald-900/20 border-emerald-500/20 text-emerald-400/60 hover:text-emerald-300' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/50'}`}>+ CATÁLOGO</button>
                      <button onClick={() => { setTargetDay(day); setShowImporter(true); }} className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 border ${isDeloadActive ? 'bg-emerald-600/10 hover:bg-emerald-600 border-emerald-500/20 text-emerald-400 hover:text-white' : 'bg-indigo-600/10 hover:bg-indigo-600 border-indigo-500/20 text-indigo-400 hover:text-white'}`} title="Importar do Plano">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {activeDays.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum dia de treino selecionado. Ative os dias acima para começar.</p>
                 </div>
              )}
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
                   <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">Escolha sua estratégia de progressão. Ao ativar uma fase, o app ajusta automaticamente os alvos de RIR e regras de carga.</p>
                </div>
             </div>

             <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-6 rounded-[2.5rem] border shadow-inner transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                 <div className="md:col-span-4 mb-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Legenda de Alvo Metabólico</h4>
                 </div>
                 {[
                   { status: 'MANUTENÇÃO', icon: '📉', desc: 'Preservar massa com baixo estresse.' },
                   { status: 'PRODUTIVO', icon: '🚀', desc: 'Estímulo padrão para hipertrofia.' },
                   { status: 'OTIMIZADO', icon: '💎', desc: 'Máximo volume para ganhos densos.' },
                   { status: 'LIMITE', icon: '⚡', desc: 'Zona de choque (Overreaching).' },
                 ].map(item => (
                   <div key={item.status} className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{item.icon}</span>
                        <span className={`text-[10px] font-black uppercase ${getVolumeStatusColor(item.status).split(' ')[0]}`}>{item.status}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium leading-tight">{item.desc}</p>
                   </div>
                 ))}
             </div>

             {activePhaseId === 'f_manual' && (
               <div className={`border p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 transition-colors ${isDeloadActive ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-indigo-600/10 border-indigo-500/30'}`}>
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                     <div className="max-w-md w-full">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">⚙️</span>
                          <h3 className="text-2xl font-black uppercase tracking-tighter">Customização Manual</h3>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-6">Defina os parâmetros globais para sua fase customizada. Escolha como quer progredir.</p>
                        
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Metodologia Pessoal / Notas</label>
                           <textarea 
                             value={manualMethodology}
                             onChange={(e) => setManualMethodology(e.target.value)}
                             placeholder="Ex: Focar em amplitude máxima. Descanso de 60s em isolados..."
                             className={`w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-200 outline-none transition-all min-h-[120px] resize-none ${isDeloadActive ? 'focus:ring-2 focus:ring-emerald-500' : 'focus:ring-2 focus:ring-indigo-500'}`}
                           />
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap gap-8 bg-slate-900/60 p-8 rounded-3xl border border-white/5 flex-1 w-full">
                        <div className="space-y-6 flex-1 min-w-[250px]">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Alvo Global RIR (Proximidade da Falha)</label>
                              <div className="flex items-center gap-6">
                                 <input 
                                   type="range" min="0" max="5" step="1" 
                                   value={manualRir} 
                                   onChange={(e) => setManualRir(parseInt(e.target.value))}
                                   className={`flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer transition-all ${isDeloadActive ? 'accent-emerald-500' : 'accent-indigo-500'}`} 
                                 />
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isDeloadActive ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}>
                                    <span className="text-2xl font-black text-white">{manualRir}</span>
                                 </div>
                              </div>
                              <div className="flex justify-between mt-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                 <span>FALHA TOTAL (0)</span>
                                 <span>CONSERVADOR (5)</span>
                              </div>
                           </div>

                           <div className="h-px bg-slate-800 w-full"></div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Regra de Progressão Principal</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                 {[
                                   {id: 'load', label: 'Carga', icon: '⚖️'},
                                   {id: 'reps', label: 'Repetições', icon: '🔢'},
                                   {id: 'volume', label: 'Volume', icon: '📈'},
                                   {id: 'technique', label: 'Técnica', icon: '🧘'},
                                   {id: 'mixed', label: 'Mista', icon: '🌪️'},
                                 ].map(opt => (
                                   <button 
                                     key={opt.id}
                                     onClick={() => setManualProgression(opt.id as any)}
                                     className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 transition-all ${manualProgression === opt.id ? (isDeloadActive ? 'bg-emerald-600 border-emerald-400' : 'bg-indigo-600 border-indigo-400') + ' text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                                   >
                                     <span>{opt.icon}</span> {opt.label}
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             <div className="space-y-16">
                {macrocycles.map((macro, i) => (
                   <div key={i} className="space-y-8">
                      <div className="flex items-center gap-4">
                         <h3 className="text-2xl font-black uppercase tracking-tight text-white">{macro.name}</h3>
                         <div className="h-px bg-slate-800 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {macro.phases.map(phase => (
                            <div 
                              key={phase.id} 
                              className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${activePhaseId === phase.id ? (isDeloadActive ? 'bg-emerald-600 border-emerald-400' : 'bg-indigo-600 border-indigo-400') + ' shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                              onClick={() => {
                                if (phase.id === 'fr_retorno') {
                                  setShowReturnModal(true);
                                } else {
                                  handlePhaseActivation(phase.id);
                                }
                              }}
                            >
                               {activePhaseId === phase.id && (
                                  <div className="absolute top-4 right-4 bg-white/20 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">Ativo</div>
                               )}
                               <div>
                                 <div className="flex justify-between items-start mb-3">
                                    <h4 className={`text-xl font-black ${activePhaseId === phase.id ? 'text-white' : 'text-slate-100'}`}>{phase.name}</h4>
                                 </div>
                                 <div className="mb-4">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border tracking-widest ${getVolumeStatusColor(phase.targetVolumeStatus)}`}>
                                      Alvo: {phase.targetVolumeStatus || 'LIVRE'}
                                      {
                                        // 1. FASE DE RETORNO: Começa baixo e sobe para aprender técnica
                                        phase.id === 'fr_retorno' ? ' ➔ PRODUTIVO' :
                                        
                                        // 2. ACUMULAÇÃO: Foco total em subir volume
                                        phase.id === 'f1_acumulacao' ? ' ➔ OTIMIZADO' :
                                        
                                        // 3. INTENSIFICAÇÃO: Volume estagnado, foco em Carga
                                        phase.id === 'f2_intensificacao' ? ' (CARGA MÁX)' :
                                        
                                        // 4. O PICO (Overreaching): Volume extremo de choque
                                        phase.id === 'm6_o_pico' ? ' ➔ LIMITE (CHOQUE)' :
                                        
                                        // 5. ONDULATÓRIA: Volume muda todo dia
                                        phase.id === 'm4_ondulatoria' ? ' (VARIÁVEL)' :
                                        
                                        // 6. FASE MANUAL: O usuário decide
                                        phase.id === 'f_manual' ? ' (PERSONALIZADO)' :
                                        
                                        // 7. REALIZAÇÃO E FORÇA PURA: Volume baixo, intensidade neural alta
                                        (phase.stage === 'REALIZAÇÃO' || phase.stage === 'FORÇA') ? ' (NEURAL)' :
                                        
                                        ''
                                      }
                                    </span>
                                 </div>
                                 <p className={`text-xs font-medium leading-relaxed mb-6 line-clamp-3 ${activePhaseId === phase.id ? 'text-white/80' : 'text-slate-500'}`}>
                                   {phase.id === 'f_manual' && activePhaseId === 'f_manual' && manualMethodology ? manualMethodology : phase.description}
                                 </p>
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                  <div className={`p-3 rounded-xl border ${activePhaseId === phase.id ? 'bg-white/10 border-white/10' : 'bg-slate-950/50 border-slate-800'}`}>
                                     <span className={`text-[8px] font-black uppercase block mb-1 ${activePhaseId === phase.id ? 'text-white/50' : 'text-slate-600'}`}>Alvo RIR</span>
                                     <span className="font-black text-sm text-white">RIR {phase.id === 'f_manual' && activePhaseId === 'f_manual' ? manualRir : phase.rirTarget}</span>
                                  </div>
                                  <div className={`p-3 rounded-xl border ${activePhaseId === phase.id ? 'bg-white/10 border-white/10' : 'bg-slate-950/50 border-slate-800'}`}>
                                     <span className={`text-[8px] font-black uppercase block mb-1 ${activePhaseId === phase.id ? 'text-white/50' : 'text-slate-600'}`}>Progressão</span>
                                     <span className="font-black text-sm text-white uppercase">{phase.id === 'f_manual' && activePhaseId === 'f_manual' ? manualProgression : phase.progressionRule}</span>
                                  </div>
                                </div>
                            </div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <ExerciseSelectorModal 
        isOpen={showSelector} 
        onClose={() => setShowSelector(false)} 
        onSelect={(name) => {
          if (targetDay) addToDay(targetDay, name);
          else addToPlan(name);
        }} 
        catalog={PREDEFINED_EXERCISES} 
        activePhase={activePhase}
        currentDayExercises={targetDay ? workouts[targetDay] || [] : []}
        planItems={weeklyPlan}
        isAddingToPlan={!targetDay}
      />
      <PlanImporterModal
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onSelect={(name, series) => targetDay && addToDay(targetDay, name, series)}
        planItems={availablePlanItems}
        dayName={targetDay || ''}
      />
      <ReturnToTrainingModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        workoutHistory={workoutHistory}
        onApply={handleApplyReturn}
        strengthProfiles={strengthProfiles}
        currentWorkouts={workouts}
      />

      <AchievementModal 
        isOpen={!!achievement} 
        onClose={() => setAchievement(null)} 
        data={achievement}
      />

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
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
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none transition-all text-white font-bold ${isDeloadActive ? 'focus:ring-2 focus:ring-emerald-500' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Peso Corporal Atual (kg)</label>
                  <input type="number" value={strengthInputs.bw || ''} onFocus={(e) => e.target.select()} onChange={(e) => setStrengthInputs(prev => ({ ...prev, bw: parseFloat(e.target.value) || 0 }))} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none transition-all text-white font-bold ${isDeloadActive ? 'focus:ring-2 focus:ring-emerald-500' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Gestão de Dados</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleExportData}
                      className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl transition-all group"
                    >
                      <svg className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">Exportar JSON</span>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl transition-all group"
                    >
                      <svg className={`w-4 h-4 group-hover:scale-110 transition-transform ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">Importar JSON</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImportData} 
                      accept=".json" 
                      className="hidden" 
                    />
                 </div>
                 <p className="text-[9px] text-slate-600 font-medium italic text-center">Use o backup para migrar seus treinos entre dispositivos.</p>
              </div>

              <div className="pt-8 border-t border-slate-800">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="text-lg">🦾</span> Dashboard de Força
                   </h4>
                   <span className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>Power Index: {globalStrength.score}</span>
                </div>
                <div className="space-y-6">
                  {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => {
                    const load = strengthProfiles[ex] || 0;
                    const result = calculateStrengthLevel(ex, strengthInputs.bw, load, 1);
                    return (
                      <div key={ex} className={`bg-slate-950/40 border rounded-3xl p-6 transition-all group ${isDeloadActive ? 'border-emerald-800 hover:border-emerald-600' : 'border-slate-800 hover:border-slate-700'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{ex}</span>
                             <div className="flex items-center gap-2">
                                <input type="number" value={strengthProfiles[ex] || ''} onFocus={(e) => e.target.select()} onChange={(e) => updateProfileValue(ex, e.target.value)} className={`w-24 bg-slate-800 border border-slate-700 rounded-xl p-2 font-black transition-all outline-none text-sm ${isDeloadActive ? 'text-emerald-400 focus:ring-emerald-500' : 'text-indigo-400 focus:ring-indigo-500'}`} />
                                <span className="text-xs text-slate-600 font-black uppercase">kg (1RM)</span>
                             </div>
                          </div>
                          <div className="text-left sm:text-right">
                             <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-tight mb-1 ${result.bg} ${result.color}`}>
                                {result.level}
                             </span>
                             <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ratio: {result.ratio.toFixed(2)}x BW</div>
                          </div>
                        </div>
                        {load > 0 && (
                          <div className={`mt-4 p-4 bg-slate-900/50 rounded-2xl border transition-colors ${isDeloadActive ? 'border-emerald-800/50' : 'border-slate-800/50'}`}>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs">🎯</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume Reativo Sugerido</span>
                             </div>
                             <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">{result.prescription}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className={`w-full mt-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}>
               Salvar Evolução
            </button>
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-4">Fechar Semana</h3>
            <p className="text-slate-400 text-sm mb-6">Salve os dados desta semana no histórico. As cargas e repetições registradas servirão como base para progressão na semana seguinte.</p>
            <input type="text" placeholder="Nome opcional (Ex: Semana 2 - Foco em Carga)" value={logName} onChange={(e) => setLogName(e.target.value)} className={`w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-8 outline-none transition-all text-white font-bold ${isDeloadActive ? 'focus:ring-2 focus:ring-emerald-500' : 'focus:ring-2 focus:ring-indigo-500'}`} />
            <div className="flex gap-4">
              <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={handleSaveWeek} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all ${isDeloadActive ? 'bg-emerald-600' : 'bg-emerald-600'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;