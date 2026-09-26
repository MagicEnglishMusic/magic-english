import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const progressService = {
  // Get user progress for all lessons
  async getUserProgress(userId) {
    if (!isSupabaseConfigured || !userId) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  },

  // Save or update lesson progress
  async saveLessonProgress(userId, lessonId, progressPercent, completed = false) {
    if (!isSupabaseConfigured || !userId) {
      return { success: true, error: null };
    }

    try {
      const payload = {
        user_id: userId,
        lesson_id: lessonId,
        progress_percent: progressPercent,
        completed: completed,
        last_accessed: new Date().toISOString(),
        ...(completed ? { completed_at: new Date().toISOString() } : {})
      };

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(payload, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Update 5-Step Song Mastery
  async updateSongMastery(userId, songId, stepUpdates) {
    if (!isSupabaseConfigured || !userId) {
      return { success: true, error: null };
    }

    try {
      const { data: existing } = await supabase
        .from('song_mastery')
        .select('*')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .single();

      const merged = {
        ...(existing || {
          user_id: userId,
          song_id: songId,
          step_video: false,
          step_song: false,
          step_reverse_translation: false,
          step_sing_along: false,
          step_final_challenge: false
        }),
        ...stepUpdates,
        updated_at: new Date().toISOString()
      };

      // Calculate percentage
      const completedSteps = [
        merged.step_video,
        merged.step_song,
        merged.step_reverse_translation,
        merged.step_sing_along,
        merged.step_final_challenge
      ].filter(Boolean).length;

      merged.mastery_percent = Math.round((completedSteps / 5) * 100);

      const { data, error } = await supabase
        .from('song_mastery')
        .upsert(merged, { onConflict: 'user_id,song_id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
};
