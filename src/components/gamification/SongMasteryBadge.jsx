import React from 'react';
import { SONG_MASTERY_STATUS } from '../../data/gamificationData';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function SongMasteryBadge({
  status = 'learning', // 'not_started' | 'learning' | 'practicing' | 'mastered'
  size = 'md', // 'sm' | 'md' | 'lg'
  showText = true,
  className = ''
}) {
  const statusConfig = {
    not_started: SONG_MASTERY_STATUS.NOT_STARTED,
    learning: SONG_MASTERY_STATUS.LEARNING,
    practicing: SONG_MASTERY_STATUS.PRACTICING,
    mastered: SONG_MASTERY_STATUS.MASTERED
  }[status] || SONG_MASTERY_STATUS.NOT_STARTED;

  const isMastered = status === 'mastered';

  if (size === 'sm') {
    return (
      <span
        title={`Status: ${statusConfig.label}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} ${className}`}
      >
        <span>{statusConfig.icon}</span>
        {showText && <span>{statusConfig.label}</span>}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} ${
        isMastered ? 'shadow-emerald-500/20 ring-1 ring-emerald-400/40 animate-pulse' : ''
      } ${className}`}
    >
      <span className="text-sm">{statusConfig.icon}</span>
      {showText && (
        <span className="tracking-tight">
          {statusConfig.label}
          {isMastered && ' 🎉'}
        </span>
      )}
    </div>
  );
}
