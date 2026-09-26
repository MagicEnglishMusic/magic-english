import React from 'react';
import { Flame, Tv, Music, Trophy, Clock, Sparkles, Award, Zap } from 'lucide-react';

export default function UserStatsCard({
  stats = {
    streakDays: 0,
    completedLessons: 0,
    masteredSongs: 0,
    unlockedBadges: 0,
    totalStudyTime: "0 min"
  },
  className = ""
}) {
  const statItems = [
    {
      id: "streak",
      label: "Sequência",
      value: `${stats.streakDays} dias`,
      sub: "estudando todo dia",
      icon: Flame,
      color: "text-amber-400",
      fill: "fill-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      glow: "from-amber-500/10"
    },
    {
      id: "lessons",
      label: "Aulas Concluídas",
      value: `${stats.completedLessons} aulas`,
      sub: "em vídeo assistidas",
      icon: Tv,
      color: "text-purple-400",
      fill: "",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25",
      glow: "from-purple-500/10"
    },
    {
      id: "songs",
      label: "Músicas Dominadas",
      value: `${stats.masteredSongs} músicas`,
      sub: "5/5 etapas concluídas",
      icon: Music,
      color: "text-emerald-400",
      fill: "",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      glow: "from-emerald-500/10"
    },
    {
      id: "badges",
      label: "Conquistas",
      value: `${stats.unlockedBadges} badges`,
      sub: "medalhas especiais",
      icon: Trophy,
      color: "text-yellow-400",
      fill: "fill-yellow-400/20",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/25",
      glow: "from-yellow-500/10"
    },
    {
      id: "time",
      label: "Tempo de Estudo",
      value: stats.totalStudyTime,
      sub: "imersão no idioma",
      icon: Clock,
      color: "text-cyan-400",
      fill: "",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
      glow: "from-cyan-500/10"
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Estatísticas do Aluno
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Métricas consolidadas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0c0e18] border ${item.border} hover:border-purple-500/40 transition-all duration-300 group shadow-lg`}
            >
              {/* Top ambient glow */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${item.glow} to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none`} />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`w-9 h-9 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center ${item.color} shadow-inner`}>
                  <Icon className={`w-4 h-4 ${item.fill}`} />
                </div>
              </div>

              <div className="relative z-10 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
                <p className="text-base sm:text-lg font-black text-white tracking-tight">
                  {item.value}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
