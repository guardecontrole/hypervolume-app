import React from 'react';
import { WorkoutLog } from '../../types';
import { calculateMuscleVolumeForLog, getShortMuscleName } from '../../utils/helpers';

interface Props {
  workoutHistory: WorkoutLog[];
  isDeloadActive: boolean;
  onClearHistory: () => void;
  onRemoveItem: (id: number) => void;
}

export const HistoryTab: React.FC<Props> = ({ workoutHistory, isDeloadActive, onClearHistory, onRemoveItem }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex justify-between items-center relative z-40 bg-slate-950/50 backdrop-blur-sm p-2 rounded-2xl">
        <div><h2 className="text-3xl font-black uppercase tracking-tighter">Histórico</h2></div>
        {workoutHistory.length > 0 && <button onClick={onClearHistory} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">Limpar Tudo</button>}
      </div>
      {workoutHistory.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-20 text-center"><p className="text-slate-500 font-medium italic">Nenhum registro encontrado.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {workoutHistory.map((log) => (
            <div key={log.id} className={`bg-slate-900 border rounded-[2rem] p-6 shadow-xl relative group hover:border-indigo-500/50 ${isDeloadActive ? 'border-emerald-500/20' : 'border-slate-800'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest mb-2 inline-block ${isDeloadActive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-indigo-400/10 text-indigo-400'}`}>S{log.week} • {log.phase || 'Geral'}</span>
                  <h3 className="text-xl font-black text-white truncate">{log.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{new Date(log.date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => onRemoveItem(log.id)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-800/50 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Volume</span><span className="text-lg font-black text-indigo-400">{log.totalSeries} Séries</span></div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><span className="text-lg font-black text-slate-300">{(Object.values(log.split) as any[]).flat().length} Dias</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
