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
      console.error('Erro ao salvar progresso da aula:', err);
      return { data: null, error: err.message };
    }
  },

  // Save or update lesson steps in user_progress (Keeps completed = false until explicit action, merges steps cleanly)
  async saveLessonProgressSteps(userId, lessonId, steps = {}) {
    const key = `${LOCAL_PROGRESS_PREFIX}${userId || 'guest'}`;
    const allSteps = ['video', 'song', 'pronunciation', 'practice'];

    // Retrieve existing from localStorage as optimistic fallback
    let localCompleted = false;
    let localExistingSteps = {};
    try {
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const found = current.find((p) => p.lesson_id === lessonId);
      if (found) {
        if (found.completed) localCompleted = true;
        if (found.steps && typeof found.steps === 'object') localExistingSteps = found.steps;
      }
    } catch (_) {}

    // 1. Supabase (source of truth)
    if (isSupabaseConfigured && userId && userId !== 'guest' && lessonId) {
      try {
        // Fetch existing row from Supabase to merge without losing data
        const { data: existingRow, error: fetchErr } = await supabase
          .from('user_progress')
          .select('steps, completed, progress_percent')
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (fetchErr) {
          console.warn('Aviso ao consultar progresso existente no Supabase:', fetchErr.message);
        }

        const dbSteps = (existingRow?.steps && typeof existingRow.steps === 'object') ? existingRow.steps : {};
        const isCompleted = Boolean(existingRow?.completed || localCompleted);

        // Merge steps
        const mergedSteps = {
          ...dbSteps,
          ...localExistingSteps,
          ...steps
        };

        // Merge pronunciation_done array without duplicates
        const dbDone = Array.isArray(dbSteps.pronunciation_done) ? dbSteps.pronunciation_done : [];
        const localDone = Array.isArray(localExistingSteps.pronunciation_done) ? localExistingSteps.pronunciation_done : [];
        const incomingDone = Array.isArray(steps?.pronunciation_done) ? steps.pronunciation_done : [];
        const cleanDone = Array.from(
          new Set([...dbDone, ...localDone, ...incomingDone].map(Number).filter((n) => !isNaN(n)))
        ).sort((a, b) => a - b);
        mergedSteps.pronunciation_done = cleanDone;

        // Smart Sync: Se qualquer etapa posterior (song, pronunciation, practice) estiver concluída,
        // o vídeo é automaticamente marcado como true
        const hasPosteriorStep = Boolean(
          mergedSteps.song ||
          mergedSteps.pronunciation ||
          mergedSteps.pronunciation_completed ||
          mergedSteps.practice ||
          (Array.isArray(mergedSteps.pronunciation_done) && mergedSteps.pronunciation_done.length > 0)
        );
        if (hasPosteriorStep) {
          mergedSteps.video = true;
        }

        const completedCount = allSteps.filter((k) => Boolean(mergedSteps[k])).length;
        const progressPercent = isCompleted ? 100 : Math.round((completedCount / allSteps.length) * 100);

        const payload = {
          user_id: userId,
          lesson_id: lessonId,
          steps: mergedSteps,
          progress_percent: progressPercent,
          completed: isCompleted,
          last_accessed: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('user_progress')
          .upsert(payload, { onConflict: 'user_id,lesson_id' })
          .select()
          .single();

        if (error) {
          console.error('Erro ao salvar passos da aula no Supabase:', error);
          return { data: null, error: error };
        }

        // Sync local storage on success
        try {
          const current = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = current.filter((p) => p.lesson_id !== lessonId);
          const updated = [...filtered, data || payload];
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (_) {}

        return { data: data || payload, error: null };
      } catch (err) {
        console.error('Erro ao salvar passos da aula no Supabase:', err);
        return { data: null, error: err.message || err };
      }
    }

    // Local fallback when offline
    const mergedSteps = { ...localExistingSteps, ...steps };
    if (steps?.pronunciation_done) {
      const cleanDone = Array.from(
        new Set([...(localExistingSteps.pronunciation_done || []), ...steps.pronunciation_done].map(Number).filter((n) => !isNaN(n)))
      ).sort((a, b) => a - b);
      mergedSteps.pronunciation_done = cleanDone;
    }

    // Smart Sync fallback: Se qualquer etapa posterior foi feita, vídeo torna-se true
    const hasPosteriorStep = Boolean(
      mergedSteps.song ||
      mergedSteps.pronunciation ||
      mergedSteps.pronunciation_completed ||
      mergedSteps.practice ||
      (Array.isArray(mergedSteps.pronunciation_done) && mergedSteps.pronunciation_done.length > 0)
    );
    if (hasPosteriorStep) {
      mergedSteps.video = true;
    }

    const completedCount = allSteps.filter((k) => Boolean(mergedSteps[k])).length;
    const progressPercent = localCompleted ? 100 : Math.round((completedCount / allSteps.length) * 100);

    const payload = {
      user_id: userId || 'guest',
      lesson_id: lessonId,
      steps: mergedSteps,
      progress_percent: progressPercent,
      completed: localCompleted,
      last_accessed: new Date().toISOString()
    };

    try {
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = current.filter((p) => p.lesson_id !== lessonId);
      const updated = [...filtered, payload];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (_) {}

    return { data: payload, error: null };
  },

  // Complete lesson atomically (WHERE completed = false RETURNING *)
  async completeLessonProgress(userId, lessonId) {
    if (!isSupabaseConfigured || !userId || userId === 'guest' || !lessonId) {
      return { success: false, error: 'Usuário não logado ou Supabase offline.' };
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .eq('completed', false)
        .select();

      if (error) throw error;

      if (data && data.length === 1) {
        // Sync local storage
        const key = `${LOCAL_PROGRESS_PREFIX}${userId}`;
        try {
          const current = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = current.map((p) => (p.lesson_id === lessonId ? { ...p, completed: true, completed_at: data[0].completed_at } : p));
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (_) {}

        return { success: true, data: data[0], error: null };
      }

      return { success: false, data: null, error: 'Aula já estava marcada como concluída.' };
    } catch (err) {
      console.error('Erro ao completar aula atomicamente:', err);
      return { success: false, data: null, error: err.message };
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

      // Merge Supabase data with LocalStorage data (taking highest challenge_index and boolean trues)
      const dbList = data || [];
      const merged = dbList.map((dbItem) => {
        const localItem = localData.find((l) => l.song_id === dbItem.song_id);
        if (!localItem) return dbItem;
        return {
          ...dbItem,
          step_video: Boolean(dbItem.step_video || localItem.step_video),
          step_song: Boolean(dbItem.step_song || localItem.step_song),
          step_reverse_translation: Boolean(dbItem.step_reverse_translation || localItem.step_reverse_translation),
          step_sing_along: Boolean(dbItem.step_sing_along || localItem.step_sing_along),
          step_final_challenge: Boolean(dbItem.step_final_challenge || localItem.step_final_challenge),
          challenge_index: Math.max(Number(dbItem.challenge_index) || 0, Number(localItem.challenge_index) || 0)
        };
      });

      // Add any local items not present in DB
      for (const localItem of localData) {
        if (!merged.some((m) => m.song_id === localItem.song_id)) {
          merged.push(localItem);
        }
      }

      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (_) {}

      return { data: merged, error: null };
    } catch (err) {
      return { data: localData, error: null };
    }
  },

  // Alias for getSongMastery
  async getUserSongMastery(userId) {
    return this.getSongMastery(userId);
  },

  // Update 5-Step Song Mastery
  async updateSongMastery(userId, songId, stepUpdates = {}) {
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
      step_final_challenge: false,
      challenge_index: 0
    };

    // Calculate highest challenge_index
    const newChallengeIndex = stepUpdates.challenge_index !== undefined
      ? Math.max(Number(existingLocal.challenge_index) || 0, Number(stepUpdates.challenge_index) || 0)
      : (Number(existingLocal.challenge_index) || 0);

    const hasPosteriorMastery = Boolean(
      (stepUpdates.step_song ?? existingLocal.step_song) ||
      (stepUpdates.step_reverse_translation ?? existingLocal.step_reverse_translation) ||
      (stepUpdates.step_sing_along ?? existingLocal.step_sing_along) ||
      (stepUpdates.step_final_challenge ?? existingLocal.step_final_challenge)
    );

    const merged = {
      ...existingLocal,
      ...stepUpdates,
      step_video: Boolean(hasPosteriorMastery || (stepUpdates.step_video ?? existingLocal.step_video)),
      step_song: Boolean(stepUpdates.step_song ?? existingLocal.step_song),
      step_reverse_translation: Boolean(stepUpdates.step_reverse_translation ?? existingLocal.step_reverse_translation),
      step_sing_along: Boolean(stepUpdates.step_sing_along ?? existingLocal.step_sing_along),
      step_final_challenge: Boolean(stepUpdates.step_final_challenge ?? existingLocal.step_final_challenge),
      challenge_index: newChallengeIndex,
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
        // Fallback se a coluna challenge_index ainda não existir no banco de produção
        if (error.message && error.message.toLowerCase().includes('challenge_index')) {
          console.warn('[progressService] Coluna challenge_index não encontrada no Supabase. Salvando localmente e persistindo sem a coluna no banco:', error.message);
          const { challenge_index, ...withoutChallengeCol } = merged;
          const retryRes = await supabase
            .from('song_mastery')
            .upsert(withoutChallengeCol, { onConflict: 'user_id,song_id' })
            .select()
            .single();

          if (!retryRes.error) {
            return { data: { ...(retryRes.data || withoutChallengeCol), challenge_index: merged.challenge_index }, error: null };
          }
        }
        console.warn('Supabase song_mastery upsert notice:', error.message);
        return { data: merged, error: null };
      }
      return { data: data || merged, error: null };
    } catch (err) {
      console.error('Erro ao atualizar maestria da música no Supabase:', err);
      return { data: merged, error: null };
    }
  },

  // Claim Song XP atomically in Supabase
  async claimSongXp(userId, songId) {
    if (!isSupabaseConfigured || !userId || userId === 'guest' || !songId) {
      return { success: false, error: 'Usuário não logado ou Supabase indisponível' };
    }

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('song_mastery')
        .update({
          xp_claimed_at: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('song_id', songId)
        .is('xp_claimed_at', null)
        .select();

      if (error) throw error;
      if (data && data.length >= 1) {
        return { success: true, data: data[0], error: null };
      }
      return { success: true, data: null, error: null };
    } catch (err) {
      console.error('Erro ao resgatar XP da música no Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Reset / Repeat practice helper (safe: never regresses step_* flags, challenge_index, or xp_claimed_at)
  async resetSongMastery(userId, songId) {
    if (!songId) return { data: null, error: null };
    try {
      const key = `${LOCAL_MASTERY_PREFIX}${userId || 'guest'}`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const match = current.find((s) => s.song_id === songId) || { song_id: songId };
      return { data: match, error: null };
    } catch (_) {
      return { data: null, error: null };
    }
  },

  // Grant XP securely via PostgreSQL Function (grant_xp)
  async grantXp(source, ref) {
    if (!isSupabaseConfigured) {
      return { success: false, data: null, error: 'Supabase não configurado.' };
    }

    let normalizedRef = String(ref || '').trim();
    if (['lesson_complete', 'song_claim', 'song_mastery', 'practice_complete', 'pronunciation_complete'].includes(source)) {
      normalizedRef = normalizedRef.toLowerCase();
    } else if (source === 'daily_challenge') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const suffix = normalizedRef.includes(':')
        ? normalizedRef.split(':').slice(1).join(':').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)
        : '';
      normalizedRef = suffix ? `${today}:${suffix}` : today;
    } else if (source === 'conversation_daily') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      normalizedRef = normalizedRef || `conversation_daily_${today}`;
    }

    try {
      const { data, error } = await supabase.rpc('grant_xp', {
        p_source: source,
        p_ref: normalizedRef
      });

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (err) {
      console.error(`Erro ao conceder XP no servidor (${source}/${normalizedRef}):`, err);
      return { success: false, data: null, error: err.message };
    }
  },

  // Fetch XP events for user (weekly calendar real dates)
  async getUserXpEvents(userId) {
    if (!isSupabaseConfigured || !userId) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('xp_events')
        .select('created_at, amount, source, ref')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Aviso ao consultar xp_events:', err.message);
      return { data: [], error: err.message };
    }
  }
};
