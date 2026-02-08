
import React, { useState, useMemo } from 'react';
import { WorkoutExercise, PeriodizationPhase, WorkoutLog, WorkoutSet } from '../types';
import { classifyExercise, getAccumulationRange, getIntensificationRange, getEffectiveRealizationModifiers, getVolumeBaseRange, getRepProgressionRange, getDropSetRange, getOndulatoriaRange, getFalsaPiramideRange, getUserDeloadTier } from '../utils/helpers';
import { PREDEFINED_EXERCISES } from '../constants';
import { SetsDetailModal } from './SetsDetailModal';

interface Props {
  exercise: WorkoutExercise;
  day: string;
  onUpdate: (day: string, id: number, data: Partial<WorkoutExercise>) => void;
  onDelete: (day: string, id: number) => void;
  onSave?: (day: string, exercise: WorkoutExercise) => void;
  activePhase: PeriodizationPhase | null;
  currentWeek: number;
  workoutHistory: WorkoutLog[];
  strengthProfiles: Record<string, number>;
  onDragStart?: () => void;
  isDragging?: boolean;
  onInitiateSuperSet?: () => void;
  onBreakSuperSet?: () => void;
  isSelectedForSuperSet?: boolean;
  isDeloadActive?: boolean;
  userLevel?: string;
}

