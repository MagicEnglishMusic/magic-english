import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { learningTracks } from '../data/mockData';

export const modulesService = {
  // Fetch all modules ordered
  async getModules() {
    if (!isSupabaseConfigured) {
      return { data: learningTracks, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data && data.length > 0 ? data : learningTracks, error: null };
    } catch (err) {
      console.warn('Fallback to local modules:', err.message);
      return { data: learningTracks, error: null };
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
