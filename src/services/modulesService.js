import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDriveImageUrl } from '../utils/googleDriveHelper';

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
        const formattedSimple = (simpleData || []).map((m) => ({
          ...m,
          banner_url: getDriveImageUrl(m.banner_url || m.image || '')
        }));
        return { data: formattedSimple, error: null };
      }

      // Compute dynamic counts from relation arrays and format banner_url
      const formatted = (data || []).map((m) => ({
        ...m,
        banner_url: getDriveImageUrl(m.banner_url || m.image || ''),
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
  },

  // Update order of modules (Admin Drag & Drop)
  // Preserves all IDs, relationships and contents; updates ONLY order_index
  async updateModulesOrder(orderedModules) {
    if (!isSupabaseConfigured || !Array.isArray(orderedModules) || orderedModules.length === 0) {
      return { success: true, error: null };
    }

    try {
      const updatePromises = orderedModules.map((mod, index) => {
        const newOrder = index + 1;
        return supabase
          .from('modules')
          .update({
            order_index: newOrder,
            updated_at: new Date().toISOString()
          })
          .eq('id', mod.id);
      });

      const results = await Promise.all(updatePromises);
      const firstError = results.find((r) => r && r.error);
      if (firstError) {
        throw new Error(firstError.error.message);
      }

      return { success: true, error: null };
    } catch (err) {
      console.warn('Error updating modules order in Supabase:', err.message);
      return { success: false, error: err.message };
    }
  }
};

