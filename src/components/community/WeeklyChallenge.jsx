import React from 'react';
import { Target, CheckCircle2, Circle, Sparkles, Award, Users, ArrowRight, Gift, Loader2 } from 'lucide-react';

export default function WeeklyChallenge({ 
  challenge, 
  steps = [], 
  isAllCompleted = false, 
  isClaimed = false, 
  isClaiming = false, 
  onClaimXp, 
  onStartChallenge 
}) {
  // Use dynamic steps if provided, fallback to challenge.steps / challenge.objectives
  const activeSteps = steps.length > 0 
    ? steps 
    : (challenge?.steps || challenge?.objectives || []);

  const completedCount = activeSteps.filter((s) => s.completed).length;
  const xpReward = challenge?.xp_reward || challenge?.xpReward || 300;
  const badgeLabel = challenge?.badge_title || challenge?.badge || 'Magic Starter';
  const badgeIcon = challenge?.badge_icon || '🌟';

  return (
    <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#17142e] via-[#101224] to-[#0c1328] border border-purple-500/40 shadow-2xl space-y-5 group">
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>{challenge?.category || '🎯 Desafio Magic da Semana'}</span>
            </span>
            <span className="text-xs text-slate-400">Termina em {challenge?.daysLeft ?? 7} dias</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            "{challenge?.title || 'Domine a Magic Song'}"
          </h2>
        </div>

        {/* Reward Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black shadow-sm">
          <Award className="w-4 h-4 text-amber-400" />
          <span>+{xpReward} XP & {badgeIcon} {badgeLabel}</span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
        {challenge?.description || 'Complete as 3 etapas essenciais de fixação musical desta semana e desbloqueie o Badge Exclusivo!'}
      </p>

      {/* Dynamic Objectives / Steps Checklist */}
      <div className="space-y-2.5 pt-1">
        {activeSteps.map((step) => (
          <div
            key={step.id || step.label}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              step.completed
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#131628] border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
              <span className={step.completed ? 'line-through text-slate-400' : 'text-white'}>
                {step.label}
              </span>
            </div>

            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              step.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {step.completed ? 'Concluído' : 'Pendente'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Progress & CTA */}
      <div className="pt-3 border-t border-[#1d223a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="w-4 h-4 text-purple-400" />
          <span><strong className="text-white">{(Number(challenge?.participatingCount) || 0).toLocaleString('pt-BR')}</strong> alunos participando agora</span>
        </div>

        {/* Dynamic Action Button by State */}
        {isClaimed ? (
          <div className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Desafio Concluído (+{xpReward} XP Recebido)</span>
          </div>
        ) : isAllCompleted ? (
          <button
            onClick={onClaimXp}
            disabled={isClaiming}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Resgatando XP...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🎁 Resgatar +{xpReward} XP</span>
              </>
            )}
          </button>
        ) : completedCount > 0 ? (
          <button
            onClick={onStartChallenge}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continuar o Desafio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onStartChallenge}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Participar do Desafio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}
