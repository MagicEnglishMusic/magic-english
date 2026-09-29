import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { magicSongsList } from '../data/mockData';
import { defaultSongLesson } from '../data/songLessonData';

export const songsService = {
  // Fetch all songs
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

  // Get single song by ID
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
      return { data: data || null, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Find the exact real song for a lesson (SSOT resolution)
  async findSongForLesson({ lessonId = null, moduleId = null, lessonTitle = '', songTitle = '' } = {}) {
    if (!isSupabaseConfigured) {
      return { data: null, error: null };
    }

    try {
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !allSongs || allSongs.length === 0) {
        return { data: null, error: error?.message || 'No songs found' };
      }

      // Priority 1: Direct lesson_id match
      if (lessonId) {
        const directMatch = allSongs.find((s) => s.lesson_id === lessonId);
        if (directMatch) return { data: directMatch, error: null };
      }

      // Priority 2: Title exact or partial match
      const cleanLesTitle = (lessonTitle || '').toLowerCase().trim();
      const cleanSngTitle = (songTitle || '').toLowerCase().trim();

      if (cleanSngTitle) {
        const titleMatch = allSongs.find((s) => (s.title || '').toLowerCase().trim() === cleanSngTitle);
        if (titleMatch) return { data: titleMatch, error: null };
      }

      if (cleanLesTitle) {
        const contentMatch = allSongs.find((s) => {
          const st = (s.title || '').toLowerCase().trim();
          return st && (cleanLesTitle.includes(st) || st.includes(cleanLesTitle));
        });
        if (contentMatch) return { data: contentMatch, error: null };
      }

      // Priority 3: module_id match
      if (moduleId) {
        const modMatch = allSongs.find((s) => s.module_id === moduleId);
        if (modMatch) return { data: modMatch, error: null };
      }

      // No match found
      return { data: null, error: null };
    } catch (err) {
      console.warn('Error in findSongForLesson:', err.message);
      return { data: null, error: err.message };
    }
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
