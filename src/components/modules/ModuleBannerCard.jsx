import React from 'react';
import { Play, BookOpen, Music, ArrowRight, Sparkles, Lock } from 'lucide-react';

export default function ModuleBannerCard({ module, onSelectModule }) {
  const isLocked = module.isLocked;

  return (
    <div
      onClick={() => onSelectModule && onSelectModule(module)}
      className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-[#1f243c] bg-[#0c0e1a] shadow-xl hover:border-purple-500/70 hover:shadow-2xl hover:shadow-purple-600/30 transition-all duration-500 cursor-pointer flex flex-col justify-between select-none hover:-translate-y-1.5"
    >
      {/* 1. Full-bleed Background Cover Image (3:4 Poster Aspect) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={module.coverImage}
          alt={module.title}
          className="w-full h-full object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Layered cinematic dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080911] via-[#080911]/90 via-45% to-transparent"></div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/35 transition-all"></div>
      </div>

      {/* 2. Top Header: Module Number & Count Pills */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-600/90 text-white backdrop-blur-md border border-purple-400/30 shadow-md">
          {module.moduleNumber}
        </span>

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
      </div>

      {/* 3. Floating Center Play Icon (Reveals on Hover) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </div>
      </div>

      {/* 4. Bottom Content Area (Title, Description, Progress) */}
      <div className="relative z-10 p-4 sm:p-5 space-y-2.5">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg lg:text-xl font-black text-white group-hover:text-purple-300 transition-colors leading-tight drop-shadow-md">
            {module.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
            "{module.shortDescription}"
          </p>
        </div>

        {/* Mini Progress Bar or Status */}
        <div className="pt-2 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{module.progress > 0 ? `${module.progress}% concluído` : 'Não iniciado'}</span>
            <span className="text-purple-300 font-bold group-hover:translate-x-0.5 transition-transform">
              Ver aulas ➔
            </span>
          </div>

          <div className="w-full bg-[#181d30] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${module.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
