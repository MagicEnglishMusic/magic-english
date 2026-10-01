import React from 'react';
import { SONG_MASTERY_CHECKLIST, SONG_MASTERY_STATUS } from '../../data/gamificationData';
import SongMasteryBadge from './SongMasteryBadge';
import { Sparkles, CheckCircle2, Circle, Trophy, Zap } from 'lucide-react';

export default function SongMasteryWidget({
  songMastery,
  onToggleStep,
  onClaimXp,
  className = ""
}) {
  const [isClaiming, setIsClaiming] = React.useState(false);

  const {
    id,
    songId = id || "song",
    title = "Música Magic",
    subtitle = "Magic Song",
    image = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    status = "not_started",
    checklist = {},
    xpClaimed = false
  } = songMastery || {};

  const targetSongId = songId || id;

  // Avaliação estrita das 5 etapas reais
  const isVideo = Boolean(checklist.watched_lesson || checklist.step_video);
  const isSong = Boolean(checklist.listened_full || checklist.step_song);
  const isReverse = Boolean(checklist.reverse_translation || checklist.step_reverse_translation);
  const isSing = Boolean(checklist.sing_along || checklist.step_sing_along);
  const isChallenge = Boolean(checklist.final_challenge || checklist.step_final_challenge);

  const stepState = {
    watched_lesson: isVideo,
    listened_full: isSong,
    reverse_translation: isReverse,
    sing_along: isSing,
    final_challenge: isChallenge
  };

  const completedCount = [isVideo, isSong, isReverse, isSing, isChallenge].filter(Boolean).length;
  const totalSteps = 5;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  
  // A música SÓ é dominada quando TODAS as 5 etapas estiverem concluídas
  const isMastered = completedCount === 5;

  // Regra de status visual: 0 = not_started, 1-2 = learning, 3-4 = practicing, 5 = mastered
  let currentStatus = 'not_started';
  if (isMastered) currentStatus = 'mastered';
  else if (completedCount >= 3) currentStatus = 'practicing';
  else if (completedCount >= 1) currentStatus = 'learning';

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

        <SongMasteryBadge status={currentStatus} size="md" />
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
          const isDone = Boolean(stepState[step.id]);

          return (
            <div
              key={step.id}
              onClick={() => onToggleStep && onToggleStep(targetSongId, step.id, !isDone)}
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

      {/* Mastery Reward Banner & Claim Action */}
      {isMastered ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/50 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-5 h-5 text-emerald-400 animate-bounce flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-300">🏆 Música Dominada!</p>
              <p className="text-[10px] text-slate-400 truncate">Você dominou todas as 5 etapas desta canção.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            {xpClaimed ? (
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 cursor-default select-none shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ✓ +100 XP Resgatado
              </span>
            ) : (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isClaiming || !onClaimXp) return;
                  setIsClaiming(true);
                  try {
                    await onClaimXp(targetSongId);
                  } finally {
                    setIsClaiming(false);
                  }
                }}
                disabled={isClaiming}
                className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 border border-amber-300/80 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                {isClaiming ? 'Resgatando...' : '🎁 Resgatar +100 XP'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Complete as 5 etapas para dominar ({completedCount}/5)</span>
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-amber-400" /> +100 XP ao dominar
          </span>
        </div>
      )}
    </div>
  );
}
