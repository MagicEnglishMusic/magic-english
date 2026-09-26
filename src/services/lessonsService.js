import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { classroomLessonData } from '../data/classroomData';

export const lessonsService = {
  // Get all lessons (Admin)
  async getAllLessons() {
    if (!isSupabaseConfigured) {
      return { data: [classroomLessonData], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          modules (title)
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error fetching all lessons from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Get lessons by module ID
  async getLessonsByModule(moduleId) {
    if (!isSupabaseConfigured) {
      return { data: [classroomLessonData], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error fetching lessons by module from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Get single lesson details with song & materials
  async getLessonDetails(lessonId) {
    if (!isSupabaseConfigured) {
      return { data: classroomLessonData, error: null };
    }

    try {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          songs (*),
          materials (*)
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      return { data: lesson, error: null };
    } catch (err) {
      return { data: classroomLessonData, error: null };
    }
  },

  // Create lesson (Admin)
  async createLesson(lessonData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `les-${Date.now()}`, ...lessonData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // Update lesson
  async updateLesson(id, updates) {
    if (!isSupabaseConfigured) {
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
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

  // Delete lesson
  async deleteLesson(id) {
    if (!isSupabaseConfigured) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
