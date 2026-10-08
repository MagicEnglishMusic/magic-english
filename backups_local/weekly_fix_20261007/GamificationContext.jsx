import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { progressService } from '../services/progressService';
import { rankingService } from '../services/rankingService';
import { songsService } from '../services/songsService';
import { 
  XP_REWARDS, 
  LEVELS_CONFIG, 
  INITIAL_USER_GAMIFICATION, 
  INITIAL_BADGES, 
  INITIAL_DAILY_CHALLENGES, 
  SONG_MASTERY_CHECKLIST,
  CLEAN_USER_GAMIFICATION,
  CLEAN_BADGES,
  CLEAN_DAILY_CHALLENGES
} from '../data/gamificationData';

import { getLocalLabPronunciationDone } from '../utils/pronunciationProgress';
import { playRewardSound } from '../services/soundService';

// Dynamic weekly days generator based on America/Sao_Paulo date & real activity dates
export const STUDY_SOURCES = [
  'lesson_complete',
  'song_claim',
  'song_mastery',
  'practice_complete',
  'pronunciation_complete',
  'daily_challenge'
];

export const getSaoPauloDate = (dateObj = new Date()) => {
  const spDateString = dateObj.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spDateString);
};

export const formatIsoDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Calcula a sequência de dias consecutivos de estudo (streak)
 * com base nas datas de atividades pedagógicas no fuso America/Sao_Paulo.
 */
export function calculateStudyStreak(activityDates = new Set(), fallbackStreak = 0) {
  if (!activityDates || activityDates.size === 0) {
    return Math.max(0, Number(fallbackStreak) || 0);
  }

  const now = getSaoPauloDate();
  const todayStr = formatIsoDate(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatIsoDate(yesterday);

  // Se o aluno estudou hoje, a contagem consecutiva inicia a partir de hoje.
  // Se ainda não estudou hoje, mas estudou ontem, a sequência anterior ainda está ativa.
  // Se não estudou nem hoje nem ontem, a sequência foi interrompida (0).
  let checkDate = new Date(now);
  if (!activityDates.has(todayStr)) {
    if (activityDates.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      return 0;
    }
  }

  let streakCount = 0;
  while (true) {
    const iso = formatIsoDate(checkDate);
    if (activityDates.has(iso)) {
      streakCount += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streakCount;
}

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
    const isoDateStr = formatIsoDate(dayDate);
    const dayNum = String(dayDate.getDate()).padStart(2, '0');
    const monthNum = String(dayDate.getMonth() + 1).padStart(2, '0');

    const hasPracticed = activityDates.has(isoDateStr);

    return {
      day: dayName,
      date: `${dayNum}/${monthNum}`,
      completed: hasPracticed,
      isToday: idx === currentDayIndex
    };
  });
};

/**
 * Sincroniza e auto-repara o step_video de song_mastery com base estrita no vínculo:
 * user_progress.lesson_id -> songs.lesson_id -> songs.id (UUID)
 * GARANTIA: Utiliza EXCLUSIVAMENTE o songs.id UUID da tabela public.songs, NUNCA títulos de música.
 */
