import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const LOCAL_STORAGE_GROUPS_KEY = 'magic_english_joined_groups';

export const communityService = {
  // Get all community posts directly from public.community_posts
  async getPosts(groupId = null) {
    if (!isSupabaseConfigured) {
      return { data: [], error: 'Supabase não configurado.', unavailable: true };
    }

    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles (name, avatar_url, level, streak)
        `)
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const posts = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        author: {
          name: item.author_name || item.profiles?.name || 'Aluno Magic',
          avatar: item.author_avatar || item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          level: item.author_level || item.profiles?.level || 'Iniciante',
          streak: item.author_streak ?? item.profiles?.streak ?? 0
        },
        type: item.type || 'achievement',
        title: item.title || '',
        content: item.content || '',
        likes: Number(item.likes_count) || 0,
        comments: Number(item.comments_count) || (item.comments_list?.length || 0),
        commentsList: item.comments_list || [],
        timeAgo: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : 'Hoje',
        group_id: item.group_id || null,
        created_at: item.created_at
      }));

      return { data: posts, error: null, unavailable: false };
    } catch (err) {
      console.error('Erro ao buscar posts da comunidade:', err);
      return { data: [], error: err.message, unavailable: true };
    }
  },

  // Get list of post IDs liked by the current user from community_likes table
  async getUserLikedPostIds(userId) {
    if (!isSupabaseConfigured || !userId) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', userId);

      if (error) throw error;
      const ids = (data || []).map((row) => row.post_id);
      return { data: ids, error: null };
    } catch (err) {
      console.warn('Aviso ao buscar curtidas do usuário:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Create new post
  async createPost(postData) {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase offline', success: false };
    }

    const postId = `post-${Date.now()}`;
    const payload = {
      id: postId,
      title: postData.title || '',
      content: postData.content || '',
      type: postData.type || 'achievement',
      group_id: postData.group_id || null
    };

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data, success: true, error: null };
    } catch (err) {
      console.error('Erro ao criar post no Supabase:', err);
      return { data: null, error: err.message, success: false };
    }
  },

  // Delete post
  async deletePost(postId) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase offline' };
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      console.error('Erro ao excluir post no Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Toggle Like via RPC toggle_post_like
  async toggleLike(postId) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase offline' };
    }

    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId
      });

      if (error) throw error;
      return { data, success: true, error: null };
    } catch (err) {
      console.error('Erro no toggle_post_like:', err);
      return { success: false, error: err.message };
    }
  },

  // Add comment via RPC add_post_comment
  async addComment(postId, commentText) {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase offline', success: false };
    }

    try {
      const { data, error } = await supabase.rpc('add_post_comment', {
        p_post_id: postId,
        p_text: commentText
      });

      if (error) throw error;
      return { data, success: true, error: null };
    } catch (err) {
      console.error('Erro ao adicionar comentário via RPC:', err);
      return { data: null, error: err.message, success: false };
    }
  },

  // Delete comment via RPC delete_post_comment
  async deleteComment(postId, commentId) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase offline' };
    }

    try {
      const { data, error } = await supabase.rpc('delete_post_comment', {
        p_post_id: postId,
        p_comment_id: commentId
      });

      if (error) throw error;
      return { data, success: true, error: null };
    } catch (err) {
      console.error('Erro ao excluir comentário via RPC:', err);
      return { success: false, error: err.message };
    }
  },

  // Get App Settings
  async getAppSettings(key = 'community') {
    if (!isSupabaseConfigured) {
      return { data: { is_posting_enabled: true, status: 'active' }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return { data: data?.value || null, error: null };
    } catch (err) {
      console.warn('Aviso ao buscar app_settings:', err.message);
      return { data: null, error: err.message };
    }
  },

  // Update App Settings (Admin only)
  async updateAppSettings(key, value) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase offline' };
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, success: true, error: null };
    } catch (err) {
      console.error('Erro ao atualizar app_settings:', err);
      return { success: false, error: err.message };
    }
  },

  // Helper getters/updaters for Community view and manager
  getCommunitySettings() {
    return { isPostingEnabled: true, status: 'active', maintenanceMessage: '' };
  },

  async fetchCommunitySettings() {
    const res = await this.getAppSettings('community');
    if (res.data) {
      const isEnabled = res.data.is_posting_enabled ?? (res.data.status === 'active');
      return {
        isPostingEnabled: isEnabled,
        status: res.data.status || (isEnabled ? 'active' : 'maintenance'),
        maintenanceMessage: res.data.maintenance_message ?? ''
      };
    }
    return { isPostingEnabled: true, status: 'active', maintenanceMessage: '' };
  },

  async updateCommunitySettings(settings) {
    const isEnabled = settings.isPostingEnabled ?? true;
    return this.updateAppSettings('community', {
      is_posting_enabled: isEnabled,
      status: isEnabled ? 'active' : 'maintenance',
      maintenance_message: settings.maintenanceMessage || (isEnabled ? '' : 'O mural da comunidade está em manutenção temporária.')
    });
  },

  subscribeToFeed(callback) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('public:community_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          callback({ type: 'post_created', post: payload.new });
        } else if (payload.eventType === 'DELETE') {
          callback({ type: 'post_deleted', postId: payload.old?.id });
        } else if (payload.eventType === 'UPDATE') {
          callback({ type: 'post_updated', post: payload.new });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToSettings(callback) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('public:app_settings_community')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        if (payload.new?.key === 'community') {
          const val = payload.new.value || {};
          const isEnabled = val.is_posting_enabled ?? (val.status === 'active');
          callback({
            isPostingEnabled: isEnabled,
            status: val.status || (isEnabled ? 'active' : 'maintenance'),
            maintenanceMessage: val.maintenance_message || ''
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Groups management (local state)
  getJoinedGroups() {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY);
      return local ? JSON.parse(local) : ['grp-vip-geral'];
    } catch (_) {
      return ['grp-vip-geral'];
    }
  },

  toggleJoinGroup(userId, groupId) {
    try {
      const current = this.getJoinedGroups();
      const isJoined = current.includes(groupId);
      const next = isJoined
        ? current.filter((g) => g !== groupId)
        : [...current, groupId];
      localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(next));
      return { success: true, isJoined: !isJoined, joinedGroups: next };
    } catch (_) {
      return { success: false, joinedGroups: ['grp-vip-geral'] };
    }
  }
};
