import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Crown, 
  Sparkles, 
  Award, 
  Music, 
  CheckCircle2, 
  Target, 
  Calendar,
  Layers,
  Star,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { LEVELS_CONFIG } from '../../data/gamificationData';
import XPBar from './XPBar';
import LevelBadge from './LevelBadge';
import AchievementCard from './AchievementCard';
import StreakCalendar from './StreakCalendar';
import DailyChallenge from './DailyChallenge';
import SongMasteryWidget from './SongMasteryWidget';
import SongMasteryBadge from './SongMasteryBadge';

export default function GamificationHubView({ onOpenLesson, onOpenSong }) {
  const { user } = useAuth();
  const {
    xp,
    streak,
    weeklyDays,
    currentLevel,
    nextLevel,
    levelProgress,
    xpToNextLevel,
    badges,
    dailyChallenges,
    songMasteryList,
    claimDailyChallenge,
    updateSongMasteryStep
  } = useGamification();

  const [activeTab, setActiveTab] = useState('badges'); // 'badges' | 'levels' | 'mastery' | 'daily'
  const [badgeCategory, setBadgeCategory] = useState('all'); // 'all' | 'Música' | 'Aulas' | 'Foco' | 'Trilhas'

  const studentName = user?.name || 'Aluno Magic';
  const studentAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

  const filteredBadges = badgeCategory === 'all' 
    ? (badges || [])
    : (badges || []).filter((b) => (b?.category || '').toLowerCase() === (badgeCategory || '').toLowerCase());

  const masteredSongsCount = (songMasteryList || []).filter((s) => s?.status === 'mastered').length;
  const unlockedBadgesCount = (badges || []).filter((b) => b?.unlocked).length;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
      
      {/* 1. Hero Profile & Gamification Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/30 shadow-2xl">
        {/* Glow ambient lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* User Info & Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={studentAvatar}
                alt={studentName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-purple-500/40 shadow-xl group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-[#121526]">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {studentName}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Aluno Pro
                </span>
              </div>

              {/* Current Level Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <LevelBadge
                  level={currentLevel?.level || 1}
                  title={currentLevel?.title || 'First Steps'}
                  icon={currentLevel?.icon || '🌱'}
                  variant="avatar-tag"
                />

                <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {Number(streak) || 0} Dias Seguidos
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                "Cada aula, música e prática me aproxima da fluência."
              </p>
            </div>
          </div>

          {/* XP & Level Summary Card */}
          <div className="w-full lg:w-80 p-4 rounded-2xl bg-[#101322]/80 border border-[#202640] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Nível {currentLevel?.level || 1} • {currentLevel?.title || 'First Steps'}</span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-400" />
                {Number(xp) || 0} XP
              </span>
            </div>

            <XPBar
              currentXp={Number(xp) || 0}
              minXp={currentLevel?.minXp || 0}
              maxXp={currentLevel?.maxXp || 1000}
              progress={levelProgress || 0}
              size="md"
              showLabels={false}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{levelProgress || 0}% concluído</span>
              <span>Faltam {xpToNextLevel || 0} XP para Nível {nextLevel ? nextLevel.level : 'Max'}</span>
            </div>
          </div>
        </div>

        {/* 4 Key Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#22273e] relative z-10">
          <div className="p-3 rounded-xl bg-[#14172a] border border-[#232942]">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Total XP
            </span>
            <p className="text-lg font-black text-white mt-0.5">{(Number(xp) || 0).toLocaleString('pt-BR')}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#14172a] border border-[#232942]">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" /> Sequência
            </span>
            <p className="text-lg font-black text-amber-400 mt-0.5">{Number(streak) || 0} Dias</p>
          </div>

          <div className="p-3 rounded-xl bg-[#14172a] border border-[#232942]">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-400" /> Conquistas
            </span>
            <p className="text-lg font-black text-purple-300 mt-0.5">{unlockedBadgesCount} / {(badges || []).length}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#14172a] border border-[#232942]">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Music className="w-3 h-3 text-emerald-400" /> Músicas Dominadas
            </span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{masteredSongsCount} / {(songMasteryList || []).length}</p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1c2035] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#131627]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Conquistas ({unlockedBadgesCount}/{badges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'levels'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#131627]'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Trilha de Níveis (1 ao 6)</span>
        </button>

        <button
          onClick={() => setActiveTab('mastery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'mastery'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#131627]'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Domínio de Músicas</span>
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#131627]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Desafios & Sequência</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: Badges Gallery */}
      {activeTab === 'badges' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'Música', 'Aulas', 'Foco', 'Pronúncia', 'Módulos', 'Trilhas'].map((cat) => (
              <button
                key={cat}
                onClick={() => setBadgeCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  badgeCategory === cat
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-[#121524] text-slate-400 hover:text-white border border-transparent hover:border-slate-700'
                }`}
              >
                {cat === 'all' ? 'Todas as Conquistas' : cat}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <AchievementCard
                key={badge.id}
                badge={badge}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Levels Progression Ladder (Levels 1 to 6) */}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#121524] border border-[#1f243a] flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Sua Jornada de Fluência
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acumule ⭐ Magic XP assistindo aulas, cantando músicas e praticando pronúncia para alcançar o topo.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              6 Níveis Oficiais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LEVELS_CONFIG.map((lvl) => {
              const isCurrent = currentLevel.level === lvl.level;
              const isPassed = currentLevel.level > lvl.level;
              const isFuture = currentLevel.level < lvl.level;

              return (
                <div
                  key={lvl.level}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-gradient-to-b from-[#1c2038] via-[#14172a] to-[#0c0e18] border-purple-500 shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/40'
                      : isPassed
                      ? 'bg-[#121525] border-emerald-500/30'
                      : 'bg-[#0f111d] border-slate-800/70 opacity-60'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-purple-600/40 animate-pulse">
                      Nível Atual
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#191d30] border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
                        {lvl.icon}
                      </div>

                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                        isPassed
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isCurrent
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/50'
                      }`}>
                        {isPassed ? 'Concluído ✓' : isCurrent ? 'Em Progresso' : 'Bloqueado'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Nível {lvl.level}
                      </span>
                      <h4 className="text-base font-black text-white mt-0.5">
                        {lvl.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        "{lvl.subtitle}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#1d2238] flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">XP Necessário:</span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      {(Number(lvl?.minXp) || 0).toLocaleString('pt-BR')} - {(Number(lvl?.maxXp) || 0).toLocaleString('pt-BR')} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Song Mastery Center */}
      {activeTab === 'mastery' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#121524] border border-[#1f243a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                Status de Domínio das Magic Songs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Uma canção é considerada 🟢 <strong>Dominada</strong> ao completar as 5 etapas: Vídeo, Áudio, Tradução Reversa, Cantar Junto e Desafio Final (+100 XP).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <SongMasteryBadge status="mastered" size="sm" />
              <span className="text-slate-400 font-medium">{masteredSongsCount} dominadas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {songMasteryList.map((song) => (
              <SongMasteryWidget
                key={song.songId}
                songMastery={song}
                onToggleStep={(songId, stepKey, val) => updateSongMasteryStep(songId, stepKey, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Daily Challenges & Streak */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <DailyChallenge
            challenges={dailyChallenges}
            onClaim={(id) => claimDailyChallenge(id)}
          />

          <StreakCalendar
            streak={streak}
            weeklyDays={weeklyDays}
          />
        </div>
      )}

    </div>
  );
}
