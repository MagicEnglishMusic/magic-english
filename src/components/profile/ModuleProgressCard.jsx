import React from 'react';
import { BookOpen, Tv, Music, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ModuleProgressCard({
  modules = [],
  onOpenModule,
  className = ""
}) {
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
            Evolução dos Cursos
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Meus Módulos</span>
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Trilha Estruturada
        </span>
      </div>

      {/* Modules List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const isLocked = mod.status === 'locked';

          return (
            <div
              key={mod.id}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                isLocked
                  ? 'bg-[#0f111d]/60 border-slate-800/60 opacity-60'
                  : 'bg-gradient-to-b from-[#15192e] to-[#0d0f1c] border-purple-500/30 hover:border-purple-500/60 shadow-lg'
              }`}
            >
              <div className="space-y-3">
                {/* Module Poster Image */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800">
                  <img
                    src={mod.image}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  {/* Number & Icon */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-base">{mod.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                      {mod.number}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isLocked ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Bloqueado
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                        {mod.statusLabel}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h4 className="text-sm font-black text-white truncate">
                      {mod.title}
                    </h4>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Tv className="w-3 h-3 text-purple-400" /> {mod.lessonsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="w-3 h-3 text-emerald-400" /> {mod.songsCount}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#181c2f] h-2 rounded-full overflow-hidden p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-3 mt-3 border-t border-[#1d2238]">
                <button
                  disabled={isLocked}
                  onClick={() => onOpenModule && onOpenModule(mod)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isLocked
                      ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800'
                      : 'bg-purple-600/25 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 cursor-pointer shadow-sm'
                  }`}
                >
                  <span>{isLocked ? 'Disponível em breve' : 'Acessar Módulo'}</span>
                  {!isLocked && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
