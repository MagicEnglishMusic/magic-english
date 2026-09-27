import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { LEADERBOARDS } from '../data/rankingData';

export const rankingService = {
  // Fetch leaderboard ranking
  async getRankingLeaderboard() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
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
        const formatted = data.map((item, index) => {
          const weeklyXp = Number(item.weekly_xp) || 0;
          const totalXp = Number(item.total_xp) || 0;
          const displayXp = weeklyXp || totalXp || 0;

          return {
            id: item.id || `rank-${index}`,
            userId: item.user_id,
            name: item.profiles?.name || 'Aluno Magic',
            avatar: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            level: item.profiles?.level || 'Nível 1',
            weeklyXp: weeklyXp,
            totalXp: totalXp,
            xp: displayXp,
            streak: Number(item.streak ?? item.profiles?.streak) || 0,
            rank: index + 1,
            league: item.league || 'Liga Bronze',
            leagueIcon: item.league_icon || '🌱',
            trend: item.trend || 'stable',
            tag: item.tag || (index === 0 ? '🥇 1º Lugar' : index === 1 ? '🥈 2º Lugar' : index === 2 ? '🥉 3º Lugar' : null)
          };
        });
        return { data: formatted, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('Error fetching ranking from Supabase:', err.message);
      return { data: [], error: err.message };
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
