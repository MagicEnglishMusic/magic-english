import React from 'react';
import { Heart, MessageSquare, Award, Trophy, Sparkles, Flame } from 'lucide-react';

export default function UserImpactCard({ impact, weeklyHighlights }) {
  return (
    <div className="space-y-6">
      
      {/* 1. Meu Impacto Pessoal */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#16142a] to-[#0e101f] border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
              Painel Pessoal
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Meu Impacto na Comunidade
            </h3>
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
            {impact.reputationBadge}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-[#121526] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-center text-rose-400">
              <span className="text-xl">👏</span>
            </div>
            <p className="text-lg font-black text-white">{impact.congratulatedCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Parabenizei</p>
          </div>

          <div className="p-3 rounded-2xl bg-[#121526] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-lg font-black text-white">{impact.participationsCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Participações</p>
          </div>

          <div className="p-3 rounded-2xl bg-[#121526] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-lg font-black text-white">{impact.sharedAchievementsCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Conquistas</p>
          </div>
        </div>
      </div>

      {/* 2. Destaques da Semana (Integração com Ranking) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#101324] border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              Comunidade Inspiradora
            </span>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Destaques da Semana</span>
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">Atualizado hoje</span>
        </div>

        <div className="space-y-3">
          {(!weeklyHighlights || weeklyHighlights.length === 0) ? (
            <div className="p-4 rounded-2xl bg-[#14172a] border border-dashed border-slate-800 text-center space-y-1">
              <p className="text-xs font-bold text-slate-300">Nenhum destaque registrado ainda</p>
              <p className="text-[11px] text-slate-500">
                Pratique músicas e complete aulas hoje para aparecer no topo dos destaques!
              </p>
            </div>
          ) : (
            weeklyHighlights.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#14172a] border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-400/40 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {item.stat}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-purple-200 font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 whitespace-nowrap">
                  {item.badge}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
