import React from 'react';
import { WorkoutRow } from '../WorkoutRow';
import { WorkoutSplit, WorkoutExercise, WorkoutLog, PeriodizationPhase } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';

interface Props {
  isDeloadActive: boolean;
  setIsDeloadActive: (v: boolean) => void;
  activePhase: PeriodizationPhase | null;
  currentWeek: number;
  setCurrentWeek: (w: number) => void;
  workouts: WorkoutSplit;
  setWorkouts: React.Dispatch<React.SetStateAction<WorkoutSplit>>;
  activeDays: string[];
  toggleDay: (day: string) => void;
  workoutHistory: WorkoutLog[];
  strengthProfiles: any;
  handleSaveExercise: any;
  saveButtonText: string;
  setIsSaveModalOpen: (v: boolean) => void;
  setShowSelector: (v: boolean) => void;
  setTargetDay: (v: string) => void;
  handleDragStart: any;
  handleDragOver: any;
  handleDrop: any;
  handleDragLeave: any;
  draggedItem: any;
  dragOverDay: any;
  generateSmartSplit: () => void;
  handleInitiateSuperSet: any;
  handleBreakSuperSet: any;
  superSetSelection: any;
  handleExerciseClick: any;
  handleQuickLink: any;
  updateWorkoutEx: any;
  removeWorkoutEx: any;
  globalStrengthLevel: string;
}

export const WorkoutsTab: React.FC<Props> = (props) => {
  const { 
    isDeloadActive, setIsDeloadActive, activePhase, currentWeek, setCurrentWeek, 
    workouts, activeDays, toggleDay, saveButtonText, setIsSaveModalOpen, 
    setShowSelector, setTargetDay, handleDragStart, handleDragOver, handleDrop, handleDragLeave, 
    dragOverDay, generateSmartSplit, workoutHistory, strengthProfiles, handleSaveExercise,
    updateWorkoutEx, removeWorkoutEx, draggedItem, handleInitiateSuperSet, handleBreakSuperSet, 
    superSetSelection, handleExerciseClick, handleQuickLink, globalStrengthLevel
  } = props;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-end mb-2">
         <div className="flex items-center gap-3 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDeloadActive ? 'text-emerald-400' : 'text-slate-500'}`}>MODO DELOAD</span>
            <button onClick={() => setIsDeloadActive(!isDeloadActive)} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isDeloadActive ? 'bg-emerald-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDeloadActive ? 'left-6' : 'left-1'}`}></div></button>
         </div>
      </div>

      <div className={`p-6 md:p-8 rounded-[2.5rem] border space-y-8 shadow-xl transition-colors ${isDeloadActive ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
         <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            <div className="max-w-xl"><h2 className="text-2xl font-black uppercase text-white">Organizador de Sessão</h2></div>
            <div className="flex flex-wrap justify-center gap-4">
               {!isDeloadActive && <button onClick={generateSmartSplit} className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Otimizar Split</button>}
               <button onClick={() => setIsSaveModalOpen(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isDeloadActive ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}>{saveButtonText}</button>
            </div>
         </div>
         <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-wrap gap-2">
               {DAYS_OF_WEEK.map(day => (
                  <button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${activeDays.includes(day) ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{day.split('-')[0]}</button>
               ))}
            </div>
         </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`}>
         {DAYS_OF_WEEK.filter(day => activeDays.includes(day)).map(day => (
            <div key={day} onDragOver={e => handleDragOver(e, day)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, day)} className={`rounded-[2.5rem] border p-10 shadow-lg group flex flex-col transition-all duration-300 bg-slate-900 border-slate-800 ${dragOverDay === day ? 'border-indigo-500 bg-indigo-500/5' : ''}`}>
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black uppercase tracking-tighter text-white">{day.split('-')[0]}</h3></div>
               <div className="space-y-2 flex-1 relative">
                  {(workouts[day] || []).map((ex, index) => (
                     <div key={ex.id} className="relative group/row">
                        <WorkoutRow 
                           exercise={ex} day={day} onUpdate={updateWorkoutEx} onDelete={removeWorkoutEx} onSave={handleSaveExercise}
                           activePhase={activePhase} currentWeek={currentWeek} workoutHistory={workoutHistory} strengthProfiles={strengthProfiles}
                           onDragStart={() => handleDragStart(ex, day)} isDragging={draggedItem?.exercise.id === ex.id}
                           onInitiateSuperSet={() => handleInitiateSuperSet(day, ex.id)} onBreakSuperSet={() => ex.superSetId && handleBreakSuperSet(day, ex.superSetId)}
                           isSelectedForSuperSet={superSetSelection?.sourceId === ex.id} isDeloadActive={isDeloadActive} userLevel={globalStrengthLevel}
                        />
                     </div>
                  ))}
               </div>
               <div className="mt-10 flex gap-3"><button onClick={() => { setTargetDay(day); setShowSelector(true); }} className="flex-1 py-5 rounded-2xl border bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/50 uppercase text-[11px] font-black">+ CATÁLOGO</button></div>
            </div>
         ))}
      </div>
    </div>
  );
};
