import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Zap, Sparkles, Trophy, Tv, Music, Brain, Mic } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';

export default function LessonProgress({ 
  onCompleteLesson, 
  onNextLesson, 
  nextLesson, 
  lessonId,
  initialSteps = { video: false, song: false, pronunciation: false, practice: false }
}) {
  const [completedSteps, setCompletedSteps] = useState(initialSteps);
  const [isCompleted, setIsCompleted] = useState(false);
  const { addXp, recordLessonProgress } = useGamification();

  const stepsList = [
    { key: 'video', label: '1. Vídeo da Aula', desc: 'Assista ao vídeo explicativo', icon: Tv },
    { key: 'song', label: '2. Magic Song Fixação', desc: 'Ouça o áudio e acompanhe a letra', icon: Music },
    { key: 'pronunciation', label: '3. Pronúncia IA', desc: 'Grave e valide sua voz no Voice Lab', icon: Mic },
    { key: 'practice', label: '4. Prática Musical', desc: 'Faça a tradução reversa dos versos', icon: Brain },
  ];

  const toggleStep = (key) => {
    if (isCompleted) return;
    setCompletedSteps((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const isAllStepsDone = completedCount === 4;

  const handleComplete = () => {
    if (!isAllStepsDone || isCompleted) return;
    setIsCompleted(true);
    if (recordLessonProgress) {
      recordLessonProgress(lessonId || 'b0000001-0000-0000-0000-000000000001', 100, true);
    }
    addXp(XP_REWARDS.COMPLETE_LESSON, 'Aula Oficial Concluída!', {
      showModal: true,
      type: 'xp',
      title: '📚 Aula Concluída com Sucesso!',
      subtitle: 'Você concluiu o vídeo e todos os 4 passos de fixação.',
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
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          isCompleted || isAllStepsDone
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
            : 'text-purple-300 bg-purple-500/10 border-purple-500/20'
        }`}>
          {isCompleted ? '100% Concluída' : `${completedCount}/4 Passos`}
        </span>
      </div>

      {/* Progress Checklist */}
      <div className="space-y-3">
        {stepsList.map((step) => {
          const isDone = Boolean(completedSteps[step.key]) || isCompleted;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              onClick={() => toggleStep(step.key)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer select-none group ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-[#131626] border-slate-800 text-slate-300 hover:border-purple-500/40 hover:bg-[#181c30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors ${
                    isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#181c30] text-purple-400 group-hover:bg-purple-600/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold block">{step.label}</span>
                  <span className="text-[10px] text-slate-400">{step.desc}</span>
                </div>
              </div>

              {isDone ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluído</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold group-hover:text-purple-300">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Pendente</span>
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
          disabled={!isAllStepsDone || isCompleted}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
            isCompleted
              ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 cursor-default'
              : isAllStepsDone
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 cursor-not-allowed opacity-75'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Aula Concluída (+{XP_REWARDS.COMPLETE_LESSON} XP Resgatados!)</span>
            </>
          ) : isAllStepsDone ? (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Concluir Aula (+{XP_REWARDS.COMPLETE_LESSON} XP)</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Complete os 4 passos para concluir ({completedCount}/4)</span>
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
