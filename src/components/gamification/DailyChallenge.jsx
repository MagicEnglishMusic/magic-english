import React from 'react';
import { Target, Zap, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function DailyChallenge({
  challenges = [],
  onClaim,
  className = ""
}) {
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-b from-[#131627] via-[#101220] to-[#0a0c16] border border-cyan-500/20 shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Missões Diárias
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              Desafios de Hoje
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#161a2c] px-2.5 py-1 rounded-full border border-slate-700/60">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Reseta em 8h 24m</span>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-2.5">
        {challenges.map((challenge) => {
          const isDone = challenge.completed;
          const isClaimed = challenge.claimed;

          return (
            <div
              key={challenge.id}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isClaimed
                  ? 'bg-[#0f121d]/70 border-slate-800/60 opacity-70'
                  : isDone
                  ? 'bg-gradient-to-r from-emerald-950/30 via-[#131929] to-[#121626] border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-[#121524] border-[#1e2338] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#181c2f] border border-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                  {challenge.icon}
                </div>

                <div className="min-w-0">
                  <p className={`text-xs sm:text-sm font-bold truncate ${isClaimed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                    {challenge.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      +{challenge.rewardXp} XP
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      • {challenge.current}/{challenge.target} concluído
                    </span>
                  </div>
                </div>
              </div>

              {/* Action / Status */}
              <div>
                {isClaimed ? (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-500" /> Coletado
                  </span>
                ) : isDone ? (
                  <button
                    onClick={() => onClaim && onClaim(challenge.id)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1 animate-bounce"
                  >
                    <Sparkles className="w-3 h-3" />
                    Resgatar
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-[#171b2d] px-2 py-1 rounded-md border border-slate-800">
                    Em progresso
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
