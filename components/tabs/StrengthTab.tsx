import React from 'react';
import { calculateStrengthLevel } from '../../utils/helpers';

interface Props {
  isDeloadActive: boolean;
  globalStrength: any;
  strengthInputs: any;
  setStrengthInputs: (val: any) => void;
  strengthProfiles: Record<string, number>;
  onSaveRecord: () => void;
}

export const StrengthTab: React.FC<Props> = ({ isDeloadActive, globalStrength, strengthInputs, setStrengthInputs, strengthProfiles, onSaveRecord }) => {
  const strengthResult = calculateStrengthLevel(strengthInputs.exercise, strengthInputs.bw, strengthInputs.load, strengthInputs.reps);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`lg:col-span-3 bg-slate-900 border rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden transition-colors ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
              <div className="max-w-3xl relative z-10">
              <span className={`${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'} font-black uppercase text-xs tracking-[0.4em] mb-4 block transition-colors`}>Power Matrix</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-6 tracking-tighter leading-none">Teste de Força</h2>
              </div>
          </div>
          <div className={`bg-slate-900 border rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-center items-center text-center`}>
              <span className="text-2xl font-black text-white leading-none">{globalStrength.score}</span>
              <span className="text-[8px] font-bold text-slate-500">PTS</span>
              <h4 className={`text-xl font-black uppercase tracking-tighter mt-2 ${isDeloadActive ? 'text-emerald-400' : 'text-indigo-400'}`}>{globalStrength.fullLevel}</h4>
          </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-white mb-4">Calculadora</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase ml-1">Exercício Base</label>
                  <select value={strengthInputs.exercise} onChange={(e) => setStrengthInputs({...strengthInputs, exercise: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none"><option>Supino</option><option>Agachamento</option><option>Levantamento Terra</option><option>Remada Curvada</option></select>
               </div>
               <div><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Carga (kg)</label><input type="number" value={strengthInputs.load || ''} onChange={(e) => setStrengthInputs({...strengthInputs, load: parseFloat(e.target.value)||0})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" /></div>
               <div><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Repetições</label><input type="number" value={strengthInputs.reps || ''} onChange={(e) => setStrengthInputs({...strengthInputs, reps: parseInt(e.target.value)||0})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" /></div>
            </div>
            <button onClick={onSaveRecord} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl transition-all">Salvar no Perfil</button>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estimativa de 1RM</span>
                 <span className="text-6xl font-black text-indigo-400 tracking-tighter mb-2">{strengthResult.oneRM.toFixed(1)}<span className="text-2xl text-slate-600 ml-1">kg</span></span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nível de Força</span>
                 <span className={`text-2xl font-black px-6 py-3 rounded-2xl mb-4 ${strengthResult.bg} ${strengthResult.color}`}>{strengthResult.level}</span>
              </div>
          </div>
      </div>
    </div>
  );
};
