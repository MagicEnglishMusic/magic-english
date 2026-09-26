import React from 'react';
import { Trophy, Star, Flame, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AchievementBadge({ type = 'medal', title, subtitle }) {
  const badgeConfig = {
    medal: {
      icon: Trophy,
      label: 'Medalha Desbloqueada',
      sub: 'Mestre dos Primeiros Passos',
      gradient: 'from-amber-500/20 to-yellow-600/10',
      border: 'border-amber-500/40',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      textColor: 'text-amber-300'
    },
    xp: {
      icon: Star,
      label: '+50 XP ao Concluir Aula',
      sub: 'Multiplicador de Ritmo Ativo',
      gradient: 'from-purple-500/20 to-indigo-600/10',
      border: 'border-purple-500/40',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      textColor: 'text-purple-300'
    },
    streak: {
      icon: Flame,
      label: 'Sequência Mantida',
      sub: '12 Dias Consecutivos',
      gradient: 'from-orange-500/20 to-rose-600/10',
      border: 'border-orange-500/40',
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      textColor: 'text-orange-300'
    }
  };

  const current = badgeConfig[type] || badgeConfig.medal;
  const Icon = current.icon;

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${current.gradient} border ${current.border} flex items-center gap-3.5 shadow-lg shadow-black/40`}>
      <div className={`w-10 h-10 rounded-xl ${current.iconBg} flex items-center justify-center flex-shrink-0 shadow-md`}>
        <Icon className={`w-5 h-5 ${current.iconColor} animate-pulse`} />
      </div>
      <div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wide">
          {title || current.label}
        </h4>
        <p className={`text-[11px] font-medium ${current.textColor} mt-0.5`}>
          {subtitle || current.sub}
        </p>
      </div>
    </div>
  );
}
