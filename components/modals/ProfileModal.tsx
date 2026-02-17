import React, { useRef } from 'react';
import { calculateStrengthLevel } from '../../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  strengthInputs: any;
  setStrengthInputs: (inputs: any) => void;
  strengthProfiles: Record<string, number>;
  setStrengthProfiles: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  globalStrengthScore: number;
  isDeloadActive: boolean;
}

export const ProfileModal: React.FC<Props> = ({
  isOpen, onClose, userName, setUserName, strengthInputs, setStrengthInputs,
  strengthProfiles, setStrengthProfiles, globalStrengthScore, isDeloadActive
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const allData = { ...localStorage };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `backup_hypervolume_${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (window.confirm("A importação substituirá seus dados atuais. O app será reiniciado. Continuar?")) {
          localStorage.clear();
          Object.keys(backupData).forEach((key) => localStorage.setItem(key, backupData[key]));
          window.location.reload(); 
        }
      } catch (error) { alert('Erro ao ler backup.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Perfil do Atleta</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        
        <div className="space-y-8">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome de Guerra</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Peso Corporal (kg)</label>
              <input type="number" value={strengthInputs.bw || ''} onChange={(e) => setStrengthInputs({ ...strengthInputs, bw: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Backup */}
          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Gestão de Dados (Backup)</label>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={handleExportBackup} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                   <span className="text-lg">📤</span> <span className="text-[10px] font-black uppercase text-white">Exportar JSON</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                   <span className="text-lg">📥</span> <span className="text-[10px] font-black uppercase text-white">Importar JSON</span>
                </button>
                <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".json" onChange={handleImportBackup} />
             </div>
             <p className="text-[9px] text-slate-600 mt-2 text-center italic">O backup salva todos os seus dados.</p>
          </div>

          <div className="w-full h-px bg-slate-800"></div>

          {/* Dashboard de Força */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-lg">💪</span> Dashboard de Força</h4>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDeloadActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>Power Index: {globalStrengthScore}</span>
            </div>

            <div className="space-y-3">
              {['Supino', 'Agachamento', 'Levantamento Terra', 'Remada Curvada'].map(ex => {
                const currentVal = strengthProfiles[ex] || 0;
                const ratio = strengthInputs.bw > 0 ? (currentVal / strengthInputs.bw).toFixed(2) : '0.00';
                const levelData = calculateStrengthLevel(ex, strengthInputs.bw, currentVal, 1);
                
                return (
                  <div key={ex} className={`bg-slate-950 p-4 rounded-2xl border flex justify-between items-center group transition-all ${isDeloadActive ? 'border-emerald-900/30 hover:border-emerald-700' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{ex}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={currentVal ? Math.round(currentVal) : ''} 
                          onChange={(e) => setStrengthProfiles(prev => ({ ...prev, [ex]: parseFloat(e.target.value) || 0 }))}
                          className="bg-transparent text-xl font-black text-white w-24 outline-none border-b border-slate-800 focus:border-indigo-500 transition-colors placeholder-slate-700"
                          placeholder="0"
                        />
                        <span className="text-[10px] font-bold text-slate-600">KG (1RM)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {currentVal > 0 ? (
                        <>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${levelData.bg} ${levelData.color} border-opacity-20`}>{levelData.level}</span>
                          <p className="text-[9px] font-bold text-slate-500 mt-1">Ratio: {ratio}x BW</p>
                        </>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-700 bg-slate-900 px-2 py-1 rounded">DADOS INCOMPLETOS</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button onClick={onClose} className={`w-full mt-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${isDeloadActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white`}>
          Salvar e Fechar
        </button>
      </div>
    </div>
  );
};
