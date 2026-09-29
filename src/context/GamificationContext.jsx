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

// Dynamic weekly days generator based on America/Sao_Paulo date & real activity dates
const getSaoPauloDate = (dateObj = new Date()) => {
  const spDateString = dateObj.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spDateString);
};

const generateWeeklyDays = (activityDates = new Set()) => {
  const now = getSaoPauloDate();
  const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  const currentDayIndex = (dayOfWeek + 6) % 7; // 0 = Seg, ..., 6 = Dom
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayIndex);

  return dayNames.map((dayName, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const yyyy = dayDate.getFullYear();
    const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dayDate.getDate()).padStart(2, '0');
    const isoDateStr = `${yyyy}-${mm}-${dd}`;
    const dayNum = dd;
    const monthNum = mm;

    const hasPracticed = activityDates.has(isoDateStr);

    return {
      day: dayName,
      date: `${dayNum}/${monthNum}`,
      completed: hasPracticed,
      isToday: idx === currentDayIndex
    };
  });
};

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { user } = useAuth();

  const [xp, setXp] = useState(() => user?.xp || 0);
  const [streak, setStreak] = useState(() => user?.streak || 0);
  const [weeklyDays, setWeeklyDays] = useState(() => generateWeeklyDays());
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
      setWeeklyDays(generateWeeklyDays());
      return;
    }

    // Real authenticated user - start clean and sync with Supabase
    setXp(user.xp || 0);
    setStreak(user.streak || 0);
    setBadges(CLEAN_BADGES);
    setSongMasteryList(CLEAN_SONG_MASTERY);
    setDailyChallenges(CLEAN_DAILY_CHALLENGES);

    if (isSupabaseConfigured && user.id) {
      // 1. Fetch unlocked rewards
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

      // 2. Fetch song mastery
      progressService.getSongMastery(user.id).then(({ data: songMasteryData }) => {
        if (songMasteryData && songMasteryData.length > 0) {
          setSongMasteryList((prev) =>
            prev.map((s) => {
              const match = songMasteryData.find((r) => r.song_id === s.songId || r.song_id === s.id);
              if (match) {
                const checklist = {
                  video: Boolean(match.step_video),
                  listen: Boolean(match.step_song),
                  reverse: Boolean(match.step_reverse_translation),
                  sing: Boolean(match.step_sing_along),
                  challenge: Boolean(match.step_final_challenge),
                  watched_lesson: Boolean(match.step_video),
                  listened_full: Boolean(match.step_song),
                  reverse_translation: Boolean(match.step_reverse_translation),
                  sing_along: Boolean(match.step_sing_along),
                  final_challenge: Boolean(match.step_final_challenge)
                };
                const count = [match.step_video, match.step_song, match.step_reverse_translation, match.step_sing_along, match.step_final_challenge].filter(Boolean).length;
                let status = 'not_started';
                if (count === 5) status = 'mastered';
                else if (count >= 3) status = 'practicing';
                else if (count >= 1) status = 'learning';
                return { ...s, checklist, status, masteryPercent: match.mastery_percent || Math.round((count / 5) * 100) };
              }
              return s;
            })
          );
        }
      });

      // 3. Fetch real activity dates from xp_events for calendar
      progressService.getUserXpEvents(user.id).then(({ data: events }) => {
        const datesSet = new Set();
        (events || []).forEach((ev) => {
          if (ev.created_at) {
            const spDate = getSaoPauloDate(new Date(ev.created_at));
            const iso = `${spDate.getFullYear()}-${String(spDate.getMonth() + 1).padStart(2, '0')}-${String(spDate.getDate()).padStart(2, '0')}`;
            datesSet.add(iso);
          }
        });
        setWeeklyDays(generateWeeklyDays(datesSet));
      });
    } else {
      setWeeklyDays(generateWeeklyDays());
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

  // Add XP via secure server-side RPC grant_xp
  const addXp = async (source, ref = "", options = {}) => {
    if (typeof source !== 'string' || !source.trim() || !ref || typeof ref !== 'string' || !ref.trim()) {
      console.warn(`[GamificationContext] addXp exige origem em texto válida e ref explícito não vazio. Recebido: source="${source}", ref="${ref}". Chamada recusada.`);
      return { success: false, error: 'Origem ou ref inválido para grant_xp.' };
    }

    const cleanSource = source.trim();
    const cleanRef = ref.trim();

    const VALID_SOURCES = [
      'lesson_complete',
      'song_claim',
      'pronunciation_item',
      'practice_complete',
      'daily_challenge',
      'song_mastery'
    ];

    if (!VALID_SOURCES.includes(cleanSource)) {
      console.warn(`[GamificationContext] Tentativa de conceder XP com origem não reconhecida pelo servidor: "${cleanSource}". Operação ignorada.`);
      return { success: false, error: `Origem de XP "${cleanSource}" não é suportada no servidor.` };
    }

    const prevXp = xp;

    // Call server-side RPC
    const res = await progressService.grantXp(cleanSource, cleanRef);
    if (!res.success) {
      if (options.showModal) {
        setRewardModal({
          isOpen: true,
          type: 'xp',
          title: 'Aviso de Pontuação',
          subtitle: res.error || 'Não foi possível validar a pontuação no servidor.',
          xp: 0,
          icon: '⚠️',
          bonusText: 'Verifique se os pré-requisitos da atividade foram concluídos.'
        });
      }
      return { success: false, error: res.error };
    }

    const isNewlyGranted = res.data?.granted !== false;
    const granted = res.data?.amount || 0;
    const newXp = res.data?.total_xp ?? (isNewlyGranted ? prevXp + granted : prevXp);
    setXp(newXp);

    if (!isNewlyGranted) {
      if (options.showModal) {
        setRewardModal({
          isOpen: true,
          type: 'xp',
          title: 'Atividade Já Pontuada',
          subtitle: res.data?.message || 'O XP desta atividade já foi resgatado anteriormente.',
          xp: 0,
          icon: 'ℹ️',
          bonusText: `Seu saldo atual é de ${newXp} Magic XP.`
        });
      }
      return { success: true, granted: false, newXp };
    }

    // Level calculation check
    let oldLevel = LEVELS_CONFIG[0];
    let newLevel = LEVELS_CONFIG[0];
    for (const lvl of LEVELS_CONFIG) {
      if (prevXp >= lvl.minXp) oldLevel = lvl;
      if (newXp >= lvl.minXp) newLevel = lvl;
    }

    if (newLevel.level > oldLevel.level) {
      setRewardModal({
        isOpen: true,
        type: 'level_up',
        title: `Subiu de Nível! Nível ${newLevel.level}`,
        subtitle: `Parabéns! Você alcançou "${newLevel.title}"`,
        xp: granted,
        icon: newLevel.icon,
        bonusText: newLevel.subtitle
      });
      return { success: true, newXp };
    }

    if (options.showModal) {
      setRewardModal({
        isOpen: true,
        type: options.type || 'xp',
        title: options.title || reasonOrRef,
        subtitle: options.subtitle || 'Você está cada vez mais próximo da fluência.',
        xp: granted,
        icon: options.icon || '⭐',
        bonusText: options.bonusText || `+${granted} Magic XP adicionados à sua jornada!`
      });
    }

    return { success: true, newXp };
  };

  // Claim Daily Challenge Reward
  const claimDailyChallenge = async (challengeId) => {
    const challenge = dailyChallenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return;

    const spDate = getSaoPauloDate();
    const todayStr = `${spDate.getFullYear()}-${String(spDate.getMonth() + 1).padStart(2, '0')}-${String(spDate.getDate()).padStart(2, '0')}`;
    const res = await progressService.grantXp('daily_challenge', `${todayStr}:${challengeId}`);
    
    if (res.success) {
      setDailyChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, claimed: true } : c))
      );
      if (res.data?.total_xp !== undefined) setXp(res.data.total_xp);

      if (res.data?.granted !== false) {
        setRewardModal({
          isOpen: true,
          type: 'challenge',
          title: '🎯 Desafio Concluído!',
          subtitle: challenge.title,
          icon: challenge.icon,
          xp: res.data?.amount || 25,
          bonusText: 'Recompensa diária coletada com sucesso!'
        });
      } else {
        setRewardModal({
          isOpen: true,
          type: 'challenge',
          title: '🎯 Desafio Diário',
          subtitle: 'Você já resgatou o desafio diário de hoje.',
          icon: 'ℹ️',
          xp: 0,
          bonusText: `Seu saldo atual é de ${res.data?.total_xp || xp} Magic XP.`
        });
      }
    } else {
      alert(res.error || 'Não foi possível validar o desafio diário.');
    }
  };

  // Update Song Mastery step with Supabase persistence
  const updateSongMasteryStep = async (songId, stepKey, isCompleted = true) => {
    const stepColumnMap = {
      video: 'step_video',
      listen: 'step_song',
      reverse: 'step_reverse_translation',
      reverse_translation: 'step_reverse_translation',
      sing: 'step_sing_along',
      sing_along: 'step_sing_along',
      challenge: 'step_final_challenge',
      final_challenge: 'step_final_challenge'
    };

    let willBeMastered = false;
    let songTitle = 'a música';

    setSongMasteryList((prev) => {
      return prev.map((song) => {
        if (song.songId !== songId && song.id !== songId) return song;
        songTitle = song.title || 'a música';

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

        if (newStatus === 'mastered' && song.status !== 'mastered') {
          willBeMastered = true;
        }

        return {
          ...song,
          checklist: updatedChecklist,
          status: newStatus,
          masteredAt: newStatus === 'mastered' ? 'Hoje' : song.masteredAt
        };
      });
    });

    const dbField = stepColumnMap[stepKey];
    if (dbField && isSupabaseConfigured && user?.id) {
      // 1. Grava no banco e aguarda confirmação do update antes de chamar grantXp
      await progressService.updateSongMastery(user.id, songId, { [dbField]: isCompleted });
    }

    // 2. Se dominada, concede XP de song_mastery somente após o salvamento no banco
    if (willBeMastered) {
      const cleanSongId = String(songId || '').trim().toLowerCase();
      const res = await progressService.grantXp('song_mastery', cleanSongId);
      if (res.success && res.data) {
        if (res.data.total_xp !== undefined) {
          setXp(res.data.total_xp);
        }
        setRewardModal({
          isOpen: true,
          type: 'song_mastery',
          title: '🎉 Música Dominada!',
          subtitle: `Você dominou todos os 5 passos de "${songTitle}"!`,
          icon: '🟢',
          xp: res.data.amount || 100,
          bonusText: `+${res.data.amount || 100} Magic XP pela maestria musical!`
        });
      }
    }
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
          xp: badge.rewardXp || 50,
          icon: badge.icon,
          category: badge.category
        });
      }

      // Concede a medalha em rewards e abre modal visual sem chamar grant_xp ('general' não existe no SQL)
      setRewardModal({
        isOpen: true,
        type: 'badge',
        title: '🏆 Nova Conquista!',
        subtitle: badge.title,
        icon: badge.icon || '🏆',
        badge: badge,
        xp: 0,
        bonusText: badge.condition || 'Conquista desbloqueada com sucesso!'
      });

      return prev.map((b) =>
        b.id === badgeId ? { ...b, unlocked: true, unlockedAt: 'Hoje' } : b
      );
    });
  };

  // Reset Song Mastery helper (no-op: repeating practice never regresses steps or clears badges)
  const resetSongMastery = (_songId) => {
    // Intentionally no-op to preserve step_* flags, challenge_index, and xp_claimed_at
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
    resetSongMastery,
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
