import React, { useEffect } from 'react';
import { Sparkles, Trophy, Zap, X, ArrowRight, Crown, Flame, CheckCircle2 } from 'lucide-react';

export default function RewardModal({
  isOpen = false,
  onClose,
  type = 'xp', // 'xp' | 'level_up' | 'badge' | 'song_mastery' | 'challenge'
  title = "Parabéns!",
  subtitle = "Você conquistou uma nova etapa no Magic English.",
  xp = 50,
  icon = "⭐",
  bonusText = "+50 Magic XP adicionados à sua jornada!",
  badge = null
}) {
  if (!isOpen) return null;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isLevelUp = type === 'level_up';
  const isMastery = type === 'song_mastery';
  const isBadge = type === 'badge';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background glow effects */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 overflow-hidden text-center">
        
        {/* Ambient Top Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isLevelUp
            ? 'bg-gradient-to-b from-amber-500/30 to-purple-500/20'
            : isMastery
            ? 'bg-emerald-500/25'
            : 'bg-purple-500/25'
        }`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1e2338]/80 text-slate-400 hover:text-white hover:bg-[#282e4a] transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Celebration Icon */}
        <div className="relative mx-auto mb-5 w-24 h-24 flex items-center justify-center">
          {/* Animated pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-amber-400 opacity-25 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-2xl shadow-purple-500/50">
            <div className="w-full h-full bg-[#0d0f1b] rounded-full flex items-center justify-center text-4xl">
              {icon}
            </div>
          </div>
        </div>

        {/* Tag / Category */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          {isLevelUp ? (
            <>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Novo Nível Desbloqueado</span>
            </>
          ) : isMastery ? (
            <>
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Maestria Musical</span>
            </>
          ) : isBadge ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Conquista Especial</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Evolução Magic English</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-slate-300 font-medium mt-2 leading-relaxed">
          {subtitle}
        </p>

        {/* XP Bonus Card */}
        {xp > 0 && (
          <div className="my-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400 animate-bounce" />
            </div>
            <div className="text-left">
              <span className="text-lg font-black text-amber-300 tracking-tight">
                +{xp} ⭐ Magic XP
              </span>
              <p className="text-[11px] text-slate-400 font-semibold">
                {bonusText || "Adicionado ao seu progresso total"}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
        >
          <span>Continuar Aprendendo</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
