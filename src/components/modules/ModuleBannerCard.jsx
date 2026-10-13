import React from 'react';
import { Play, BookOpen, Music, ArrowRight, Sparkles, Lock } from 'lucide-react';

export default function ModuleBannerCard({ module, onSelectModule }) {
  const isLocked = Boolean(module.isLocked || module.isComingSoon);
  const isComingSoon = Boolean(module.isComingSoon || module.status === 'coming_soon');

  return (
    <div
      onClick={() => {
        if (!isLocked && onSelectModule) {
          onSelectModule(module);
        }
      }}
      className={`group relative aspect-[9/16] rounded-3xl overflow-hidden border transition-all duration-500 flex flex-col justify-between select-none shadow-xl ${
        isLocked
          ? 'border-amber-500/40 bg-[#0a0c16] cursor-not-allowed opacity-90'
          : 'border-[#1f243c] bg-[#0c0e1a] hover:border-purple-500/70 hover:shadow-2xl hover:shadow-purple-600/30 cursor-pointer hover:-translate-y-1.5'
      }`}
    >
      {/* 1. Full-bleed Background Cover Image (9:16 Vertical Poster Aspect) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={module.coverImage}
          alt={module.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80';
          }}
          className={`w-full h-full object-cover object-center scale-100 transition-transform duration-700 ease-out ${
            isLocked ? 'grayscale-[35%] brightness-75' : 'group-hover:scale-105'
          }`}
        />

        {/* Top Vignette */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Bottom Dynamic Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-2/5 group-hover:h-3/5 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-85 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
      </div>

      {/* 2. Top Header: Module Number & Count Pills or EM BREVE Badge */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-600/90 text-white backdrop-blur-md border border-purple-400/30 shadow-md">
          {module.moduleNumber}
        </span>

        {isComingSoon ? (
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 backdrop-blur-md border border-amber-300/40 shadow-lg flex items-center gap-1 animate-pulse">
            <Lock className="w-2.5 h-2.5 stroke-[3]" />
            <span>EM BREVE</span>
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-slate-300 backdrop-blur-md border border-white/10 flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5 text-purple-400" />
              <span>{module.lessonsCount}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-cyan-300 backdrop-blur-md border border-cyan-500/20 flex items-center gap-1">
              <Music className="w-2.5 h-2.5" />
              <span>{module.songsCount}</span>
            </span>
          </div>
        )}
      </div>

      {/* 3. Center Lock or Floating Play Icon */}
      {isLocked ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/20 mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-xs font-black text-amber-200 uppercase tracking-wider drop-shadow-md">
            Conteúdo em preparação
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* 4. Bottom Content Area (Title, Description, Progress) */}
      <div className="relative z-10 p-4 sm:p-5 space-y-2.5">
        <div className="space-y-1">
          <h3 className={`text-base sm:text-lg font-black transition-colors leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
            isLocked ? 'text-slate-300' : 'text-white group-hover:text-purple-300'
          }`}>
            {module.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-200/90 line-clamp-2 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            "{module.shortDescription}"
          </p>
        </div>

        {/* Mini Progress Bar or Status */}
        <div className="pt-2 border-t border-white/15 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            {isLocked ? (
              <>
                <span className="font-semibold text-amber-300/90 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Em preparação</span>
                </span>
                <span className="text-slate-400 font-bold">
                  Em breve disponível
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">{module.progress > 0 ? `${module.progress}% concluído` : 'Não iniciado'}</span>
                <span className="text-purple-300 font-bold group-hover:translate-x-0.5 transition-transform drop-shadow">
                  Ver aulas ➔
                </span>
              </>
            )}
          </div>

          <div className="w-full bg-black/50 backdrop-blur-sm h-1.5 rounded-full overflow-hidden border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isLocked
                  ? 'bg-amber-500/40 w-0'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400'
              }`}
              style={{ width: isLocked ? '0%' : `${module.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
