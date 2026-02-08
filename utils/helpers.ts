
import { MUSCULOS_GRANDES, EXERCISE_CATEGORIES, DAYS_OF_WEEK, PREDEFINED_EXERCISES, MUSCLE_SORT_ORDER } from '../constants';
// Added MuscleVolumeMetrics to imports from types
import { Exercise, WorkoutExercise, WorkoutLog, WorkoutSet, WorkoutSplit, PeriodizationPhase, MuscleVolumeMetrics } from '../types';

export const getMuscleEmoji = (muscleName: string): string => {
    if (muscleName.includes('Peito')) return '🦍';
    if (muscleName.includes('Costas') || muscleName.includes('Dorsal')) return '🦇';
    if (muscleName.includes('Trapézio')) return '⛰️';
    if (muscleName.includes('Quadríceps')) return '🍗';
    if (muscleName.includes('Glúteos')) return '🍑';
    if (muscleName.includes('Isquiotibiais')) return 'Leg';
    if (muscleName.includes('Adutores')) return '📐';
    if (muscleName.includes('Panturrilhas')) return '💎';
    if (muscleName.includes('Ombros')) return '🥥';
    if (muscleName.includes('Bíceps')) return '💪';
    if (muscleName.includes('Tríceps')) return '🐴'; 
    if (muscleName.includes('Antebraço') || muscleName.includes('Braquial')) return '🔧';
    if (muscleName.includes('Abdômen')) return '🍫';
    if (muscleName.includes('Lombar')) return '🧱';
    if (muscleName.includes('Estabilizadores')) return '⚖️';
    return '💪';
};

export const calculate1RM = (load: number, reps: number): number => {
    if (load <= 0 || reps <= 0) return 0;
    if (reps === 1) return load;
    return load * (1 + reps / 30);
};

export const getVolumeLevelData = (muscleName: string, totalSeries: number, strengthScore: number = 50) => {
    const isGrande = MUSCULOS_GRANDES.includes(muscleName);
    const series = totalSeries || 0;
    const capacityFactor = 0.75 + (strengthScore / 200);

    if (series === 0) return { label: "SEM TREINO", color: "text-slate-600", bg: "bg-slate-900", level: 0, icon: "⚪" };
    
    const t = isGrande 
        ? { base: 6 * capacityFactor, prod: 10 * capacityFactor, elite: 14 * capacityFactor, over: 18 * capacityFactor }
        : { base: 4 * capacityFactor, prod: 8 * capacityFactor, elite: 10 * capacityFactor, over: 13 * capacityFactor };

    if (series < t.base) return { label: "MANUTENÇÃO", color: "text-blue-400", bg: "bg-blue-400/10", level: 1, icon: "📉" };
    if (series < t.prod) return { label: "PRODUTIVO", color: "text-emerald-400", bg: "bg-emerald-400/10", level: 2, icon: "🚀" };
    if (series <= t.elite) return { label: "OTIMIZADO", color: "text-indigo-400", bg: "bg-indigo-400/10", level: 3, icon: "💎" };
    if (series <= t.over) return { label: "LIMITE", color: "text-orange-400", bg: "bg-orange-400/10", level: 4, icon: "⚡" };
    
    return { label: "OVERTRAINING", color: "text-red-500", bg: "bg-red-500/10", level: 5, icon: "🛑" };
};

export const isWorkingSet = (set: WorkoutSet | undefined): boolean => {
    if (!set) return true;
    return set.type !== 'warmup' && set.type !== 'feeder';
};

export const calculateDetailedMuscleMetrics = (log: WorkoutLog): Record<string, MuscleVolumeMetrics> => {
    const metrics: Record<string, MuscleVolumeMetrics> = {};
    MUSCLE_SORT_ORDER.forEach(m => {
        metrics[m] = { weightedVolume: 0, directSets: 0, workload: 0 };
    });
    
    Object.values(log.split).flat().forEach(item => {
        const ex = PREDEFINED_EXERCISES.find(e => e.name === item.name);
        if (ex) {
            const workingSets = item.sets ? item.sets.filter(s => isWorkingSet(s)) : [];
            const series = workingSets.length || item.series || 0;
            const reps = workingSets[0]?.reps || item.reps || 0;
            const load = workingSets[0]?.load || item.load || 0;

            ex.muscles.forEach(m => {
                const muscleMetric = metrics[m.name];
                if (muscleMetric) {
                    muscleMetric.weightedVolume += series * m.contribution;
                    muscleMetric.workload += series * reps * load * m.contribution;
                    if (m.type === 'principal') {
                        muscleMetric.directSets += series;
                    }
                }
            });
        }
    });
    return metrics;
};

