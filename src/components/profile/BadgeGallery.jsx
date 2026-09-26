import React, { useState } from 'react';
import { Trophy, Lock, CheckCircle2, Zap, Sparkles, Filter } from 'lucide-react';
import AchievementCard from '../gamification/AchievementCard';

export default function BadgeGallery({
  badges = [],
  className = ""
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  const displayedBadges = activeFilter === 'unlocked'
    ? unlockedBadges
    : activeFilter === 'locked'
    ? lockedBadges
    : badges;

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Galeria de Medalhas
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Minhas Conquistas ({unlockedBadges.length}/{badges.length})</span>
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-[#121524] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({badges.length})
          </button>
          <button
            onClick={() => setActiveFilter('unlocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'unlocked'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Conquistadas ({unlockedBadges.length})
          </button>
          <button
            onClick={() => setActiveFilter('locked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'locked'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bloqueadas ({lockedBadges.length})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedBadges.map((badge) => (
          <AchievementCard
            key={badge.id}
            badge={badge}
          />
        ))}
      </div>
    </div>
  );
}
