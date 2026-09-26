import React from 'react';
import { Crown, Zap, Flame, Sparkles, Trophy, ShieldCheck, Mail, Calendar } from 'lucide-react';
import XPBar from '../gamification/XPBar';
import LevelBadge from '../gamification/LevelBadge';

export default function ProfileHeader({
  student,
  xp = 2450,
  streak = 12,
  currentLevel = { level: 2, title: "Music Learner", icon: "🎵", minXp: 1000, maxXp: 3000 },
  nextLevel = { level: 3, title: "Conversation Builder", icon: "💬", minXp: 3000, maxXp: 6000 },
  levelProgress = 72,
  xpToNextLevel = 550
}) {
  const {
    name = "João Silva",
    email = "joao.silva@magicenglish.com",
    role = "Membro VIP Pro",
    avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    joinDate = "Membro desde Agosto de 2026",
    motto = "Continue evoluindo no seu ritmo.",
    rankingInfo = { league: "Liga Diamante", tier: "Top 5%", currentRank: 4 }
  } = student || {};

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/35 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/25 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        
        {/* Left: Avatar & Identity Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-[2.5px] bg-gradient-to-tr from-purple-500 via-indigo-500 to-amber-400 shadow-2xl shadow-purple-600/30">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full rounded-[22px] object-cover"
              />
            </div>
            
            {/* VIP Crown Medallion */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-[#121526]">
              <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/25 to-blue-500/25 text-purple-200 border border-purple-500/40">
                {role}
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {rankingInfo.league} • #{rankingInfo.currentRank}
              </span>
            </div>

            {/* Level & Streak Quick Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <LevelBadge
                level={currentLevel.level}
                title={currentLevel.title}
                icon={currentLevel.icon}
                variant="avatar-tag"
              />

              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {streak} Dias Seguidos
              </span>
            </div>

            {/* Motto / Phrase */}
            <p className="text-xs sm:text-sm text-slate-300 italic font-medium pt-1">
              "{motto}"
            </p>
          </div>
        </div>

        {/* Right: XP & Next Level Progress Card */}
        <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#101322]/90 border border-[#222842] space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="text-base">{currentLevel.icon}</span>
              <span>Nível {currentLevel.level} • {currentLevel.title}</span>
            </div>
            <span className="text-amber-400 font-black flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              {xp.toLocaleString('pt-BR')} XP
            </span>
          </div>

          <XPBar
            currentXp={xp}
            minXp={currentLevel.minXp}
            maxXp={currentLevel.maxXp}
            progress={levelProgress}
            size="md"
            showLabels={false}
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{levelProgress}% concluído</span>
            <span className="text-purple-300 font-semibold">
              Faltam +{xpToNextLevel} XP para Nível {nextLevel ? nextLevel.level : 'Max'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
