import React from 'react';
import { Shield, Sparkles, CheckCircle2, Crown, Lock } from 'lucide-react';
import { LEAGUES_LIST } from '../../data/rankingData';

export default function LeagueBadge({
  leagues = LEAGUES_LIST,
  activeLeagueName = "Liga Diamante",
  className = ""
}) {
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
            Divisão de Níveis
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Sistema de Ligas Magic English</span>
          </h3>
        </div>

        <span className="text-xs text-purple-300 font-bold bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30 self-start sm:self-auto">
          Sua Liga: {activeLeagueName}
        </span>
      </div>

      {/* 5 Leagues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {leagues.map((league) => {
          const isCurrent = league.name === activeLeagueName;

          return (
            <div
              key={league.id}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#1b223d] via-[#13172c] to-[#0c0e18] border-cyan-400 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-400/50'
                  : 'bg-[#101220] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Glow for active */}
              {isCurrent && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />
              )}

              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#171a2c] border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                    {league.icon}
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                      Sua Liga
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {league.minXp > 0 ? `${league.minXp} XP` : 'Início'}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className={`text-sm font-black truncate ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                    {league.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {league.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {league.description}
                  </p>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="pt-3 mt-3 border-t border-[#1b2034] text-[10px] text-slate-400 relative z-10">
                {isCurrent ? (
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Competindo agora
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    Liga da Comunidade
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
