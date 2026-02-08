import React, { useState, useMemo } from 'react';
import { Exercise, PeriodizationPhase, WorkoutExercise, PlanItem } from '../types';
import { EXERCISE_CATEGORIES, CATEGORY_ORDER, PREDEFINED_EXERCISES } from '../constants';
import { getExerciseCategory, getMuscleEmoji } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  catalog: Exercise[];
  activePhase: PeriodizationPhase | null;
  currentDayExercises: WorkoutExercise[];
  planItems: PlanItem[]; // Adicionado para analisar o plano global
  isAddingToPlan: boolean; // Flag para saber se estamos na aba Plano
}

export const ExerciseSelectorModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  catalog,
  activePhase,
  currentDayExercises,
  planItems,
  isAddingToPlan
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Peito');
  const [searchTerm, setSearchTerm] = useState('');

  const isVolumeBase = activePhase?.id === 'm1_volume_base';
  const isRepProgression = activePhase?.id === 'm2_prog_reps';
  const isDropSets = activePhase?.id === 'm3_drop_sets';
  const isOndulatoria = activePhase?.id === 'm4_ondulatoria';
  const isFalsaPiramide = activePhase?.id === 'm5_falsa_piramide';
  const isOverreaching = activePhase?.id === 'm6_o_pico';
  const isAdaptation = activePhase?.id === 'f0_adaptacao';
  const isAccumulation = activePhase?.id === 'f1_acumulacao';
  const isIntensification = activePhase?.id === 'f2_intensificacao';
  const isRecuperation = activePhase?.id === 'fr_retorno';
  const isRealization = activePhase?.id === 'f3_realizacao';

  const workoutStats = useMemo(() => {
    // Se estivermos na aba Plano, analisamos planItems. Se for na aba Treinos, usamos currentDayExercises.
    const itemsToAnalyze = isAddingToPlan ? planItems : currentDayExercises;
    
    if (itemsToAnalyze.length === 0) return { guidedRatio: 0, tensionalRatio: 0, count: 0, activeCategories: new Set<string>() };
    
    let guided = 0;
    let tensional = 0;
    const activeCategories = new Set<string>();
    
    itemsToAnalyze.forEach(item => {
      const data = PREDEFINED_EXERCISES.find(e => e.name === item.name);
      if (data?.isGuided) guided++;
      if (data?.isCompound) tensional++;
      if (data) activeCategories.add(getExerciseCategory(data));
    });

    return {
      guidedRatio: (guided / itemsToAnalyze.length) * 100,
      tensionalRatio: (tensional / itemsToAnalyze.length) * 100,
      count: itemsToAnalyze.length,
      activeCategories
    };
  }, [currentDayExercises, planItems, isAddingToPlan]);

  const filteredExercises = useMemo(() => {
    return catalog.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = getExerciseCategory(ex) === selectedCategory;
      // If there is a search term, search across all categories; otherwise filter by selected category.
      return searchTerm ? matchesSearch : matchesCategory;
    });
  }, [catalog, selectedCategory, searchTerm]);

  if (!isOpen) return null;

  /**
   * LÓGICA DE DISTRIBUIÇÃO DE ESTÍMULO
   * VOLUME_BASE / REP_PROGRESSION / DROP_SETS / ONDULATÓRIA: Tensional 40% | Metabólico 60%
   * FALSA PIRÂMIDE: Tensional 30% | Metabólico 70%
   * OVERREACHING: Tensional 30% | Metabólico 70%
   * REALIZAÇÃO: Tensional 85% | Metabólico 15%
   */
  const targetGuided = (isVolumeBase || isRepProgression || isDropSets || isOndulatoria) ? 60 : (isFalsaPiramide || isOverreaching) ? 70 : isRealization ? 15 : isAccumulation ? 60 : isIntensification ? 30 : isRecuperation ? 70 : 50;
  const targetTensional = (isVolumeBase || isRepProgression || isDropSets || isOndulatoria) ? 40 : (isFalsaPiramide || isOverreaching) ? 30 : isRealization ? 85 : isAccumulation ? 40 : isIntensification ? 70 : isRecuperation ? 30 : 50;

  const getPhaseTheme = () => {
    if (isVolumeBase) return 'bg-blue-500/5 text-blue-400 border-blue-500/30';
    if (isRepProgression) return 'bg-indigo-500/5 text-indigo-400 border-indigo-500/30';
    if (isDropSets) return 'bg-purple-500/5 text-purple-400 border-purple-500/30';
    if (isOndulatoria) return 'bg-indigo-600/5 text-indigo-300 border-indigo-500/40';
    if (isFalsaPiramide || isOverreaching) return 'bg-purple-600/5 text-purple-300 border-purple-500/40';
    if (isAdaptation) return 'bg-cyan-500/5 text-cyan-400 border-cyan-500/30';
    if (isAccumulation) return 'bg-emerald-500/5 text-emerald-400 border-emerald-500/30';
    if (isIntensification) return 'bg-indigo-500/5 text-indigo-400 border-indigo-500/30';
    if (isRecuperation) return 'bg-amber-500/5 text-amber-400 border-amber-500/30';
    if (isRealization) return 'bg-red-500/5 text-red-400 border-red-500/50';
    return '';
  };

  const getBadgeColor = () => {
    if (isVolumeBase) return 'bg-blue-600';
    if (isRepProgression) return 'bg-indigo-600';
    if (isDropSets) return 'bg-purple-600';
    if (isOndulatoria) return 'bg-indigo-500';
    if (isFalsaPiramide || isOverreaching) return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    if (isAdaptation) return 'bg-cyan-500';
    if (isAccumulation) return 'bg-emerald-500';
    if (isIntensification) return 'bg-indigo-500';
    if (isRecuperation) return 'bg-amber-500';
    if (isRealization) return 'bg-red-600';
    return 'bg-slate-700';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Estratégico Adaptativo */}
        <div className={`p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${getPhaseTheme().split(' ')[0]}`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-black tracking-tight uppercase">
                {isAddingToPlan ? 'Arquitetura do Plano' : 'Catálogo de Exercícios'}
              </h3>
              {(isVolumeBase || isRepProgression || isDropSets || isOndulatoria || isFalsaPiramide || isOverreaching || isAdaptation || isAccumulation || isIntensification || isRecuperation || isRealization) && (
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse text-white ${getBadgeColor()}`}>
                    Advisor de {isVolumeBase ? 'Volume Base' : isRepProgression ? 'Progressão Reps' : isDropSets ? 'Intensidade Drop Set' : isOndulatoria ? 'Periodização Ondulante' : (isFalsaPiramide || isOverreaching) ? 'Hipertrofia Pura' : isRecuperation ? 'Recuperação' : isAdaptation ? 'Adaptação' : isIntensification ? 'Intensificação' : isRealization ? 'Realização' : 'Acumulação'}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xl">
              {isAddingToPlan 
                ? 'Analisando equilíbrio total da sua semana de treinos' 
                : isOverreaching
                ? 'Fase de Pico (Overreaching): Mantenha 70% do volume em máquinas para segurança máxima enquanto leva o corpo ao limite do MVR.'
                : isFalsaPiramide
                ? 'Fase de Hipertrofia Pura: Use 70% de exercícios guiados para buscar a falha total com segurança (Falsa Pirâmide).'
                : isOndulatoria
                ? 'Estratégia Ondulante: Comece com exercícios básicos pesados (Top Set) para manter a força. Preencha o resto do treino com máquinas e isoladores em Super Set (sem descanso) para condicionamento metabólico.'
                : isDropSets
                ? 'Regra de Ouro: Nunca faça Drop Sets nos exercícios livres (40%). Use a técnica apenas nas máquinas e isoladores (60%) na última série para gerar pump máximo com segurança.'
                : isVolumeBase
                ? 'Use os 40% Tensional para aplicar o protocolo de força (8x2, 6x3) nos exercícios principais. Use os 60% Guiados para acumular volume de hipertrofia sem sobrecarregar o SNC/Articulações.'
                : isRepProgression
                ? 'Mantenha a carga fixa e suba as reps nos compostos (40%). Use as máquinas (60%) para preencher o volume sem desgastar as articulações.'
                : `Sessão: ${isRealization ? 'Foco em Pico de Performance' : isRecuperation ? 'Foco em Segurança e Readaptação' : isAdaptation ? 'Foco em Equilíbrio Full Body' : isIntensification ? 'Foco em Carga Mecânica' : 'Foco em Capacidade'}`
              }
            </p>
          </div>
          
          <div className="flex-1 max-w-md w-full bg-slate-950/50 p-4 rounded-3xl border border-slate-800 flex flex-col gap-3">
             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{isAdaptation ? 'Cobertura de Grupos Musculares' : isAddingToPlan ? 'Equilíbrio Estratégico Semanal' : 'Equilíbrio da Sessão Atual'}</span>
                <span className={`${isRealization ? 'text-red-400' : isIntensification ? 'text-indigo-400' : isAdaptation ? 'text-cyan-400' : isRecuperation ? 'text-amber-400' : isDropSets ? 'text-purple-400' : (isFalsaPiramide || isOverreaching) ? 'text-purple-300' : (isVolumeBase || isRepProgression || isOndulatoria) ? 'text-blue-400' : 'text-emerald-400'}`}>{workoutStats.count} Selecionados</span>
             </div>
             {isAdaptation ? (
               <div className="flex flex-wrap gap-1.5">
                 {CATEGORY_ORDER.filter(c => c !== 'Outros').map(cat => (
                   <span key={cat} className={`text-[7px] font-black px-2 py-0.5 rounded border ${workoutStats.activeCategories.has(cat) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                     {cat.toUpperCase()}
                   </span>
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-bold text-slate-500">
                    <span>GUIADOS (ALVO {targetGuided}%)</span>
                    <span className={isRealization ? (workoutStats.guidedRatio <= targetGuided ? 'text-red-400' : 'text-yellow-400') : (isVolumeBase || isRepProgression || isDropSets || isOndulatoria || isFalsaPiramide || isOverreaching) ? (workoutStats.guidedRatio >= targetGuided ? 'text-indigo-400' : 'text-yellow-400') : (workoutStats.guidedRatio >= targetGuided ? 'text-emerald-400' : 'text-yellow-400')}>
                      {Math.round(workoutStats.guidedRatio)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isRealization ? 'bg-red-500' : (isDropSets || isFalsaPiramide || isOverreaching) ? 'bg-purple-500' : (isVolumeBase || isRepProgression || isOndulatoria) ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${workoutStats.guidedRatio}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-bold text-slate-500">
                    <span>TENSIONAL (ALVO {targetTensional}%)</span>
                    <span className={isRealization ? (workoutStats.tensionalRatio >= targetTensional ? 'text-red-400' : 'text-yellow-400') : (isVolumeBase || isRepProgression || isDropSets || isOndulatoria || isFalsaPiramide || isOverreaching) ? (workoutStats.tensionalRatio <= targetTensional ? 'text-indigo-400' : 'text-yellow-400') : (workoutStats.tensionalRatio <= targetTensional ? 'text-emerald-400' : 'text-red-400')}>
                      {Math.round(workoutStats.tensionalRatio)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isRealization ? 'bg-red-600' : (isDropSets || isFalsaPiramide || isOverreaching) ? 'bg-indigo-400' : (isVolumeBase || isRepProgression || isOndulatoria) ? 'bg-blue-600' : 'bg-indigo-500'}`} style={{ width: `${workoutStats.tensionalRatio}%` }}></div>
                  </div>
                </div>
               </div>
             )}
          </div>

          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <aside className="w-full md:w-64 bg-slate-900/50 p-6 border-r border-slate-800 overflow-y-auto no-scrollbar">
            <nav className="space-y-2">
              {CATEGORY_ORDER.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-800'}`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <div className="relative mb-8">
              <input
                type="text"
                placeholder="Buscar no catálogo..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-12 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-white placeholder-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredExercises.map((ex, i) => {
                const category = getExerciseCategory(ex);
                
                const isRecommendedVol = isVolumeBase && (ex.isGuided || !ex.isCompound);
                const isRecommendedProg = isRepProgression && (ex.isGuided || !ex.isCompound);
                const isRecommendedDrop = isDropSets && ex.isGuided; // Foco total em máquinas para Drop Sets
                const isRecommendedOnd = isOndulatoria && (ex.isGuided || !ex.isCompound); // Foco em metabólicos para Super Sets
                const isRecommendedFalsa = (isFalsaPiramide || isOverreaching) && (ex.isGuided || !ex.isCompound);
                const isRecommendedAcc = isAccumulation && (
                    (workoutStats.guidedRatio < 60 && ex.isGuided) || 
                    (workoutStats.tensionalRatio > 40 && !ex.isCompound)
                );
                const isRecommendedInt = isIntensification && (
                    (workoutStats.tensionalRatio < 70 && ex.isCompound && !ex.isGuided) ||
                    (workoutStats.guidedRatio > 30 && !ex.isGuided)
                );
                const isRecommendedAda = isAdaptation && !workoutStats.activeCategories.has(category);
                const isRecommendedRec = isRecuperation && ex.isGuided;
                const isRecommendedRea = isRealization && ex.isCompound && !ex.isGuided;

                const isRecommended = isRecommendedVol || isRecommendedProg || isRecommendedDrop || isRecommendedOnd || isRecommendedFalsa || isRecommendedAcc || isRecommendedInt || isRecommendedAda || isRecommendedRec || isRecommendedRea;
                
                const showMetabolicGlow = (isOndulatoria || isFalsaPiramide || isOverreaching) && (ex.isGuided || !ex.isCompound);

                return (
                  <button
                    key={i}
                    onClick={() => { onSelect(ex.name); onClose(); }}
                    className={`p-6 rounded-3xl border transition-all text-left group relative flex flex-col justify-between h-40 ${isRecommended ? getPhaseTheme() + ' hover:border-white ring-1 ring-white/10' : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500 hover:bg-slate-800'} ${showMetabolicGlow ? 'shadow-[0_0_20px_rgba(99,102,241,0.25)] border-indigo-400/50 scale-[1.02]' : 'shadow-none'}`}
                  >
                    {isRecommended && (
                       <span className={`absolute top-4 right-4 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-tighter text-white ${getBadgeColor()}`}>🎯 {showMetabolicGlow ? ((isFalsaPiramide || isOverreaching) ? 'FP SUGERIDO' : 'SS SUGERIDO') : 'RECOMENDADO'}</span>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${ex.isCompound ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                           {ex.isCompound ? 'TENSIONAL' : 'METABÓLICO'}
                        </span>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${ex.isGuided ? 'bg-purple-500/20 text-purple-400 border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.2)] animate-pulse' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                           {ex.isGuided ? 'MÁQUINA/POLIA' : 'PESO LIVRE'}
                        </span>
                      </div>
                      <h4 className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight">{ex.name}</h4>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {ex.muscles.slice(0, 3).map((m, idx) => (
                        <span key={idx} className={`text-[8px] font-black px-2 py-1 rounded-lg ${showMetabolicGlow ? 'bg-indigo-900/40 text-indigo-200 border-indigo-500/30' : 'bg-slate-900/80 text-slate-500 border-slate-700/30'} border`}>
                          {getMuscleEmoji(m.name)} {m.name}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};