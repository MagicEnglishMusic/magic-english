import React from 'react';
import { Trophy, TrendingUp, Zap, ArrowRight, Sparkles, Target, Flame } from 'lucide-react';

export default function UserRankCard({
  userRanking,
  onContinueStudy,
  className = ""
}) {
  const {
    rank = 4,
    name = "João Silva",
    avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    level = "Nível 2 • Music Learner",
    league = "Liga Diamante",
    weeklyXp = 680,
    positionsGained = 3,
    nextGoal = "Faltam 120 XP para chegar ao Top 3.",
    xpToNextRank = 120
  } = userRanking || {};

  return (
    <div className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#161a2f] via-[#121526] to-[#0b0d18] border border-purple-500/40 shadow-2xl space-y-5 group ${className}`}>
      
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/25 transition-all" />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f243c] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Meu Desempenho no Ranking
          </h3>
        </div>

        <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Subiu {positionsGained} posições
        </span>
      </div>

      {/* Main Grid: User Details + Next Goal + CTA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
        
        {/* Left: User Identity & Current Rank (5 Cols) */}
        <div className="md:col-span-5 flex items-center gap-4">
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-md"
            />
            <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white font-black text-xs px-2 py-0.5 rounded-lg border-2 border-[#121526]">
              #{rank}
            </div>
          </div>

          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
              {league}
            </span>
            <h4 className="text-base font-black text-white truncate">
              {name}
            </h4>
            <p className="text-xs text-slate-400 truncate">
              {level}
            </p>
          </div>
        </div>

        {/* Center: Weekly XP & Target Goal (4 Cols) */}
        <div className="md:col-span-4 p-4 rounded-2xl bg-[#101322] border border-[#1f243a] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Magic XP da Semana:</span>
            <span className="text-amber-400 font-extrabold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              {weeklyXp} XP
            </span>
          </div>

          <div className="pt-1 text-xs text-slate-300 font-medium">
            <span className="text-purple-300 font-bold">Próximo objetivo: </span>
            <span>{nextGoal}</span>
          </div>
        </div>

        {/* Right: Continue Study CTA (3 Cols) */}
        <div className="md:col-span-3 flex justify-end">
          <button
            onClick={onContinueStudy}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continuar Estudando</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
