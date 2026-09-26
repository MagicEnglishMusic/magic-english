import React from 'react';
import { Trophy, Music, Mic, Flame, BookOpen, Crown, Sparkles, Zap } from 'lucide-react';
import { SPECIAL_RANKINGS } from '../../data/rankingData';

export default function SpecialRankingCard({
  categories = SPECIAL_RANKINGS,
  className = ""
}) {
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            Destaques por Habilidade
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Rankings por Categorias Especiais</span>
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          4 Especialidades
        </span>
      </div>

      {/* 4 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-[#15192e] to-[#0c0e18] border ${cat.border} shadow-lg flex flex-col justify-between space-y-4`}
          >
            <div className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#1a1d33] border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  {cat.leader.badge}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-white">
                  {cat.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {cat.subtitle}
                </p>
              </div>

              {/* Current Category Leader */}
              <div className="p-3 rounded-xl bg-[#101322] border border-[#1e233b] flex items-center gap-2.5">
                <img
                  src={cat.leader.avatar}
                  alt={cat.leader.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-amber-400/40"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {cat.leader.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {cat.leader.value}
                  </p>
                </div>
              </div>
            </div>

            {/* User Personal Stat */}
            <div className="pt-2 border-t border-[#1d2238] text-[11px] text-purple-300 font-semibold">
              {cat.userStat}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
