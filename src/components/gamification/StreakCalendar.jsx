import React from 'react';
import { Flame, Calendar, Check, Sparkles } from 'lucide-react';

export default function StreakCalendar({
  streak = 12,
  weeklyDays = [
    { day: "Seg", date: "22/09", completed: true },
    { day: "Ter", date: "23/09", completed: true },
    { day: "Qua", date: "24/09", completed: true },
    { day: "Qui", date: "25/09", completed: true },
    { day: "Sex", date: "26/09", completed: true, isToday: true },
    { day: "Sáb", date: "27/09", completed: false },
    { day: "Dom", date: "28/09", completed: false }
  ],
  compact = false,
  className = ""
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0d0f1a] border border-amber-500/25 shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sequência Diária
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>{streak} Dias Seguidos</span>
              <span className="text-amber-400">🔥</span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Bônus 2x XP</span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
        {weeklyDays.map((item, idx) => {
          const isDone = item.completed;
          const isToday = item.isToday;

          return (
            <div key={item.day || idx} className="flex flex-col items-center gap-1.5 group">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-extrabold transition-all duration-300 relative ${
                  isDone
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-1 ring-amber-400'
                    : isToday
                    ? 'bg-[#1a1f33] text-amber-400 border-2 border-dashed border-amber-400/80 animate-pulse'
                    : 'bg-[#151829] text-slate-500 border border-slate-800'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-[11px] text-slate-500">{item.day.slice(0, 1)}</span>
                )}

                {/* Today Marker */}
                {isToday && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                )}
              </div>

              <div className="text-center">
                <p className={`text-[10px] font-bold ${isToday ? 'text-amber-400' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.day}
                </p>
                {!compact && item.date && (
                  <p className="text-[9px] text-slate-600 hidden sm:block">
                    {item.date.split('/')[0]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="pt-2 border-t border-[#1d2238] flex items-center justify-between text-xs text-slate-400">
          <span>Meta: 1 prática por dia</span>
          <span className="text-amber-400 font-semibold">Hoje concluído ✓</span>
        </div>
      )}
    </div>
  );
}
