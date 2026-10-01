import React from 'react';
import { CheckCircle2, Circle, Clock, Zap, Trophy, Tv, Music, Brain, Mic, ArrowRight } from 'lucide-react';
import { XP_REWARDS } from '../../data/gamificationData';

export default function LessonProgress({ 
  lessonId,
  steps = { video: false, song: false, pronunciation: false, pronunciation_completed: false, practice: false },
  pronunciationMeta = { done: 0, required: 25 },
  isCompleted = false,
  onCompleteLesson, 
  onNextLesson, 
  nextLesson
}) {
  const reqPronunciation = pronunciationMeta?.required || 0;
  const donePronunciation = pronunciationMeta?.done || 0;
  const isPronunciationApplicable = reqPronunciation > 0;
  const isPronunciationDone = isPronunciationApplicable
    ? Boolean(steps.pronunciation_completed || steps.pronunciation || isCompleted)
    : true;

  const stepsList = [
    { 
      key: 'video', 
      label: '1. Vídeo da Aula', 
      desc: 'Assista ao vídeo da aula até o fim', 
      icon: Tv,
      isDone: Boolean(steps.video) || isCompleted
    },
    { 
      key: 'song', 
      label: '2. Magic Song Fixação', 
      desc: 'Ouça o áudio da canção completa', 
      icon: Music,
      isDone: Boolean(steps.song) || isCompleted
    },
    { 
      key: 'pronunciation', 
      label: '3. Pronúncia IA', 
      desc: !isPronunciationApplicable
        ? 'Passo não aplicável para esta aula (sem palavras)'
        : (isPronunciationDone 
            ? 'Todos os termos fonéticos validados com sucesso'
            : `Valide ${reqPronunciation} termos no Voice Lab (${donePronunciation}/${reqPronunciation})`),
      icon: Mic,
      isDone: isPronunciationDone,
      isNotApplicable: !isPronunciationApplicable
    },
    { 
      key: 'practice', 
      label: '4. Prática Musical', 
      desc: 'Conclua a tradução reversa das frases', 
      icon: Brain,
      isDone: Boolean(steps.practice) || isCompleted
    },
  ];

  const completedCount = stepsList.filter((s) => s.isDone).length;
  const isAllStepsDone = completedCount === stepsList.length;

  const handleComplete = () => {
    if (!isAllStepsDone || isCompleted) return;
    if (onCompleteLesson) {
      onCompleteLesson(XP_REWARDS.COMPLETE_LESSON || 100);
    }
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
          {isCompleted ? '100% Concluída' : `${completedCount}/${stepsList.length} Passos`}
        </span>
      </div>

      {/* Progress Checklist (Automático por eventos reais) */}
      <div className="space-y-3">
        {stepsList.map((step) => {
          const isDone = step.isDone;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all select-none ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-[#131626] border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors ${
                    isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#181c30] text-purple-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold block">{step.label}</span>
                  <span className="text-[10px] text-slate-400">{step.desc}</span>
                </div>
              </div>

              {step.isNotApplicable ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span>Opcional</span>
                </div>
              ) : isDone ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluído</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
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
              <span>Tarefa Concluída (+{XP_REWARDS.COMPLETE_LESSON || 100} XP Resgatados!)</span>
            </>
          ) : isAllStepsDone ? (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Concluir Aula (+{XP_REWARDS.COMPLETE_LESSON || 100} XP)</span>
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
          <div className="p-3.5 rounded-2xl bg-[#131626] border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-bold text-purple-400">
                {nextLesson.lessonNumber || 'Próxima'}
              </span>
              <p className="text-xs font-bold text-white truncate">
                {nextLesson.title}
              </p>
            </div>
            <button
              onClick={onNextLesson}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors flex-shrink-0 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
