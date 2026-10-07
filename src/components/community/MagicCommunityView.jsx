import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import CommunityHeader from './CommunityHeader';
import WeeklyChallenge from './WeeklyChallenge';
import SongChallenge from './SongChallenge';
import CommunityFeed from './CommunityFeed';
import ConversationRoom from './ConversationRoom';
import CommunityGroups from './CommunityGroups';
import UserImpactCard from './UserImpactCard';
import { 
  communityStats, 
  songOfTheWeekData, 
  conversationRoomData, 
  communityGroupsData 
} from '../../data/communityData';
import { communityService } from '../../services/communityService';
import { rankingService } from '../../services/rankingService';
import { weeklyChallengeService } from '../../services/weeklyChallengeService';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';

export default function MagicCommunityView({ onOpenClassroom, onOpenMusicalPractice }) {
  const { user } = useAuth();
  const { xp, streak, currentLevel, addXp } = useGamification();

  const [posts, setPosts] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState(() => communityService.getJoinedGroups());
  const [settings, setSettings] = useState(() => communityService.getCommunitySettings());
  const [weeklyHighlights, setWeeklyHighlights] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  // Dynamic Weekly Challenge States
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);
  const [challengeSteps, setChallengeSteps] = useState([]);
  const [isChallengeAllCompleted, setIsChallengeAllCompleted] = useState(false);
  const [isChallengeClaimed, setIsChallengeClaimed] = useState(false);
  const [isClaimingChallengeXp, setIsClaimingChallengeXp] = useState(false);

  // Show Toast helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time subscribe to community settings and feed changes
  useEffect(() => {
    communityService.fetchCommunitySettings().then((remoteSettings) => {
      if (remoteSettings) setSettings(remoteSettings);
    });

    const unsubSettings = communityService.subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    const unsubFeed = communityService.subscribeToFeed((event) => {
      if (event.type === 'post_created' && event.post) {
        setPosts((prev) => [event.post, ...prev.filter((p) => p.id !== event.post.id)]);
      } else if (event.type === 'post_deleted' && event.postId) {
        setPosts((prev) => prev.filter((p) => p.id !== event.postId));
      } else if (event.type === 'post_updated' && event.post) {
        setPosts((prev) => prev.map((p) => (p.id === event.post.id ? { ...p, ...event.post } : p)));
      }
    });

    return () => {
      unsubSettings();
      unsubFeed();
    };
  }, []);

  // Load posts, likes, ranking highlights, and dynamic weekly challenge
  const loadCommunityData = useCallback(async () => {
    setIsLoading(true);
    setIsUnavailable(false);

    try {
      const [postsRes, likesRes, rankingRes, challengeRes] = await Promise.all([
        communityService.getPosts(selectedGroupId),
        communityService.getUserLikedPostIds(user?.id),
        rankingService.getRankingLeaderboard(),
        weeklyChallengeService.getActiveWeeklyChallenge()
      ]);

      if (postsRes.unavailable) {
        setIsUnavailable(true);
        setPosts([]);
      } else {
        const likedIds = new Set(likesRes.data || []);
        const loadedPosts = (postsRes.data || []).map((p) => ({
          ...p,
          isLiked: likedIds.has(p.id)
        }));
        setPosts(loadedPosts);
      }

      if (rankingRes && rankingRes.data && rankingRes.data.length > 0) {
        const topHighlights = rankingRes.data.slice(0, 3).map((r, i) => ({
          name: r.name,
          avatar: r.avatar,
          category: i === 0 ? '🏆 Líder da Semana' : i === 1 ? '🔥 Maior Sequência' : '⭐ Destaque Musical',
          stat: `${r.weeklyXp || r.xp} XP acumulados`,
          badge: r.tag || (i === 0 ? '🥇 1º Lugar' : i === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar')
        }));
        setWeeklyHighlights(topHighlights);
      }

      // Process Weekly Challenge
      if (challengeRes?.data) {
        const chal = challengeRes.data;
        setWeeklyChallenge(chal);
        if (user?.id) {
          const prog = await weeklyChallengeService.checkChallengeProgress(user.id, chal);
          setChallengeSteps(prog.stepsWithStatus || []);
          setIsChallengeAllCompleted(prog.isAllCompleted || false);
          setIsChallengeClaimed(prog.isClaimed || false);
        } else {
          setChallengeSteps(chal.steps || []);
          setIsChallengeAllCompleted(false);
          setIsChallengeClaimed(false);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dados da comunidade:', err);
      setIsUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, user?.id]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // Handle Weekly Challenge Claim XP
  const handleClaimWeeklyChallengeXp = async () => {
    if (!weeklyChallenge || isChallengeClaimed || isClaimingChallengeXp) return;
    setIsClaimingChallengeXp(true);
    try {
      const res = await weeklyChallengeService.claimWeeklyChallengeXp(weeklyChallenge);
      if (res.success) {
        setIsChallengeClaimed(true);
        if (addXp && res.amount) {
          await addXp(res.amount, 'weekly_magic_challenge', weeklyChallenge.week_key || weeklyChallenge.id);
        }
        showToast(`Parabéns! Você resgatou +${res.amount} XP pelo Desafio Magic da Semana! 🎉`);
      } else {
        showToast(res.message || 'Recompensa já resgatada anteriormente ou pendente.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erro ao resgatar recompensa.', 'error');
    } finally {
      setIsClaimingChallengeXp(false);
    }
  };

  // Create Post Handler
  const handleCreatePost = async ({ title, content, type }) => {
    if (!settings.isPostingEnabled || settings.status === 'maintenance') {
      showToast('A comunidade está em manutenção temporária. Novas publicações estão pausadas.', 'error');
      return;
    }

    const res = await communityService.createPost({
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

    if (res.success && res.data) {
      const newPost = {
        ...res.data,
        author: {
          name: user?.name || 'Você',
          avatar: user?.avatar,
          level: `Nível ${currentLevel?.level || 1}`,
          streak: streak || 0
        },
        likes: 0,
        comments: 0,
        commentsList: [],
        timeAgo: 'Agora'
      };
      setPosts((prev) => [newPost, ...prev]);
      showToast('Sua mensagem foi publicada no feed da comunidade! 🚀');
    } else {
      showToast('Não foi possível publicar. A comunidade pode estar temporariamente indisponível.', 'error');
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
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#161a32] border shadow-2xl text-white text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md ${
          toastMessage.type === 'error' ? 'border-rose-500/60' : 'border-purple-500/60'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            toastMessage.type === 'error' ? 'bg-rose-600/30 text-rose-400' : 'bg-purple-600/30 text-emerald-400'
          }`}>
            {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
              challenge={weeklyChallenge}
              steps={challengeSteps}
              isAllCompleted={isChallengeAllCompleted}
              isClaimed={isChallengeClaimed}
              isClaiming={isClaimingChallengeXp}
              onClaimXp={handleClaimWeeklyChallengeXp}
              onStartChallenge={() => {
                if (onOpenMusicalPractice) {
                  onOpenMusicalPractice(weeklyChallenge?.song_id);
                }
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <SongChallenge 
              song={songOfTheWeekData}
              onPlaySong={() => onOpenMusicalPractice && onOpenMusicalPractice(weeklyChallenge?.song_id)}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Center Row: Feed de Evolução (7 Cols) & Conversation Room + Meu Impacto (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Feed de Evolução */}
        <div className="lg:col-span-7 space-y-6">
          {isUnavailable ? (
            <div className="p-8 rounded-3xl bg-[#111425] border border-amber-500/30 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Mural da Comunidade Temporariamente Indisponível</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  A tabela do mural ainda não está disponível ou a conexão está oscilando. Clique abaixo para tentar novamente.
                </p>
              </div>
              <button
                onClick={loadCommunityData}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            <CommunityFeed 
              posts={posts} 
              onCreatePost={handleCreatePost}
              isPostingEnabled={Boolean(settings.isPostingEnabled && settings.status !== 'maintenance')}
              user={user}
            />
          )}
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
