import React, { useState } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, Sparkles, Award, Zap } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';

export default function PronunciationPractice({ items = [] }) {
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [scores, setScores] = useState({});
  const { addXp } = useGamification();

  const currentItem = items[selectedWordIndex] || items[0] || {
    word: "Hello",
    phonetic: "/həˈloʊ/",
    tip: "Acentue a segunda sílaba com som aberto de 'ou'."
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const newScore = currentItem.score || 95;
        setScores((prev) => ({
          ...prev,
          [selectedWordIndex]: newScore
        }));

        // Reward XP for pronunciation practice
        addXp(XP_REWARDS.COMPLETE_PRONUNCIATION, `Treino de Pronúncia: ${currentItem.word}`, {
          showModal: true,
          type: 'xp',
          title: '🎤 Pronúncia Aprovada!',
          subtitle: `Precisão de ${newScore}% na palavra "${currentItem.word}".`,
          icon: '🎤',
          bonusText: `+${XP_REWARDS.COMPLETE_PRONUNCIATION} Magic XP conquistados no Voice Lab!`
        });
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Word Selector Chips */}
      <div className="flex flex-wrap items-center gap-2.5">
        {items.map((item, idx) => {
          const isSelected = selectedWordIndex === idx;
          const score = scores[idx];
          return (
            <button
              key={idx}
              onClick={() => setSelectedWordIndex(idx)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-[#111424] border border-[#1e233b] text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item.word}</span>
              {score && (
                <span className="text-[10px] font-black bg-black/40 px-1.5 py-0.2 rounded text-emerald-400">
                  {score}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Pronunciation Lab Box */}
      <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-b from-[#121528] to-[#0d0f1c] border border-purple-500/30 shadow-2xl flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Inteligência Artificial Vocal</span>
        </div>

        {/* Big Word Display */}
        <div className="space-y-1">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wide">
            {currentItem.word}
          </h2>
          <p className="text-sm font-mono text-purple-400">{currentItem.phonetic}</p>
          <p className="text-xs text-slate-400 max-w-md pt-1">{currentItem.tip}</p>
        </div>

        {/* Score Badge */}
        {scores[selectedWordIndex] && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-300 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-300 uppercase">Score de Precisão Vocal</p>
                <p className="text-sm sm:text-base font-black text-white">{scores[selectedWordIndex]}% — Excelente Pronúncia!</p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-amber-400" /> +{XP_REWARDS.COMPLETE_PRONUNCIATION} XP
            </span>
          </div>
        )}

        {/* Buttons: Ouvir & Gravar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 w-full">
          <button
            onClick={() => speak(currentItem.word)}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-[#181c32] hover:bg-[#202540] border border-purple-500/30 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-purple-400"
          >
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span>🎤 Ouvir Nativo</span>
          </button>

          <button
            onClick={handleRecord}
            className={`flex-1 max-w-xs py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Gravando... Fale agora!</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>🎙 Gravar Minha Voz</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
