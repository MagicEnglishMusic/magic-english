import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Volume2, Award, CheckCircle2, Loader2, VolumeX } from 'lucide-react';
import PronunciationPractice from '../classroom/PronunciationPractice';
import { pronunciationService } from '../../services/pronunciationService';

export default function PronunciationLabView() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPronunciation() {
      setIsLoading(true);
      try {
        const { data } = await pronunciationService.getWords();
        if (data) {
          setItems(data);
        }
      } catch (err) {
        console.warn('Error loading pronunciation words:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPronunciation();
  }, []);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c2035]">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Laboratório de Pronúncia IA</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Treine sua fala, ouça a pronúncia de nativos e receba avaliação de ritmo em tempo real
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Voice Lab Ativo</span>
        </span>
      </div>

      {isLoading ? (
        <div className="p-16 rounded-3xl bg-[#111425] border border-[#1e233b] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-sm text-slate-400">Carregando termos fonéticos...</p>
        </div>
      ) : items.length > 0 ? (
        <PronunciationPractice items={items} context="general" />
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#111425] border border-[#1e233b] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mx-auto">
            <Mic className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Nenhum termo fonético disponível no momento</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              As palavras e exercícios de pronúncia cadastrados pelo administrador aparecerão aqui para treino vocal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
