import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ADMIN_STATS, INITIAL_ADMIN_STUDENTS, RECENT_ACTIVITIES } from '../data/adminData';
import { getDriveImageUrl } from '../utils/googleDriveHelper';

export const adminService = {
  // Fetch dashboard summary statistics
  async getDashboardStats() {
    if (!isSupabaseConfigured) {
      return {
        data: {
          totalStudents: 0,
          totalModules: 0,
          totalLessons: 0,
          totalSongs: 0,
          totalContentTime: '0h'
        },
        error: null
      };
    }

    try {
      const [
        { count: studentsCount, error: errStudents },
        { count: modulesCount, error: errModules },
        { count: lessonsCount, error: errLessons },
        { count: songsCount, error: errSongs }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('modules').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('songs').select('*', { count: 'exact', head: true })
      ]);

      if (errStudents || errModules || errLessons || errSongs) {
        console.warn('Error fetching counts from Supabase:', errStudents || errModules || errLessons || errSongs);
      }

      // Fetch lessons to calculate total duration if available
      let totalMinutes = 0;
      const { data: lessonsData } = await supabase.from('lessons').select('duration');
      if (lessonsData && lessonsData.length > 0) {
        lessonsData.forEach((l) => {
          const match = (l.duration || '').match(/\d+/);
          if (match) totalMinutes += parseInt(match[0], 10);
        });
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const totalContentTime = totalMinutes > 0 
        ? (hours > 0 ? `${hours}h${minutes > 0 ? `${minutes}min` : ''}` : `${minutes}min`)
        : '0h';

      return {
        data: {
          totalStudents: studentsCount || 0,
          totalModules: modulesCount || 0,
          totalLessons: lessonsCount || 0,
          totalSongs: songsCount || 0,
          totalContentTime
        },
        error: null
      };
    } catch (err) {
      console.warn('Dashboard stats fallback:', err.message);
      return {
        data: {
          totalStudents: 0,
          totalModules: 0,
          totalLessons: 0,
          totalSongs: 0,
          totalContentTime: '0h'
        },
        error: err.message
      };
    }
  },

  // Fetch real students from profiles table
  async getStudents() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      const formatted = data.map((std) => ({
        id: std.id,
        name: std.name || 'Aluno Sem Nome',
        email: std.email || 'sem-email@magicenglish.com',
        avatar: std.avatar_url ? getDriveImageUrl(std.avatar_url) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        level: std.level || 'Nível 1 • First Steps',
        xp: std.xp || 0,
        streak: std.streak || 0,
        lastAccess: std.updated_at 
          ? new Date(std.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
          : 'Hoje',
        status: std.role === 'admin' ? 'Administrador' : (std.access_status || 'active'),
        plan: std.plan || (std.role === 'admin' ? 'Super Admin' : 'VIP Pro'),
        accessStatus: std.access_status || 'active',
        kiwifyOrderId: std.kiwify_order_id || null,
        role: std.role || 'student'
      }));

      return { data: formatted, error: null };
    } catch (err) {
      console.warn('Error fetching students:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Fetch recent system activities (clean in production when no activity logs)
  async getRecentActivities() {
    return { data: [], error: null };
  },

  // Create student manually via Edge Function (preserving admin session)
  async createStudent(studentData) {
    if (!isSupabaseConfigured) {
      return { 
        data: { id: `std-${Date.now()}`, ...studentData }, 
        error: null 
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-student', {
        body: {
          action: 'create',
          name: studentData.name,
          email: studentData.email,
          password: studentData.password,
          plan: studentData.plan || 'VIP Pro',
          access_status: studentData.access_status || 'active',
          kiwify_order_id: studentData.kiwify_order_id || `MANUAL-${Date.now()}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { data: data?.data || data, error: null };
    } catch (err) {
      console.warn('Erro ao criar aluno via Edge Function:', err.message);
      return { data: null, error: err.message };
    }
  },

  // Update student access status or plan
  async updateStudentStatus(userId, statusData) {
    if (!isSupabaseConfigured || !userId) {
      return { data: null, error: 'Supabase não configurado ou ID ausente.' };
    }

    try {
      const payload = {
        updated_at: new Date().toISOString()
      };
      if (statusData.access_status !== undefined) payload.access_status = statusData.access_status;
      if (statusData.plan !== undefined) payload.plan = statusData.plan;
      if (statusData.is_suspended !== undefined) payload.is_suspended = Boolean(statusData.is_suspended);

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Erro ao atualizar status do aluno:', err.message);
      return { data: null, error: err.message };
    }
  }
};
