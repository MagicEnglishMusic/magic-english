import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { magicSongsList } from '../data/mockData';
import { defaultSongLesson } from '../data/songLessonData';

export const songsService = {
  // Fetch all songs
  async getSongs() {
    if (!isSupabaseConfigured) {
      return { data: magicSongsList, error: null };
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
    if (!isSupabaseConfigured) {
      const found = magicSongsList.find((s) => s.id === id) || defaultSongLesson;
      return { data: found, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data || defaultSongLesson, error: null };
    } catch (err) {
      return { data: defaultSongLesson, error: null };
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
