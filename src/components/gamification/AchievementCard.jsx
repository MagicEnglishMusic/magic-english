import React from 'react';
import { Lock, CheckCircle2, Zap, Sparkles } from 'lucide-react';

export default function AchievementCard({
  badge,
  onClaim,
  isLoading = false,
  className = ""
}) {
  const {
    id = "",
    title = "Conquista",
    icon = "🏆",
    condition = "Condição para desbloquear",
    rewardXp = 50,
    category = "Geral",
    unlocked = false,
    unlockedAt = "",
    claimed = false,
    claimedAt = "",
    progress = null
  } = badge || {};

  const progressPercent = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : (unlocked ? 100 : 0);

  return (
    <div
      className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 group flex flex-col justify-between ${
        unlocked
          ? 'bg-gradient-to-br from-[#151829] via-[#111320] to-[#0c0e18] border-purple-500/30 hover:border-purple-500/60 shadow-lg shadow-purple-950/20'
          : 'bg-[#0f111d]/70 border-[#1f243a] opacity-80 hover:opacity-100 hover:border-slate-700'
      } ${className}`}
    >
      {/* Background glow on hover for unlocked */}
      {unlocked && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
      )}

      <div className="flex items-start gap-3.5 relative z-10">
        {/* Badge Icon Medallion */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
            unlocked
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 p-[1.5px] shadow-lg shadow-purple-600/30'
              : 'bg-[#181c2f] border border-slate-800 text-slate-500'
          }`}
        >
          {unlocked ? (
            <div className="w-full h-full bg-[#0e101b] rounded-[14px] flex items-center justify-center">
              {icon}
            </div>
          ) : (
            <div className="w-full h-full bg-[#131627] rounded-[14px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#191d30] px-2 py-0.5 rounded border border-slate-700/50">
                {category}
              </span>
              {unlocked && (
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                  isLoading ? 'text-slate-400' : claimed ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isLoading ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Concluída
                    </>
                  ) : claimed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resgatada
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" /> Desbloqueada
                    </>
                  )}
                </span>
              )}
            </div>

            {/* XP Reward Pill */}
            <span className={`text-[11px] font-extrabold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
              claimed
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : unlocked
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
            }`}>
              <Zap className={`w-3 h-3 ${claimed ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400 fill-amber-400'}`} />
              +{rewardXp} XP
            </span>
          </div>

          <h4 className={`text-sm font-extrabold mt-1.5 truncate ${unlocked ? 'text-white' : 'text-slate-300'}`}>
            {title}
          </h4>

          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {condition}
          </p>

          {/* Incremental Progress Bar if applicable */}
          {progress && !unlocked && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>Progresso</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-[#181c2e] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {unlocked && unlockedAt && (
            <div className="mt-2 text-[10px] text-slate-500">
              Conquistado: {unlockedAt}
            </div>
          )}
        </div>
      </div>

      {/* Action Area: Claim Button, Loading State or Claimed Status */}
      {unlocked && (
        <div className="mt-3 pt-2.5 border-t border-purple-500/10 relative z-10">
          {isLoading ? (
            <div className="w-full py-2 px-3 rounded-xl bg-[#131627] border border-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>Verificando...</span>
            </div>
          ) : !claimed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClaim) onClaim(badge);
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <span>🎁 Resgatar +{rewardXp} XP</span>
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Recompensa Resgatada</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
