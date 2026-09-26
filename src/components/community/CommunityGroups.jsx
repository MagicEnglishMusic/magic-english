import React from 'react';
import { Users, Sparkles, ArrowRight } from 'lucide-react';

export default function CommunityGroups({ groups }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Focos de Estudo
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Grupos de Aprendizado
          </h3>
        </div>
        <span className="text-xs text-purple-300 font-semibold">4 Grupos Ativos</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-5 rounded-2xl bg-[#111425] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-xl"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{group.icon}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-[#161a2e] px-2 py-0.5 rounded border border-slate-700">
                  {group.members}
                </span>
              </div>

              <h4 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                {group.name}
              </h4>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {group.desc}
              </p>
            </div>

            <button
              onClick={() => alert(`Você entrou no grupo ${group.name}! Novas discussões serão exibidas.`)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-[#171b30] hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Participar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
