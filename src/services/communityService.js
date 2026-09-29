import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const LOCAL_STORAGE_POSTS_KEY = 'magic_english_community_posts';
const LOCAL_STORAGE_GROUPS_KEY = 'magic_english_joined_groups';
const LOCAL_STORAGE_SETTINGS_KEY = 'magic_english_community_settings';
const COMMUNITY_CHANNEL_NAME = 'magic_community_realtime';

// Shared Realtime Channel Instance
let realtimeChannel = null;

function getRealtimeChannel() {
  if (!realtimeChannel && isSupabaseConfigured) {
    try {
      realtimeChannel = supabase.channel(COMMUNITY_CHANNEL_NAME, {
        config: { broadcast: { self: true } }
      });
      realtimeChannel.subscribe();
    } catch (err) {
      console.warn('Realtime channel subscription error:', err);
    }
  }
  return realtimeChannel;
}

function broadcastEvent(event, payload) {
  // 1. Supabase Realtime Broadcast (Cross-device / Cross-user)
  const ch = getRealtimeChannel();
  if (ch) {
    try {
      ch.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (_) {}
  }

  // 2. Local DOM Event (Cross-component in same window)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`community_${event}`, { detail: payload }));
  }
}

export const communityService = {
  // Get all community posts
  async getPosts(groupId = null) {
    let posts = [];

    if (isSupabaseConfigured) {
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
        if (!error && data && data.length > 0) {
          posts = data.map((item) => ({
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
        }
      } catch (err) {
        console.warn('Supabase community posts query error, using local fallback:', err.message);
      }
    }

    // If no posts from Supabase or offline, read local storage
    if (posts.length === 0) {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          posts = Array.isArray(parsed) ? parsed : [];
        }
      } catch (_) {
        posts = [];
      }
    }

    if (groupId) {
      return { data: posts.filter((p) => p.group_id === groupId || !p.group_id), error: null };
    }

    return { data: posts, error: null };
  },

  // Create a new post
  async createPost({ userId, authorName, authorAvatar, authorLevel, authorStreak, title, content, type = 'achievement', groupId = null }) {
    const newPost = {
      id: `post-${Date.now()}`,
      user_id: userId || 'local-user',
      author: {
        name: authorName || 'Você',
        avatar: authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        level: authorLevel || 'Iniciante',
        streak: authorStreak || 1
      },
      type,
      title: title || '',
      content,
      likes: 0,
      comments: 0,
      commentsList: [],
      timeAgo: 'Agora mesmo',
      group_id: groupId,
      created_at: new Date().toISOString()
    };

    // 1. Try Supabase
    if (isSupabaseConfigured && userId) {
      try {
        await supabase
          .from('community_posts')
          .insert([{
            id: newPost.id,
            user_id: userId,
            author_name: newPost.author.name,
            author_avatar: newPost.author.avatar,
            author_level: newPost.author.level,
            author_streak: newPost.author.streak,
            title: newPost.title,
            content: newPost.content,
            type: newPost.type,
            group_id: newPost.group_id,
            likes_count: 0,
            comments_count: 0,
            comments_list: []
          }]);
      } catch (err) {
        console.warn('Supabase post create fallback to local:', err.message);
      }
    }

    // 2. Persist to local storage
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || '[]');
      const updated = [newPost, ...local];
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    // 3. Broadcast real-time across all clients
    broadcastEvent('post_created', { post: newPost });

    return { data: newPost, error: null };
  },

  // Delete a post (Moderation / Admin & Author)
  async deletePost(postId) {
    // 1. Delete from Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId);
      } catch (err) {
        console.warn('Supabase post delete error:', err.message);
      }
    }

    // 2. Delete from local storage
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || '[]');
      const updated = local.filter((p) => p.id !== postId);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    // 3. Broadcast real-time deletion
    broadcastEvent('post_deleted', { postId });

    return { success: true };
  },

  // Add Comment to Post
  async addComment(postId, comment) {
    const fullComment = {
      id: comment.id || `comm-${Date.now()}`,
      author: comment.author || 'Aluno Magic',
      avatar: comment.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      text: comment.text || '',
      time: comment.time || 'Agora mesmo',
      created_at: new Date().toISOString()
    };

    // 1. Update in local storage
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || '[]');
      const updated = local.map((p) => {
        if (p.id === postId) {
          const list = p.commentsList || p.comments_list || [];
          const nextList = [...list.filter((c) => c.id !== fullComment.id), fullComment];
          return {
            ...p,
            comments: nextList.length,
            commentsList: nextList,
            comments_list: nextList
          };
        }
        return p;
      });
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    // 2. Update in Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: current } = await supabase.from('community_posts').select('comments_list, comments_count').eq('id', postId).single();
        if (current) {
          const currentList = current.comments_list || [];
          const nextList = [...currentList.filter((c) => c.id !== fullComment.id), fullComment];
          await supabase.from('community_posts').update({
            comments_count: nextList.length,
            comments_list: nextList
          }).eq('id', postId);
        }
      } catch (err) {
        console.warn('Supabase add comment error:', err.message);
      }
    }

    broadcastEvent('comment_added', { postId, comment: fullComment });
    return { data: fullComment, success: true };
  },

  // Delete Comment (Moderation)
  async deleteComment(postId, commentId) {
    // 1. Update in local storage
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || '[]');
      const updated = local.map((p) => {
        if (p.id === postId) {
          const list = (p.commentsList || p.comments_list || []).filter((c) => c.id !== commentId);
          return {
            ...p,
            comments: list.length,
            commentsList: list,
            comments_list: list
          };
        }
        return p;
      });
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    // 2. Update in Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: current } = await supabase.from('community_posts').select('comments_list').eq('id', postId).single();
        if (current) {
          const updatedList = (current.comments_list || []).filter((c) => c.id !== commentId);
          await supabase.from('community_posts').update({
            comments_count: updatedList.length,
            comments_list: updatedList
          }).eq('id', postId);
        }
      } catch (err) {
        console.warn('Supabase delete comment error:', err.message);
      }
    }

    // 3. Broadcast real-time deletion
    broadcastEvent('comment_deleted', { postId, commentId });
    return { success: true };
  },

  // Like a post
  async likePost(postId) {
    let newLikes = 0;
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || '[]');
      const updated = local.map((p) => {
        if (p.id === postId) {
          newLikes = (p.likes || 0) + 1;
          return { ...p, likes: newLikes };
        }
        return p;
      });
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('increment_post_likes', { post_id: postId });
      } catch (_) {}
    }

    broadcastEvent('post_liked', { postId, likes: newLikes });
    return { success: true };
  },

  // Get joined groups for current user
  getJoinedGroups(userId) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_GROUPS_KEY}_${userId || 'anon'}`);
      return stored ? JSON.parse(stored) : ['grp-1']; // Default to Beginners group
    } catch (_) {
      return ['grp-1'];
    }
  },

  // Toggle joining / leaving a group
  toggleJoinGroup(userId, groupId) {
    try {
      const key = `${LOCAL_STORAGE_GROUPS_KEY}_${userId || 'anon'}`;
      const joined = this.getJoinedGroups(userId);
      let updated;
      let isJoined = false;

      if (joined.includes(groupId)) {
        updated = joined.filter((id) => id !== groupId);
        isJoined = false;
      } else {
        updated = [...joined, groupId];
        isJoined = true;
      }

      localStorage.setItem(key, JSON.stringify(updated));
      return { success: true, isJoined, joinedGroups: updated };
    } catch (_) {
      return { success: false, isJoined: false, joinedGroups: [] };
    }
  },

  // Fetch Community Settings from Supabase SSOT with local fallback
  async fetchCommunitySettings() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'community')
          .single();

        if (!error && data?.value) {
          const remoteSettings = data.value;
          try {
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(remoteSettings));
          } catch (_) {}
          return remoteSettings;
        }
      } catch (err) {
        console.warn('Supabase app_settings query error, using local fallback:', err.message);
      }
    }

    return this.getCommunitySettings();
  },

  // Get Community Interaction Settings (Cached Synchronous)
  getCommunitySettings() {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (local) return JSON.parse(local);
    } catch (_) {}
    return {
      isPostingEnabled: true,
      maintenanceMessage: 'O mural da comunidade está em manutenção temporária.'
    };
  },

  // Subscribe to community settings updates in real time (Supabase Realtime + local DOM)
  subscribeToSettings(callback) {
    if (typeof window === 'undefined') return () => {};

    // 1. Supabase Realtime Broadcast Listener
    let ch = getRealtimeChannel();
    if (ch) {
      ch.on('broadcast', { event: 'settings_update' }, ({ payload }) => {
        if (payload) {
          try {
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(payload));
          } catch (_) {}
          callback(payload);
        }
      });
    }

    // 2. Custom DOM event (same-tab immediate feedback)
    const handleCustomEvent = (e) => {
      if (e.detail) callback(e.detail);
      else callback(this.getCommunitySettings());
    };

    // 3. Storage event (cross-tab on same machine)
    const handleStorageEvent = (e) => {
      if (e.key === LOCAL_STORAGE_SETTINGS_KEY) {
        callback(this.getCommunitySettings());
      }
    };

    window.addEventListener('community_settings_update', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('community_settings_update', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  },

  // Subscribe to Realtime Community Feed Events (create, delete, comments)
  subscribeToFeed(callback) {
    if (typeof window === 'undefined') return () => {};

    const ch = getRealtimeChannel();
    if (ch) {
      ch.on('broadcast', { event: 'post_created' }, ({ payload }) => callback({ type: 'post_created', ...payload }));
      ch.on('broadcast', { event: 'post_deleted' }, ({ payload }) => callback({ type: 'post_deleted', ...payload }));
      ch.on('broadcast', { event: 'comment_added' }, ({ payload }) => callback({ type: 'comment_added', ...payload }));
      ch.on('broadcast', { event: 'comment_deleted' }, ({ payload }) => callback({ type: 'comment_deleted', ...payload }));
      ch.on('broadcast', { event: 'post_liked' }, ({ payload }) => callback({ type: 'post_liked', ...payload }));
    }

    const handleLocalCreate = (e) => callback({ type: 'post_created', ...e.detail });
    const handleLocalDelete = (e) => callback({ type: 'post_deleted', ...e.detail });
    const handleLocalCommentAdd = (e) => callback({ type: 'comment_added', ...e.detail });
    const handleLocalCommentDel = (e) => callback({ type: 'comment_deleted', ...e.detail });

    window.addEventListener('community_post_created', handleLocalCreate);
    window.addEventListener('community_post_deleted', handleLocalDelete);
    window.addEventListener('community_comment_added', handleLocalCommentAdd);
    window.addEventListener('community_comment_deleted', handleLocalCommentDel);

    return () => {
      window.removeEventListener('community_post_created', handleLocalCreate);
      window.removeEventListener('community_post_deleted', handleLocalDelete);
      window.removeEventListener('community_comment_added', handleLocalCommentAdd);
      window.removeEventListener('community_comment_deleted', handleLocalCommentDel);
    };
  },

  // Update Community Settings (Admin)
  async updateCommunitySettings(settings) {
    // 1. Update in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('app_settings')
          .upsert({
            key: 'community',
            value: settings,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Supabase app_settings upsert error:', err.message);
      }
    }

    // 2. Update local storage cache
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}

    // 3. Broadcast update across all Supabase Realtime subscribers worldwide
    broadcastEvent('settings_update', settings);

    return { success: true };
  }
};

