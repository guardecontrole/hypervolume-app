
import React from 'react';

interface AchievementProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    exercise: string;
    old1RM: number;
    new1RM: number;
    oldScore: number;
    newScore: number;
    oldLevel: string;
    newLevel: string;
    changedLevel: boolean;
  };
}

export const AchievementModal: React.FC<AchievementProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const scoreGain = data.newScore - data.oldScore;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 z-[200] animate-in fade-in duration-500">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[80px] rounded-full"></div>
      </div>

      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-lg rounded-[3.5rem] p-10 shadow-[0_0_80px_rgba(79,70,229,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-300 text-center">
        
        {/* Confetti/Stars decoration (simple) */}
        <div className="absolute top-10 left-10 text-2xl animate-bounce">✨</div>
        <div className="absolute top-20 right-10 text-2xl animate-pulse">🔥</div>
        <div className="absolute bottom-20 left-14 text-2xl animate-bounce">🦾</div>
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <span className="text-indigo-400 font-black uppercase text-xs tracking-[0.5em] block mb-2">Novo Recorde Pessoal</span>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">PARABÉNS!</h2>
            <p className="text-slate-400 font-medium">Você superou seus limites no <span className="text-indigo-300 font-bold">{data.exercise}</span>.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">1RM Anterior</span>
              <span className="text-2xl font-black text-slate-400 line-through">{data.old1RM.toFixed(1)}kg</span>
            </div>
            <div className="bg-indigo-600/10 p-6 rounded-[2rem] border border-indigo-500/30 ring-2 ring-indigo-500/10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Novo Recorde</span>
              <span className="text-3xl font-black text-white">{data.new1RM.toFixed(1)}kg</span>
            </div>
          </div>

          <div className="py-8 border-y border-slate-800/50 space-y-4">
             <div className="flex justify-center items-center gap-3">
                <div className="flex flex-col items-center">
                   <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Power Index</span>
                   <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-white">{data.oldScore}</span>
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                      <span className="text-4xl font-black text-emerald-400">{data.newScore}</span>
                   </div>
                </div>
             </div>
             {scoreGain > 0 && (
               <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                  +{scoreGain} Pontos de Evolução
               </span>
             )}
          </div>

          {data.changedLevel ? (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-[2.5rem] shadow-xl group">
               <span className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-2">UPGRADE DE CLASSE!</span>
               <div className="flex items-center justify-center gap-4">
                  <span className="text-xl font-bold text-white/50">{data.oldLevel}</span>
                  <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{data.newLevel}</span>
               </div>
            </div>
          ) : (
            <div className="p-4">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status Atual</span>
               <span className="text-xl font-black text-indigo-300">{data.newLevel}</span>
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full py-6 bg-white text-slate-900 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95"
          >
            Continuar Esmagando
          </button>
        </div>
      </div>
    </div>
  );
};
