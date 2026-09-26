import React from 'react';
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
        
        {/* Left Column: Feed de Evolução (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <CommunityFeed posts={initialCommunityFeed} />
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
