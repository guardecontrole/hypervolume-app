
export type MuscleType = 'principal' | 'sinergista';

export interface MuscleContribution {
  name: string;
  type: MuscleType;
  contribution: number;
  importance?: string;
}

export interface Exercise {
  name: string;
  muscles: MuscleContribution[];
  isCompound?: boolean;
  isGuided?: boolean;
  description?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  load: number | null;
  rir: number | null;
  type?: 'top' | 'backoff' | 'normal' | 'warmup' | 'feeder';
}

export interface PlanItem {
  id: number;
  name: string;
  series: number;
}

export interface WorkoutExercise extends PlanItem {
  sets: WorkoutSet[];
  reps: number;
  load: number | null;
  rir: number | null;
  isSuperSetCandidate?: boolean;
  superSetId?: string; // ID único para agrupar exercícios em bi-sets
}

export interface WorkoutSplit {
  [key: string]: WorkoutExercise[];
}

export interface WorkoutLog {
    id: number;
    date: string;
    name: string;
    totalSeries: number;
    split: WorkoutSplit;
    phase?: string;
    week?: number;
}

export interface PeriodizationPhase {
  id: string;
  name: string;
  stage: 'INÍCIO' | 'FORÇA' | 'REALIZAÇÃO' | 'RESISTÊNCIA' | 'HIPERTROFIA';
  rirTarget: number;
  progressionRule: 'load' | 'reps' | 'volume' | 'mixed' | 'technique';
  description: string;
  tensionalRatio: number;
  targetVolumeStatus?: 'MANUTENÇÃO' | 'PRODUTIVO' | 'OTIMIZADO' | 'LIMITE' | 'QUALQUER';
}

// Added MuscleVolumeMetrics interface to support muscle metric calculations
export interface MuscleVolumeMetrics {
  weightedVolume: number;
  directSets: number;
  workload: number;
}

export interface AIAnalysisResponse {
  verdict: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  recommendations: string[];
  muscleInsight: string;
  techniqueSuggestion: {
    name: string;
    reason: string;
  };
}
