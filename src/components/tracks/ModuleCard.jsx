import React from 'react';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import LessonCard from './LessonCard';

export default function ModuleCard({ module, onSelectLesson }) {
  const lessons = module?.lessons || [];
  const totalCount = lessons.length;
  const completedCount = lessons.filter((l) => l?.status === 'completed').length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-[#0d0f1c] border border-[#1e233b] space-y-5 shadow-xl">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b2035]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Módulo
            </span>
            <span className="text-xs text-slate-400">
              {completedCount} de {totalCount} aulas concluídas
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">{module?.title || ''}</h3>
          <p className="text-xs sm:text-sm text-slate-400">{module?.description || ''}</p>
        </div>

        {isAllCompleted ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
            <CheckCircle2 className="w-4 h-4" />
            <span>Módulo Concluído!</span>
          </div>
        ) : (
          <div className="w-32 bg-[#171a2c] h-2 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Lesson Cards List */}
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson?.id}
            lesson={lesson}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
}