export const calculateMuscleVolumeForLog = (log: WorkoutLog): Record<string, number> => {
    const detailed = calculateDetailedMuscleMetrics(log);
    const result: Record<string, number> = {};
    Object.entries(detailed).forEach(([m, metrics]) => {
        result[m] = metrics.weightedVolume;
    });
    return result;
};

export const getWeeklyStatistics = (history: WorkoutLog[]) => {
  if (history.length === 0) return [];
  
  const stats = history.reduce((acc, log) => {
    const d = new Date(log.date);
    const weekNumber = Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000);
    const key = `${d.getFullYear()}-W${weekNumber}`;
    
    if (!acc[key]) {
      acc[key] = { week: key, volume: 0, workload: 0, avgRir: 0, setCount: 0, date: d };
    }
    
    acc[key].volume += log.totalSeries;
    
    Object.values(log.split).flat().forEach(ex => {
      (ex.sets || []).forEach(set => {
        if (isWorkingSet(set)) {
          acc[key].workload += (set.load || 0) * set.reps;
          if (set.rir !== null) {
            acc[key].avgRir += set.rir;
            acc[key].setCount++;
          }
        }
      });
    });
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(stats)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    .map((s: any) => ({
      ...s,
      avgRir: s.setCount > 0 ? s.avgRir / s.setCount : 0,
      label: `Sem. ${s.week.split('-W')[1]}`
    }));
};

export const analyzeTrends = (history: WorkoutLog[], strengthScore: number = 50) => {
    const last4Weeks = history.slice(0, 4).reverse();
    if (last4Weeks.length === 0) return null;

    const muscleTrends: Record<string, number[]> = {};
    const workloadTrends: Record<string, number[]> = {};
    MUSCLE_SORT_ORDER.forEach(m => {
        muscleTrends[m] = [];
        workloadTrends[m] = [];
    });

    last4Weeks.forEach(log => {
        const metrics = calculateDetailedMuscleMetrics(log);
        Object.entries(metrics).forEach(([muscle, data]) => {
            muscleTrends[muscle].push(data.weightedVolume);
            workloadTrends[muscle].push(data.workload);
        });
    });

    let recoveryScore = 95; 
    const warnings: string[] = [];

    Object.entries(muscleTrends).forEach(([muscle, data]) => {
        if (data.length < 1) return;
        const last = data[data.length - 1];
        
        if (last > 20) {
            recoveryScore -= 30;
            warnings.push(`PERIGO: Volume de ${muscle} (${last.toFixed(1)}s) excede o limite fisiológico seguro.`);
        }

        if (data.length < 2) return;
        const prev = data[data.length - 2];

        const spikeThreshold = 0.25 + (strengthScore / 250); 
        if (prev > 4 && (last - prev) / prev > spikeThreshold) {
            recoveryScore -= 15;
            warnings.push(`Aumento brusco de volume em ${muscle}.`);
        }
    });

    return {
        muscleTrends,
        workloadTrends,
        recoveryScore: Math.max(0, Math.min(100, recoveryScore)),
        warnings: Array.from(new Set(warnings))
    };
};

export const getExerciseCategory = (exercise: Exercise): string => {
    const primaryMuscle = exercise.muscles.find(m => m.type === 'principal' || m.contribution >= 0.5)?.name;
    if (!primaryMuscle) return 'Outros';

    for (const [category, muscles] of Object.entries(EXERCISE_CATEGORIES)) {
        if (muscles.includes(primaryMuscle)) return category;
    }
    return 'Outros';
};

export const classifyExercise = (exerciseName: string, catalog: Exercise[]): string => {
    const ex = catalog.find(e => e.name === exerciseName);
    if (!ex) return 'Core/Accessory';

    const muscles = ex.muscles.map(m => m.name);
    if (muscles.some(m => ["Quadríceps", "Glúteos", "Isquiotibiais", "Panturrilhas", "Adutores"].includes(m))) return 'Legs';
    if (muscles.some(m => ["Costas (Grande Dorsal)", "Bíceps", "Ombros (Deltoides Posteriores)", "Trapézio"].includes(m))) return 'Pull';
    if (muscles.some(m => ["Peito", "Tríceps", "Ombros (Deltoides Anteriores)", "Ombros (Deltoides Laterais)"].includes(m))) return 'Push';

    return 'Core/Accessory';
};

export const sortExercisesSmartly = <T extends { name: string }>(exercises: T[]): T[] => {
    if (exercises.length <= 1) return exercises;

    const pool = exercises.map(ex => {
        const data = PREDEFINED_EXERCISES.find(e => e.name === ex.name);
        return {
            original: ex,
            isCompound: data?.isCompound || false,
            isGuided: data?.isGuided || false,
            cat: classifyExercise(ex.name, PREDEFINED_EXERCISES),
            muscles: new Set(data?.muscles.map(m => m.name) || []),
            muscleCount: data?.muscles.length || 0
        };
    });

    pool.sort((a, b) => {
        // Tensionais primeiro (Compostos e não-guiados)
        const isATensional = a.isCompound && !a.isGuided;
        const isBTensional = b.isCompound && !b.isGuided;
        if (isATensional !== isBTensional) return isATensional ? -1 : 1;
        
        if (a.isCompound !== b.isCompound) return a.isCompound ? -1 : 1;
        if (a.muscleCount !== b.muscleCount) return b.muscleCount - a.muscleCount;
        return a.original.name.localeCompare(b.original.name);
    });

    const sorted: T[] = [];
    const remaining = [...pool];

    while (remaining.length > 0) {
        if (sorted.length === 0) {
            sorted.push(remaining.shift()!.original);
            continue;
        }

        const lastAdded = pool.find(p => p.original.name === sorted[sorted.length - 1].name)!;
        
        let bestIdx = remaining.findIndex(item => {
            const diffCat = item.cat !== lastAdded.cat;
            const noDirectOverlap = ![...item.muscles].some(m => lastAdded.muscles.has(m));
            return diffCat && noDirectOverlap;
        });

        if (bestIdx === -1) {
            bestIdx = remaining.findIndex(item => item.cat !== lastAdded.cat);
        }

        if (bestIdx === -1) bestIdx = 0;

        sorted.push(remaining.splice(bestIdx, 1)[0].original);
    }

    return sorted;
};

export const checkRecuperationRisk = (workouts: Record<string, WorkoutExercise[]>) => {
    const risks: Record<string, string[]> = {};
    
    DAYS_OF_WEEK.forEach((day, idx) => {
        const currentExs = workouts[day] || [];
        const nextDay = DAYS_OF_WEEK[idx + 1];
        if (!nextDay) return;
        const nextExs = workouts[nextDay] || [];

        const currentMuscles = new Set(currentExs.flatMap(ex => 
            PREDEFINED_EXERCISES.find(e => e.name === ex.name)?.muscles
                .filter(m => m.type === 'principal')
                .map(m => m.name) || []
        ));

        const nextMuscles = new Set(nextExs.flatMap(ex => 
            PREDEFINED_EXERCISES.find(e => e.name === ex.name)?.muscles
                .filter(m => m.type === 'principal')
                .map(m => m.name) || []
        ));

        const intersection = [...currentMuscles].filter(m => nextMuscles.has(m));
        if (intersection.length > 0) {
            risks[nextDay] = intersection;
        }
    });

    return risks;
};

export const getShortMuscleName = (muscleName: string): string => {
    if (muscleName.includes('Anteriores')) return 'Ombro Ant.';
    if (muscleName.includes('Laterais')) return 'Ombro Lat.';
    if (muscleName.includes('Posteriores')) return 'Ombro Post.';
    if (muscleName.includes('Dorsal')) return 'Dorsal';
    return muscleName.split(' ')[0];
};

export const calculateStrengthLevel = (exercise: string, bw: number, load: number, reps: number) => {
    if (bw <= 0 || load <= 0 || reps <= 0) return { oneRM: 0, ratio: 0, level: 'Dados Incompletos', prescription: 'Insira seus dados para análise.', color: 'text-slate-500', bg: 'bg-slate-500/10', score: 0 };

    const oneRM = calculate1RM(load, reps);
    const ratio = oneRM / bw;
    let vTarget = 10;

    if (exercise.includes('Supino')) {
        if (ratio < 0.80) vTarget = 8;
        else if (ratio < 1.20) vTarget = 10;
        else if (ratio < 1.35) vTarget = 12;
        else if (ratio < 1.50) vTarget = 14;
        else if (ratio < 1.80) vTarget = 16;
        else if (ratio < 2.00) vTarget = 18;
        else vTarget = 20;
    } else if (exercise.includes('Agachamento')) {
        if (ratio < 1.00) vTarget = 8;
        else if (ratio < 1.60) vTarget = 10;
        else if (ratio < 1.80) vTarget = 12;
        else if (ratio < 2.00) vTarget = 14;
        else if (ratio < 2.30) vTarget = 16;
        else if (ratio < 2.60) vTarget = 18;
        else vTarget = 20;
    } else if (exercise.includes('Levantamento Terra')) {
        if (ratio < 1.40) vTarget = 8;
        else if (ratio < 2.00) vTarget = 10;
        else if (ratio < 2.25) vTarget = 12;
        else if (ratio < 2.50) vTarget = 14;
        else if (ratio < 2.80) vTarget = 16;
        else if (ratio < 3.20) vTarget = 18;
        else vTarget = 20;
    } else {
        if (ratio < 0.60) vTarget = 8;
        else if (ratio < 0.90) vTarget = 10;
        else if (ratio < 1.05) vTarget = 12;
        else if (ratio < 1.20) vTarget = 14;
        else if (ratio < 1.40) vTarget = 16;
        else if (ratio < 1.60) vTarget = 18;
        else vTarget = 20;
    }

    let level = "";
    let color = "";
    let bg = "";
    let levelPoints = 1;

    if (vTarget <= 8) { level = "Frango 1 🐣"; color = "text-red-400"; bg = "bg-red-400/10"; levelPoints = 1; }
    else if (vTarget <= 10) { level = "Frango 2 🐥"; color = "text-red-400"; bg = "bg-red-400/10"; levelPoints = 2; }
    else if (vTarget <= 12) { level = "Bruto 1 🐗"; color = "text-green-400"; bg = "bg-green-400/10"; levelPoints = 3; }
    else if (vTarget <= 14) { level = "Bruto 2 🔨"; color = "text-green-400"; bg = "bg-green-400/10"; levelPoints = 4; }
    else if (vTarget <= 16) { level = "Monstro 1 👹"; color = "text-blue-400"; bg = "bg-blue-400/10"; levelPoints = 5; }
    else if (vTarget <= 18) { level = "Monstro 2 💀"; color = "text-blue-400"; bg = "bg-blue-400/10"; levelPoints = 6; }
    else { level = "Lenda 🔱"; color = "text-red-600"; bg = "bg-red-600/20"; levelPoints = 7; }

    return {
        oneRM,
        ratio,
        level,
        color,
        bg,
        score: levelPoints,
        prescription: `Volume sugerido seguro: ${vTarget} séries/semana.`
    };
};

export const calculateGlobalStrengthLevel = (strengthProfiles: Record<string, number>, bw: number) => {
    const exercises = ['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'];
    let totalScore = 0;
    let count = 0;

    exercises.forEach(ex => {
        const load = strengthProfiles[ex];
        if (load) {
            const res = calculateStrengthLevel(ex, bw, load, 1);
            totalScore += res.score;
            count++;
        }
    });

    if (count === 0) return { name: "Novato", score: 0, label: "Sem Dados", fullLevel: "Novato 🚩" };

    const avgScore = totalScore / exercises.length; 
    const percentScore = Math.min(100, (avgScore / 7) * 100);

    let className = "";
    let fullLevel = "";
    
    if (avgScore < 1.5) { className = "Frango"; fullLevel = "Frango 1 🐣"; }
    else if (avgScore < 2) { className = "Frango"; fullLevel = "Frango 2 🐥"; }
    else if (avgScore < 3) { className = "Bruto"; fullLevel = "Bruto 1 🐗"; }
    else if (avgScore < 4) { className = "Bruto"; fullLevel = "Bruto 2 🔨"; }
    else if (avgScore < 5) { className = "Monstro"; fullLevel = "Monstro 1 👹"; }
    else if (avgScore < 6) { className = "Monstro"; fullLevel = "Monstro 2 💀"; }
    else { className = "Lenda"; fullLevel = "Lenda 🔱"; }

    return {
        name: className,
        score: Math.round(percentScore),
        label: `Classe: ${className}`,
        fullLevel,
        count
    };
};

// Check if user is in advanced or beginner list for deload logic
export const getUserDeloadTier = (levelName: string): 'advanced' | 'beginner' => {
  const advancedPrefixes = ['Bruto 1', 'Bruto 2', 'Monstro 1', 'Monstro 2', 'Lenda'];
  if (advancedPrefixes.some(prefix => levelName.includes(prefix))) return 'advanced';
  return 'beginner';
};

/**
 * PHASE-AWARE Smart Load Suggestion Logic
 */
export const suggestSmartLoad = (
    exerciseName: string, 
    targetReps: number, 
    strengthProfiles: Record<string, number>,
    activePhase?: PeriodizationPhase | null,
    timeAway?: string
): number | null => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex || targetReps <= 0) return null;

    const mainMuscle = ex.muscles.find(m => m.type === 'principal')?.name;
    if (!mainMuscle) return null;

    let anchorEx = '';
    let mechanicalRatio = 1.0; 

    if (["Peito", "Tríceps"].includes(mainMuscle)) anchorEx = 'Supino';
    else if (["Quadríceps", "Glúteos", "Adutores"].includes(mainMuscle)) anchorEx = 'Agachamento';
    else if (["Costas (Grande Dorsal)", "Bíceps", "Trapézio"].includes(mainMuscle)) anchorEx = 'Remada Curvada';
    else if (["Isquiotibiais", "Lombar"].includes(mainMuscle)) anchorEx = 'Levantamento Terra';
    else if (mainMuscle.includes("Ombros")) anchorEx = 'Supino';

    const isAnchorItself = exerciseName.toLowerCase().includes(anchorEx.toLowerCase().split(' ')[0]);
    
    if (isAnchorItself) {
        mechanicalRatio = 1.0;
    } else {
        if (anchorEx === 'Supino') mechanicalRatio = mainMuscle === "Peito" ? 0.45 : 0.28;
        else if (anchorEx === 'Agachamento') mechanicalRatio = mainMuscle === "Quadríceps" ? 0.55 : 0.40;
        else if (anchorEx === 'Remada Curvada') mechanicalRatio = mainMuscle === "Bíceps" ? 0.35 : 0.60;
        else if (anchorEx === 'Levantamento Terra') mechanicalRatio = 0.50;
    }

    const anchor1RM = strengthProfiles[anchorEx];
    if (!anchor1RM) return null;

    // --- PHASE MODIFIER ENGINE ---
    let base1RM = anchor1RM * mechanicalRatio;

    // VOLUME BASE OVERRIDE
    if (activePhase?.id === 'm1_volume_base') {
        return Math.round((base1RM * 0.80) / 2) * 2;
    }

    // FALSA PIRÂMIDE & OVERREACHING
    if (activePhase?.id === 'm5_falsa_piramide' || activePhase?.id === 'm6_o_pico') {
        // Carga para ~12 reps (Hipertrofia Pura)
        const intensity = base1RM * 0.70;
        return Math.round(intensity / (1 + 12 / 30) / 2) * 2;
    }

    // MESO 4 (ONDULATÓRIA)
    if (activePhase?.id === 'm4_ondulatoria') {
        const isTensional = ex.isCompound && !ex.isGuided;
        if (isTensional) {
           // Força: ~80% 1RM
           const strengthIntensity = base1RM * 0.80;
           return Math.round(strengthIntensity / (1 + targetReps / 30) / 2) * 2;
        } else {
           // Metabólico: Carga Moderada (~70%)
           const metabolicIntensity = base1RM * 0.70;
           return Math.round(metabolicIntensity / (1 + targetReps / 30) / 2) * 2;
        }
    }

    if (activePhase?.id === 'fr_retorno' && timeAway) {
        let multiplier = 1.0;
        switch(timeAway) {
            case '1-2_weeks': multiplier = 0.85; break;
            case '2-4_weeks': multiplier = 0.75; break;
            case '4-12_weeks': multiplier = 0.60; break;
            case 'more_12_weeks': multiplier = 0.50; break;
            default: multiplier = 1.0;
        }
        base1RM *= multiplier;
    }

    if (activePhase?.id === 'f3_realizacao') {
        base1RM *= 1.04; 
    }

    let suggestedLoad = base1RM / (1 + targetReps / 30);

    if (activePhase?.id === 'f1_acumulacao') {
        const intensityCap = base1RM * 0.82; 
        if (suggestedLoad > intensityCap) suggestedLoad = intensityCap;
    }

    return Math.round(suggestedLoad / 2) * 2;
};

