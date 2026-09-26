import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { studentProfileData } from '../../data/profileData';
import ProfileHeader from './ProfileHeader';
import UserStatsCard from './UserStatsCard';
import JourneyProgress from './JourneyProgress';
import BadgeGallery from './BadgeGallery';
import SongCollection from './SongCollection';
import ModuleProgressCard from './ModuleProgressCard';
import ActivityTimeline from './ActivityTimeline';
import { Trophy, Sparkles, Flame, Zap, Shield, ArrowRight } from 'lucide-react';

export default function StudentProfileView({
  onOpenSong,
  onOpenModule,
  onOpenClassroom
}) {
  const { user } = useAuth();
  const {
    xp,
    streak,
    currentLevel,
    nextLevel,
    levelProgress,
    xpToNextLevel,
    badges,
    songMasteryList
  } = useGamification();

  const isRealUser = Boolean(user && user.id !== 'std-1');

  // Combine dynamic auth profile + gamification
  const currentStudent = {
    ...studentProfileData,
    name: user?.name || studentProfileData.name,
    email: user?.email || studentProfileData.email,
    avatar: user?.avatar || studentProfileData.avatar,
    role: user?.plan ? `Membro ${user.plan}` : studentProfileData.role,
    motto: user?.objective ? `Objetivo: ${user.objective}` : studentProfileData.motto,
    joinDate: isRealUser ? "Membro recente" : studentProfileData.joinDate
  };

  const dynamicStats = {
    streakDays: streak,
    completedLessons: isRealUser ? 0 : studentProfileData.stats.completedLessons,
    masteredSongs: songMasteryList.filter((s) => s.status === 'mastered').length,
    unlockedBadges: badges.filter((b) => b.unlocked).length,
    totalStudyTime: isRealUser ? (xp > 0 ? `${Math.round(xp / 10)} min` : "0 min") : studentProfileData.stats.totalStudyTime,
    accuracyRate: isRealUser ? (xp > 0 ? "100%" : "--") : studentProfileData.stats.accuracyRate
  };

  const getLeagueInfo = (userXp) => {
    if (userXp >= 15000) return { league: "👑 Liga Magic", tier: "Top 1%" };
    if (userXp >= 8000) return { league: "💎 Liga Diamante", tier: "Top 5%" };
    if (userXp >= 4000) return { league: "🥇 Liga Ouro", tier: "Top 15%" };
    if (userXp >= 1500) return { league: "🥈 Liga Prata", tier: "Top 35%" };
    return { league: "🌱 Liga Bronze", tier: "Iniciante" };
  };

  const userLeague = getLeagueInfo(xp);

  const rankingInfo = isRealUser ? {
    league: userLeague.league,
    tier: xp > 0 ? userLeague.tier : "Iniciante",
    currentRank: xp > 0 ? 15 : 99,
    weeklyPoints: xp,
    seasonEndsIn: "3 dias"
  } : studentProfileData.rankingInfo;

  const musicCollection = isRealUser ? studentProfileData.musicCollection.map((s) => ({
    ...s,
    status: 'not_started',
    statusLabel: 'Não iniciada',
    progress: 0
  })) : studentProfileData.musicCollection;

  const modulesProgress = isRealUser ? studentProfileData.modulesProgress.map((m, idx) => ({
    ...m,
    status: idx === 0 ? 'in_progress' : 'locked',
    statusLabel: idx === 0 ? 'Disponível' : 'Bloqueado',
    progress: 0,
    completedLessons: 0
  })) : studentProfileData.modulesProgress;

  const activityTimeline = isRealUser ? [] : studentProfileData.activityTimeline;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
      
      {/* 1. Profile Header Banner */}
      <ProfileHeader
        student={currentStudent}
        xp={xp}
        streak={streak}
        currentLevel={currentLevel}
        nextLevel={nextLevel}
        levelProgress={levelProgress}
        xpToNextLevel={xpToNextLevel}
      />

      {/* 2. Key Student Statistics */}
      <UserStatsCard stats={dynamicStats} />

      {/* 3. Future Ranking Teaser Card (Magic Ranking Preparation) */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/30 via-[#181c30] to-purple-950/30 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md flex-shrink-0">
            <Trophy className="w-6 h-6 fill-amber-400/20 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                Magic Ranking
              </span>
              <span className="text-xs text-slate-400 font-medium">Temporada Ativa</span>
            </div>
            <h4 className="text-base font-black text-white mt-0.5">
              {rankingInfo.league} • Posição #{rankingInfo.currentRank} ({rankingInfo.tier})
            </h4>
            <p className="text-xs text-slate-400">
              {rankingInfo.weeklyPoints} pontos acumulados nesta semana. Encerramento em {rankingInfo.seasonEndsIn}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-xs text-amber-300 bg-[#121526] px-3 py-1.5 rounded-xl border border-amber-500/30 font-bold">
            {isRealUser ? (xp > 0 ? "⚡ Ativo na Liga" : "🌱 Iniciando Jornada") : "⚡ Top 5 da Liga"}
          </span>
        </div>
      </div>

      {/* 4. Minha Jornada (6 Levels Progression Roadmap) */}
      <JourneyProgress
        journeySteps={studentProfileData.journeySteps}
        currentLevelNumber={currentLevel.level}
      />

      {/* 5. Minhas Conquistas (Badges Gallery) */}
      <BadgeGallery badges={badges} />

      {/* 6. Minhas Músicas (Personal Music Library) */}
      <SongCollection
        songs={musicCollection}
        onOpenSong={onOpenSong}
      />

      {/* 7. Meus Módulos (Course Modules Progress) */}
      <ModuleProgressCard
        modules={modulesProgress}
        onOpenModule={onOpenModule}
      />

      {/* 8. Histórico de Atividades (Timeline) */}
      <ActivityTimeline activities={activityTimeline} />

    </div>
  );
}
