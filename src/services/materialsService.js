import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { materialsList } from '../data/materialsData';

export const materialsService = {
  // Fetch materials (optionally filter by lessonId and/or moduleId without duplicates)
  async getMaterials(lessonId = null, moduleId = null) {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      let query = supabase.from('materials').select('*').order('created_at', { ascending: false });
      
      if (lessonId && moduleId) {
        query = query.or(`lesson_id.eq.${lessonId},module_id.eq.${moduleId}`);
      } else if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Deduplicate by ID
      const seen = new Set();
      const uniqueMaterials = (data || []).filter((item) => {
        if (!item?.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      return { data: uniqueMaterials, error: null };
    } catch (err) {
      console.warn('Error fetching materials from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Create material record
  async createMaterial(materialData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `mat-${Date.now()}`, ...materialData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Update material record
  async updateMaterial(id, updates) {
    if (!isSupabaseConfigured || !id) {
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data || { id, ...updates }, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Delete material
  async deleteMaterial(id) {
    if (!isSupabaseConfigured) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
