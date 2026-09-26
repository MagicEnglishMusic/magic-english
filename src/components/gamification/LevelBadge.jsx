import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

export default function LevelBadge({
  level = 2,
  title = "Music Learner",
  icon = "🎵",
  subtitle = "Aprendendo através do ritmo.",
  variant = "pill", // 'pill' | 'card' | 'avatar-tag'
  className = ""
}) {
  if (variant === 'avatar-tag') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-blue-500/20 border border-purple-500/30 text-purple-300 shadow-sm ${className}`}>
        <span className="text-xs">{icon}</span>
        <span className="text-[11px] font-bold tracking-tight">Nível {level} • {title}</span>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131728] border border-purple-500/30 shadow-lg shadow-purple-500/10 ${className}`}>
        <span className="text-base">{icon}</span>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Nível {level}</span>
          <span className="text-xs font-extrabold text-slate-100">{title}</span>
        </div>
      </div>
    );
  }

  // 'card' variant: Large visually stunning badge
  return (
    <div className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-[#161a2e] to-[#0e111e] border border-purple-500/30 shadow-xl group ${className}`}>
      {/* Glow background aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30 flex-shrink-0">
          <div className="w-full h-full bg-[#0c0e17] rounded-[14px] flex items-center justify-center text-2xl">
            {icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
              Nível {level}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>

          <h3 className="text-base font-extrabold text-white mt-1 truncate">
            {title}
          </h3>

          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">
              "{subtitle}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
