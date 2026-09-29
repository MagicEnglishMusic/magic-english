import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const LOCAL_PROGRESS_PREFIX = 'magic_english_user_progress_';
const LOCAL_MASTERY_PREFIX = 'magic_english_song_mastery_';

export const progressService = {
  // Get user progress for all lessons (Supabase + LocalStorage fallback)
  async getUserProgress(userId) {
    const key = `${LOCAL_PROGRESS_PREFIX}${userId || 'guest'}`;
    let localData = [];
    try {
      const stored = localStorage.getItem(key);
      if (stored) localData = JSON.parse(stored);
    } catch (_) {}

    if (!isSupabaseConfigured || !userId) {
      return { data: localData, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase user_progress error, using local fallback:', error.message);
        return { data: localData, error: null };
      }

      const merged = data && data.length > 0 ? data : localData;
      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (_) {}

      return { data: merged, error: null };
    } catch (err) {
      return { data: localData, error: null };
    }
  },

  // Save or update lesson progress
  async saveLessonProgress(userId, lessonId, progressPercent, completed = false) {
    const key = `${LOCAL_PROGRESS_PREFIX}${userId || 'guest'}`;
    const payload = {
      user_id: userId || 'guest',
      lesson_id: lessonId,
      progress_percent: progressPercent,
      completed: completed,
      last_accessed: new Date().toISOString(),
      ...(completed ? { completed_at: new Date().toISOString() } : {})
    };

    // 1. Save immediately to LocalStorage
    try {
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = current.filter((p) => p.lesson_id !== lessonId);
      const updated = [...filtered, payload];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (_) {}

    // 2. Persist to Supabase if configured and user is logged in
    if (!isSupabaseConfigured || !userId || userId === 'guest') {
      return { data: payload, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(payload, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) throw error;
      return { data: data || payload, error: null };
    } catch (err) {
      return { data: payload, error: null };
    }
  },

  // Get Song Mastery list (Supabase + LocalStorage)
  async getSongMastery(userId) {
    const key = `${LOCAL_MASTERY_PREFIX}${userId || 'guest'}`;
    let localData = [];
    try {
      const stored = localStorage.getItem(key);
      if (stored) localData = JSON.parse(stored);
    } catch (_) {}

    if (!isSupabaseConfigured || !userId) {
      return { data: localData, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('song_mastery')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase song_mastery error, using local fallback:', error.message);
        return { data: localData, error: null };
      }

      const merged = data && data.length > 0 ? data : localData;
      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (_) {}

      return { data: merged, error: null };
    } catch (err) {
      return { data: localData, error: null };
    }
  },

  // Update 5-Step Song Mastery
  async updateSongMastery(userId, songId, stepUpdates) {
    const key = `${LOCAL_MASTERY_PREFIX}${userId || 'guest'}`;
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (_) {}

    const existingLocal = localList.find((s) => s.song_id === songId) || {
      user_id: userId || 'guest',
      song_id: songId,
      step_video: false,
      step_song: false,
      step_reverse_translation: false,
      step_sing_along: false,
      step_final_challenge: false
    };

    const merged = {
      ...existingLocal,
      ...stepUpdates,
      updated_at: new Date().toISOString()
    };

    const completedSteps = [
      merged.step_video,
      merged.step_song,
      merged.step_reverse_translation,
      merged.step_sing_along,
      merged.step_final_challenge
    ].filter(Boolean).length;

    merged.mastery_percent = Math.round((completedSteps / 5) * 100);

    // 1. Save immediately to LocalStorage
    try {
      const filtered = localList.filter((s) => s.song_id !== songId);
      const updatedList = [...filtered, merged];
      localStorage.setItem(key, JSON.stringify(updatedList));
    } catch (_) {}

    // 2. Persist to Supabase if configured and logged in
    if (!isSupabaseConfigured || !userId || userId === 'guest') {
      return { data: merged, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('song_mastery')
        .upsert(merged, { onConflict: 'user_id,song_id' })
        .select()
        .single();

      if (error) {
        console.warn('Supabase song_mastery upsert notice:', error.message);
      }
      return { data: data || merged, error: null };
    } catch (err) {
      return { data: merged, error: null };
    }
  },

  // Reset 5-Step Song Mastery for practicing again from zero (without touching XP)
  async resetSongMastery(userId, songId) {
    const key = `${LOCAL_MASTERY_PREFIX}${userId || 'guest'}`;
    const resetPayload = {
      user_id: userId || 'guest',
      song_id: songId,
      step_video: false,
      step_song: false,
      step_reverse_translation: false,
      step_sing_along: false,
      step_final_challenge: false,
      mastery_percent: 0,
      updated_at: new Date().toISOString()
    };

    // 1. Reset LocalStorage immediately
    try {
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = current.filter((s) => s.song_id !== songId);
      const updated = [...filtered, resetPayload];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (_) {}

    // 2. Reset Supabase
    if (!isSupabaseConfigured || !userId || userId === 'guest') {
      return { data: resetPayload, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('song_mastery')
        .upsert(resetPayload, { onConflict: 'user_id,song_id' })
        .select()
        .single();

      if (error) throw error;
      return { data: data || resetPayload, error: null };
    } catch (err) {
      return { data: resetPayload, error: null };
    }
  }
};