export const WorkoutRow: React.FC<Props> = ({ 
  exercise, 
  day, 
  onUpdate, 
  onDelete, 
  onSave,
  activePhase, 
  currentWeek, 
  workoutHistory,
  strengthProfiles,
  onDragStart,
  isDragging,
  onInitiateSuperSet,
  onBreakSuperSet,
  isSelectedForSuperSet,
  isDeloadActive,
  userLevel = "Novato 🚩"
}) => {
  const [showSetsModal, setShowSetsModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const exData = PREDEFINED_EXERCISES.find(e => e.name === exercise.name);
  const isCompound = exData?.isCompound ?? false;
  const isGuided = exData?.isGuided ?? false;
  const type = useMemo(() => classifyExercise(exercise.name, PREDEFINED_EXERCISES), [exercise.name]);

  const deloadTier = useMemo(() => getUserDeloadTier(userLevel), [userLevel]);

  const deloadOverrides = useMemo(() => {
    if (!isDeloadActive) return null;
    
    const originalSets = exercise.sets?.length || exercise.series || 3;
    const originalLoad = exercise.sets?.[0]?.load || exercise.load || 0;
    
    if (deloadTier === 'advanced') {
      return {
        sets: Math.ceil(originalSets / 2),
        load: originalLoad,
        rir: 3,
        note: 'Deload Sistêmico: Volume reduzido em 50%.'
      };
    } else {
      return {
        sets: originalSets,
        load: Math.round((originalLoad * 0.6) / 2) * 2,
        rir: 3,
        note: 'Deload Técnico: Carga leve para recuperação articular.'
      };
    }
  }, [isDeloadActive, deloadTier, exercise]);

  const realizationModifiers = useMemo(() => {
    if (activePhase?.id === 'f3_realizacao' && !isDeloadActive) {
      return getEffectiveRealizationModifiers(exercise.name, currentWeek, exercise.sets?.length || exercise.series || 3);
    }
    return null;
  }, [activePhase, currentWeek, exercise, isDeloadActive]);

  const handleUpdateSets = (day: string, exId: number, sets: WorkoutSet[]) => {
    const lastSet = sets[0];
    onUpdate(day, exId, { 
      sets,
      series: sets.length,
      reps: lastSet?.reps || 0,
      load: lastSet?.load || null,
      rir: lastSet?.rir || null,
      isSuperSetCandidate: activePhase?.id === 'm4_ondulatoria' && (!isCompound || isGuided) && !isDeloadActive
    });
  };

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      const savedEx = deloadOverrides ? {
        ...exercise,
        series: deloadOverrides.sets,
        load: deloadOverrides.load,
        rir: deloadOverrides.rir,
        sets: exercise.sets.slice(0, deloadOverrides.sets).map(s => ({ ...s, load: deloadOverrides.load, rir: deloadOverrides.rir }))
      } : exercise;
      onSave(day, savedEx);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const getTargetProjection = () => {
    if (isDeloadActive) {
      return deloadOverrides?.note || "RECUPERAÇÃO ATIVA 🍃";
    }

    if (activePhase?.id === 'm5_falsa_piramide') {
       return "Meta: Falha (RIR 0) - Carga Fixa 🧬";
    }

    if (activePhase?.id === 'm4_ondulatoria') {
       return isCompound && !isGuided ? "Foco: Força Tensional 🦾" : "Foco: Super Set Metabólico ⛓️";
    }

    if (activePhase?.id === 'm1_volume_base') {
      const vb = getVolumeBaseRange(exercise.name, strengthProfiles, currentWeek);
      if (vb) return `Meta: ${vb.recommendedSets}x${vb.recommendedReps} @ ${vb.recommendedLoad}kg 🧱`;
      return "Meta: Work Capacity 🧱";
    }

    if (activePhase?.id === 'm2_prog_reps') {
      const rp = getRepProgressionRange(exercise.name, strengthProfiles, currentWeek);
      if (rp) return `Alvo: ${rp.recommendedReps} Reps 💪`;
      return "Alvo: +1 Rep 📈";
    }

    if (activePhase?.id === 'm3_drop_sets') {
      const isTensional = isCompound && !isGuided;
      if (isTensional) return "Meta: Top Set 🛡️";
      return "Meta: Drop na Última 💧";
    }

    if (realizationModifiers) return realizationModifiers.note;

    if (activePhase?.id === 'f1_acumulacao') {
       const accRange = getAccumulationRange(exercise.name, strengthProfiles, currentWeek);
       if (accRange) return `Alvo: ${accRange.recommendedLoad}kg (${accRange.recommendedSets}S) 📈`;
       return "Adicionar +1 Série ou +Reps 📈";
    }

    if (activePhase?.id === 'f2_intensificacao') {
       const intRange = getIntensificationRange(exercise.name, strengthProfiles, currentWeek);
       if (intRange) return `Alvo: ${intRange.recommendedLoad}kg (${intRange.recommendedSets}S) 💀`;
       return "Carga ↑ Volume ↓ 💀";
    }

    if (currentWeek === 1) return "Estabelecer Base 🚩";
    const lastWorkout = workoutHistory.find(log => log.week === currentWeek - 1);
    const lastDayEx = lastWorkout?.split[day]?.find(ex => ex.name === exercise.name);
    if (!lastDayEx || (!lastDayEx.load && (!lastDayEx.sets || lastDayEx.sets.length === 0))) return "S1 vazia ⏳";

    const lastLoad = lastDayEx.load || lastDayEx.sets?.[0]?.load || 0;
    const lastReps = lastDayEx.reps || lastDayEx.sets?.[0]?.reps || 0;

    if (!activePhase) return `Alvo: ${lastLoad + 2}kg 🔥`;
    switch(activePhase.progressionRule) {
      case 'load': return `Alvo: ${lastLoad + 2}kg 🔥`;
      case 'reps': return `Alvo: ${lastReps + 1} reps 💪`;
      case 'volume': return "Adicionar +1 Série ou +2 Reps 📈";
      default: return "Manter Intensidade";
    }
  };

  const getTypeStyle = () => {
    switch(type) {
      case 'Push': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Pull': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Legs': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const displaySets = isDeloadActive ? deloadOverrides?.sets : (activePhase?.id === 'm1_volume_base' ? getVolumeBaseRange(exercise.name, strengthProfiles, currentWeek)?.recommendedSets || exercise.series : realizationModifiers ? realizationModifiers.effectiveSets : (exercise.sets?.length || exercise.series));
  const displayRir = isDeloadActive ? 3 : (activePhase?.id === 'm1_volume_base' ? 2 : realizationModifiers ? realizationModifiers.targetRir : activePhase?.id === 'm5_falsa_piramide' ? 0 : (exercise.sets?.[0]?.rir || exercise.rir));
  const displayLoad = isDeloadActive ? deloadOverrides?.load : (exercise.sets?.[0]?.load || exercise.load);

  const exerciseForModal = useMemo(() => {
    return {
      ...exercise,
      sets: exercise.sets || Array.from({ length: exercise.series || 3 }).map((_, idx) => ({
        id: `default-${idx}-${exercise.id}`,
        reps: exercise.reps || 10,
        load: exercise.load || null,
        rir: exercise.rir || null
      }))
    };
  }, [exercise]);

  const hasDropSet = activePhase?.id === 'm3_drop_sets' && (!isCompound || isGuided) && !isDeloadActive;
  const isOndulatoriaTensional = activePhase?.id === 'm4_ondulatoria' && isCompound && !isGuided && !isDeloadActive;
  const isFalsaPiramide = activePhase?.id === 'm5_falsa_piramide' && !isDeloadActive;

  return (
    <>
      <div 
        draggable={!isSelectedForSuperSet && !isDeloadActive} 
        onDragStart={onDragStart}
        className={`bg-slate-800/40 p-5 rounded-[1.8rem] border transition-all duration-300 cursor-pointer active:scale-[0.98] 
          ${isDragging ? 'opacity-30 border-indigo-500 dashed' : 'border-slate-700/50 hover:bg-slate-800/80 hover:border-indigo-500/30'}
          ${isSaved ? 'border-emerald-500/50 ring-2 ring-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/5' : ''}
          ${isDeloadActive ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}
          ${isSelectedForSuperSet ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.05] z-50 bg-indigo-500/10' : ''}
          ${exercise.superSetId && !isDeloadActive ? 'border-indigo-500/40 bg-indigo-500/5' : ''}
          ${realizationModifiers?.isPRTest ? 'border-amber-500/30 bg-amber-500/5' : ''}
          ${activePhase?.id === 'm1_volume_base' ? 'border-blue-500/20 bg-blue-500/5' : ''}
          ${isFalsaPiramide ? 'border-purple-500/30 bg-purple-500/5' : ''}
          ${activePhase?.id === 'm4_ondulatoria' && !isDeloadActive ? 'border-indigo-500/20 bg-indigo-500/5' : ''}
          ${activePhase?.id === 'm3_drop_sets' && !isDeloadActive ? 'border-purple-500/30 bg-purple-900/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : ''}
          ${activePhase?.id === 'm2_prog_reps' ? 'border-indigo-500/20 bg-indigo-500/5' : ''}`} 
        onClick={() => !isSelectedForSuperSet && setShowSetsModal(true)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[7px] px-1.5 py-0.5 rounded border font-black flex-shrink-0 ${getTypeStyle()}`}>{type.toUpperCase()}</span>
              <span className="font-black text-xs text-white truncate block">{exercise.name}</span>
              {isDeloadActive && (
                <span className="text-[7px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-400/30 shadow-lg animate-pulse">
                  RECUPERAÇÃO 🍃
                </span>
              )}
              {hasDropSet && (
                <span className="text-[7px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse">Drop Set</span>
              )}
              {isFalsaPiramide && (
                <span className="text-[7px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter border border-purple-400/30">
                   FALSA PIRÂMIDE 🧬
                </span>
              )}
              {isOndulatoriaTensional && (
                <span className="text-[7px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter border border-red-400/30">
                   FORÇA 🦾
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`bg-slate-900/80 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-700/50 ${isDeloadActive ? 'border-emerald-500/30' : ''}`}>
                  <span className={isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}>{displaySets}S</span>
                  <span className="mx-1.5 opacity-20">×</span>
                  <span className="text-white">{(exercise.sets?.[0]?.reps) || exercise.reps}R</span>
              </div>
              {displayLoad && (
                <span className={`text-xs font-black ${isDeloadActive ? 'text-emerald-300' : 'text-emerald-400'}`}>{displayLoad}kg</span>
              )}
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isFalsaPiramide ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : activePhase?.id === 'm1_volume_base' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : realizationModifiers?.isPRTest ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                RIR {displayRir}
              </span>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            {exercise.superSetId && !isDeloadActive && (
              <button 
                onClick={(e) => { e.stopPropagation(); onBreakSuperSet?.(); }}
                className="w-9 h-9 flex items-center justify-center bg-red-600/10 border border-red-500/30 rounded-xl text-red-400 hover:text-white hover:bg-red-600 transition-all shadow-xl active:scale-90"
                title="Desfazer Super Set"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSetsModal(true); }}
              className="w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-700/60 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all shadow-xl active:scale-90"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
            <button 
              onClick={handleQuickLog} 
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border border-transparent ${isSaved ? 'text-emerald-400 scale-110 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-600 hover:text-indigo-400 hover:bg-slate-700/50'}`}
            >
              {isSaved ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(day, exercise.id); }} className="text-slate-700 hover:text-red-500 p-2 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700/30 flex justify-between items-center">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fase Atual</span>
           <span className={`text-[9px] font-black uppercase transition-colors ${isSaved ? 'text-emerald-300' : (isDeloadActive ? 'text-emerald-400' : 'text-emerald-400')}`}>{getTargetProjection()}</span>
        </div>
      </div>
      <SetsDetailModal 
        isOpen={showSetsModal} 
        onClose={() => setShowSetsModal(false)}
        exercise={exerciseForModal}
        day={day}
        activePhase={activePhase}
        currentWeek={currentWeek}
        onUpdateSets={handleUpdateSets}
        isCompound={isCompound}
        isGuided={isGuided}
        strengthProfiles={strengthProfiles}
        isDeloadActive={isDeloadActive}
        userLevel={userLevel}
      />
    </>
  );
};
