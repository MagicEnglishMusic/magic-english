import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Crown,
  Target
} from 'lucide-react';
import RankingHeader from './RankingHeader';
import UserRankCard from './UserRankCard';
import RankingFilter from './RankingFilter';
import LeaderboardTable from './LeaderboardTable';
import LeagueBadge from './LeagueBadge';
import { 
  LEAGUES_LIST, 
  CURRENT_USER_RANKING 
} from '../../data/rankingData';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { rankingService } from '../../services/rankingService';

export default function MagicRankingView({ onContinueStudy }) {
  const { user } = useAuth();
  const { xp, streak, currentLevel } = useGamification();
  const [activeFilter, setActiveFilter] = useState('weekly'); // 'weekly' | 'monthly' | 'allTime'
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filterLabels = {
    weekly: "da Semana",
    monthly: "do Mês",
    allTime: "Geral da Comunidade"
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const { data, error } = await rankingService.getRankingLeaderboard();
        if (isMounted) {
          if (!error && data) {
            setLeaderboard(data);
          } else {
            setLeaderboard([]);
          }
        }
      } catch (err) {
        if (isMounted) setLeaderboard([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const getLeagueInfo = (userXp) => {
    if (userXp >= 15000) return { league: "Liga Magic", leagueIcon: "👑", tier: "Top 1%" };
    if (userXp >= 8000) return { league: "Liga Diamante", leagueIcon: "💎", tier: "Top 5%" };
    if (userXp >= 4000) return { league: "Liga Ouro", leagueIcon: "🥇", tier: "Top 15%" };
    if (userXp >= 1500) return { league: "Liga Prata", leagueIcon: "🥈", tier: "Top 35%" };
    return { league: "Liga Bronze", leagueIcon: "🌱", tier: "Iniciante" };
  };

  const userLeague = getLeagueInfo(xp);

  // Find user's real rank in the fetched leaderboard
  const userRankEntry = leaderboard.find((item) => item.userId === user?.id || item.name === user?.name);
  const userCalculatedRank = userRankEntry ? userRankEntry.rank : (xp > 0 ? leaderboard.length + 1 : '--');

  const dynamicUserRanking = {
    ...CURRENT_USER_RANKING,
    name: user?.name ? `${user.name} (Você)` : 'Você',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    totalXp: xp,
    weeklyXp: xp,
    streak: streak,
    level: `Nível ${currentLevel.level} • ${currentLevel.title}`,
    league: userLeague.league,
    leagueIcon: userLeague.leagueIcon,
    rank: userCalculatedRank,
    positionsGained: 0,
    nextGoal: xp === 0 ? "Você ainda não está no ranking — comece a praticar para pontuar!" : `Faltam ${Math.max(50, 200 - (xp % 200))} XP para subir de posição.`,
    xpToNextRank: Math.max(50, 200 - (xp % 200))
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300 pb-24">
      
      {/* 1. Header do Ranking */}
      <RankingHeader
        league={dynamicUserRanking.league}
        leagueIcon={dynamicUserRanking.leagueIcon}
        currentRank={dynamicUserRanking.rank}
        weeklyXp={dynamicUserRanking.weeklyXp}
        seasonEndsIn={CURRENT_USER_RANKING.seasonEndsIn}
      />

      {/* 2. Meu Desempenho */}
      <UserRankCard
        userRanking={dynamicUserRanking}
        onContinueStudy={onContinueStudy}
      />

      {/* 3. Filtros & Tabela do Ranking Semanal / Mensal / Geral */}
      <div className="space-y-4">
        <RankingFilter
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
        />

        <LeaderboardTable
          leaderboard={leaderboard}
          filterLabel={filterLabels[activeFilter]}
        />
      </div>

      {/* 4. Sistema de Ligas */}
      <LeagueBadge
        leagues={LEAGUES_LIST}
        activeLeagueName={dynamicUserRanking.league}
      />

      {/* 5. Sticky Bottom Banner "Você está aqui" */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-4xl p-3.5 sm:p-4 rounded-2xl bg-[#121526]/95 backdrop-blur-xl border border-purple-500/50 shadow-2xl shadow-purple-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-600/40 flex-shrink-0">
            {dynamicUserRanking.rank === '--' ? '🌱' : `#${dynamicUserRanking.rank}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">Você está aqui no Ranking</span>
              <span className="text-[10px] text-purple-300 font-bold bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-0.5">
                {dynamicUserRanking.rank === '--' ? 'Sem classificação' : `Posição #${dynamicUserRanking.rank}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {dynamicUserRanking.nextGoal}
            </p>
          </div>
        </div>

        <button
          onClick={onContinueStudy}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-600/30 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
        >
          <span>Estudar Agora (+XP)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
