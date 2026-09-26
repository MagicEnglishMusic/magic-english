import React from 'react';
import { SONG_MASTERY_CHECKLIST, SONG_MASTERY_STATUS } from '../../data/gamificationData';
import SongMasteryBadge from './SongMasteryBadge';
import { Sparkles, CheckCircle2, Circle, Trophy, Zap } from 'lucide-react';

export default function SongMasteryWidget({
  songMastery,
  onToggleStep,
  className = ""
}) {
  const {
    songId = "song-hello",
    title = "Hello Song",
    subtitle = "Greetings & First Impressions",
    image = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    status = "practicing",
    checklist = {},
    masteredAt = ""
  } = songMastery || {};

  const totalSteps = SONG_MASTERY_CHECKLIST.length;
  const completedCount = Object.values(checklist || {}).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const isMastered = status === 'mastered' || completedCount === totalSteps;

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#090b14] border ${
      isMastered ? 'border-emerald-500/40 shadow-emerald-950/30' : 'border-purple-500/25'
    } shadow-xl space-y-4 ${className}`}>
      {/* Header with cover and status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={image}
            alt={title}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/30 shadow-md flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Domínio da Canção
            </span>
            <h4 className="text-sm font-extrabold text-white truncate">
              {title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        <SongMasteryBadge status={status} size="md" />
      </div>

      {/* Progress towards mastery */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Etapas para Domínio</span>
          <span className="text-white font-bold">{completedCount} de {totalSteps} completas ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-[#181c2f] h-2 rounded-full overflow-hidden p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMastered
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-sm shadow-purple-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 5-Step Checklist */}
      <div className="space-y-2 pt-1 border-t border-[#1d2238]">
        {SONG_MASTERY_CHECKLIST.map((step) => {
          const isDone = Boolean(checklist[step.id]);

          return (
            <div
              key={step.id}
              onClick={() => onToggleStep && onToggleStep(songId, step.id, !isDone)}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-[#121524] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span className="text-sm">{step.icon}</span>
                <span>{step.label}</span>
              </div>

              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mastery Reward Banner */}
      {isMastered ? (
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-emerald-300">🎉 Música Dominada!</p>
              <p className="text-[10px] text-slate-400">Você dominou o vocabulário e o ritmo desta canção.</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-amber-400" /> +100 XP
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Complete as 5 etapas para dominar</span>
          <span className="text-amber-400 font-bold">+100 XP ao dominar</span>
        </div>
      )}
    </div>
  );
}
