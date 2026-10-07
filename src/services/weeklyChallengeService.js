import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { progressService } from './progressService';

// Default Fallback Weekly Challenge (aligns with current DB seed)
const DEFAULT_WEEKLY_CHALLENGE = {
  id: 'chal-2026-w41',
  week_key: '2026-W41',
  title: 'Domine a Magic Song',
  description: 'Complete as 3 etapas essenciais de fixação musical desta semana e desbloqueie o Badge Exclusivo!',
  song_id: '0aed5144-07d7-4c04-9410-34d035a7577d',
  lesson_id: 'a695bb9a-1620-4752-978d-333527fb3afd',
  xp_reward: 300,
  badge_id: 'badge-starter',
  badge_title: 'Magic Starter',
  badge_icon: '🌟',
  is_active: true,
  auto_rotate: true,
  start_date: '2026-10-05',
  end_date: '2026-10-11',
  steps: [
    {
      id: 'step-1',
      type: 'LESSON',
      label: 'Assistir a aula da Magic Song',
      target_id: 'a695bb9a-1620-4752-978d-333527fb3afd',
      required: true
    },
    {
      id: 'step-2',
      type: 'PRACTICE',
      label: 'Fazer Prática Musical da Magic Song',
      target_id: '0aed5144-07d7-4c04-9410-34d035a7577d',
      required: true
    },
    {
      id: 'step-3',
      type: 'PRONUNCIATION',
      label: 'Treinar pronúncia da Magic Song',
      target_id: '0aed5144-07d7-4c04-9410-34d035a7577d',
      min_score: 80,
      required: true
    }
  ]
};

