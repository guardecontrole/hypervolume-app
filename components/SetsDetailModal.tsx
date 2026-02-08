
import React, { useState, useMemo } from 'react';
import { WorkoutExercise, WorkoutSet, PeriodizationPhase } from '../types';
import { suggestSmartLoad, getAccumulationRange, getIntensificationRange, getAdaptationRange, getVolumeBaseRange, getMuscleEmoji, calculatePrepLoad, isWorkingSet, generateWarmupLadder, getEffectiveRealizationModifiers, getRepProgressionRange, getDropSetRange, getOndulatoriaRange, getFalsaPiramideRange, getOverreachingRange, getUserDeloadTier } from '../utils/helpers';
import { PREDEFINED_EXERCISES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exercise: WorkoutExercise;
  day: string;
  activePhase: PeriodizationPhase | null;
  currentWeek: number;
  onUpdateSets: (day: string, exerciseId: number, sets: WorkoutSet[]) => void;
  isCompound: boolean;
  isGuided?: boolean;
  strengthProfiles: Record<string, number>;
  isDeloadActive?: boolean;
  userLevel?: string;
}

export const SetsDetailModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  exercise, 
  day, 
  activePhase, 
  currentWeek,
  onUpdateSets,
  isCompound,
  isGuided,
  strengthProfiles,
  isDeloadActive,
  userLevel = "Novato 🚩"
}) => {
  const [lastSuggestionSource, setLastSuggestionSource] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const exData = useMemo(() => PREDEFINED_EXERCISES.find(e => e.name === exercise.name), [exercise.name]);
  const mainMuscle = useMemo(() => exData?.muscles.find(m => m.type === 'principal')?.name || '', [exData]);

  const isVolumeBase = activePhase?.id === 'm1_volume_base';
  const isRepProgression = activePhase?.id === 'm2_prog_reps';
  const isDropSets = activePhase?.id === 'm3_drop_sets';
  const isOndulatoria = activePhase?.id === 'm4_ondulatoria';
  const isFalsaPiramide = activePhase?.id === 'm5_falsa_piramide';
  const isOverreaching = activePhase?.id === 'm6_o_pico';
  const isAdaptation = activePhase?.id === 'f0_adaptacao';
  const isAccumulation = activePhase?.id === 'f1_acumulacao';
  const isIntensification = activePhase?.id === 'f2_intensificacao';
  const isRealization = activePhase?.id === 'f3_realizacao';
  const isRecuperation = activePhase?.id === 'fr_retorno';
  const isManual = activePhase?.id === 'f_manual';
  
  const timeAway = localStorage.getItem('hv_return_time_away') || '1-2_weeks';

  const deloadTier = useMemo(() => getUserDeloadTier(userLevel), [userLevel]);

  const strategyRange = useMemo(() => {
    if (isDeloadActive) {
      const originalSets = exercise.sets.filter(isWorkingSet).length || 3;
      const suggested = suggestSmartLoad(exercise.name, 10, strengthProfiles, activePhase);
      
      if (deloadTier === 'advanced') {
        return { 
          min: suggested ? Math.round(suggested * 0.9) : 0, 
          max: suggested ? Math.round(suggested * 1.1) : 0, 
          recommendedLoad: suggested || 0, 
          recommendedSets: Math.ceil(originalSets / 2), 
          recommendedReps: 10, 
          customNote: 'DELOAD SISTÊMICO: Foco em volume baixo e carga preservada.' 
        };
      } else {
        return { 
          min: suggested ? Math.round(suggested * 0.5) : 0, 
          max: suggested ? Math.round(suggested * 0.7) : 0, 
          recommendedLoad: suggested ? Math.round(suggested * 0.6) : 0, 
          recommendedSets: originalSets, 
          recommendedReps: 12, 
          customNote: 'DELOAD TÉCNICO: Carga leve para restauração articular.' 
        };
      }
    }

    if (isOverreaching) return getOverreachingRange(exercise.name, strengthProfiles);
    if (isFalsaPiramide) return getFalsaPiramideRange(exercise.name, strengthProfiles);
    if (isOndulatoria) return getOndulatoriaRange(exercise.name, strengthProfiles, currentWeek);
    if (isVolumeBase) return getVolumeBaseRange(exercise.name, strengthProfiles, currentWeek);
    if (isRepProgression) return getRepProgressionRange(exercise.name, strengthProfiles, currentWeek);
    if (isDropSets) return getDropSetRange(exercise.name, strengthProfiles, currentWeek);
    if (isRealization) {
      const mods = getEffectiveRealizationModifiers(exercise.name, currentWeek, exercise.sets.filter(isWorkingSet).length || 3);
      if (!mods) return null;
      const suggested = suggestSmartLoad(exercise.name, mods.isPRTest ? 1 : 10, strengthProfiles, activePhase);
      return { min: suggested ? Math.round(suggested * 0.9) : 0, max: suggested ? Math.round(suggested * 1.1) : 0, recommendedLoad: suggested || 0, recommendedSets: mods.effectiveSets, recommendedReps: mods.isPRTest ? 1 : 10, customNote: mods.note };
    }
    if (isRecuperation) {
      const suggested = suggestSmartLoad(exercise.name, 12, strengthProfiles, activePhase, timeAway);
      return { min: suggested ? Math.round(suggested * 0.7) : 0, max: suggested ? Math.round(suggested * 0.9) : 0, recommendedLoad: suggested ? Math.round(suggested * 0.8) : 0, recommendedSets: exercise.sets.filter(isWorkingSet).length || 3, recommendedReps: 12 };
    }
    if (isAdaptation) return getAdaptationRange(exercise.name, strengthProfiles);
    if (isAccumulation) return getAccumulationRange(exercise.name, strengthProfiles, currentWeek);
    if (isIntensification) return getIntensificationRange(exercise.name, strengthProfiles, currentWeek);
    if (isManual) {
      const suggested = suggestSmartLoad(exercise.name, 10, strengthProfiles, activePhase);
      return { min: suggested ? Math.round(suggested * 0.8) : 0, max: suggested ? Math.round(suggested * 1.2) : 0, recommendedLoad: suggested || 0, recommendedSets: exercise.sets.filter(isWorkingSet).length || 3, recommendedReps: 10 };
    }
    return null;
  }, [isDeloadActive, deloadTier, isVolumeBase, isRepProgression, isDropSets, isOndulatoria, isFalsaPiramide, isOverreaching, isAdaptation, isAccumulation, isIntensification, isRealization, isRecuperation, isManual, exercise.name, strengthProfiles, currentWeek, exercise.sets, activePhase, timeAway]);

  const themeColors = useMemo(() => {
    if (isDeloadActive) return { from: 'from-emerald-600', to: 'from-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', ring: 'ring-emerald-400' };
    if (isFalsaPiramide || isOverreaching) return { from: 'from-purple-700', to: 'from-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', ring: 'ring-purple-400' };
    if (isOndulatoria) return { from: 'from-indigo-600', to: 'from-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', ring: 'ring-indigo-400' };
    if (isVolumeBase) return { from: 'from-blue-600', to: 'from-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', ring: 'ring-blue-400' };
    if (isRepProgression) return { from: 'from-indigo-600', to: 'from-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', ring: 'ring-indigo-400' };
    if (isDropSets) return { from: 'from-purple-600', to: 'from-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', ring: 'ring-purple-400' };
    if (isRecuperation) return { from: 'from-amber-600', to: 'from-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', ring: 'ring-amber-400' };
    if (isAdaptation) return { from: 'from-cyan-600', to: 'from-cyan-500', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-400' };
    if (isIntensification) return { from: 'from-indigo-600', to: 'from-indigo-500', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400', ring: 'ring-indigo-400' };
    if (isRealization) return { from: 'from-amber-600', to: 'from-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-400' };
    return { from: 'from-emerald-600', to: 'from-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-400' };
  }, [isDeloadActive, isVolumeBase, isRepProgression, isDropSets, isOndulatoria, isFalsaPiramide, isOverreaching, isAdaptation, isIntensification, isRealization, isRecuperation, isManual]);

  if (!isOpen) return null;

  const isTensional = isCompound && !isGuided;
  const isProgressionPhase = (activePhase?.id === 'm2_prog_reps' || activePhase?.id === 'm5_falsa_piramide' || activePhase?.id === 'm6_o_pico' || isIntensification || isRealization || (isDropSets && isTensional) || (isOndulatoria && isTensional)) && isCompound && !isDeloadActive;

  const addSet = (type: WorkoutSet['type'] = 'normal') => {
    const firstWorkingSet = exercise.sets.find(s => isWorkingSet(s));
    const lastSetOfSameType = [...exercise.sets].reverse().find(s => s.type === type);
    let reps = 10;
    let load = null;
    let rir = isDeloadActive ? 3 : (activePhase?.rirTarget ?? null);

    if (type === 'warmup') { reps = 12; rir = 5; if (firstWorkingSet?.load) load = calculatePrepLoad(firstWorkingSet.load, 'warmup'); }
    else if (type === 'feeder') { reps = 4; rir = 3; if (firstWorkingSet?.load) load = calculatePrepLoad(firstWorkingSet.load, 'feeder'); }
    else { reps = lastSetOfSameType?.reps || (isAdaptation ? 15 : firstWorkingSet?.reps) || 10; load = lastSetOfSameType?.load || firstWorkingSet?.load || null; }

    const newSet: WorkoutSet = {
      id: Math.random().toString(36).substr(2, 9),
      reps,
      load,
      rir,
      type: type === 'normal' && isProgressionPhase && exercise.sets.filter(s => isWorkingSet(s)).length === 0 ? 'top' : 
            type === 'normal' && isProgressionPhase ? 'backoff' : 'normal'
    };
    onUpdateSets(day, exercise.id, type === 'warmup' || type === 'feeder' ? [...exercise.sets.filter(s => !isWorkingSet(s)), newSet, ...exercise.sets.filter(s => isWorkingSet(s))] : [...exercise.sets, newSet]);
  };

  const removeSet = (id: string) => { if (exercise.sets.length <= 1) return; onUpdateSets(day, exercise.id, exercise.sets.filter(s => s.id !== id)); };

  const updateSetField = (id: string, field: keyof WorkoutSet, value: any) => {
    const finalValue = field === 'rir' && isDeloadActive ? 3 : value;
    const newSets = exercise.sets.map(s => s.id === id ? { ...s, [field]: finalValue } : s);
    onUpdateSets(day, exercise.id, newSets);
  };

  const applyWeeklyStrategy = () => {
    if (!strategyRange) return;
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1500);

    const targetCount = strategyRange.recommendedSets;
    const currentPreps = exercise.sets.filter(s => !isWorkingSet(s));
    let updatedWorkingSets: WorkoutSet[] = [];
    const targetReps = strategyRange.recommendedReps || 10;

    if (isDeloadActive) {
      for (let i = 0; i < targetCount; i++) {
          updatedWorkingSets.push({ 
            id: Math.random().toString(36).substr(2, 9), 
            reps: targetReps, 
            load: strategyRange.recommendedLoad || null, 
            rir: 3, 
            type: 'normal' 
          });
      }
    } else if (isFalsaPiramide || isOverreaching) {
      const baseLoad = strategyRange.recommendedLoad || null;
      const repDrops = [12, 10, 8, 7];
      for (let i = 0; i < targetCount; i++) {
          const projectedReps = repDrops[Math.min(i, repDrops.length - 1)];
          updatedWorkingSets.push({ 
            id: Math.random().toString(36).substr(2, 9), 
            reps: projectedReps, 
            load: baseLoad, 
            rir: 0, 
            type: 'normal' 
          });
      }
    } else if (isRepProgression || (isDropSets && isTensional) || (isOndulatoria && isTensional)) {
      const topLoad = strategyRange.recommendedLoad || 0;
      const topReps = isOndulatoria ? 6 : (strategyRange.recommendedReps || 8);
      const backoffLoad = Math.round((topLoad * 0.85) / 2) * 2;
      const backoffReps = topReps + 2;

      for (let i = 0; i < targetCount; i++) {
        const isTop = i === 0;
        updatedWorkingSets.push({ id: Math.random().toString(36).substr(2, 9), reps: isTop ? topReps : backoffReps, load: isTop ? topLoad : backoffLoad, rir: isTop ? 1 : 2, type: isTop ? 'top' : 'backoff' });
      }
    } else if (isDropSets) {
      const baseLoad = strategyRange.recommendedLoad || null;
      for (let i = 0; i < targetCount; i++) {
          const isLast = i === targetCount - 1;
          updatedWorkingSets.push({ id: Math.random().toString(36).substr(2, 9), reps: isLast ? 0 : targetReps, load: baseLoad, rir: isLast ? 0 : 2, type: 'normal' });
      }
    } else if (isOndulatoria && !isTensional) {
      // Séries Retas (Metabólico)
      const baseLoad = strategyRange.recommendedLoad || null;
      for (let i = 0; i < targetCount; i++) {
          updatedWorkingSets.push({ id: Math.random().toString(36).substr(2, 9), reps: targetReps, load: baseLoad, rir: 1, type: 'normal' });
      }
    } else {
      for (let i = 0; i < targetCount; i++) {
          updatedWorkingSets.push({ id: Math.random().toString(36).substr(2, 9), reps: targetReps, load: strategyRange.recommendedLoad || null, rir: isRecuperation ? 4 : (isRealization ? (currentWeek === 1 ? 2 : 0) : (isVolumeBase ? 2 : activePhase?.rirTarget || 1)), type: i === 0 && (isIntensification || isRealization) ? 'top' : (isIntensification || isRealization) ? 'backoff' : 'normal' });
      }
    }
    onUpdateSets(day, exercise.id, [...currentPreps, ...updatedWorkingSets]);
    setLastSuggestionSource(isDeloadActive ? "Protocolo de Recuperação Ativa" : isOverreaching ? "Meso 2: O Pico (Overreaching)" : isFalsaPiramide ? "Meso 1: Falsa Pirâmide" : isOndulatoria ? (isTensional ? "Ondulatória: Força Tensional" : "Ondulatória: Super Set Metabólico") : isVolumeBase ? "Work Capacity Protocol" : isRepProgression ? "Top Set Protocol" : activePhase?.name || "Protocolo");
  };

  const handleSmartSuggest = (setId: string, reps: number) => {
    const suggested = suggestSmartLoad(exercise.name, reps, strengthProfiles, activePhase, timeAway);
    if (suggested) { 
        const finalLoad = isDeloadActive && deloadTier === 'beginner' ? Math.round((suggested * 0.6) / 2) * 2 : suggested;
        updateSetField(setId, 'load', finalLoad); 
        setLastSuggestionSource(isDeloadActive ? "Deload Smart Load" : (activePhase?.name || "Smart Suggest")); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className={`p-8 border-b flex justify-between items-center transition-colors ${isDeloadActive ? 'bg-emerald-950/40 border-emerald-800/40' : 'bg-slate-900/50 border-slate-800'}`}>
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 bg-slate-800 border rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-700'}`}>{getMuscleEmoji(mainMuscle)}</div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{exercise.name}</h3>
              <div className="flex gap-2 mt-1">
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${isCompound ? (isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20') : 'bg-purple-500/10 text-purple-400 border-purple-400/20'}`}>{isCompound ? 'MULTIARTICULAR' : 'ISOLADO'}</span>
                 {isDeloadActive ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase bg-emerald-600 text-white border-emerald-400 shadow-sm">MODO RECUPERAÇÃO</span>
                 ) : (
                    activePhase && <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${themeColors.bg} ${themeColors.text} ${themeColors.border}`}>{activePhase.name}</span>
                 )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors"><svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 flex-1 no-scrollbar">
          {(activePhase || isDeloadActive) && (
            <div className={`${themeColors.bg} ${themeColors.border} border rounded-[2rem] overflow-hidden shadow-sm`}>
              <div className={`${themeColors.bg.replace('/10', '/20')} border-b flex items-center justify-between px-6 py-3`}>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeColors.text}`}>{isDeloadActive ? `DELOAD ${deloadTier === 'advanced' ? 'SISTÊMICO' : 'TÉCNICO'}` : isOverreaching ? 'Meso 2: O Pico (Overreaching)' : isFalsaPiramide ? 'Meso 1: Falsa Pirâmide (Carga Fixa)' : isOndulatoria ? (isTensional ? 'Meso 4: Força Tensional' : 'Meso 4: Super Set Metabólico') : activePhase?.name}</span>
                <span className="text-xs">{isDeloadActive ? '🛡️' : isOverreaching ? '💀' : isFalsaPiramide ? '🧬' : isOndulatoria ? (isTensional ? '🦾' : '🌪️') : '🦾'}</span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Carga Alvo</span>
                    <span className="text-lg font-black text-white">{strategyRange?.recommendedLoad ? `${strategyRange.recommendedLoad}kg` : '--'}</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status de Série</span>
                    <span className={`text-lg font-black ${isDeloadActive ? 'text-emerald-400' : isTensional ? 'text-indigo-400' : 'text-emerald-400'}`}>{isDeloadActive ? 'CONSERVAR' : (isFalsaPiramide || isOverreaching) ? 'RIR 0' : isTensional && strategyRange?.recommendedLoad ? `${Math.round((strategyRange.recommendedLoad * 0.85) / 2) * 2}kg` : (isOndulatoria ? 'Sim' : '--')}</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Repetições</span>
                    <span className="text-lg font-black text-white">{strategyRange?.recommendedReps || '--'}R</span>
                  </div>
                </div>
                
                {/* Instruction Box Dynamic */}
                <div className={`${isDeloadActive ? 'bg-emerald-600/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : isOndulatoria && !isTensional ? 'bg-indigo-600/20 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : (isFalsaPiramide || isOverreaching) ? 'bg-purple-600/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : themeColors.bg.replace('/10', '/20') + ' ' + themeColors.border} border p-4 rounded-2xl flex gap-3`}>
                   <span className="text-xl">{isDeloadActive ? '🛡️' : isOndulatoria && !isTensional ? '🌪️' : isOverreaching ? '💀' : isFalsaPiramide ? '🧬' : 'ℹ️'}</span>
                   <p className={`text-[10px] ${isDeloadActive ? 'text-emerald-200' : isOndulatoria && !isTensional ? 'text-indigo-200' : (isFalsaPiramide || isOverreaching) ? 'text-purple-200' : themeColors.text} font-black leading-relaxed italic`}>
                      {isDeloadActive 
                        ? (deloadTier === 'advanced' 
                           ? "MODO AVANÇADO: Volume reduzido em 50%. Mantenha a carga para sinalização neural, mas evite o estresse metabólico excessivo. RIR 3 obrigatório." 
                           : "MODO INICIANTE: Carga reduzida em 40%. Foco em técnica perfeita e mobilidade. Deixe as articulações recuperarem sem estresse mecânico alto. RIR 3 obrigatório.")
                        : isOverreaching
                        ? "PICO DE VOLUME: Carga travada, falha total em todas as séries. Aceite a queda de repetições. Você está buscando o esgotamento total antes do fim do ciclo."
                        : isFalsaPiramide
                        ? "TÉCNICA FALSA PIRÂMIDE: Mantenha o peso fixo em todas as séries. Vá até a falha (RIR 0). É esperado que as repetições caiam a cada série devido à fadiga acumulada."
                        : isOndulatoria && isTensional 
                        ? "ESTRATÉGIA TENSIONAL: Manutenção de Força (~80% 1RM). Execute o Top Set pesado e o Back-off com -15% de carga. Descanso longo (3-5 min)." 
                        : isOndulatoria 
                        ? "TÉCNICA BI-SET: Realize este exercício conjugado com o próximo sem descanso. Foco total na densidade, pump e tempo sob tensão." 
                        : "Aplique os modificadores de fase para ajustar sua sessão."}
                   </p>
                </div>

                <button onClick={applyWeeklyStrategy} className={`w-full bg-gradient-to-r ${themeColors.from} to-slate-800 p-5 rounded-2xl shadow-lg flex justify-between items-center group transition-all hover:scale-[1.02] border border-white/10 ${justApplied ? themeColors.ring + ' ring-2' : ''}`}>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest block mb-0.5 opacity-80">{isDeloadActive ? 'SINCRONIZAR RECUPERAÇÃO' : `SINCRONIZAR S${currentWeek}`}</span>
                    <span className="text-xl font-black text-white tracking-tighter">
                      {isDeloadActive ? 'Gerar Layout Restaurativo' : isOverreaching ? 'Gerar Layout de Pico' : isFalsaPiramide ? 'Gerar Layout Pirâmide' : isOndulatoria && isTensional ? 'Gerar Layout de Força' : isOndulatoria ? 'Gerar Layout Super Set' : 'Sincronizar Protocolo'}
                    </span>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-all flex-shrink-0"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></div>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {exercise.sets.map((set, index) => {
              const isWorking = isWorkingSet(set);
              const workingSets = exercise.sets.filter(isWorkingSet);
              const isTop = (set.type === 'top' || (isWorking && isProgressionPhase && workingSets.indexOf(set) === 0)) && !isDeloadActive;
              const isBackoff = (set.type === 'backoff' || (isWorking && isProgressionPhase && workingSets.indexOf(set) > 0)) && !isDeloadActive;
              const isSuperSet = isOndulatoria && !isTensional && isWorking && !isDeloadActive;
              const isFalsaSet = (isFalsaPiramide || isOverreaching) && isWorking && !isDeloadActive;
              const isDeloadSet = isDeloadActive && isWorking;

              return (
                <div key={set.id} className={`p-5 rounded-3xl border transition-all duration-500 ${isDeloadSet ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/10' : isTop ? 'bg-red-500/5 border-red-500/30' : isBackoff ? 'bg-blue-500/5 border-blue-500/20' : isSuperSet ? 'bg-indigo-600/10 border-indigo-500/40 ring-1 ring-indigo-400/10' : isFalsaSet ? 'bg-purple-600/10 border-purple-500/40' : 'bg-slate-800/30 border-slate-700/50'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border ${isDeloadSet ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : isTop ? 'bg-red-600 border-red-500 text-white' : (isSuperSet || isFalsaSet) ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>{index + 1}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDeloadSet ? 'text-emerald-400' : isTop ? 'text-red-400' : isBackoff ? 'text-blue-400' : isSuperSet ? 'text-indigo-300' : isFalsaSet ? 'text-purple-300' : 'text-slate-500'}`}>
                        {isDeloadSet ? '🌿 RECUPERAÇÃO' : isTop ? '🚀 TOP SET' : isBackoff ? '📦 BACK-OFF' : isSuperSet ? '⛓️ SUPER SET' : isFalsaSet ? (isOverreaching ? '💀 PICO' : '🧬 PIRÂMIDE') : 'SÉRIE PADRÃO'}
                      </span>
                    </div>
                    <button onClick={() => removeSet(set.id)} className="text-slate-700 hover:text-red-500 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 relative">
                      <label className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">Carga {isDeloadActive && '(REST.)'}</label>
                      <input type="number" value={set.load || ''} onFocus={(e) => e.target.select()} onChange={e => updateSetField(set.id, 'load', parseFloat(e.target.value) || null)} className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center transition-colors ${isDeloadActive ? 'text-emerald-400 border-emerald-800' : isFalsaSet ? 'text-purple-400' : isSuperSet ? 'text-indigo-400' : 'text-emerald-400'} font-black text-lg focus:border-indigo-500 outline-none`} />
                      {isWorking && <button onClick={() => handleSmartSuggest(set.id, set.reps || 10)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isDeloadActive ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}>🪄</button>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">Reps</label>
                      <input type="number" value={set.reps || ''} onFocus={(e) => e.target.select()} onChange={e => updateSetField(set.id, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-white font-black text-lg focus:border-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">RIR {isDeloadActive && '(SAFE)'}</label>
                      <input type="number" readOnly={isDeloadActive} value={set.rir === null ? '' : set.rir} onFocus={(e) => e.target.select()} onChange={e => !isDeloadActive && updateSetField(set.id, 'rir', parseInt(e.target.value) || 0)} className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center ${isDeloadActive ? 'text-emerald-400 border-emerald-800 cursor-not-allowed' : isFalsaSet ? 'text-red-400' : 'text-indigo-400'} font-black text-lg focus:border-indigo-500 outline-none`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => addSet('warmup')} className={`py-4 border-2 border-dashed rounded-3xl font-black text-[9px] uppercase tracking-widest transition-all ${isDeloadActive ? 'border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400' : 'border-orange-500/20 text-orange-400/60 hover:text-orange-400'}`}>+ Aquecer</button>
            <button onClick={() => addSet('feeder')} className={`py-4 border-2 border-dashed rounded-3xl font-black text-[9px] uppercase tracking-widest transition-all ${isDeloadActive ? 'border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400' : 'border-yellow-500/20 text-yellow-400/60 hover:text-yellow-400'}`}>+ Feeder</button>
            <button onClick={() => addSet('normal')} className={`py-4 border-2 border-dashed rounded-3xl font-black text-[9px] uppercase tracking-widest transition-all ${isDeloadActive ? 'border-emerald-500/40 text-emerald-400 hover:text-emerald-300' : 'border-slate-800 text-slate-600 hover:text-indigo-400'}`}>+ Trabalho</button>
          </div>
        </div>
        <div className={`p-8 border-t transition-colors ${isDeloadActive ? 'bg-emerald-950/50 border-emerald-800/40' : 'bg-slate-950/50 border-slate-800'}`}>
           <button onClick={onClose} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all text-white ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}>Salvar Detalhamento</button>
        </div>
      </div>
    </div>
  );
};
