import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { LEADERBOARDS } from '../data/rankingData';

export const rankingService = {
  // Fetch leaderboard ranking
  async getRankingLeaderboard() {
    if (!isSupabaseConfigured) {
      return { data: LEADERBOARDS.weekly, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('ranking')
        .select(`
          *,
          profiles (name, avatar_url, level)
        `)
        .order('weekly_xp', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formatted = data.map((item, index) => ({
          id: item.id,
          name: item.profiles?.name || 'Aluno Magic',
          avatar: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          level: item.profiles?.level || 'Nível 1',
          weeklyXp: item.weekly_xp,
          totalXp: item.total_xp,
          rank: index + 1,
          league: item.league
        }));
        return { data: formatted, error: null };
      }

      return { data: LEADERBOARDS.weekly, error: null };
    } catch (err) {
      console.warn('Fallback to local ranking:', err.message);
      return { data: LEADERBOARDS.weekly, error: null };
    }
  },

  // Save new achievement / reward for user
  async unlockReward(userId, reward) {
    if (!isSupabaseConfigured || !userId) {
      return { success: true, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('rewards')
        .insert([{
          user_id: userId,
          title: reward.title,
          description: reward.description,
          xp_amount: reward.xp || 50,
          badge_icon: reward.icon || '🏆',
          badge_category: reward.category || 'geral'
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
};
