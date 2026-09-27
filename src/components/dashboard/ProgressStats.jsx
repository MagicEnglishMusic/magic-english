import React from 'react';
import { Flame, TrendingUp, Zap, Award } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';

export default function ProgressStats() {
  const { streak = 0, xp = 0, currentLevel = {}, levelProgress = 0, xpToNextLevel = 0 } = useGamification();

  const safeStreak = Number(streak) || 0;
  const safeXp = Number(xp) || 0;
  const safeLevel = currentLevel?.level ?? 1;
  const safeIcon = currentLevel?.icon || '🌱';
  const safeTitle = currentLevel?.title || 'Iniciante';
  const safeProgress = Number.isFinite(levelProgress) ? Math.min(100, Math.max(0, levelProgress)) : 0;
  const safeXpToNext = Number(xpToNextLevel) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Sequência de Dias */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-[#131627] to-[#0e101d] border border-amber-500/20 hover:border-amber-500/40 transition-all group shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sequência de Dias
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">{safeStreak}</span>
          <span className="text-xs font-medium text-amber-400">dias consecutivos 🔥</span>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Pratique hoje para manter seu ritmo e dobrar seus pontos de bônus!
        </p>
      </div>

      {/* 2. Progresso do Nível */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-[#131627] to-[#0e101d] border border-purple-500/20 hover:border-purple-500/40 transition-all group shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Nível Atual
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm text-lg">
            {safeIcon}
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white">Nível {safeLevel}</span>
          <span className="text-xs font-medium text-purple-400">{safeTitle}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-[#1c2033] h-2 rounded-full overflow-hidden p-[1px]">
          <div
            className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 h-full rounded-full transition-all duration-1000 shadow-sm shadow-purple-500"
            style={{ width: `${safeProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Magic XP */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-[#131627] to-[#0e101d] border border-blue-500/20 hover:border-blue-500/40 transition-all group shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Magic XP Total
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white">{safeXp.toLocaleString('pt-BR')}</span>
          <span className="text-xs font-semibold text-amber-400">XP</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-300 font-medium">{safeProgress}% concluído</span>
          <span className="text-[11px] text-slate-500">Próximo: +{safeXpToNext} XP</span>
        </div>
      </div>
    </div>
  );
}
