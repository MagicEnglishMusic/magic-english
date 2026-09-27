import React, { useState } from 'react';
import { 
  Music, 
  Globe2, 
  Brain, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  MessageSquareQuote,
  CheckCircle2,
  Copy
} from 'lucide-react';

export default function LearningTabs({ song, currentLineIndex, onSelectLine }) {
  const [activeTab, setActiveTab] = useState('lyrics'); // 'lyrics' | 'translation' | 'learn'
  const [copiedId, setCopiedId] = useState(null);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Selectors */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0e101f] border border-[#1e2338] max-w-md">
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'lyrics'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>🎵 Letra</span>
        </button>

        <button
          onClick={() => setActiveTab('translation')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'translation'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>🌎 Tradução</span>
        </button>

        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'learn'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>🧠 Aprenda</span>
        </button>
      </div>

      {/* Tab 1: Letra com Destaque Interativo */}
      {activeTab === 'lyrics' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-400">
              Clique em qualquer frase para destacar e ouvir a pronúncia isolada
            </p>
            <span className="text-[11px] text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-medium">
              Modo Karaokê
            </span>
          </div>

          <div className="space-y-3">
            {(song?.lyrics || []).map((line, index) => {
              const isSelected = currentLineIndex === index;
              return (
                <div
                  key={line?.id || index}
                  onClick={() => onSelectLine(index)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-4 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-950/40 via-[#181a30] to-[#121528] border-purple-500/60 shadow-xl shadow-purple-600/15 scale-[1.01]'
                      : 'bg-[#111322] border-[#1d2238] hover:border-purple-500/30 hover:bg-[#15182a]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-slate-500 mt-1 px-2 py-0.5 rounded bg-[#181b2e]">
                      {line?.time || ''}
                    </span>
                    <div className="space-y-1">
                      <p
                        className={`text-base sm:text-lg font-bold transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {line?.english || ''}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {line?.portuguese || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(line?.english || '');
                      }}
                      className="p-2 rounded-xl bg-[#191d32] hover:bg-purple-600 hover:text-white text-purple-300 transition-colors"
                      title="Ouvir pronúncia da frase"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Tradução Lado a Lado */}
      {activeTab === 'translation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(song?.lyrics || []).map((line, index) => (
              <div
                key={line?.id || index}
                className="p-5 rounded-2xl bg-[#111424] border border-[#1e2338] hover:border-purple-500/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1c2035]">
                  <span className="text-xs font-mono text-purple-400 font-semibold">{line?.time || ''}</span>
                  <button
                    onClick={() => speakText(line?.english || '')}
                    className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 bg-purple-500/10 px-2 py-1 rounded-lg"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Ouvir
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                      EN
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white">{line?.english || ''}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                      PT
                    </span>
                    <p className="text-sm text-slate-300 font-medium">{line?.portuguese || ''}</p>
                  </div>
                </div>

                {line?.notes && (
                  <div className="p-2.5 rounded-xl bg-[#161a2e] text-[11px] text-slate-400 border border-slate-800">
                    <span className="font-semibold text-purple-300">💡 Dica de contexto: </span>
                    {line.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Aprenda (Palavras Aprendidas & Frases Importantes) */}
      {activeTab === 'learn' && (
        <div className="space-y-8">
          
          {/* Seção 1: Palavras Aprendidas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">
                Palavras Chave Aprendidas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(song?.vocabulary || []).map((vocab, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-gradient-to-b from-[#13172b] to-[#0e101f] border border-[#20263f] hover:border-purple-500/40 transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        {vocab?.word || ''}
                      </h4>
                      <span className="text-xs font-mono text-purple-400">{vocab?.phonetic || ''}</span>
                    </div>
                    <button
                      onClick={() => speakText(vocab?.word || '')}
                      className="p-1.5 rounded-lg bg-[#191d32] hover:bg-purple-600 text-purple-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#1c2138] space-y-1">
                    <p className="text-xs font-bold text-slate-200">{vocab?.meaning || ''}</p>
                    <span className="inline-block text-[10px] text-purple-300/80 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {vocab?.type || ''}
                    </span>
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      "{vocab?.example || ''}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Frases Importantes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">
                Frases Importantes para Conversação
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(song?.keyPhrases || []).map((phrase, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-[#121526] border border-[#1f253d] hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        Expressão #{index + 1}
                      </span>
                      <button
                        onClick={() => speakText(phrase?.audioText || phrase?.phrase || '')}
                        className="p-1.5 rounded-lg bg-[#181c30] hover:bg-cyan-500 hover:text-black text-cyan-400 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      "{phrase?.phrase || ''}"
                    </h4>
                    <p className="text-xs font-semibold text-purple-300">
                      {phrase?.translation || ''}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                    {phrase?.context || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
