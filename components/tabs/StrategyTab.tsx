import React from 'react';
import { PeriodizationPhase } from '../../types';

interface Props {
  macrocycles: any[];
  activePhaseId: string | null;
  isDeloadActive: boolean;
  onActivatePhase: (id: string) => void;
  manualMethodology: string;
  setManualMethodology: (v: string) => void;
  manualRir: number;
  setManualRir: (v: number) => void;
  manualProgression: string;
  setManualProgression: (v: any) => void;
}

export const StrategyTab: React.FC<Props> = ({ 
  macrocycles, activePhaseId, isDeloadActive, onActivatePhase, 
  manualMethodology, setManualMethodology, manualRir, setManualRir, 
  manualProgression, setManualProgression 
}) => {
  const getVolumeStatusColor = (status?: string) => {
      if(status === 'MANUTENÇÃO') return 'text-blue-400 border-blue-400/20';
      if(status === 'PRODUTIVO') return 'text-emerald-400 border-emerald-400/20';
      if(status === 'OTIMIZADO') return 'text-indigo-400 border-indigo-400/20';
      return 'text-orange-400 border-orange-400/20';
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className={`bg-slate-900 border rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden ${isDeloadActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
          <div className="max-w-3xl relative z-10">
             <span className="text-indigo-400 font-black uppercase text-xs tracking-[0.4em] mb-4 block">Manual de Guerra</span>
             <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-6 tracking-tighter leading-none">Periodização</h2>
             <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">Escolha sua estratégia de progressão.</p>
          </div>
       </div>

       {activePhaseId === 'f_manual' && (
         <div className="border border-slate-700 p-10 rounded-[2.5rem] bg-slate-900/50">
             <h3 className="text-2xl font-black text-white mb-6">Customização Manual</h3>
             <textarea value={manualMethodology} onChange={e => setManualMethodology(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white" placeholder="Descreva sua metodologia..." />
         </div>
       )}

       <div className="space-y-16">
          {macrocycles.map((macro, i) => (
             <div key={i} className="space-y-8">
                <div className="flex items-center gap-4"><h3 className="text-2xl font-black uppercase text-white">{macro.name}</h3><div className="h-px bg-slate-800 flex-1"></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {macro.phases.map((phase: PeriodizationPhase) => (
                      <div key={phase.id} className={`p-8 rounded-[2.5rem] border cursor-pointer transition-all ${activePhaseId === phase.id ? 'bg-indigo-600 border-indigo-400 shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`} onClick={() => onActivatePhase(phase.id)}>
                         {activePhaseId === phase.id && <span className="bg-white/20 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase mb-4 inline-block">Ativo</span>}
                         <h4 className="text-xl font-black text-white mb-2">{phase.name}</h4>
                         <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase ${getVolumeStatusColor(phase.targetVolumeStatus)}`}>{phase.targetVolumeStatus}</span>
                         <p className="text-xs text-slate-400 mt-4 leading-relaxed">{phase.description}</p>
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