export const getFalsaPiramideRange = (exerciseName: string, strengthProfiles: Record<string, number>) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const suggested = suggestSmartLoad(exerciseName, 12, strengthProfiles, { id: 'm5_falsa_piramide' } as PeriodizationPhase);
    
    return {
        recommendedLoad: suggested || 0,
        recommendedSets: 4,
        recommendedReps: 12,
        isFixedLoad: true,
        note: 'FALSA PIRÂMIDE: Carga Fixa + Queda de Reps (RIR 0) 🧬'
    };
};

export const getOverreachingRange = (exerciseName: string, strengthProfiles: Record<string, number>) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const suggested = suggestSmartLoad(exerciseName, 12, strengthProfiles, { id: 'm6_o_pico' } as PeriodizationPhase);
    
    return {
        recommendedLoad: suggested || 0,
        recommendedSets: 4,
        recommendedReps: 12,
        isFixedLoad: true,
        note: 'PICO DE VOLUME: Carga Fixa + Falha Total (RIR 0) 💀'
    };
};

export const getOndulatoriaRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const isTensional = ex.isCompound && !ex.isGuided;

    if (isTensional) {
        const suggested = suggestSmartLoad(exerciseName, 6, strengthProfiles, { id: 'm4_ondulatoria' } as PeriodizationPhase);
        return {
            min: suggested ? Math.round(suggested * 0.95) : 0,
            max: suggested ? Math.round(suggested * 1.05) : 0,
            recommendedLoad: suggested || 0,
            recommendedSets: 3,
            recommendedReps: 6,
            note: 'TENSIONAL: Top Set + Back-off (80% 1RM) 🦾'
        };
    } else {
        const suggested = suggestSmartLoad(exerciseName, 12, strengthProfiles, { id: 'm4_ondulatoria' } as PeriodizationPhase);
        return {
            min: suggested ? Math.round(suggested * 0.9) : 0,
            max: suggested ? Math.round(suggested * 1.1) : 0,
            recommendedLoad: suggested || 0,
            recommendedSets: 4,
            recommendedReps: 12,
            isSuperSetCandidate: true,
            note: 'METABÓLICO: Straight Sets (Super Sets) 🌪️'
        };
    }
};

