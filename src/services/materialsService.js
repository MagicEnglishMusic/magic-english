import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { materialsList } from '../data/materialsData';

export const materialsService = {
  // Fetch materials (optionally filter by lessonId)
  async getMaterials(lessonId = null) {
    if (!isSupabaseConfigured) {
      return { data: materialsList, error: null };
    }

    try {
      let query = supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data && data.length > 0 ? data : materialsList, error: null };
    } catch (err) {
      console.warn('Fallback to local materials:', err.message);
      return { data: materialsList, error: null };
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
