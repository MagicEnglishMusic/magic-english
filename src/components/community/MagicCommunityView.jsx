import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
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
  communityGroupsData 
} from '../../data/communityData';
import { communityService } from '../../services/communityService';
import { rankingService } from '../../services/rankingService';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';

export default function MagicCommunityView({ onOpenClassroom, onOpenMusicalPractice }) {
  const { user } = useAuth();
  const { xp, streak, currentLevel } = useGamification();

  const [posts, setPosts] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState(() => communityService.getJoinedGroups(user?.id));
  const [settings, setSettings] = useState(() => communityService.getCommunitySettings());
  const [weeklyHighlights, setWeeklyHighlights] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Show Toast helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time subscribe to community settings and feed changes
  useEffect(() => {
    // 1. Initial persistent fetch from Supabase SSOT
    communityService.fetchCommunitySettings().then((remoteSettings) => {
      if (remoteSettings) setSettings(remoteSettings);
    });

    // 2. Real-time subscription for live updates
    const unsubSettings = communityService.subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    const unsubFeed = communityService.subscribeToFeed((event) => {
      if (event.type === 'post_created' && event.post) {
        setPosts((prev) => [event.post, ...prev.filter((p) => p.id !== event.post.id)]);
      } else if (event.type === 'post_deleted' && event.postId) {
        setPosts((prev) => prev.filter((p) => p.id !== event.postId));
      } else if (event.type === 'comment_added' && event.postId && event.comment) {
        setPosts((prev) => prev.map((p) => {
          if (p.id === event.postId) {
            const list = (p.commentsList || []).filter((c) => c.id !== event.comment.id);
            return {
              ...p,
              comments: list.length + 1,
              commentsList: [...list, event.comment]
            };
          }
          return p;
        }));
      } else if (event.type === 'comment_deleted' && event.postId && event.commentId) {
        setPosts((prev) => prev.map((p) => {
          if (p.id === event.postId) {
            const list = (p.commentsList || []).filter((c) => c.id !== event.commentId);
            return {
              ...p,
              comments: list.length,
              commentsList: list
            };
          }
          return p;
        }));
      }
    });

    return () => {
      unsubSettings();
      unsubFeed();
    };
  }, []);

  // Load posts and ranking highlights
  useEffect(() => {
    let isMounted = true;

    async function loadCommunity() {
      try {
        const { data: loadedPosts } = await communityService.getPosts(selectedGroupId);
        if (isMounted) {
          setPosts(loadedPosts || []);
        }

        // Fetch top rankers for weekly highlights
        const { data: rankingData } = await rankingService.getRankingLeaderboard();
        if (isMounted && rankingData && rankingData.length > 0) {
          const topHighlights = rankingData.slice(0, 3).map((r, i) => ({
            name: r.name,
            avatar: r.avatar,
            category: i === 0 ? '🏆 Líder da Semana' : i === 1 ? '🔥 Maior Sequência' : '⭐ Destaque Musical',
            stat: `${r.weeklyXp || r.xp} XP acumulados`,
            badge: r.tag || (i === 0 ? '🥇 1º Lugar' : i === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar')
          }));
          setWeeklyHighlights(topHighlights);
        }
      } catch (err) {
        console.warn('Error loading community data:', err);
      }
    }

    loadCommunity();
    return () => { isMounted = false; };
  }, [selectedGroupId, user?.id]);

  // Create Post Handler
  const handleCreatePost = async ({ title, content, type }) => {
    const { data: newPost } = await communityService.createPost({
      userId: user?.id,
      authorName: user?.name || 'Você',
      authorAvatar: user?.avatar,
      authorLevel: `Nível ${currentLevel?.level || 1}`,
      authorStreak: streak || 1,
      title,
      content,
      type,
      groupId: selectedGroupId
    });

    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
      showToast('Sua mensagem foi publicada no feed da comunidade! 🚀');
    }
  };

  // Toggle Group Join
  const handleToggleJoinGroup = (group) => {
    const res = communityService.toggleJoinGroup(user?.id, group.id);
    if (res.success) {
      setJoinedGroupIds(res.joinedGroups);
      if (res.isJoined) {
        showToast(`Você entrou no grupo "${group.name}"! Discussões do grupo agora aparecem no seu feed.`);
      } else {
        showToast(`Você saiu do grupo "${group.name}".`, 'info');
      }
    }
  };

  // Real Calculated User Impact
  const dynamicImpact = {
    congratulatedCount: posts.reduce((acc, p) => acc + (p.likes || 0), 0),
    participationsCount: joinedGroupIds.length,
    sharedAchievementsCount: posts.filter((p) => p.user_id === user?.id).length,
    reputationBadge: `Nível ${currentLevel?.level || 1} • ${currentLevel?.title || 'Iniciante'}`
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto animate-in fade-in duration-300 pb-20 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#161a32] border border-purple-500/60 shadow-2xl text-white text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span>{toastMessage.message}</span>
        </div>
      )}

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
        
        {/* Left Column: Feed de Evolução */}
        <div className="lg:col-span-7 space-y-6">
          <CommunityFeed 
            posts={posts} 
            onCreatePost={handleCreatePost}
            isPostingEnabled={settings.isPostingEnabled}
            user={user}
          />
        </div>

        {/* Right Column: Conversation Room & Meu Impacto (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ConversationRoom data={conversationRoomData} />
          <UserImpactCard 
            impact={dynamicImpact}
            weeklyHighlights={weeklyHighlights}
          />
        </div>

      </div>

      {/* 4. Grupos de Aprendizado */}
      <CommunityGroups 
        groups={communityGroupsData}
        joinedGroupIds={joinedGroupIds}
        selectedGroupId={selectedGroupId}
        onToggleJoin={handleToggleJoinGroup}
        onSelectGroup={setSelectedGroupId}
      />

    </div>
  );
}
