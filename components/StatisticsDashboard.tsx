
import React, { useMemo } from 'react';
import { WorkoutLog } from '../types';
import { getWeeklyStatistics, getMuscleEmoji, calculateDetailedMuscleMetrics } from '../utils/helpers';
import { MUSCULOS_GRANDES } from '../constants';

interface Props {
  history: WorkoutLog[];
}

export const StatisticsDashboard: React.FC<Props> = ({ history }) => {
  const weeklyStats = useMemo(() => getWeeklyStatistics(history).slice(-12), [history]);
  
  // Fix: Added type assertion to ensure Math.max receives numbers
  const maxVolume = useMemo(() => Math.max(...(weeklyStats.map(s => s.volume) as number[]), 1), [weeklyStats]);
  // Fix: Added type assertion to ensure Math.max receives numbers
  const maxWorkload = useMemo(() => Math.max(...(weeklyStats.map(s => s.workload) as number[]), 1), [weeklyStats]);

  const muscleSymmetry = useMemo(() => {
    const totals: Record<string, number> = {};
    history.slice(0, 5).forEach(log => {
      const metrics = calculateDetailedMuscleMetrics(log);
      Object.entries(metrics).forEach(([m, d]) => {
        if (MUSCULOS_GRANDES.includes(m)) {
          totals[m] = (totals[m] || 0) + d.weightedVolume;
        }
      });
    });
    return totals;
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfico 1: Volume vs Intensidade Média */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Evolução Semanal</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Volume de Séries vs RIR Médio</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Volume</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Intensidade (RIR)</span>
               </div>
            </div>
          </div>

          <div className="relative h-64 w-full mt-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
              {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
            </div>
            
            <div className="absolute inset-0 flex items-end justify-around gap-4 px-4">
              {weeklyStats.map((s, i) => {
                const volHeight = (s.volume / maxVolume) * 100;
                const rirHeight = ((10 - s.avgRir) / 10) * 100; // Invertemos: RIR 0 (falha) é o topo
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 whitespace-nowrap shadow-xl">
                       {s.volume}S | RIR {s.avgRir.toFixed(1)}
                    </div>
                    
                    {/* Bar Volume */}
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-indigo-900 to-indigo-500 rounded-t-xl transition-all duration-700 relative z-10" 
                      style={{ height: `${volHeight}%` }}
                    >
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    {/* Dot Intensity */}
                    <div 
                      className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.5)] z-20 transition-all duration-1000"
                      style={{ bottom: `${rirHeight}%` }}
                    ></div>

                    <span className="text-[8px] font-black text-slate-500 uppercase mt-4 tracking-tighter">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfico 2: Tonelagem Semanal (Load x Reps x Sets) */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Tonelagem (Workload)</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Peso Total Movimentado (Toneladas)</p>
            </div>
            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">PROGRESSÃO MECÂNICA</span>
          </div>

          <div className="relative h-64 w-full">
            <svg viewBox="0 0 1000 400" className="w-full h-full preserve-3d overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area Under Line */}
              <path 
                d={`M 0 400 ${weeklyStats.map((s, i) => `L ${(1000 / (weeklyStats.length - 1 || 1)) * i} ${400 - (s.workload / maxWorkload) * 350}`).join(' ')} L 1000 400 Z`}
                fill="url(#lineGrad)"
                className="transition-all duration-1000"
              />
              
              {/* The Line */}
              <path 
                d={weeklyStats.map((s, i) => `${i === 0 ? 'M' : 'L'} ${(1000 / (weeklyStats.length - 1 || 1)) * i} ${400 - (s.workload / maxWorkload) * 350}`).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />

              {/* Data points labels */}
              {weeklyStats.map((s, i) => (
                <text 
                  key={i} 
                  x={(1000 / (weeklyStats.length - 1 || 1)) * i} 
                  y={380 - (s.workload / maxWorkload) * 350} 
                  className="fill-slate-400 text-[20px] font-black text-center"
                  textAnchor="middle"
                >
                  {(s.workload / 1000).toFixed(1)}t
                </text>
              ))}
            </svg>
            <div className="flex justify-between px-2 mt-2">
               {weeklyStats.map((s, i) => (
                 <span key={i} className="text-[8px] font-black text-slate-600 uppercase">{s.label}</span>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico 3: Balanço Muscular (Radar) */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8">Simetria de Esforço</h3>
          
          <div className="flex-1 flex items-center justify-center relative py-6">
             <svg viewBox="0 0 200 200" className="w-56 h-56 overflow-visible">
                {/* Radar Circles */}
                {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
                  <circle key={r} cx="100" cy="100" r={r * 80} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-800" />
                ))}
                
                {/* Lines */}
                {MUSCULOS_GRANDES.map((m, i) => {
                  const angle = (i * 2 * Math.PI) / MUSCULOS_GRANDES.length;
                  return (
                    <line key={i} x1="100" y1="100" x2={100 + Math.cos(angle) * 80} y2={100 + Math.sin(angle) * 80} stroke="currentColor" strokeWidth="0.5" className="text-slate-800" />
                  );
                })}

                {/* Data Shape */}
                <path 
                  d={MUSCULOS_GRANDES.map((m, i) => {
                    const angle = (i * 2 * Math.PI) / MUSCULOS_GRANDES.length;
                    const val = muscleSymmetry[m] || 0;
                    // Fix: Added type assertion to ensure Math.max receives numbers
                    const maxVal = Math.max(...(Object.values(muscleSymmetry) as number[]), 1);
                    const r = (val / maxVal) * 80;
                    return `${i === 0 ? 'M' : 'L'} ${100 + Math.cos(angle) * r} ${100 + Math.sin(angle) * r}`;
                  }).join(' ') + ' Z'}
                  fill="rgba(99, 102, 241, 0.2)"
                  stroke="#6366f1"
                  strokeWidth="2"
                  className="transition-all duration-1000"
                />

                {/* Labels */}
                {MUSCULOS_GRANDES.map((m, i) => {
                  const angle = (i * 2 * Math.PI) / MUSCULOS_GRANDES.length;
                  const x = 100 + Math.cos(angle) * 105;
                  const y = 100 + Math.sin(angle) * 105;
                  return (
                    <text key={i} x={x} y={y} className="fill-slate-500 text-[10px] font-black" textAnchor="middle" dominantBaseline="middle">
                      {getMuscleEmoji(m)}
                    </text>
                  );
                })}
             </svg>
          </div>
          <div className="pt-8 border-t border-slate-800">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center">Baseado nas últimas 5 sessões registradas no seu histórico.</p>
          </div>
        </div>

        {/* Gráfico 4: Frequência de Grupos */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Intensidade por Grupo</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Zoneamento Adaptativo</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {MUSCULOS_GRANDES.map(m => {
              // Fix: Added safety check for muscleSymmetry access
              const currentVol = (muscleSymmetry[m] || 0) / (history.length || 1);
              const status = (currentVol > 8) ? { label: 'ALTO', color: 'text-orange-400', bg: 'bg-orange-500/10' } : 
                             (currentVol > 4) ? { label: 'IDEAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10' } :
                             { label: 'BAIXO', color: 'text-blue-400', bg: 'bg-blue-500/10' };
              
              return (
                <div key={m} className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xl border border-slate-800">
                         {getMuscleEmoji(m)}
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                   </div>
                   <div className="mt-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1">{m}</h4>
                      <p className="text-2xl font-black text-indigo-400">{(muscleSymmetry[m] || 0).toFixed(1)} <span className="text-[10px] text-slate-600 font-bold uppercase">Séries</span></p>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
