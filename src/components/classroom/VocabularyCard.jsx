import React from 'react';
import { Volume2, BookOpen, MessageSquareQuote, CheckCircle2 } from 'lucide-react';

export default function VocabularyCard({ vocabulary, keyPhrases }) {
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Vocabulário da Aula */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Vocabulário Principal da Aula
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vocabulary.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#111424] border border-[#1e233b] hover:border-purple-500/40 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                    {item.word}
                  </h4>
                  <span className="text-xs font-mono text-purple-400">{item.pronunciation}</span>
                </div>
                <button
                  onClick={() => speakText(item.word)}
                  className="p-1.5 rounded-lg bg-[#191d32] hover:bg-purple-600 text-purple-300 hover:text-white transition-colors cursor-pointer"
                  title="Ouvir palavra"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-200">{item.meaning}</p>
                <p className="text-[11px] text-slate-400 italic">"{item.example}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Frases Importantes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Frases Chave para Conversação
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {keyPhrases.map((phrase, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#111424] border border-[#1e233b] hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Frase #{idx + 1}
                  </span>
                  <button
                    onClick={() => speakText(phrase.en)}
                    className="p-1.5 rounded-lg bg-[#191d32] hover:bg-cyan-500 hover:text-black text-cyan-400 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  "{phrase.en}"
                </h4>
                <p className="text-xs font-semibold text-purple-300">{phrase.pt}</p>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                💡 {phrase.tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