export const getVolumeBaseRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const protocols: Record<number, { s: number, r: number }> = {
        1: { s: 8, r: 2 },
        2: { s: 6, r: 3 },
        3: { s: 5, r: 4 },
        4: { s: 4, r: 5 }
    };

    const w = Math.min(Math.max(week, 1), 4);
    const { s, r } = protocols[w];
    const suggested = suggestSmartLoad(exerciseName, r, strengthProfiles, { id: 'm1_volume_base' } as PeriodizationPhase);

    return {
        min: suggested ? Math.round(suggested * 0.95) : 0,
        max: suggested ? Math.round(suggested * 1.05) : 0,
        recommendedLoad: suggested || 0,
        recommendedSets: s,
        recommendedReps: r,
        isFixedIntensity: true
    };
};

export const getRepProgressionRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const repsTable = [8, 9, 10, 12];
    const wIdx = Math.min(Math.max(week, 1), 4) - 1;
    const targetReps = repsTable[wIdx];

    const suggested = suggestSmartLoad(exerciseName, targetReps, strengthProfiles, { id: 'm2_prog_reps' } as PeriodizationPhase);

    return {
        min: suggested ? Math.round(suggested * 0.95) : 0,
        max: suggested ? Math.round(suggested * 1.05) : 0,
        recommendedLoad: suggested || 0,
        recommendedSets: 3, 
        recommendedReps: targetReps,
        isFixedIntensity: false,
        note: `Meta S${week}: ${targetReps} Reps (Top Set) 💪`
    };
};

