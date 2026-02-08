
import React, { useState } from 'react';
import { WorkoutLog, WorkoutSplit, WorkoutExercise, WorkoutSet } from '../types';
import { calculateRecoveryLoad } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workoutHistory: WorkoutLog[];
  onApply: (newSplit: WorkoutSplit, phaseId: string) => void;
  strengthProfiles: Record<string, number>;
  currentWorkouts: WorkoutSplit;
}

export const ReturnToTrainingModal: React.FC<Props> = ({ isOpen, onClose, workoutHistory, onApply, strengthProfiles, currentWorkouts }) => {
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!isOpen) return null;

  const handleProcessReturn = () => {
    if (!selectedTime) return;

    // Persist timeAway to local storage so other components (like suggestSmartLoad) can access it
    localStorage.setItem('hv_return_time_away', selectedTime);

    if (selectedTime === 'more_12_weeks') {
      alert("Como você esteve parado há mais de 12 semanas, ativamos a Fase 0: Adaptação Anatômica. Escolha seus exercícios no catálogo priorizando máquinas.");
      onApply({}, 'f0_adaptacao'); 
      onClose();
      return;
    }

    const hasCurrentExercises = (Object.values(currentWorkouts) as WorkoutExercise[][]).some(day => day.length > 0);
    const lastValidLog = workoutHistory.find(log => log.split && Object.keys(log.split).length > 0);

    let baseSplit = currentWorkouts;
    let message = "Fase de Recuperação ativada! Monte seu treino no catálogo. O assistente irá sugerir cargas seguras baseadas no seu tempo parado.";

    if (hasCurrentExercises || lastValidLog) {
        const useHistory = !hasCurrentExercises && lastValidLog;
        const sourceSplit = useHistory ? lastValidLog.split : currentWorkouts;

        const newSplit: WorkoutSplit = {};
        Object.entries(sourceSplit).forEach(([day, exercises]) => {
          newSplit[day] = (exercises as WorkoutExercise[]).map(ex => {
            const reducedSets: WorkoutSet[] = (ex.sets || []).map(s => ({
              ...s,
              load: calculateRecoveryLoad(s.load, selectedTime),
              rir: 4 
            }));

            return {
              ...ex,
              sets: reducedSets,
              load: reducedSets[0]?.load || null,
              rir: 4
            };
          });
        });

        baseSplit = newSplit;
        message = useHistory 
            ? "Importamos seu último treino com cargas reduzidas para sua segurança. Sinta-se à vontade para ajustar ou trocar exercícios no catálogo."
            : "Reduzimos as cargas dos seus treinos atuais conforme o tempo de pausa. O assistente de retorno está ativo para novas escolhas.";
    }

    alert(message);
    onApply(baseSplit, 'fr_retorno');
    onClose();
  };

  const options = [
    { id: '1-2_weeks', label: '1 a 2 semanas', desc: 'Leve perda de ritmo. Redução de 15% na carga (x0.85).', icon: '🍃' },
    { id: '2-4_weeks', label: '2 a 4 semanas', desc: 'Perda de tônus. Redução de 25% na carga (x0.75).', icon: '🍂' },
    { id: '4-12_weeks', label: '4 a 12 semanas', desc: 'Perda de força significativa. Redução de 40% na carga (x0.60).', icon: '❄️' },
    { id: 'more_12_weeks', label: 'Mais de 12 semanas', desc: 'Reinício total recomendado. Fase de Adaptação.', icon: '🌱' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-amber-500/5">
            ⏳
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Retorno Estratégico</h2>
          <p className="text-slate-400 font-medium mt-2">Ative o assistente de retorno. Suas cargas serão recalculadas e o catálogo destacará as melhores opções para você.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedTime(opt.id)}
              className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all text-left group ${selectedTime === opt.id ? 'bg-amber-500 border-amber-400 shadow-xl shadow-amber-500/20' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">{opt.icon}</span>
              <div className="flex-1">
                <h4 className={`font-black text-lg ${selectedTime === opt.id ? 'text-white' : 'text-slate-100'}`}>{opt.label}</h4>
                <p className={`text-xs font-medium ${selectedTime === opt.id ? 'text-amber-100' : 'text-slate-500'}`}>{opt.desc}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedTime === opt.id ? 'border-white bg-white/20' : 'border-slate-700'}`}>
                {selectedTime === opt.id && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 bg-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-white transition-all">Cancelar</button>
          <button 
            disabled={!selectedTime}
            onClick={handleProcessReturn}
            className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${selectedTime ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20 hover:bg-amber-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            Ativar Readaptação
          </button>
        </div>
      </div>
    </div>
  );
};
