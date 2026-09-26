import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Zap, Sparkles, Trophy, Tv, Music, Brain, Mic } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';

export default function LessonProgress({ onCompleteLesson, onNextLesson, nextLesson, lessonId }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const { addXp, recordLessonProgress } = useGamification();

  const items = [
    { label: 'Vídeo da Aula', status: 'done', icon: Tv },
    { label: 'Magic Song Fixação', status: 'done', icon: Music },
    { label: 'Pronúncia IA', status: 'done', icon: Mic },
    { label: 'Prática Musical', status: 'in_progress', icon: Brain },
  ];

  const handleComplete = () => {
    setIsCompleted(true);
    if (recordLessonProgress) {
      recordLessonProgress(lessonId || 'b0000001-0000-0000-0000-000000000001', 100, true);
    }
    addXp(XP_REWARDS.COMPLETE_LESSON, 'Aula Oficial Concluída!', {
      showModal: true,
      type: 'xp',
      title: '📚 Aula Concluída com Sucesso!',
      subtitle: 'Você concluiu o vídeo e as práticas de fixação.',
      icon: '🏆',
      bonusText: `+${XP_REWARDS.COMPLETE_LESSON} Magic XP adicionados à sua jornada!`
    });
    if (onCompleteLesson) onCompleteLesson(XP_REWARDS.COMPLETE_LESSON);
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Sua Evolução na Aula
        </h3>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {isCompleted ? '100% Concluída' : '75% Progresso'}
        </span>
      </div>

      {/* Progress Checklist */}
      <div className="space-y-3">
        {items.map((it, idx) => {
          const isDone = it.status === 'done' || isCompleted;
          const Icon = it.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-[#131626] border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                    isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#181c30] text-purple-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">{it.label}</span>
              </div>

              {isDone ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluído</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-purple-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Em andamento</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button: Concluir Aula */}
      <div className="pt-2">
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
            isCompleted
              ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 cursor-default'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Aula Concluída (+{XP_REWARDS.COMPLETE_LESSON} XP Resgatados!)</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Concluir Aula (+{XP_REWARDS.COMPLETE_LESSON} XP)</span>
            </>
          )}
        </button>
      </div>

      {/* Próxima Aula Preview */}
      {nextLesson && (
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Próxima Aula
          </span>

          <div className="p-3.5 rounded-2xl bg-[#141728] border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={nextLesson.thumbnail}
                alt={nextLesson.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-purple-400">{nextLesson.number}</span>
                <p className="text-xs font-bold text-white truncate">{nextLesson.title}</p>
                <span className="text-[11px] text-slate-400">{nextLesson.duration}</span>
              </div>
            </div>

            <button
              onClick={onNextLesson}
              className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              Continuar ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
