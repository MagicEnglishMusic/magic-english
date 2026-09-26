import React, { useState } from 'react';
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
import SpecialRankingCard from './SpecialRankingCard';
import { 
  LEAGUES_LIST, 
  CURRENT_USER_RANKING, 
  LEADERBOARDS, 
  SPECIAL_RANKINGS 
} from '../../data/rankingData';
import { useGamification } from '../../context/GamificationContext';

export default function MagicRankingView({ onContinueStudy }) {
  const { xp, streak, currentLevel } = useGamification();
  const [activeFilter, setActiveFilter] = useState('weekly'); // 'weekly' | 'monthly' | 'allTime'

  const currentLeaderboard = LEADERBOARDS[activeFilter] || LEADERBOARDS.weekly;

  const filterLabels = {
    weekly: "da Semana",
    monthly: "do Mês",
    allTime: "Geral da Comunidade"
  };

  const dynamicUserRanking = {
    ...CURRENT_USER_RANKING,
    totalXp: xp,
    streak: streak,
    level: `Nível ${currentLevel.level} • ${currentLevel.title}`
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300 pb-24">
      
      {/* 1. Header do Ranking */}
      <RankingHeader
        league={CURRENT_USER_RANKING.league}
        leagueIcon={CURRENT_USER_RANKING.leagueIcon}
        currentRank={CURRENT_USER_RANKING.rank}
        weeklyXp={CURRENT_USER_RANKING.weeklyXp}
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
          leaderboard={currentLeaderboard}
          filterLabel={filterLabels[activeFilter]}
        />
      </div>

      {/* 4. Sistema de Ligas */}
      <LeagueBadge
        leagues={LEAGUES_LIST}
        activeLeagueName={CURRENT_USER_RANKING.league}
      />

      {/* 5. Categorias Especiais */}
      <SpecialRankingCard
        categories={SPECIAL_RANKINGS}
      />

      {/* 6. Sticky Bottom Banner "Você está aqui" */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-4xl p-3.5 sm:p-4 rounded-2xl bg-[#121526]/95 backdrop-blur-xl border border-purple-500/50 shadow-2xl shadow-purple-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-600/40 flex-shrink-0">
            #{CURRENT_USER_RANKING.rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">Você está aqui no Ranking</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> ↑ Subiu {CURRENT_USER_RANKING.positionsGained} posições
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Faltam apenas <strong className="text-amber-400">{CURRENT_USER_RANKING.xpToNextRank} XP</strong> para alcançar o Top 3 da semana.
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