export const getDropSetRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;

    const isTensional = ex.isCompound && !ex.isGuided;
    const suggested = suggestSmartLoad(exerciseName, 10, strengthProfiles, { id: 'm3_drop_sets' } as PeriodizationPhase);

    if (isTensional) {
        return {
            min: suggested ? Math.round(suggested * 0.9) : 0,
            max: suggested ? Math.round(suggested * 1.1) : 0,
            recommendedLoad: suggested || 0,
            recommendedSets: 3,
            recommendedReps: 10,
            note: 'Top Set + Back-off (Segurança) 🛡️'
        };
    } else {
        return {
            min: suggested ? Math.round(suggested * 0.9) : 0,
            max: suggested ? Math.round(suggested * 1.1) : 0,
            recommendedLoad: suggested || 0,
            recommendedSets: 4,
            recommendedReps: 12,
            note: 'Straight Sets + Drop na última 💧'
        };
    }
};

export const getAdaptationRange = (exerciseName: string, strengthProfiles: Record<string, number>) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;
    const suggested = suggestSmartLoad(exerciseName, 15, strengthProfiles, { id: 'f0_adaptacao' } as PeriodizationPhase);
    return {
        min: suggested ? Math.round(suggested * 0.8) : 0,
        max: suggested ? Math.round(suggested * 1.2) : 0,
        recommendedLoad: suggested || 0,
        recommendedSets: 3,
        recommendedReps: 15
    };
};

