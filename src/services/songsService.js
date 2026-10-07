import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDriveImageUrl } from '../utils/googleDriveHelper';

/**
 * Normalizes and formats a song database record with defensive fallbacks
 * without injecting invented strings or fallback data.
 */
function formatSongRecord(raw) {
  if (!raw) return null;

  const timestamps = Array.isArray(raw.timestamps) && raw.timestamps.length > 0
    ? raw.timestamps
    : Array.isArray(raw.lyricsTimestamps) && raw.lyricsTimestamps.length > 0
      ? raw.lyricsTimestamps
      : Array.isArray(raw.lyrics) && raw.lyrics.length > 0
        ? raw.lyrics
        : [];

  const lyrics_en = raw.lyrics_en || raw.lyricsEn || (Array.isArray(raw.lyrics) ? raw.lyrics.map((l) => l.en || l.english || '').filter(Boolean).join('\n') : '');
  const lyrics_pt = raw.lyrics_pt || raw.lyricsPt || (Array.isArray(raw.lyrics) ? raw.lyrics.map((l) => l.pt || l.portuguese || '').filter(Boolean).join('\n') : '');

  const formattedCover = getDriveImageUrl(raw.cover_url || raw.coverUrl || raw.image || '');

  return {
    ...raw,
    id: raw.id,
    title: raw.title || '',
    artist: raw.artist || '',
    module_id: raw.module_id || null,
    moduleId: raw.module_id || null,
    lesson_id: raw.lesson_id || null,
    lessonId: raw.lesson_id || null,
    lyrics_en,
    lyrics_pt,
    lyrics: Array.isArray(raw.lyrics) && raw.lyrics.length > 0 ? raw.lyrics : timestamps,
    timestamps,
    lyricsTimestamps: timestamps,
    pronunciation_guide: Array.isArray(raw.pronunciation_guide) ? raw.pronunciation_guide : (Array.isArray(raw.pronunciationGuide) ? raw.pronunciationGuide : []),
    audio_url: raw.audio_url || raw.audioUrl || '',
    audioUrl: raw.audio_url || raw.audioUrl || '',
    cover_url: formattedCover,
    image: formattedCover,
    bpm: raw.bpm || '',
    duration: raw.duration || '',
    xpReward: raw.xpReward ?? raw.xp_reward ?? null,
    xp_reward: raw.xp_reward ?? raw.xpReward ?? null,
    level: raw.level || ''
  };
}

export const songsService = {
  // Fetch all songs (raw data for admin and lists)
  async getSongs() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error fetching songs from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Get single song by ID (normalized)
  async getSongById(id) {
    if (!isSupabaseConfigured || !id) {
      return { data: null, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data ? formatSongRecord(data) : null, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Get real song for a lesson with 4 priorities and fallback handling (SSOT resolution)
  async getSongForLesson({ lessonId = null, moduleId = null, lessonTitle = '', songTitle = '', songId = null, id = null } = {}) {
    if (!isSupabaseConfigured) {
      return { data: null, error: null };
    }

    try {
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching song for lesson:', error.message);
        return { data: null, error: error.message };
      }

      if (!allSongs || allSongs.length === 0) {
        return { data: null, error: null };
      }

      const targetSongId = songId || id;

      // Priority 1: Direct lesson_id match
      if (lessonId) {
        const directMatch = allSongs.find((s) => s.lesson_id === lessonId);
        if (directMatch) return { data: formatSongRecord(directMatch), error: null };
      }

      // Priority 2: Direct song id match
      if (targetSongId) {
        const idMatch = allSongs.find((s) => s.id === targetSongId);
        if (idMatch) return { data: formatSongRecord(idMatch), error: null };
      }

      // Priority 3: module_id match (only when song is not assigned to another lesson)
      if (moduleId) {
        const modMatch = allSongs.find((s) => s.module_id === moduleId && !s.lesson_id);
        if (modMatch) return { data: formatSongRecord(modMatch), error: null };
      }

      // Priority 4: Title exact or partial match
      const cleanLesTitle = (lessonTitle || '').toLowerCase().trim();
      const cleanSngTitle = (songTitle || '').toLowerCase().trim();

      if (cleanSngTitle) {
        const titleMatch = allSongs.find((s) => (s.title || '').toLowerCase().trim() === cleanSngTitle);
        if (titleMatch) return { data: formatSongRecord(titleMatch), error: null };
      }

      if (cleanLesTitle) {
        const contentMatch = allSongs.find((s) => {
          const st = (s.title || '').toLowerCase().trim();
          return st && (cleanLesTitle.includes(st) || st.includes(cleanLesTitle));
        });
        if (contentMatch) return { data: formatSongRecord(contentMatch), error: null };
      }

      // No match found without error
      return { data: null, error: null };
    } catch (err) {
      console.error('Error fetching song for lesson:', err.message);
      return { data: null, error: err.message };
    }
  },

  // Alias for backward compatibility
  async findSongForLesson(params) {
    return songsService.getSongForLesson(params);
  },

  // Single Source of Truth: Create Song with automatic distribution payload
  async createSong(songData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `sng-${Date.now()}`, ...songData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Update song
  async updateSong(id, updates) {
    if (!isSupabaseConfigured) {
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Delete song
  async deleteSong(id) {
    if (!isSupabaseConfigured) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
