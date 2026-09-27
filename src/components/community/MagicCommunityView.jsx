import React from 'react';
import { Sparkles } from 'lucide-react';
import CommunityHeader from './CommunityHeader';
import WeeklyChallenge from './WeeklyChallenge';
import SongChallenge from './SongChallenge';
import CommunityFeed from './CommunityFeed';
import ConversationRoom from './ConversationRoom';
import CommunityGroups from './CommunityGroups';
import UserImpactCard from './UserImpactCard';
import { 
  communityStats, 
  weeklyChallengeData, 
  songOfTheWeekData, 
  conversationRoomData, 
  communityGroupsData, 
  userImpactData, 
  weeklyHighlightsData, 
  initialCommunityFeed 
} from '../../data/communityData';

export default function MagicCommunityView({ onOpenClassroom, onOpenMusicalPractice }) {
  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300 pb-20">
      
      {/* 1. Header da Comunidade */}
      <CommunityHeader stats={communityStats} />

      {/* 2. Grid de Destaques: Desafio da Semana (8 Cols) & Música da Semana (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex">
          <div className="w-full">
            <WeeklyChallenge 
              challenge={weeklyChallengeData}
              onStartChallenge={() => onOpenMusicalPractice && onOpenMusicalPractice()}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <SongChallenge 
              song={songOfTheWeekData}
              onPlaySong={() => onOpenMusicalPractice && onOpenMusicalPractice()}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Center Row: Feed de Evolução (7 Cols) & Conversation Room + Meu Impacto (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Feed de Evolução (Substituído por Em Breve até integração com banco) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#111425] border border-[#1e233b] text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-inner">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Em Breve
              </span>
              <h3 className="text-xl font-black text-white">
                Feed da Comunidade Chegando!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Estamos preparando um espaço exclusivo para você interagir com outros alunos, compartilhar suas vitórias, trocar dicas e praticar conversação.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Conversation Room & Meu Impacto (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ConversationRoom data={conversationRoomData} />
          <UserImpactCard 
            impact={userImpactData}
            weeklyHighlights={weeklyHighlightsData}
          />
        </div>

      </div>

      {/* 4. Grupos de Aprendizado */}
      <CommunityGroups groups={communityGroupsData} />

    </div>
  );
}