export async function syncVideoStepToSongMastery(userId, songsData = [], userProgressData = [], masteryData = []) {
  if (!userId || !Array.isArray(songsData) || songsData.length === 0 || !Array.isArray(userProgressData)) {
    return masteryData || [];
  }

  const updatedMasteryList = [...(masteryData || [])];

  // 1. Percorre cada registro de progresso do aluno
  for (const prog of userProgressData) {
    const isVideoWatched = Boolean(
      prog.completed || 
      prog.steps?.video ||
      (prog.progress_percent && prog.progress_percent >= 20)
    );

    if (!isVideoWatched || !prog.lesson_id) continue;

    const cleanLessonId = String(prog.lesson_id).trim().toLowerCase();

    // 2. Localiza a música vinculada: songs.lesson_id === user_progress.lesson_id
    const targetSong = songsData.find((s) => {
      const sLessonId = String(s.lesson_id || '').trim().toLowerCase();
      const sSongId = String(s.id || '').trim().toLowerCase();
      return (sLessonId && sLessonId === cleanLessonId) || sSongId === cleanLessonId;
    });

    if (!targetSong || !targetSong.id || typeof targetSong.id !== 'string') continue;

    const realSongUuid = targetSong.id; // UUID real (ex: 0aed5144-07d7-4c04-9410-34d035a7577d)
    const cleanSongUuid = realSongUuid.trim().toLowerCase();

    const existingMasteryIndex = updatedMasteryList.findIndex(
      (m) => String(m.song_id || '').trim().toLowerCase() === cleanSongUuid
    );

    const existingMastery = existingMasteryIndex !== -1 ? updatedMasteryList[existingMasteryIndex] : null;

    // 3. Se step_video ainda não estiver true, sincroniza no banco e memória
    if (!existingMastery?.step_video) {
      if (existingMasteryIndex !== -1) {
        updatedMasteryList[existingMasteryIndex] = {
          ...updatedMasteryList[existingMasteryIndex],
          step_video: true
        };
      } else {
        updatedMasteryList.push({
          user_id: userId,
          song_id: realSongUuid,
          step_video: true,
          step_song: false,
          step_reverse_translation: false,
          step_sing_along: false,
          step_final_challenge: false,
          challenge_index: 0
        });
      }

      console.log('[syncVideoStepToSongMastery] Sincronização de step_video via lesson_id:', {
        userId,
        lesson_id: prog.lesson_id,
        song_id: realSongUuid,
        song_title: targetSong.title,
        action: 'step_video synchronized to true'
      });

      // Executa atualização assíncrona no Supabase usando estritamente o songs.id UUID
      progressService.updateSongMastery(userId, realSongUuid, { step_video: true }).catch((err) => {
        console.warn('[syncVideoStepToSongMastery] Erro ao sincronizar step_video:', err);
      });
    }
  }

  return updatedMasteryList;
}

// Alias para compatibilidade retroativa
export const syncSongMasteryProgress = syncVideoStepToSongMastery;

/**
 * Constrói a lista dinâmica de maestria de músicas reais cruzando public.songs com public.song_mastery, xp_events e user_progress
 */
export function buildSongMasteryList(songsData = [], masteryData = [], xpEvents = [], userProgressList = []) {
  if (!Array.isArray(songsData) || songsData.length === 0) {
    return [];
  }

  return songsData.map((song) => {
    const cleanId = String(song.id || '').trim().toLowerCase();
    const match = (masteryData || []).find((r) => {
      const rId = String(r.song_id || '').trim().toLowerCase();
      return rId === cleanId;
    });

    // Fallback defensivo com cruzamento de user_progress
    const matchingProg = (userProgressList || []).find((p) => {
      const pLesId = String(p.lesson_id || '').trim().toLowerCase();
      const sLesId = String(song.lesson_id || '').trim().toLowerCase();
      return (sLesId && pLesId && sLesId === pLesId) || (pLesId === cleanId);
    });

    const isVideo = Boolean(match?.step_video || matchingProg?.steps?.video || matchingProg?.completed);
    const isSong = Boolean(match?.step_song);
    const isReverse = Boolean(match?.step_reverse_translation);
    const isSing = Boolean(match?.step_sing_along);
    const isChallenge = Boolean(match?.step_final_challenge);

    const count = [isVideo, isSong, isReverse, isSing, isChallenge].filter(Boolean).length;
    let status = 'not_started';
    if (count === 5) status = 'mastered';
    else if (count >= 3) status = 'practicing';
    else if (count >= 1) status = 'learning';

    const isClaimedInDb = Boolean(match?.xp_claimed_at);
    const isClaimedInEvents = (xpEvents || []).some(
      (ev) => ev.source === 'song_mastery' && String(ev.ref || '').trim().toLowerCase() === cleanId
    );
    const isClaimed = isClaimedInDb || isClaimedInEvents;

    return {
      id: song.id,
      songId: song.id,
      title: song.title || 'Música Magic',
      subtitle: song.artist || 'Magic Song',
      image: song.cover_url || song.coverUrl || song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      status,
      checklist: {
        watched_lesson: isVideo,
        listened_full: isSong,
        reverse_translation: isReverse,
        sing_along: isSing,
        final_challenge: isChallenge
      },
      masteryPercent: Math.round((count / 5) * 100),
      xpClaimed: isClaimed,
      xpClaimedAt: match?.xp_claimed_at || null,
      masteredAt: status === 'mastered' ? 'Concluído' : null
    };
  });
}

