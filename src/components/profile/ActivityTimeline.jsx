import React from 'react';
import { History, Zap, Clock, CheckCircle2, Sparkles } from 'lucide-react';

export default function ActivityTimeline({
  activities = [],
  className = ""
}) {
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Registro de Evolução
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Histórico de Atividades</span>
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Últimas sessões
        </span>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-purple-500 before:via-indigo-500 before:to-slate-800">
        {activities.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline Node Icon */}
            <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full ${item.bg} ${item.border} border flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>

            {/* Content Box */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111424] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {item.time} • {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {item.subtitle}
                </p>
              </div>

              {/* XP Pill */}
              <div className="self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  {item.xp}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
