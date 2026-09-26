import React from 'react';
import { Trophy, Medal, Flame, Zap, TrendingUp, TrendingDown, Minus, Crown, Sparkles } from 'lucide-react';

export default function LeaderboardTable({
  leaderboard = [],
  filterLabel = "da Semana",
  className = ""
}) {
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const getRankMedal = (rank) => {
    if (rank === 1) return { icon: "🥇", label: "1º", bg: "from-amber-500 to-yellow-600", text: "text-amber-300" };
    if (rank === 2) return { icon: "🥈", label: "2º", bg: "from-slate-300 to-slate-500", text: "text-slate-200" };
    if (rank === 3) return { icon: "🥉", label: "3º", bg: "from-amber-700 to-amber-900", text: "text-amber-500" };
    return null;
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Comunidade Ativa
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>🔥 Destaques {filterLabel}</span>
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Atualizado a cada 1 hora
        </span>
      </div>

      {/* Top 3 Visual Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {top3.map((user, idx) => {
          const medal = getRankMedal(user.rank);
          const isGold = user.rank === 1;

          return (
            <div
              key={user.rank}
              className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isGold
                  ? 'bg-gradient-to-b from-[#1f1a10] via-[#16141c] to-[#0d0f1b] border-amber-500/50 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400/30 md:-translate-y-2'
                  : 'bg-gradient-to-b from-[#15182a] to-[#0c0e18] border-purple-500/30 shadow-lg'
              }`}
            >
              {/* Gold Top Light */}
              {isGold && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{medal.icon}</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    isGold
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#1b2038] text-slate-300 border-slate-700'
                  }`}>
                    {user.tag || `${user.rank}º Lugar`}
                  </span>
                </div>

                {/* Avatar & Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-14 h-14 rounded-2xl object-cover ring-2 ${
                        isGold ? 'ring-amber-400 shadow-md shadow-amber-500/40' : 'ring-purple-500/40'
                      }`}
                    />
                    {isGold && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-sm">
                        <Crown className="w-3 h-3 fill-slate-950" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-base font-black text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {user.level}
                    </p>
                    <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
                      <span>{user.leagueIcon}</span>
                      <span>{user.league}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Pill */}
              <div className="pt-4 mt-4 border-t border-[#1e2338] flex items-center justify-between text-xs relative z-10">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  {user.streak} dias
                </span>
                <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  {user.xp.toLocaleString('pt-BR')} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Remaining List */}
      <div className="space-y-2 pt-2">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-[#1b2034]">
          <span className="col-span-1 text-center">Posição</span>
          <span className="col-span-5">Aluno & Nível</span>
          <span className="col-span-2">Liga</span>
          <span className="col-span-2 text-center">Sequência</span>
          <span className="col-span-2 text-right">Magic XP</span>
        </div>

        {remaining.map((user) => {
          const isMe = user.isCurrentUser;

          return (
            <div
              key={user.rank}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center ${
                isMe
                  ? 'bg-gradient-to-r from-purple-950/60 via-[#1c1f38] to-[#12162a] border-purple-400/80 shadow-xl shadow-purple-950/50 ring-1 ring-purple-400/50'
                  : 'bg-[#111322] border-[#1d2238] hover:border-slate-700'
              }`}
            >
              {/* Rank & Trend */}
              <div className="col-span-1 flex items-center justify-center gap-1.5 w-full sm:w-auto">
                <span className={`text-sm font-black ${isMe ? 'text-purple-300 font-extrabold' : 'text-slate-300'}`}>
                  #{user.rank}
                </span>
                {user.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : user.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                ) : (
                  <Minus className="w-3 h-3 text-slate-500" />
                )}
              </div>

              {/* Student Info */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                    isMe ? 'ring-purple-400' : 'ring-slate-700'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs sm:text-sm font-black truncate ${isMe ? 'text-purple-200' : 'text-white'}`}>
                      {user.name}
                    </p>
                    {isMe && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user.level}
                  </p>
                </div>
              </div>

              {/* League */}
              <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span>{user.leagueIcon}</span>
                <span className="truncate">{user.league}</span>
              </div>

              {/* Streak */}
              <div className="col-span-2 hidden sm:flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{user.streak}d</span>
              </div>

              {/* XP */}
              <div className="col-span-2 flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto">
                <span className="sm:hidden text-xs text-slate-400">Pontuação:</span>
                <span className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  {user.xp.toLocaleString('pt-BR')} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
