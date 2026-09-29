import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const modulesService = {
  // Fetch all modules ordered with dynamic lessons and songs count
  async getModules() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      // Fetch modules with nested count if possible, fallback to standard select
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          lessons (id),
          songs (id)
        `)
        .order('order_index', { ascending: true });

      if (error) {
        // Fallback to simple select if relations aren't configured with foreign keys in join
        const { data: simpleData, error: simpleError } = await supabase
          .from('modules')
          .select('*')
          .order('order_index', { ascending: true });

        if (simpleError) throw simpleError;
        return { data: simpleData || [], error: null };
      }

      // Compute dynamic counts from relation arrays
      const formatted = (data || []).map((m) => ({
        ...m,
        lessons_count: Array.isArray(m.lessons) ? m.lessons.length : (m.lessons_count || 0),
        songs_count: Array.isArray(m.songs) ? m.songs.length : (m.songs_count || 0)
      }));

      return { data: formatted, error: null };
    } catch (err) {
      console.warn('Error fetching modules from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Create new module (Admin)
  async createModule(moduleData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `mod-${Date.now()}`, ...moduleData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([moduleData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Update existing module
  async updateModule(id, updates) {
    if (!isSupabaseConfigured) {
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('modules')
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

  // Delete module
  async deleteModule(id) {
    if (!isSupabaseConfigured) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
