import React, { useState, useEffect } from 'react';
import { Play, Pause, Music, Volume2, Sparkles, CheckCircle2, RotateCcw, Radio } from 'lucide-react';

export default function MusicSection({ song, onOpenFullPlayer }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(0);

  const lyrics = song.lyricsTimestamps || [
    { id: 1, startTime: 0, endTime: 4, en: "Hello, hello, good morning my friend!", pt: "Olá, olá, bom dia meu amigo!" },
    { id: 2, startTime: 4, endTime: 9, en: "The sun is up, a new day will begin.", pt: "O sol nasceu, um novo dia vai começar." },
    { id: 3, startTime: 9, endTime: 14, en: "How are you doing on this lovely day?", pt: "Como você está neste lindo dia?" },
    { id: 4, startTime: 14, endTime: 19, en: "I'm feeling great, ready to sing and play!", pt: "Estou me sentindo ótimo, pronto para cantar e brincar!" },
    { id: 5, startTime: 19, endTime: 24, en: "Nice to meet you, welcome to the show.", pt: "Prazer em conhecer você, bem-vindo ao show." },
    { id: 6, startTime: 24, endTime: 30, en: "Sing with the rhythm, let your English grow!", pt: "Cante com o ritmo, deixe seu inglês crescer!" }
  ];

  // Synchronized Karaoke timer
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          // Find which line is active based on timestamp
          const lineIdx = lyrics.findIndex(
            (l) => next >= l.startTime && next < l.endTime
          );
          if (lineIdx !== -1) {
            setActiveLineIndex(lineIdx);
          } else if (next >= 30) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, lyrics]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      speak(lyrics[activeLineIndex]?.en || song.title);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation Card: Music as Memorization Tool */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#15182d] to-[#0f1224] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-md">
            <Music className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Karaokê Sincronizado de Fixação
            </span>
            <h3 className="text-base font-bold text-white">
              Magic Song: {song.title}
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe os versos iluminados em tempo real para destravar a musicalidade do inglês.
            </p>
          </div>
        </div>

        {onOpenFullPlayer && (
          <button
            onClick={onOpenFullPlayer}
            className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          >
            Abrir Prática Musical ➔
          </button>
        )}
      </div>

      {/* Mini Player & Synced Karaoke Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Mini Player Card (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-[#111424] border border-[#1e233b] flex flex-col justify-between space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-purple-500/30 group">
            <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 hover:scale-110 transition-transform cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">{song.title}</h4>
            <p className="text-xs text-slate-400">{song.subtitle}</p>
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold pt-1">
              <span>{song.duration}</span>
              <span className="text-cyan-400 font-bold">{song.bpm}</span>
            </div>
          </div>
        </div>

        {/* Right: Synchronized Karaoke Lyrics List (8 Cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[#111424] border border-[#1e233b] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Letra Sincronizada com Áudio
            </h4>
            <span className="text-[11px] text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              {isPlaying ? '▶ Tocando Karaokê' : 'Pausado'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {lyrics.map((line, index) => {
              const isCurrent = activeLineIndex === index;
              const isPast = activeLineIndex > index;
              const isFuture = activeLineIndex < index;

              return (
                <div
                  key={line.id}
                  onClick={() => {
                    setActiveLineIndex(index);
                    speak(line.en);
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-500 cursor-pointer flex items-center justify-between gap-4 group ${
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-950/60 via-[#1a1d38] to-[#121528] border-purple-400 shadow-xl shadow-purple-600/30 scale-[1.02] ring-1 ring-purple-400/60'
                      : isPast
                      ? 'bg-[#121526]/80 border-slate-800/80 text-slate-400'
                      : 'bg-[#0e101d]/60 border-slate-800/40 opacity-40 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-purple-600 text-white shadow-sm'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPast ? '✓' : `00:${line.startTime < 10 ? '0' : ''}${line.startTime}`}
                    </span>

                    <div className="space-y-0.5">
                      <p
                        className={`text-sm sm:text-base font-black transition-colors ${
                          isCurrent
                            ? 'text-white text-shadow-glow'
                            : isPast
                            ? 'text-slate-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {line.en}
                      </p>
                      <p
                        className={`text-xs ${
                          isCurrent ? 'text-purple-300 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {line.pt}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(line.en);
                    }}
                    className={`p-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-[#171b30] text-slate-400 group-hover:text-white'
                    }`}
                    title="Ouvir verso"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
