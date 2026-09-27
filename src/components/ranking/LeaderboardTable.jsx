import React from 'react';
import { Trophy, Medal, Flame, Zap, TrendingUp, TrendingDown, Minus, Crown, Sparkles } from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

export default function LeaderboardTable({
  leaderboard = [],
  filterLabel = "da Semana",
  className = ""
}) {
  const top3 = (leaderboard || []).slice(0, 3);
  const remaining = (leaderboard || []).slice(3);

  const getRankMedal = (rank, fallbackIndex = 0) => {
    if (rank === 1) return { icon: "🥇", label: "1º", bg: "from-amber-500 to-yellow-600", text: "text-amber-300" };
    if (rank === 2) return { icon: "🥈", label: "2º", bg: "from-slate-300 to-slate-500", text: "text-slate-200" };
    if (rank === 3) return { icon: "🥉", label: "3º", bg: "from-amber-700 to-amber-900", text: "text-amber-500" };
    return { icon: "🏅", label: `${rank || fallbackIndex + 1}º`, bg: "from-purple-500 to-indigo-600", text: "text-purple-300" };
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

      {(!leaderboard || leaderboard.length === 0) ? (
        <div className="py-12 px-4 text-center space-y-3 bg-[#0d0f1a] rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Nenhum aluno classificado ainda</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Seja o primeiro a completar aulas em vídeo e práticas musicais para liderar o ranking!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Visual Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {top3.map((user, idx) => {
          const userRank = user?.rank ?? (idx + 1);
          const medal = getRankMedal(userRank, idx);
          const isGold = userRank === 1;
          const userXp = Number(user?.xp ?? user?.weeklyXp ?? user?.totalXp ?? 0);
          const userStreak = Number(user?.streak ?? 0);
          const userName = user?.name || 'Aluno Magic';
          const userAvatar = user?.avatar || DEFAULT_AVATAR;
          const userLevel = user?.level || 'Nível 1';
          const userLeague = user?.league || 'Liga Bronze';
          const userLeagueIcon = user?.leagueIcon || '🌱';
          const userTag = user?.tag || `${userRank}º Lugar`;

          return (
            <div
              key={user?.id || userRank || idx}
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
                  <span className="text-2xl">{medal?.icon || '🏅'}</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    isGold
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#1b2038] text-slate-300 border-slate-700'
                  }`}>
                    {userTag}
                  </span>
                </div>

                {/* Avatar & Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={userAvatar}
                      alt={userName}
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
                      {userName}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {userLevel}
                    </p>
                    <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
                      <span>{userLeagueIcon}</span>
                      <span>{userLeague}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Pill */}
              <div className="pt-4 mt-4 border-t border-[#1e2338] flex items-center justify-between text-xs relative z-10">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  {userStreak} dias
                </span>
                <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  {userXp.toLocaleString('pt-BR')} XP
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

        {remaining.map((user, idx) => {
          const userRank = user?.rank ?? (idx + 4);
          const isMe = Boolean(user?.isCurrentUser);
          const userXp = Number(user?.xp ?? user?.weeklyXp ?? user?.totalXp ?? 0);
          const userStreak = Number(user?.streak ?? 0);
          const userName = user?.name || 'Aluno Magic';
          const userAvatar = user?.avatar || DEFAULT_AVATAR;
          const userLevel = user?.level || 'Nível 1';
          const userLeague = user?.league || 'Liga Bronze';
          const userLeagueIcon = user?.leagueIcon || '🌱';
          const userTrend = user?.trend || 'stable';

          return (
            <div
              key={user?.id || userRank || idx}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center ${
                isMe
                  ? 'bg-gradient-to-r from-purple-950/60 via-[#1c1f38] to-[#12162a] border-purple-400/80 shadow-xl shadow-purple-950/50 ring-1 ring-purple-400/50'
                  : 'bg-[#111322] border-[#1d2238] hover:border-slate-700'
              }`}
            >
              {/* Rank & Trend */}
              <div className="col-span-1 flex items-center justify-center gap-1.5 w-full sm:w-auto">
                <span className={`text-sm font-black ${isMe ? 'text-purple-300 font-extrabold' : 'text-slate-300'}`}>
                  #{userRank}
                </span>
                {userTrend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : userTrend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                ) : (
                  <Minus className="w-3 h-3 text-slate-500" />
                )}
              </div>

              {/* Student Info */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <img
                  src={userAvatar}
                  alt={userName}
                  className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                    isMe ? 'ring-purple-400' : 'ring-slate-700'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs sm:text-sm font-black truncate ${isMe ? 'text-purple-200' : 'text-white'}`}>
                      {userName}
                    </p>
                    {isMe && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {userLevel}
                  </p>
                </div>
              </div>

              {/* League */}
              <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span>{userLeagueIcon}</span>
                <span className="truncate">{userLeague}</span>
              </div>

              {/* Streak */}
              <div className="col-span-2 hidden sm:flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{userStreak}d</span>
              </div>

              {/* XP */}
              <div className="col-span-2 flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto">
                <span className="sm:hidden text-xs text-slate-400">Pontuação:</span>
                <span className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  {userXp.toLocaleString('pt-BR')} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

    </div>
  );
}
