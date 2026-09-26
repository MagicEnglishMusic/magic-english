import React from 'react';
import { Users, Sparkles, Flame, Trophy, ShieldCheck, Heart } from 'lucide-react';

export default function CommunityHeader({ stats }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1535] via-[#101326] to-[#080a14] border border-purple-500/40 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/30 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Title & Tag */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Comunidade Educacional Oficial</span>
            </span>

            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.onlineNow} alunos estudando agora
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            👥 Magic Community
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium">
            "Aprenda, pratique e evolua junto com outros alunos no método musical."
          </p>

          <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
            <span>🔥 Desafio ativo da comunidade: <strong className="text-amber-300">{stats.activeChallenge}</strong></span>
          </div>
        </div>

        {/* Right Stats Box */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 p-4 sm:p-5 rounded-2xl bg-[#0d0f1d]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl">
          <div className="text-left md:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Membros Ativos
            </p>
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-300 via-white to-cyan-300 bg-clip-text text-transparent">
              {stats.activeMembers.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{stats.celebrationsToday} comemorações hoje</span>
          </div>
        </div>

      </div>
    </div>
  );
}
