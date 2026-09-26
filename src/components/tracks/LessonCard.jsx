import React from 'react';
import { Play, CheckCircle2, Lock, Music, Clock, Sparkles } from 'lucide-react';

export default function LessonCard({ lesson, onSelectLesson }) {
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in_progress';
  const isLocked = lesson.status === 'locked';

  const handleClick = () => {
    if (!isLocked && onSelectLesson) {
      onSelectLesson(lesson);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
        isLocked
          ? 'bg-[#0d0f1a]/60 border-slate-800/60 opacity-60 cursor-not-allowed'
          : isInProgress
          ? 'bg-gradient-to-r from-purple-950/40 via-[#15182e] to-[#101324] border-purple-500/60 shadow-xl shadow-purple-600/15 cursor-pointer hover:border-purple-400 hover:scale-[1.01]'
          : 'bg-[#111424] border-[#1d2238] hover:border-purple-500/40 hover:bg-[#161a2f] cursor-pointer hover:scale-[1.01]'
      }`}
    >
      {/* Left: Status Icon & Lesson Info */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Status Indicator Icon */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-md transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : isInProgress
              ? 'bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-purple-600/40 animate-pulse'
              : 'bg-[#181c30] text-slate-500 border border-slate-800'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isInProgress ? (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400">
              Aula {lesson.number}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {lesson.type}
            </span>
          </div>

          <h4
            className={`text-base font-bold truncate ${
              isLocked ? 'text-slate-400' : 'text-white'
            }`}
          >
            {lesson.title}
          </h4>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {lesson.duration}
            </span>
            <span>•</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              +{lesson.xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Right: Status Label & Action Button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isCompleted && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            Concluído
          </span>
        )}
        {isInProgress && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40 animate-pulse">
            Em andamento
          </span>
        )}
        {isLocked && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full">
            Bloqueada
          </span>
        )}

        {!isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isInProgress
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30 hover:opacity-90'
                : 'bg-[#181d32] hover:bg-purple-600 hover:text-white text-slate-300'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">{isCompleted ? 'Revisar' : 'Praticar'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
