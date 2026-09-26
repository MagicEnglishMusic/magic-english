import React from 'react';
import { CheckCircle2, Lock, Star, Sparkles, ChevronRight, Zap } from 'lucide-react';

export default function JourneyProgress({
  journeySteps = [],
  currentLevelNumber = 2,
  className = ""
}) {
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Mapa de Evolução
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Minha Jornada no Inglês</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </h3>
        </div>

        <span className="text-xs text-purple-300 font-bold bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30 self-start sm:self-auto">
          Nível {currentLevelNumber} de 6 Ativo
        </span>
      </div>

      {/* Visual Progression Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {journeySteps.map((step) => {
          const isCompleted = step.status === 'completed' || step.level < currentLevelNumber;
          const isCurrent = step.status === 'current' || step.level === currentLevelNumber;
          const isNext = step.status === 'next' || step.level === currentLevelNumber + 1;
          const isFuture = step.level > currentLevelNumber + 1;

          return (
            <div
              key={step.level}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#1e233d] via-[#15182d] to-[#0d0f1c] border-purple-500 shadow-xl shadow-purple-950/50 ring-2 ring-purple-500/40'
                  : isCompleted
                  ? 'bg-[#121525] border-emerald-500/30'
                  : isNext
                  ? 'bg-[#111320] border-amber-500/30'
                  : 'bg-[#0e101b]/70 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Current Level Glow */}
              {isCurrent && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
              )}

              <div className="space-y-3">
                {/* Icon & Status Pill */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                      isCurrent
                        ? 'bg-purple-600/30 border border-purple-400/50'
                        : isCompleted
                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                        : 'bg-[#181c30] border border-slate-700/60 text-slate-500'
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* Status Indicator */}
                  {isCompleted ? (
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Concluído
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 animate-pulse">
                      <Star className="w-3 h-3 fill-amber-300" /> Atual
                    </span>
                  ) : isNext ? (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" /> Próximo
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Futuro
                    </span>
                  )}
                </div>

                {/* Level Title & Subtitle */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nível {step.level}
                  </span>
                  <h4 className="text-sm font-black text-white truncate mt-0.5">
                    {step.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Footer Tag */}
              <div className="pt-3 mt-3 border-t border-[#1d2238] flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Meta:</span>
                <span className={`font-bold ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-purple-300' : 'text-slate-400'}`}>
                  {step.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
