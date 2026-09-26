import React, { useState } from 'react';
import { Award, Trophy, Flame, Sparkles, Heart, CheckCircle2, MessageCircle } from 'lucide-react';

export default function CommunityPost({ post }) {
  const [claps, setClaps] = useState(post.claps);
  const [hasClapped, setHasClapped] = useState(post.isClapped || false);

  const handleClap = () => {
    if (!hasClapped) {
      setClaps(claps + 1);
      setHasClapped(true);
    } else {
      setClaps(claps - 1);
      setHasClapped(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#111426] border border-[#1e233b] hover:border-purple-500/40 transition-all space-y-4 shadow-xl group">
      
      {/* Post Author Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-purple-500/40 group-hover:ring-purple-400 transition-all flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {post.author.name}
            </h4>
            <span className="text-[11px] text-purple-300 font-medium">
              {post.author.level}
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {post.time}
        </span>
      </div>

      {/* Main Achievement Message */}
      <div className="p-4 rounded-2xl bg-[#161a2e] border border-[#222846] space-y-3">
        <p className="text-sm sm:text-base font-bold text-white leading-snug">
          {post.message}
        </p>

        {/* Highlighted Badge / XP Pill */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.badgeIcon}</span>
            <span className="text-xs font-extrabold text-slate-200">
              {post.badgeTitle}
            </span>
          </div>

          <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30">
            +{post.xpAwarded} XP
          </span>
        </div>
      </div>

      {/* Interactive Actions Footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          onClick={handleClap}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            hasClapped
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
              : 'bg-[#181c33] text-purple-300 hover:text-white hover:bg-purple-600/30 border border-purple-500/30'
          }`}
        >
          <span className="text-sm">👏</span>
          <span>{hasClapped ? 'Parabenizado!' : 'Parabenizar'}</span>
          <span className="text-[11px] font-mono font-black ml-1 bg-black/30 px-1.5 py-0.2 rounded">
            {claps}
          </span>
        </button>

        <span className="text-slate-500 text-[11px]">
          Comunidade Magic English ✨
        </span>
      </div>

    </div>
  );
}
