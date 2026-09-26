import React from 'react';
import { Trophy, Zap, Flame, Crown, Clock, Sparkles, TrendingUp } from 'lucide-react';

export default function RankingHeader({
  league = "Liga Diamante",
  leagueIcon = "💎",
  currentRank = 4,
  weeklyXp = 680,
  seasonEndsIn = "3 dias e 8 horas"
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-amber-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Title & Community Vision */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Competição Saudável & Inspiração</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            🏆 Magic Ranking
          </h1>

          <p className="text-sm text-slate-300 max-w-xl font-medium">
            "Veja sua evolução, acompanhe seus pontos semanais e inspire-se na consistência de outros alunos da comunidade."
          </p>
        </div>

        {/* 3 Key Header Badges */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 w-full lg:w-auto">
          
          {/* Current League */}
          <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-[#111425]/90 border border-cyan-500/30 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Liga Atual</span>
            </span>
            <p className="text-base font-black text-cyan-300 flex items-center gap-1.5 whitespace-nowrap">
              <span>{leagueIcon}</span>
              <span>{league}</span>
            </p>
          </div>

          {/* User Rank */}
          <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-[#111425]/90 border border-purple-500/30 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Minha Posição
            </span>
            <p className="text-base font-black text-purple-300 flex items-center gap-1">
              <span className="text-lg">#{currentRank}</span>
              <span className="text-xs font-semibold text-emerald-400">↑ Top 5%</span>
            </p>
          </div>

          {/* Weekly XP */}
          <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-[#111425]/90 border border-amber-500/30 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pontos da Semana
            </span>
            <p className="text-base font-black text-amber-400 flex items-center gap-1">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>{weeklyXp} XP</span>
            </p>
          </div>

        </div>

      </div>

      {/* Season Timer Bar */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[#1e243c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Temporada Semanal: Encerra em <strong className="text-slate-200">{seasonEndsIn}</strong></span>
        </div>
        <span className="text-[11px] text-purple-300 font-semibold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
          Os 5 primeiros avançam para a próxima liga 🚀
        </span>
      </div>
    </div>
  );
}
