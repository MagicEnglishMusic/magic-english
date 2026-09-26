import React from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Mic2, 
  Music, 
  Compass, 
  CheckCircle2, 
  Lock, 
  Quote,
  Target,
  Clock,
  Zap,
  ChevronRight
} from 'lucide-react';
import { userData } from '../../data/mockData';
import { useGamification } from '../../context/GamificationContext';

export default function RightPanel({ onOpenGamification }) {
  const { streak, weeklyDays, badges, xp, currentLevel } = useGamification();

  return (
    <aside className="w-80 bg-[#0c0e17] border-l border-[#1e2235] h-screen sticky top-0 p-6 overflow-y-auto space-y-7 hidden xl:block select-none">
      {/* Section 1: Meu Progresso & Streak */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Meu Progresso
          </h3>
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-400" />
            {streak} Dias
          </span>
        </div>

        {/* Weekly Streak Mini Calendar */}
        <div className="bg-[#121522] border border-[#20253b] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Meta Semanal de Prática</span>
            <span className="text-white font-bold">{weeklyDays.filter((d) => d.completed).length}/7 dias</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {weeklyDays.map((item, idx) => {
              const isDone = item.completed;
              const isToday = item.isToday;

              return (
                <div key={item.day || idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                      isDone
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : isToday
                        ? 'bg-[#181c2e] text-amber-400 border border-amber-500/80 animate-pulse'
                        : 'bg-[#181c2e] text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isDone ? '✓' : item.day.slice(0, 1)}
                  </div>
                  <span className={`text-[10px] ${isDone ? 'text-slate-300 font-semibold' : 'text-slate-600'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2338]">
            <div className="p-2.5 rounded-xl bg-[#171b2e] border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Tempo de Prática
              </div>
              <p className="text-sm font-bold text-white">{xp > 0 ? `${Math.round(xp / 10)} min` : '0 min'}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171b2e] border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Magic XP
              </div>
              <p className="text-sm font-bold text-amber-300">{xp} <span className="text-[10px] text-purple-400 font-normal">XP</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Minhas Conquistas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Minhas Conquistas
          </h3>
          <button
            onClick={onOpenGamification}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5 cursor-pointer transition-colors"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {badges.slice(0, 4).map((ach) => (
            <div
              key={ach.id}
              onClick={onOpenGamification}
              className={`p-3 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                ach.unlocked
                  ? 'bg-gradient-to-r from-purple-950/30 to-[#141726] border-purple-500/25 hover:border-purple-500/50'
                  : 'bg-[#10121d] border-slate-800/60 opacity-60 hover:opacity-90'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
                  ach.unlocked
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-[#191d2f] text-slate-500'
                }`}
              >
                {ach.unlocked ? ach.icon : <Lock className="w-4 h-4 text-slate-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-bold truncate ${ach.unlocked ? 'text-white' : 'text-slate-400'}`}>
                    {ach.title}
                  </p>
                  {ach.unlocked && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {ach.condition}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Frase Motivacional */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-br from-purple-900/30 via-[#141728] to-blue-900/30 border border-purple-500/30 shadow-xl overflow-hidden group">
        <div className="absolute -top-3 -right-3 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
          <Quote className="w-20 h-20" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
            Inspiração Diária
          </span>
        </div>

        <blockquote className="text-xs italic text-slate-200 leading-relaxed relative z-10 font-medium">
          "{userData.motivationalQuote.text}"
        </blockquote>

        <div className="mt-3.5 pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
          <span className="text-purple-300 font-semibold">— {userData.motivationalQuote.author}</span>
          <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full font-bold">
            {currentLevel.title}
          </span>
        </div>
      </div>
    </aside>
  );
}
