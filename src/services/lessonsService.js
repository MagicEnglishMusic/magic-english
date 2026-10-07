import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDriveImageUrl } from '../utils/googleDriveHelper';

export const lessonsService = {
  // Get all lessons (Admin)
  async getAllLessons() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
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
      const formatted = (data || []).map((l) => {
        const thumb = getDriveImageUrl(l.thumbnail_url || l.thumbnail || '');
        return {
          ...l,
          thumbnail_url: thumb,
          thumbnail: thumb,
          image: thumb
        };
      });
      return { data: formatted, error: null };
    } catch (err) {
      console.warn('Error fetching all lessons from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Get lessons by module ID
  async getLessonsByModule(moduleId) {
    if (!isSupabaseConfigured || !moduleId) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      const formatted = (data || []).map((l) => {
        const thumb = getDriveImageUrl(l.thumbnail_url || l.thumbnail || '');
        return {
          ...l,
          thumbnail_url: thumb,
          thumbnail: thumb,
          image: thumb
        };
      });
      return { data: formatted, error: null };
    } catch (err) {
      console.warn('Error fetching lessons by module from Supabase:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Get single lesson details with song & materials
  async getLessonDetails(lessonId) {
    if (!isSupabaseConfigured || !lessonId) {
      return { data: null, error: null };
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
      if (lesson) {
        const thumb = getDriveImageUrl(lesson.thumbnail_url || lesson.thumbnail || '');
        lesson.thumbnail_url = thumb;
        lesson.thumbnail = thumb;
        lesson.image = thumb;
      }
      return { data: lesson, error: null };
    } catch (err) {
      return { data: null, error: err.message };
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
