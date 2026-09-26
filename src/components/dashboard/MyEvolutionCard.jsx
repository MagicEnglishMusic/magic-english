import React from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Crown, 
  Target,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import XPBar from '../gamification/XPBar';
import LevelBadge from '../gamification/LevelBadge';

export default function MyEvolutionCard({ onOpenEvolutionHub }) {
  const {
    xp,
    streak,
    currentLevel,
    nextLevel,
    levelProgress,
    xpToNextLevel,
    dailyChallenges,
    claimDailyChallenge
  } = useGamification();

  const claimableChallenge = dailyChallenges.find((c) => c.completed && !c.claimed);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161a2e] via-[#111322] to-[#0a0c16] border border-purple-500/30 p-6 sm:p-7 shadow-2xl group">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl group-hover:bg-purple-600/25 transition-all pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#20253d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 p-[1.5px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0d0f1b] rounded-[14px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
              Jornada de Aprendizado
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Minha Evolução
            </h3>
          </div>
        </div>

        {/* View all achievements CTA */}
        <button
          onClick={onOpenEvolutionHub}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-purple-300 hover:text-white bg-purple-500/15 hover:bg-purple-500/25 px-3.5 py-2 rounded-xl border border-purple-500/30 transition-all cursor-pointer self-start sm:self-auto group/btn"
        >
          <span>Ver Todas as Conquistas</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
        
        {/* 1. Nível Atual */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-[#1f243b] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#181c30] border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
            {currentLevel.icon}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Nível {currentLevel.level}
            </span>
            <h4 className="text-sm font-black text-white truncate">
              {currentLevel.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              "{currentLevel.subtitle}"
            </p>
          </div>
        </div>

        {/* 2. Magic XP Bar */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-[#1f243b] space-y-2.5 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Magic XP
            </span>
            <span className="text-white font-extrabold">
              <span className="text-amber-400">{xp.toLocaleString('pt-BR')}</span>
              <span className="text-slate-500"> / {currentLevel.maxXp.toLocaleString('pt-BR')} XP</span>
            </span>
          </div>

          <XPBar
            currentXp={xp}
            minXp={currentLevel.minXp}
            maxXp={currentLevel.maxXp}
            progress={levelProgress}
            size="sm"
            showLabels={false}
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{levelProgress}% para Nível {nextLevel ? nextLevel.level : 'Max'}</span>
            <span className="text-purple-300 font-medium">+{xpToNextLevel} XP restante</span>
          </div>
        </div>

        {/* 3. Sequência Diária */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md flex-shrink-0">
              <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sequência
              </span>
              <h4 className="text-sm font-black text-amber-300">
                {streak} Dias Seguidos 🔥
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ritmo ativo hoje ✓
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Objective Hint & Daily Quest Quick Claim */}
      <div className="relative z-10 mt-5 pt-4 border-t border-[#1d2238] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] uppercase">
            Próximo Objetivo
          </span>
          <span className="font-semibold text-slate-200">
            "Complete mais uma música para subir de nível."
          </span>
        </div>

        {claimableChallenge && (
          <button
            onClick={() => claimDailyChallenge(claimableChallenge.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold cursor-pointer animate-pulse transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resgatar Missão: +{claimableChallenge.rewardXp} XP</span>
          </button>
        )}
      </div>
    </section>
  );
}