/**
 * Motor Avaliador de Conquistas e Badges
 * Calcula o progresso dinâmico e status de desbloqueio com base no progresso real do aluno.
 */
export function evaluateAchievements({
  baseBadges = CLEAN_BADGES,
  songMasteryList = [],
  userProgressList = [],
  streak = 0,
  weeklyDays = [],
  labApprovedWords = [],
  unlockedRewards = [],
  claimedBadgeIds = new Set()
}) {
  // 1. Músicas com qualquer progresso ou conclusão
  const songsWithProgress = (songMasteryList || []).filter((s) => {
    const checklist = s?.checklist || {};
    return Boolean(
      s?.status === 'mastered' ||
      s?.masteryPercent > 0 ||
      checklist.challenge ||
      checklist.final_challenge ||
      checklist.listen ||
      checklist.listened_full ||
      checklist.reverse ||
      checklist.reverse_translation ||
      checklist.sing ||
      checklist.sing_along ||
      s?.step_song ||
      s?.step_final_challenge
    );
  }).length;

  // 2. Músicas dominadas (100% ou 5 steps)
  const masteredSongsCount = (songMasteryList || []).filter((s) => s?.status === 'mastered').length;

  // 3. Aulas assistidas ou concluídas
  const completedLessons = (userProgressList || []).filter((p) => {
    return Boolean(p?.completed || p?.steps?.video || p?.steps?.song || p?.steps?.practice || (p?.progress_percent && p.progress_percent > 0));
  }).length;

  // 4. Práticas de pronúncia
  let pronunciationCount = 0;
  (userProgressList || []).forEach((p) => {
    if (Array.isArray(p?.steps?.pronunciation_done) && p.steps.pronunciation_done.length > 0) {
      pronunciationCount += p.steps.pronunciation_done.length;
    } else if (p?.steps?.pronunciation || p?.steps?.pronunciation_completed) {
      pronunciationCount += 1;
    }
  });
  if (Array.isArray(labApprovedWords) && labApprovedWords.length > 0) {
    pronunciationCount += labApprovedWords.length;
  }

  // 5. Sequência de dias de estudo
  const currentStreak = Number(streak) || 0;
  const activeWeeklyDaysCount = (weeklyDays || []).filter((d) => d?.completed).length;
  const maxDays = Math.max(currentStreak, activeWeeklyDaysCount);

  // 6. Módulos finalizados (se o aluno completou pelo menos 4 aulas ou completou um módulo)
  const completedModules = completedLessons >= 4 ? 1 : 0;

  // 7. Traveler Ready (concluir trilha ou aulas)
  const travelerProgress = Math.min(8, completedLessons);

  return baseBadges.map((badge) => {
    let current = 0;
    let total = badge.progress?.total || 1;
    let isUnlocked = Boolean(badge.unlocked);

    // Se já constar na tabela rewards do Supabase
    if (Array.isArray(unlockedRewards) && unlockedRewards.some((r) => r.title === badge.title || r.badge_id === badge.id)) {
      isUnlocked = true;
    }

    switch (badge.id) {
      case 'badge-first-song':
        current = Math.min(total, songsWithProgress);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-first-step':
        current = Math.min(total, completedLessons);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-perfect-week':
        current = Math.min(total, maxDays);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-voice-evolution':
        current = Math.min(total, pronunciationCount);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-music-master':
        current = Math.min(total, masteredSongsCount);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-module-complete':
        current = Math.min(total, completedModules);
        isUnlocked = isUnlocked || current >= total;
        break;

      case 'badge-traveler-ready':
        current = Math.min(total, travelerProgress);
        isUnlocked = isUnlocked || current >= total;
        break;

      default:
        current = badge.progress?.current || 0;
        break;
    }

    const isClaimed = Boolean(badge.claimed || (claimedBadgeIds && (claimedBadgeIds.has(badge.id) || claimedBadgeIds.has(badge.title))));
    const finalUnlocked = isUnlocked || isClaimed;

    return {
      ...badge,
      unlocked: finalUnlocked,
      unlockedAt: finalUnlocked ? (badge.unlockedAt || 'Desbloqueado') : null,
      claimed: isClaimed,
      claimedAt: isClaimed ? (badge.claimedAt || 'Resgatado') : null,
      progress: {
        current,
        total
      }
    };
  });
}

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { user } = useAuth();

  const [xp, setXp] = useState(() => user?.xp || 0);
  const [streak, setStreak] = useState(() => user?.streak || 0);
  const [weeklyDays, setWeeklyDays] = useState(() => generateWeeklyDays());
  const [badges, setBadges] = useState(CLEAN_BADGES);
  const [claimedBadgeIds, setClaimedBadgeIds] = useState(new Set());
  const [dailyChallenges, setDailyChallenges] = useState(CLEAN_DAILY_CHALLENGES);
  const [songMasteryList, setSongMasteryList] = useState([]);
  const [userProgressList, setUserProgressList] = useState([]);
  const [isGamificationLoaded, setIsGamificationLoaded] = useState(false);

  // Sync with Auth user when user profile changes
  useEffect(() => {
    if (!user) {
      setXp(0);
      setStreak(0);
      setBadges(CLEAN_BADGES);
      setClaimedBadgeIds(new Set());
      setSongMasteryList([]);
      setUserProgressList([]);
      setDailyChallenges(CLEAN_DAILY_CHALLENGES);
      setWeeklyDays(generateWeeklyDays());
      setIsGamificationLoaded(true);
      return;
    }

    // Real authenticated user - start clean and sync with Supabase
    setXp(user.xp || 0);
    setStreak(user.streak || 0);
    setDailyChallenges(CLEAN_DAILY_CHALLENGES);
    setIsGamificationLoaded(false);

    if (isSupabaseConfigured && user.id) {
      Promise.all([
        songsService.getSongs(),
        progressService.getUserProgress(user.id),
        progressService.getSongMastery(user.id),
        progressService.getUserXpEvents(user.id),
        supabase.from('rewards').select('*').eq('user_id', user.id)
      ]).then(async ([
        { data: songsData },
        { data: progData },
        { data: songMasteryData },
        { data: eventsData },
        { data: rewardsData }
      ]) => {
        const safeProgData = progData || [];
        setUserProgressList(safeProgData);

        // 1. Sincronização e reparação retroativa robusta: cruza user_progress com songs reais pelo UUID
        const syncedMastery = await syncSongMasteryProgress(
          user.id,
          songsData || [],
          safeProgData,
          songMasteryData || []
        );

        // 2. Constrói a lista de maestria com base no estado sincronizado e no progresso do usuário
        const list = buildSongMasteryList(
          songsData || [],
          syncedMastery || [],
          eventsData || [],
          safeProgData
        );
        setSongMasteryList(list);

        // 3. Atualiza medalhas desbloqueadas a partir de rewards
        if (rewardsData && rewardsData.length > 0) {
          setBadges((prev) =>
            prev.map((b) => {
              const hasUnlocked = rewardsData.some((r) => r.title === b.title || r.badge_id === b.id);
              return hasUnlocked ? { ...b, unlocked: true, unlockedAt: b.unlockedAt || 'Desbloqueado' } : b;
            })
          );
        }

        // 4. Identifica conquistas resgatadas a partir de xp_events
        const badgeEvents = (eventsData || []).filter((ev) => ev.source === 'badge_claim');
        const badgeIdsSet = new Set(badgeEvents.map((ev) => ev.ref));
        setClaimedBadgeIds(badgeIdsSet);

        // 5. Atualiza calendário semanal e streak dinâmico baseado estritamente em STUDY_SOURCES
        const studyDatesSet = new Set();
        (eventsData || []).forEach((ev) => {
          if (ev.created_at && ev.source && STUDY_SOURCES.includes(ev.source)) {
            const spDate = getSaoPauloDate(new Date(ev.created_at));
            const iso = formatIsoDate(spDate);
            studyDatesSet.add(iso);
          }
        });

        const calculatedStreak = calculateStudyStreak(studyDatesSet, user.streak || 0);
        setStreak(calculatedStreak);
        setWeeklyDays(generateWeeklyDays(studyDatesSet));
        setIsGamificationLoaded(true);
      }).catch((err) => {
        console.warn('[GamificationContext] Erro ao sincronizar dados de gamificação:', err);
        setIsGamificationLoaded(true);
      });
    } else {
      setWeeklyDays(generateWeeklyDays());
      setIsGamificationLoaded(true);
    }
  }, [user?.id, user?.xp, user?.streak]);

  // Re-evaluate achievements dynamically whenever progress changes
  useEffect(() => {
    if (!user) {
      setBadges(CLEAN_BADGES);
      return;
    }
    const labApproved = getLocalLabPronunciationDone(user?.id, 'general');
    setBadges((prev) =>
      evaluateAchievements({
        baseBadges: prev.length > 0 ? prev : CLEAN_BADGES,
        songMasteryList,
        userProgressList,
        streak,
        weeklyDays,
        labApprovedWords: labApproved,
        claimedBadgeIds
      })
    );
  }, [user?.id, songMasteryList, userProgressList, streak, weeklyDays, claimedBadgeIds]);

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
      'pronunciation_complete',
      'practice_complete',
      'daily_challenge',
      'song_mastery',
      'badge_claim',
      'weekly_magic_challenge'
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

    if (isNewlyGranted) {
      playRewardSound();
      if (STUDY_SOURCES.includes(cleanSource)) {
        setWeeklyDays((prev) => prev.map((d) => d.isToday ? { ...d, completed: true } : d));
        setStreak((prev) => (prev > 0 ? prev : 1));
      }
    }

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
        playRewardSound();
        setWeeklyDays((prev) => prev.map((d) => d.isToday ? { ...d, completed: true } : d));
        setStreak((prev) => (prev > 0 ? prev : 1));
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

    const canonicalKeyMap = {
      video: 'watched_lesson',
      watched_lesson: 'watched_lesson',
      step_video: 'watched_lesson',
      listen: 'listened_full',
      listened_full: 'listened_full',
      step_song: 'listened_full',
      reverse: 'reverse_translation',
      reverse_translation: 'reverse_translation',
      step_reverse_translation: 'reverse_translation',
      sing: 'sing_along',
      sing_along: 'sing_along',
      step_sing_along: 'sing_along',
      challenge: 'final_challenge',
      final_challenge: 'final_challenge',
      step_final_challenge: 'final_challenge'
    };
    const cKey = canonicalKeyMap[stepKey] || stepKey;

    setSongMasteryList((prev) => {
      return prev.map((song) => {
        if (song.songId !== songId && song.id !== songId) return song;
        songTitle = song.title || 'a música';

        const updatedChecklist = {
          ...song.checklist,
          [cKey]: isCompleted
        };

        const isVideo = Boolean(updatedChecklist.watched_lesson);
        const isSong = Boolean(updatedChecklist.listened_full);
        const isReverse = Boolean(updatedChecklist.reverse_translation);
        const isSing = Boolean(updatedChecklist.sing_along);
        const isChallenge = Boolean(updatedChecklist.final_challenge);

        const completedCount = [isVideo, isSong, isReverse, isSing, isChallenge].filter(Boolean).length;

        let newStatus = 'not_started';
        if (completedCount === 5) {
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
          masteryPercent: Math.round((completedCount / 5) * 100),
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
        if (res.data.granted !== false) {
          setWeeklyDays((prev) => prev.map((d) => d.isToday ? { ...d, completed: true } : d));
          setStreak((prev) => (prev > 0 ? prev : 1));
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

  // Claim Achievement / Badge Reward (+XP)
  const claimAchievement = async (badgeId) => {
    if (!user?.id || !badgeId) {
      return { success: false, error: 'Usuário não autenticado ou conquista inválida.' };
    }

    const cleanBadgeId = String(badgeId).trim();
    const badge = badges.find((b) => b.id === cleanBadgeId);

    if (!badge) {
      return { success: false, error: 'Conquista não encontrada.' };
    }

    if (!badge.unlocked) {
      return { success: false, error: 'Esta conquista ainda não foi desbloqueada.' };
    }

    if (badge.claimed || claimedBadgeIds.has(cleanBadgeId)) {
      setRewardModal({
        isOpen: true,
        type: 'xp',
        title: 'Recompensa Já Resgatada',
        subtitle: `O XP da conquista "${badge.title}" já foi resgatado anteriormente.`,
        xp: 0,
        icon: 'ℹ️',
        bonusText: `Seu saldo atual é de ${xp} Magic XP.`
      });
      return { success: true, granted: false, newXp: xp };
    }

    try {
      // 1. Concede XP via RPC grant_xp com trava anti-duplicidade atômica
      const res = await progressService.grantXp('badge_claim', cleanBadgeId);

      if (!res.success) {
        setRewardModal({
          isOpen: true,
          type: 'xp',
          title: 'Aviso de Resgate',
          subtitle: res.error || 'Não foi possível resgatar a recompensa no momento.',
          xp: 0,
          icon: '⚠️',
          bonusText: 'Tente novamente mais tarde.'
        });
        return { success: false, error: res.error };
      }

      const isNewlyGranted = res.data?.granted !== false;
      const granted = res.data?.amount || badge.rewardXp || 50;
      const newXp = res.data?.total_xp ?? (isNewlyGranted ? xp + granted : xp);

      // 2. Atualiza saldo de XP
      setXp(newXp);

      // 3. Atualiza estado local de claimedBadgeIds e badges imediatamente
      setClaimedBadgeIds((prev) => new Set([...prev, cleanBadgeId]));
      setBadges((prev) =>
        prev.map((b) =>
          b.id === cleanBadgeId
            ? { ...b, unlocked: true, claimed: true, claimedAt: new Date().toISOString() }
            : b
        )
      );

      // 4. Salva registro na tabela rewards para histórico persistente do aluno
      if (isSupabaseConfigured && isNewlyGranted) {
        rankingService.unlockReward(user.id, {
          title: badge.title,
          description: badge.condition,
          xp: granted,
          icon: badge.icon,
          category: badge.category,
          badge_id: cleanBadgeId
        }).catch((err) => {
          console.warn('[GamificationContext] Aviso ao registrar reward no Supabase:', err);
        });
      }

      // 5. Exibe Modal de Celebração
      if (isNewlyGranted) {
        playRewardSound();
        setRewardModal({
          isOpen: true,
          type: 'badge',
          title: '🏆 Recompensa Resgatada!',
          subtitle: `Parabéns por conquistar "${badge.title}"!`,
          icon: badge.icon || '🏆',
          badge: { ...badge, claimed: true },
          xp: granted,
          bonusText: `+${granted} Magic XP adicionados à sua jornada!`
        });
      } else {
        setRewardModal({
          isOpen: true,
          type: 'xp',
          title: 'Atividade Já Pontuada',
          subtitle: res.data?.message || 'A recompensa desta conquista já foi resgatada.',
          xp: 0,
          icon: 'ℹ️',
          bonusText: `Seu saldo atual é de ${newXp} Magic XP.`
        });
      }

      return { success: true, granted: isNewlyGranted, newXp };
    } catch (err) {
      console.error('[GamificationContext] Erro ao resgatar conquista:', err);
      return { success: false, error: err?.message || err };
    }
  };

  // Claim Song Mastery Reward (+100 XP)
  const claimSongMastery = async (songId) => {
    if (!user?.id || !songId) {
      return { success: false, error: 'Usuário não autenticado ou música inválida.' };
    }

    const cleanSongId = String(songId || '').trim().toLowerCase();
    const song = songMasteryList.find((s) => s.songId === songId || s.id === songId);

    if (song?.xpClaimed) {
      setRewardModal({
        isOpen: true,
        type: 'xp',
        title: 'Atividade Já Pontuada',
        subtitle: `O XP de domínio de "${song?.title || 'esta música'}" já foi resgatado anteriormente.`,
        xp: 0,
        icon: 'ℹ️',
        bonusText: `Seu saldo atual é de ${xp} Magic XP.`
      });
      return { success: true, granted: false, newXp: xp };
    }

    try {
      // 1. Grava no banco xp_claimed_at em song_mastery
      if (isSupabaseConfigured) {
        await progressService.claimSongXp(user.id, songId);
      }

      // 2. Concede +100 XP via RPC grant_xp
      const res = await progressService.grantXp('song_mastery', cleanSongId);

      const isNewlyGranted = res.data?.granted !== false;
      const granted = res.data?.amount || 100;
      const newXp = res.data?.total_xp ?? (isNewlyGranted ? xp + granted : xp);
      setXp(newXp);

      if (isNewlyGranted) {
        setWeeklyDays((prev) => prev.map((d) => d.isToday ? { ...d, completed: true } : d));
        setStreak((prev) => (prev > 0 ? prev : 1));
      }

      // 3. Atualiza estado local de songMasteryList
      setSongMasteryList((prev) =>
        prev.map((s) =>
          (s.songId === songId || s.id === songId)
            ? { ...s, xpClaimed: true, xpClaimedAt: new Date().toISOString(), masteredAt: 'Resgatado' }
            : s
        )
      );

      // 4. Modal de celebração
      if (isNewlyGranted) {
        setRewardModal({
          isOpen: true,
          type: 'song_mastery',
          title: '🏆 Recompensa Resgatada!',
          subtitle: `Você dominou "${song?.title || 'a canção'}" e resgatou +100 XP!`,
          icon: '🏆',
          xp: granted,
          bonusText: `+${granted} Magic XP adicionados à sua jornada!`
        });
      } else {
        setRewardModal({
          isOpen: true,
          type: 'xp',
          title: 'Atividade Já Pontuada',
          subtitle: res.data?.message || 'O XP desta música já foi resgatado anteriormente.',
          xp: 0,
          icon: 'ℹ️',
          bonusText: `Seu saldo atual é de ${newXp} Magic XP.`
        });
      }

      return { success: true, granted: isNewlyGranted, newXp };
    } catch (err) {
      console.error('[GamificationContext] Erro ao resgatar XP da música:', err);
      return { success: false, error: err?.message || err };
    }
  };

  // Reset Song Mastery helper (no-op: repeating practice never regresses steps or clears badges)
  const resetSongMastery = (_songId) => {
    // Intentionally no-op to preserve step_* flags, challenge_index, and xp_claimed_at
  };

  // Record Lesson Progress directly to Supabase
  const recordLessonProgress = async (lessonId, progressPercent = 100, completed = true) => {
    setUserProgressList((prev) => {
      const idx = prev.findIndex((p) => p.lesson_id === lessonId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], progress_percent: progressPercent, completed };
        return updated;
      }
      return [...prev, { lesson_id: lessonId, progress_percent: progressPercent, completed }];
    });
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
    userProgressList,
    isGamificationLoaded,
    rewardModal,
    closeRewardModal,
    addXp,
    claimDailyChallenge,
    updateSongMasteryStep,
    claimSongMastery,
    claimAchievement,
    resetSongMastery,
    unlockBadge,
    evaluateAchievements,
    syncSongMasteryProgress,
    syncVideoStepToSongMastery,
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
