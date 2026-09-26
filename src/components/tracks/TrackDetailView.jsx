import React from 'react';
import { ArrowLeft, Play, Sparkles, BookOpen, Music, CheckCircle2, Lock, Flame, Star, Trophy } from 'lucide-react';
import ModuleCard from './ModuleCard';
import ProgressBar from './ProgressBar';
import AchievementBadge from './AchievementBadge';
import { userJourneyLevels } from '../../data/tracksData';

export default function TrackDetailView({ track, onBack, onSelectLesson }) {
  if (!track) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1c2035]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Minhas Trilhas</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
            {track.emoji} {track.title}
          </span>
        </div>
      </div>

      {/* Track Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-[#0e101f] shadow-2xl p-7 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 z-0 opacity-25">
          <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e101f] via-[#0e101f]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Trilha Oficial Magic English</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {track.emoji} {track.title}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            {track.fullDescription || track.description}
          </p>

          <div className="pt-2 max-w-md">
            <ProgressBar value={track.progress} max={100} showLabel={true} size="md" />
          </div>
        </div>

        {/* Right Stats Card */}
        <div className="relative z-10 w-full md:w-auto flex-shrink-0 grid grid-cols-2 gap-3 sm:gap-4 p-5 rounded-2xl bg-[#131628]/90 backdrop-blur-md border border-[#232944]">
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-white">{track.lessonsCount}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Aulas Totais</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-purple-400">{track.songsCount}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Músicas Inclusas</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-amber-400">+{track.lessonsCount * 50}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">XP Total</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{track.progress}%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Progresso</p>
          </div>
        </div>
      </div>

      {/* Gamification Badges Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Recompensas & Gamificação da Trilha
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AchievementBadge
            type="medal"
            title="Medalha Desbloqueada"
            subtitle="Mestre dos Primeiros Passos"
          />
          <AchievementBadge
            type="xp"
            title="+50 XP ao Concluir Aula"
            subtitle="Multiplicador Musical Ativo"
          />
          <AchievementBadge
            type="streak"
            title="Sequência Mantida"
            subtitle="12 Dias Consecutivos"
          />
        </div>
      </div>

      {/* Modules & Lessons Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Módulos da Trilha
          </h3>
          <span className="text-xs text-slate-400">
            {track.modules?.length || 0} módulos disponíveis
          </span>
        </div>

        <div className="space-y-6">
          {track.modules && track.modules.length > 0 ? (
            track.modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onSelectLesson={onSelectLesson}
              />
            ))
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#0e101f] border border-slate-800 space-y-3">
              <Lock className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-lg font-bold text-white">Trilha Bloqueada</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Conclua a trilha anterior para desbloquear este conteúdo exclusivo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Journey Evolution Roadmap */}
      <div className="p-7 rounded-3xl bg-[#0e101f] border border-[#20253f] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Sua Jornada de Fluência
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete mais 3 músicas para desbloquear o próximo nível.
            </p>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 w-fit">
            Nível Atual: Music Learner 🎵
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {userJourneyLevels.map((lvl, index) => {
            const isCompleted = lvl.status === 'completed';
            const isCurrent = lvl.status === 'current';
            const isLocked = lvl.status === 'locked' || lvl.status === 'upcoming';

            return (
              <div
                key={lvl.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-purple-950/50 to-[#15192c] border-purple-500/60 shadow-lg shadow-purple-600/20 ring-1 ring-purple-400/40'
                    : isCompleted
                    ? 'bg-[#101322] border-emerald-500/30'
                    : 'bg-[#0d0f1a] border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{lvl.emoji}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      Atual
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{lvl.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{lvl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
