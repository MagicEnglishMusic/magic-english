import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { progressService } from '../services/progressService';
import { rankingService } from '../services/rankingService';
import { 
  XP_REWARDS, 
  LEVELS_CONFIG, 
  INITIAL_USER_GAMIFICATION, 
  INITIAL_BADGES, 
  INITIAL_DAILY_CHALLENGES, 
  INITIAL_SONG_MASTERY,
  SONG_MASTERY_CHECKLIST,
  CLEAN_USER_GAMIFICATION,
  CLEAN_BADGES,
  CLEAN_DAILY_CHALLENGES,
  CLEAN_SONG_MASTERY
} from '../data/gamificationData';

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { user } = useAuth();

  const [xp, setXp] = useState(() => user?.xp || 0);
  const [streak, setStreak] = useState(() => user?.streak || 0);
  const [weeklyDays, setWeeklyDays] = useState(CLEAN_USER_GAMIFICATION.weeklyDays);
  const [badges, setBadges] = useState(CLEAN_BADGES);
  const [dailyChallenges, setDailyChallenges] = useState(CLEAN_DAILY_CHALLENGES);
  const [songMasteryList, setSongMasteryList] = useState(CLEAN_SONG_MASTERY);

  // Sync with Auth user when user profile changes
  useEffect(() => {
    if (!user) {
      setXp(0);
      setStreak(0);
      setBadges(CLEAN_BADGES);
      setSongMasteryList(CLEAN_SONG_MASTERY);
      setDailyChallenges(CLEAN_DAILY_CHALLENGES);
      setWeeklyDays(CLEAN_USER_GAMIFICATION.weeklyDays);
      return;
    }

    // Real authenticated user - start clean and sync with Supabase
    setXp(user.xp || 0);
    setStreak(user.streak || 0);
    setBadges(CLEAN_BADGES);
    setSongMasteryList(CLEAN_SONG_MASTERY);
    setDailyChallenges(CLEAN_DAILY_CHALLENGES);
    setWeeklyDays(CLEAN_USER_GAMIFICATION.weeklyDays);

    if (isSupabaseConfigured && user.id) {
        // Fetch unlocked rewards
        supabase
          .from('rewards')
          .select('*')
          .eq('user_id', user.id)
          .then(({ data: rewardsData }) => {
            if (rewardsData && rewardsData.length > 0) {
              setBadges((prev) =>
                prev.map((b) => {
                  const hasUnlocked = rewardsData.some((r) => r.title === b.title);
                  return hasUnlocked ? { ...b, unlocked: true, unlockedAt: 'Desbloqueado' } : b;
                })
              );
            }
          });

        // Fetch song mastery
        supabase
          .from('song_mastery')
          .select('*')
          .eq('user_id', user.id)
          .then(({ data: songMasteryData }) => {
            if (songMasteryData && songMasteryData.length > 0) {
              setSongMasteryList((prev) =>
                prev.map((s) => {
                  const match = songMasteryData.find((r) => r.song_id === s.songId);
                  if (match) {
                    const checklist = {
                      watched_lesson: match.step_video,
                      listened_full: match.step_song,
                      reverse_translation: match.step_reverse_translation,
                      sing_along: match.step_sing_along,
                      final_challenge: match.step_final_challenge
                    };
                    const count = Object.values(checklist).filter(Boolean).length;
                    let status = 'not_started';
                    if (count === 5) status = 'mastered';
                    else if (count >= 3) status = 'practicing';
                    else if (count >= 1) status = 'learning';
                    return { ...s, checklist, status };
                  }
                  return s;
                })
              );
            }
          });
      }
  }, [user?.id, user?.xp, user?.streak]);

  // Celebratory Reward Modal State
  const [rewardModal, setRewardModal] = useState({
    isOpen: false,
    type: 'xp', // 'xp' | 'level_up' | 'badge' | 'song_mastery' | 'challenge'
    title: '',
    subtitle: '',
    xp: 0,
    icon: '⭐',
    badge: null,
    bonusText: ''
  });

  // Calculate current level based on XP
  const { currentLevel, nextLevel, levelProgress, xpToNextLevel } = useMemo(() => {
    let activeLvl = LEVELS_CONFIG[0];
    for (const lvl of LEVELS_CONFIG) {
      if (xp >= lvl.minXp) {
        activeLvl = lvl;
      }
    }
    const currentIndex = LEVELS_CONFIG.findIndex((l) => l.level === activeLvl.level);
    const nextLvl = currentIndex < LEVELS_CONFIG.length - 1 ? LEVELS_CONFIG[currentIndex + 1] : null;

    const span = (activeLvl.maxXp - activeLvl.minXp) || 1000;
    const currentProgress = Math.min(100, Math.max(0, Math.round(((xp - activeLvl.minXp) / span) * 100)));
    const needed = Math.max(0, activeLvl.maxXp - xp);

    return {
      currentLevel: activeLvl,
      nextLevel: nextLvl,
      levelProgress: currentProgress,
      xpToNextLevel: needed
    };
  }, [xp]);

  // Close celebration modal
  const closeRewardModal = () => {
    setRewardModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Add XP with automatic Level Up detection and Supabase sync
  const addXp = (amount, reason = "Atividade concluída", options = {}) => {
    const prevXp = xp;
    const newXp = prevXp + amount;
    setXp(newXp);

    // Check if new level was unlocked
    let oldLevel = LEVELS_CONFIG[0];
    let newLevel = LEVELS_CONFIG[0];
    for (const lvl of LEVELS_CONFIG) {
      if (prevXp >= lvl.minXp) oldLevel = lvl;
      if (newXp >= lvl.minXp) newLevel = lvl;
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured && user?.id) {
      try {
        // 1. Update Profile XP and Level
        supabase
          .from('profiles')
          .update({
            xp: newXp,
            level: newLevel.title,
            level_number: newLevel.level,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.warn('Supabase profile XP sync:', error.message);
          });

        // 2. Update Ranking XP
        supabase
          .from('ranking')
          .upsert({
            user_id: user.id,
            total_xp: newXp,
            weekly_xp: (user.weeklyXp || 0) + amount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.warn('Supabase ranking sync:', error.message);
          });
      } catch (err) {
        console.warn('Supabase addXp error:', err.message);
      }
    }

    if (newLevel.level > oldLevel.level) {
      // LEVEL UP CELEBRATION!
      setRewardModal({
        isOpen: true,
        type: 'level_up',
        title: `Subiu de Nível! Nível ${newLevel.level}`,
        subtitle: `Parabéns! Você alcançou "${newLevel.title}"`,
        xp: amount,
        icon: newLevel.icon,
        bonusText: newLevel.subtitle
      });
      return;
    }

    // Standard activity reward modal if requested
    if (options.showModal) {
      setRewardModal({
        isOpen: true,
        type: options.type || 'xp',
        title: options.title || reason,
        subtitle: options.subtitle || 'Você está cada vez mais próximo da fluência.',
        xp: amount,
        icon: options.icon || '⭐',
        bonusText: options.bonusText || `+${amount} Magic XP adicionados à sua jornada!`
      });
    }
  };

  // Claim Daily Challenge Reward
  const claimDailyChallenge = (challengeId) => {
    const challenge = dailyChallenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return;

    setDailyChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, claimed: true } : c))
    );

    addXp(challenge.rewardXp, `Desafio Diário: ${challenge.title}`, {
      showModal: true,
      type: 'challenge',
      title: '🎯 Desafio Concluído!',
      subtitle: challenge.title,
      icon: challenge.icon,
      bonusText: 'Recompensa diária coletada com sucesso!'
    });
  };

  // Update Song Mastery step with Supabase persistence
  const updateSongMasteryStep = (songId, stepKey, isCompleted = true) => {
    setSongMasteryList((prev) => {
      return prev.map((song) => {
        if (song.songId !== songId) return song;

        const updatedChecklist = {
          ...song.checklist,
          [stepKey]: isCompleted
        };

        const totalSteps = SONG_MASTERY_CHECKLIST.length;
        const completedCount = Object.values(updatedChecklist).filter(Boolean).length;

        let newStatus = song.status;
        if (completedCount === totalSteps) {
          newStatus = 'mastered'; // 🟢 Dominada
        } else if (completedCount >= 3) {
          newStatus = 'practicing'; // 🟣 Em prática
        } else if (completedCount >= 1) {
          newStatus = 'learning'; // 🔵 Em aprendizado
        } else {
          newStatus = 'not_started'; // ⚪ Não iniciada
        }

        // Map checklist step to database columns
        const stepColumnMap = {
          video: 'step_video',
          listen: 'step_song',
          reverse: 'step_reverse_translation',
          sing: 'step_sing_along',
          challenge: 'step_final_challenge'
        };

        const dbField = stepColumnMap[stepKey];
        if (dbField && isSupabaseConfigured && user?.id) {
          progressService.updateSongMastery(user.id, songId, { [dbField]: isCompleted });
        }

        // If just mastered now, trigger celebratory reward
        if (newStatus === 'mastered' && song.status !== 'mastered') {
          setTimeout(() => {
            addXp(XP_REWARDS.MASTER_SONG, `Música Dominada: ${song.title}`, {
              showModal: true,
              type: 'song_mastery',
              title: '🎉 Música Dominada!',
              subtitle: `Você dominou todos os 5 passos de "${song.title}"!`,
              icon: '🟢',
              bonusText: `+${XP_REWARDS.MASTER_SONG} Magic XP pela maestria musical!`
            });
          }, 300);
        }

        return {
          ...song,
          checklist: updatedChecklist,
          status: newStatus,
          masteredAt: newStatus === 'mastered' ? 'Hoje' : song.masteredAt
        };
      });
    });
  };

  // Unlock Badge with Supabase persistence
  const unlockBadge = (badgeId) => {
    setBadges((prev) => {
      const badge = prev.find((b) => b.id === badgeId);
      if (!badge || badge.unlocked) return prev;

      if (isSupabaseConfigured && user?.id) {
        rankingService.unlockReward(user.id, {
          title: badge.title,
          description: badge.condition,
          xp: badge.rewardXp,
          icon: badge.icon,
          category: badge.category
        });
      }

      addXp(badge.rewardXp, `Conquista: ${badge.title}`, {
        showModal: true,
        type: 'badge',
        title: '🏆 Nova Conquista!',
        subtitle: badge.title,
        icon: badge.icon,
        badge: badge,
        bonusText: badge.condition
      });

      return prev.map((b) =>
        b.id === badgeId ? { ...b, unlocked: true, unlockedAt: 'Hoje' } : b
      );
    });
  };

  // Record Lesson Progress directly to Supabase
  const recordLessonProgress = async (lessonId, progressPercent = 100, completed = true) => {
    if (isSupabaseConfigured && user?.id) {
      return progressService.saveLessonProgress(user.id, lessonId, progressPercent, completed);
    }
    return { success: true };
  };

  const value = {
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
    rewardModal,
    closeRewardModal,
    addXp,
    claimDailyChallenge,
    updateSongMasteryStep,
    unlockBadge,
    recordLessonProgress
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