export const calculateRecoveryLoad = (prevLoad: number | null, timeAway: string): number | null => {
    if (!prevLoad) return null;
    let multiplier = 1.0;
    switch(timeAway) {
        case '1-2_weeks': multiplier = 0.85; break;
        case '2-4_weeks': multiplier = 0.75; break;
        case '4-12_weeks': multiplier = 0.60; break;
        case 'more_12_weeks': multiplier = 0.50; break;
        default: multiplier = 1.0;
    }
    return Math.round((prevLoad * multiplier) / 2) * 2;
};

// Fixed: Added missing recommendedReps to return object
export const getAccumulationRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;
    const suggested = suggestSmartLoad(exerciseName, 10, strengthProfiles, { id: 'f1_acumulacao' } as PeriodizationPhase);
    if (!suggested) return null;
    return {
        min: Math.round(suggested * 0.9),
        max: Math.round(suggested * 1.1),
        recommendedLoad: suggested,
        recommendedSets: 3 + (Math.min(week, 4) - 1),
        recommendedReps: 10
    };
};

export const getIntensificationRange = (exerciseName: string, strengthProfiles: Record<string, number>, week: number = 1) => {
    const ex = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    if (!ex) return null;
    const repsTable = [8, 6, 4, 3];
    const idx = Math.min(week, 4) - 1;
    const currentReps = ex.isCompound ? repsTable[idx] : 10;
    const suggested = suggestSmartLoad(exerciseName, currentReps, strengthProfiles, { id: 'f2_intensificacao' } as PeriodizationPhase);
    if (!suggested) return null;
    const setsTable = [4, 3, 2, 2];
    const currentSets = setsTable[idx];
    return {
        min: Math.round(suggested * 0.95),
        max: Math.round(suggested * 1.05),
        recommendedLoad: suggested,
        recommendedSets: currentSets,
        recommendedReps: currentReps
    };
};

