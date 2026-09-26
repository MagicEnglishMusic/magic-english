import React, { useState } from 'react';
import { Sparkles, Trophy, Flame, Award, Filter } from 'lucide-react';
import CommunityPost from './CommunityPost';

export default function CommunityFeed({ posts }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'achievements' | 'modules' | 'streaks'

  const filteredPosts = posts.filter((post) => {
    if (filter === 'achievements') return post.type === 'achievement';
    if (filter === 'modules') return post.type === 'module_completed';
    if (filter === 'streaks') return post.type === 'streak';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Feed Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1c2035]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Feed em Tempo Real
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Evolução da Comunidade</span>
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'achievements', label: '🏆 Conquistas' },
            { id: 'modules', label: '✈️ Módulos' },
            { id: 'streaks', label: '🔥 Sequências' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === f.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#121526] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <CommunityPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
