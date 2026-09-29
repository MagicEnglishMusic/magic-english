import React from 'react';
import { Users, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CommunityGroups({ 
  groups = [], 
  joinedGroupIds = [], 
  selectedGroupId = null, 
  onToggleJoin, 
  onSelectGroup 
}) {
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
        <span className="text-xs text-purple-300 font-semibold">
          {groups.length} Grupos Ativos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const isJoined = joinedGroupIds.includes(group.id);
          const isSelected = selectedGroupId === group.id;

          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup && onSelectGroup(group.id === selectedGroupId ? null : group.id)}
              className={`p-5 rounded-2xl bg-[#111425] border transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-xl ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/40 bg-[#161a32]'
                  : 'border-[#1e233b] hover:border-purple-500/40 hover:bg-[#14182e]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{group.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {isJoined && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Membro
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 bg-[#161a2e] px-2 py-0.5 rounded border border-slate-700">
                      {group.members}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                  {group.name}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {group.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleJoin) onToggleJoin(group);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isJoined
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                      : 'bg-[#171b30] hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30'
                  }`}
                >
                  <span>{isJoined ? '✓ Participando' : 'Participar'}</span>
                  {!isJoined && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
