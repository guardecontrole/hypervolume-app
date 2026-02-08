
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { WorkoutLog, PlanItem, PeriodizationPhase, AIAnalysisResponse } from '../types';

interface Props {
  history: WorkoutLog[];
  plan: PlanItem[];
  phase: PeriodizationPhase | null;
  strengthProfiles: Record<string, number>;
  userName: string;
}

export const AICoach: React.FC<Props> = ({ history, plan, phase, strengthProfiles, userName }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const context = {
        userName,
        currentPhase: phase?.name || 'Geral',
        phaseGoal: phase?.description,
        weeklyPlan: plan.map(p => ({ name: p.name, series: p.series })),
        recentHistory: history.slice(0, 3).map(h => ({ date: h.date, totalSeries: h.totalSeries, phase: h.phase })),
        strength: strengthProfiles
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise estes dados de treinamento de um atleta de musculação e retorne um feedback técnico em JSON. 
        Dados: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING, description: "Um resumo de 1 frase sobre o estado atual do treino." },
              status: { type: Type.STRING, enum: ['OPTIMAL', 'WARNING', 'CRITICAL'] },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              muscleInsight: { type: Type.STRING, description: "Análise sobre equilíbrio entre grupos musculares." },
              techniqueSuggestion: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            },
            required: ["verdict", "status", "recommendations", "muscleInsight", "techniqueSuggestion"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      alert("Erro ao consultar o HyperCoach. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h3 className="text-xl font-black uppercase tracking-tight">Consultoria HyperCoach IA</h3>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Análise Biomecânica e de Volume via Gemini 3 Pro</p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${loading ? 'bg-slate-800 text-slate-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'}`}
        >
          {loading ? 'Processando Fibras...' : '🚀 Gerar Insight Profissional'}
        </button>
      </div>

      {!analysis && !loading && (
        <div className="py-12 text-center">
          <p className="text-slate-600 text-xs font-medium italic">Clique para que a IA analise seu plano e histórico em busca de falhas estruturais.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-800/50 rounded-2xl"></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
             <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`p-6 rounded-3xl border ${analysis.status === 'OPTIMAL' ? 'bg-emerald-500/10 border-emerald-500/20' : analysis.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-lg">{analysis.status === 'OPTIMAL' ? '✅' : '⚠️'}</span>
               <span className={`text-[10px] font-black uppercase tracking-widest ${analysis.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'}`}>Veredito do Treinador</span>
            </div>
            <p className="text-white font-bold text-lg leading-tight">{analysis.verdict}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Recomendações Estratégicas</h4>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-300 font-medium">
                    <span className="text-indigo-400">•</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Insights de Simetria</h4>
                <p className="text-xs text-slate-400 leading-relaxed italic">{analysis.muscleInsight}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Técnica Sugerida</span>
                 <h5 className="text-sm font-black text-white">{analysis.techniqueSuggestion.name}</h5>
                 <p className="text-[10px] text-slate-500">{analysis.techniqueSuggestion.reason}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
