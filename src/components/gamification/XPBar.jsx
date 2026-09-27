import React from 'react';
import { Zap, Sparkles } from 'lucide-react';

export default function XPBar({
  currentXp = 2450,
  minXp = 1000,
  maxXp = 3000,
  progress = 72,
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabels = true,
  showPercentage = true,
  className = ''
}) {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const safeCurrentXp = Number(currentXp) || 0;
  const safeMaxXp = Number(maxXp) || 1000;
  const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>
              <strong className="text-amber-400">{safeCurrentXp.toLocaleString('pt-BR')}</strong>
              <span className="text-slate-500 font-normal"> / {safeMaxXp.toLocaleString('pt-BR')} XP</span>
            </span>
          </div>

          {showPercentage && (
            <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              {safeProgress}%
            </span>
          )}
        </div>
      )}

      {/* Bar container */}
      <div className={`w-full bg-[#151828] border border-[#22273e] rounded-full overflow-hidden p-[2px] ${heightClasses[size] || 'h-2.5'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 shadow-sm shadow-purple-500/50 transition-all duration-700 relative overflow-hidden"
          style={{ width: `${safeProgress}%` }}
        >
          {/* Subtle animated light gleam */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
        </div>
      </div>
    </div>
  );
}