export const weeklyChallengeService = {
  // 1. Fetch active weekly challenge from public.app_settings (key: 'weekly_challenge')
  async getActiveWeeklyChallenge() {
    if (!isSupabaseConfigured) {
      return { data: DEFAULT_WEEKLY_CHALLENGE, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'weekly_challenge')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value && typeof data.value === 'object') {
        const val = data.value;
        const formatted = {
          id: val.id || 'chal-active',
          week_key: val.week_key || 'current-week',
          title: val.title || DEFAULT_WEEKLY_CHALLENGE.title,
          description: val.description || DEFAULT_WEEKLY_CHALLENGE.description,
          song_id: val.song_id || DEFAULT_WEEKLY_CHALLENGE.song_id,
          lesson_id: val.lesson_id || DEFAULT_WEEKLY_CHALLENGE.lesson_id,
          xp_reward: Number(val.xp_reward) || 300,
          badge_id: val.badge_id || DEFAULT_WEEKLY_CHALLENGE.badge_id,
          badge_title: val.badge_title || val.badge || 'Magic Starter',
          badge_icon: val.badge_icon || '🌟',
          is_active: val.is_active !== false,
          auto_rotate: val.auto_rotate ?? true,
          start_date: val.start_date || null,
          end_date: val.end_date || null,
          steps: Array.isArray(val.steps) && val.steps.length > 0 ? val.steps : DEFAULT_WEEKLY_CHALLENGE.steps,
          daysLeft: this.calculateDaysLeft(val.end_date)
        };
        return { data: formatted, error: null };
      }

      return { data: DEFAULT_WEEKLY_CHALLENGE, error: null };
    } catch (err) {
      console.warn('Erro ao buscar desafio semanal do Supabase, usando padrão:', err.message);
      return { data: DEFAULT_WEEKLY_CHALLENGE, error: err.message };
    }
  },

  // 2. Calculate days left until end_date (or end of current Sunday)
  calculateDaysLeft(endDateStr) {
    try {
      const now = new Date();
      let targetDate;

      if (endDateStr) {
        targetDate = new Date(`${endDateStr}T23:59:59`);
      } else {
        // Next Sunday at 23:59:59
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntilSunday);
        targetDate.setHours(23, 59, 59, 999);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (_) {
      return 7;
    }
  },

  // 3. Evaluate real student progress against the active challenge steps
  async checkChallengeProgress(userId, challenge, preloadedXpEvents = null) {
    if (!userId || !challenge) {
      const defaultSteps = (challenge?.steps || DEFAULT_WEEKLY_CHALLENGE.steps).map((s) => ({
        ...s,
        completed: false
      }));
      return {
        stepsWithStatus: defaultSteps,
        completedStepsCount: 0,
        totalStepsCount: defaultSteps.length,
        isAllCompleted: false,
        isClaimed: false
      };
    }

    try {
      // Load user progress, song mastery, and xp_events in parallel
      const [progRes, masteryRes, xpRes] = await Promise.all([
        progressService.getUserProgress(userId),
        progressService.getUserSongMastery(userId),
        preloadedXpEvents ? Promise.resolve({ data: preloadedXpEvents }) : progressService.getUserXpEvents(userId)
      ]);

      const userProgress = progRes?.data || [];
      const songMastery = masteryRes?.data || [];
      const xpEvents = xpRes?.data || [];

      // Check if XP reward was already claimed for this challenge/week
      const challengeRefKey = challenge.week_key || challenge.id || 'weekly_challenge';
      const isClaimed = xpEvents.some(
        (ev) => ev.source === 'weekly_magic_challenge' && (ev.ref === challengeRefKey || ev.ref === challenge.id)
      );

      const steps = challenge.steps || DEFAULT_WEEKLY_CHALLENGE.steps;

      const stepsWithStatus = steps.map((step) => {
        let isDone = false;
        const targetId = step.target_id;

        switch (step.type) {
          case 'LESSON': {
            // Check if matching lesson is marked completed in user_progress
            const matchLesson = userProgress.find(
              (p) => String(p.lesson_id).toLowerCase() === String(targetId || challenge.lesson_id).toLowerCase()
            );
            isDone = Boolean(matchLesson?.completed === true || matchLesson?.progress_percent === 100 || matchLesson?.steps?.video);
            break;
          }

          case 'PRACTICE': {
            // Check if matching song has practice steps done in song_mastery
            const matchSong = songMastery.find(
              (m) => String(m.song_id).toLowerCase() === String(targetId || challenge.song_id).toLowerCase()
            );
            isDone = Boolean(
              matchSong?.step_reverse_translation ||
              matchSong?.step_final_challenge ||
              matchSong?.mastery_percent > 0 ||
              matchSong?.xp_claimed_at
            );
            break;
          }

          case 'PRONUNCIATION': {
            // Check if matching song has pronunciation / sing_along done in song_mastery
            const matchSong = songMastery.find(
              (m) => String(m.song_id).toLowerCase() === String(targetId || challenge.song_id).toLowerCase()
            );
            const minScore = Number(step.min_score) || 80;
            isDone = Boolean(
              matchSong?.step_sing_along ||
              (matchSong?.mastery_percent && matchSong.mastery_percent >= minScore) ||
              matchSong?.step_reverse_translation
            );
            break;
          }

          case 'QUIZ': {
            const matchSong = songMastery.find(
              (m) => String(m.song_id).toLowerCase() === String(targetId || challenge.song_id).toLowerCase()
            );
            isDone = Boolean(matchSong?.step_final_challenge);
            break;
          }

          default: {
            isDone = false;
            break;
          }
        }

        return {
          ...step,
          completed: isDone
        };
      });

      const completedStepsCount = stepsWithStatus.filter((s) => s.completed).length;
      const totalStepsCount = stepsWithStatus.length;
      const isAllCompleted = totalStepsCount > 0 && completedStepsCount === totalStepsCount;

      return {
        stepsWithStatus,
        completedStepsCount,
        totalStepsCount,
        isAllCompleted,
        isClaimed
      };
    } catch (err) {
      console.warn('Erro ao avaliar progresso do desafio semanal:', err);
      const fallbackSteps = (challenge.steps || []).map((s) => ({ ...s, completed: false }));
      return {
        stepsWithStatus: fallbackSteps,
        completedStepsCount: 0,
        totalStepsCount: fallbackSteps.length,
        isAllCompleted: false,
        isClaimed: false
      };
    }
  },

  // 4. Claim weekly challenge XP via RPC grant_xp
  async claimWeeklyChallengeXp(challenge) {
    if (!isSupabaseConfigured) {
      return { success: true, amount: challenge?.xp_reward || 300, message: 'Modo local: XP resgatado com sucesso!' };
    }

    try {
      const challengeRefKey = challenge.week_key || challenge.id || 'weekly_challenge';

      const { data, error } = await supabase.rpc('grant_xp', {
        p_source: 'weekly_magic_challenge',
        p_ref: challengeRefKey
      });

      if (error) throw error;

      return {
        success: Boolean(data?.granted),
        amount: data?.amount || challenge?.xp_reward || 300,
        total_xp: data?.total_xp,
        level: data?.level,
        message: data?.message || 'Recompensa do desafio semanal resgatada com sucesso!'
      };
    } catch (err) {
      console.error('Erro ao resgatar XP do desafio semanal via RPC grant_xp:', err);
      return {
        success: false,
        amount: 0,
        message: err.message || 'Erro ao resgatar recompensa do desafio semanal.'
      };
    }
  }
};

export default weeklyChallengeService;
