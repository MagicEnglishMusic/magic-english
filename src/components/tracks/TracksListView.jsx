import React from 'react';
import { 
  Flame, 
  Star, 
  Target, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Compass,
  Trophy
} from 'lucide-react';
import TrailCard from './TrailCard';
import ProgressBar from './ProgressBar';
import { tracksData, userJourneyLevels } from '../../data/tracksData';
import { userData } from '../../data/mockData';

export default function TracksListView({ onSelectTrack, onContinueCurrentTrack }) {
  const currentTrack = tracksData[0]; // Inglês do Zero

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      {/* 1. Header da Página & Indicadores de Topo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-purple-400 animate-spin" style={{ animationDuration: '20s' }} />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Minhas <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Trilhas</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Escolha seu caminho e evolua no seu ritmo.
          </p>
        </div>

        {/* Top Floating Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sequência */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#131728] border border-amber-500/30 text-amber-300 text-xs font-bold shadow-md">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-none">Sequência</span>
              <span>{userData.streak} dias</span>
            </div>
          </div>

          {/* XP */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#131728] border border-purple-500/30 text-purple-300 text-xs font-bold shadow-md">
            <Star className="w-4 h-4 text-purple-400 fill-purple-400/30" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-none">Total XP</span>
              <span>{userData.xp} XP</span>
            </div>
          </div>

          {/* Nível */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#131728] border border-blue-500/30 text-blue-300 text-xs font-bold shadow-md">
            <Target className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-none">Nível</span>
              <span>Intermediário</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banner Principal da Trilha Atual (Hero) */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-r from-[#140d2b] via-[#0f132a] to-[#09152a] shadow-2xl p-7 sm:p-9 md:p-10 group">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80"
            alt="Pessoa aprendendo inglês com fones"
            className="w-full h-full object-cover object-right opacity-35 scale-100 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d091e] via-[#0d091e]/90 to-transparent"></div>
          <div className="absolute -top-16 -left-16 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Trilha em Andamento</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            🌱 {currentTrack.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            "{currentTrack.description}"
          </p>

          <div className="pt-2 max-w-md">
            <ProgressBar value={currentTrack.progress} max={100} showLabel={true} size="md" />
          </div>

          <div className="pt-3">
            <button
              onClick={() => onContinueCurrentTrack ? onContinueCurrentTrack(currentTrack) : onSelectTrack(currentTrack)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-600/40 hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </div>
              <span>▶ Continuar trilha</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Lista de Trilhas Disponíveis */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Trilhas Disponíveis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore os diferentes objetivos e avance no seu aprendizado musical
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracksData.map((track) => (
            <TrailCard
              key={track.id}
              track={track}
              onSelectTrack={onSelectTrack}
            />
          ))}
        </div>
      </div>

      {/* 4. Sistema de Progresso / Visual de Evolução (Jornada) */}
      <div className="p-7 sm:p-8 rounded-3xl bg-[#0e101f] border border-[#20253f] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Sua Jornada de Fluência
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete mais 3 músicas para desbloquear o próximo nível.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3.5 py-1.5 rounded-full border border-purple-500/30 w-fit">
            Nível Atual: Music Learner 🎵
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {userJourneyLevels.map((lvl, index) => {
            const isCompleted = lvl.status === 'completed';
            const isCurrent = lvl.status === 'current';

            return (
              <div
                key={lvl.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-purple-950/50 to-[#14172a] border-purple-500/60 shadow-xl shadow-purple-600/20 ring-1 ring-purple-400/40'
                    : isCompleted
                    ? 'bg-[#101322] border-emerald-500/30'
                    : 'bg-[#0d0f1a] border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{lvl.emoji}</span>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluído</span>
                    </div>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-extrabold uppercase bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                      Nível Atual
                    </span>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <h4 className="text-base font-bold text-white">{lvl.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{lvl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