export const calculatePrepLoad = (targetLoad: number, type: 'warmup' | 'feeder'): number => {
    const ratio = type === 'warmup' ? 0.45 : 0.75;
    return Math.round((targetLoad * ratio) / 2) * 2;
};

export const generateWarmupLadder = (targetLoad: number): Partial<WorkoutSet>[] => {
  if (targetLoad <= 0) return [];
  return [
    { type: 'warmup', load: Math.round((targetLoad * 0.40) / 2) * 2, reps: 15, rir: 5 },
    { type: 'warmup', load: Math.round((targetLoad * 0.50) / 2) * 2, reps: 10, rir: 4 },
    { type: 'feeder', load: Math.round((targetLoad * 0.60) / 2) * 2, reps: 6, rir: 3 },
    { type: 'feeder', load: Math.round((targetLoad * 0.75) / 2) * 2, reps: 4, rir: 2 },
  ];
};

export const getEffectiveRealizationModifiers = (exerciseName: string, week: number, originalSets: number) => {
    const exData = PREDEFINED_EXERCISES.find(e => e.name === exerciseName);
    const isCompound = exData?.isCompound || false;
    if (week === 1) return { effectiveSets: Math.max(1, Math.floor(originalSets * 0.75)), targetRir: 2, note: "Semana de Deload: Foco em Recuperação (RPE 7-8)" };
    else if (week === 2) {
        if (isCompound) return { effectiveSets: 1, targetRir: 0, note: "Série de Teste Máximo (PR TEST) 🔥", isPRTest: true };
        else return { effectiveSets: Math.max(1, Math.ceil(originalSets * 0.5)), targetRir: 1, note: "Volume Reduzido (Foco no Main Lift)" };
    }
    return null;
};
