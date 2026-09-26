import React from 'react';
import { Calendar, Flame, Globe, Sparkles } from 'lucide-react';

export default function RankingFilter({
  activeFilter = 'weekly', // 'weekly' | 'monthly' | 'allTime'
  onChangeFilter,
  className = ""
}) {
  const filters = [
    {
      id: 'weekly',
      label: 'Semana',
      sub: 'Últimos 7 dias de evolução',
      icon: Flame,
      color: 'text-amber-400'
    },
    {
      id: 'monthly',
      label: 'Mês',
      sub: 'Consistência mensal',
      icon: Calendar,
      color: 'text-purple-400'
    },
    {
      id: 'allTime',
      label: 'Geral',
      sub: 'Maior evolução histórica',
      icon: Globe,
      color: 'text-cyan-400'
    }
  ];

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#101220] border border-[#1e233b] ${className}`}>
      <div className="flex items-center gap-1.5 flex-1">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;

          return (
            <button
              key={f.id}
              onClick={() => onChangeFilter && onChangeFilter(f.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#161a2c]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : f.color}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
