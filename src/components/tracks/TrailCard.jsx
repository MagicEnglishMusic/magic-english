import React from 'react';
import { Play, Lock, Music, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import ProgressBar from './ProgressBar';

export default function TrailCard({ track, onSelectTrack }) {
  const isLocked = track.isLocked;

  return (
    <div
      onClick={() => onSelectTrack && onSelectTrack(track)}
      className={`group relative rounded-3xl overflow-hidden border transition-all duration-500 flex flex-col justify-between ${
        isLocked
          ? 'bg-[#0f111e]/70 border-[#1d2238] opacity-75 cursor-pointer hover:border-slate-700'
          : 'bg-[#111424] border-[#222740] hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer hover:-translate-y-1'
      }`}
    >
      {/* Top Cover Image with Streaming Aspect Ratio */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
        <img
          src={track.image}
          alt={track.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isLocked ? 'grayscale-[50%] scale-100' : 'group-hover:scale-105'
          }`}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-black/30 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <span>{track.emoji}</span>
            <span>{track.tagline}</span>
          </span>

          {isLocked && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700 flex items-center gap-1.5 shadow-md">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Bloqueado</span>
            </span>
          )}
        </div>

        {/* Floating Play / Lock Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 scale-75 group-hover:scale-100 transition-transform">
            {isLocked ? (
              <Lock className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              {track.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {track.description}
          </p>
        </div>

        {/* Meta info: Lessons & Songs */}
        <div className="pt-2 border-t border-[#1d2238] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>{track.lessonsCount} aulas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>{track.songsCount} músicas</span>
            </div>
          </div>

          {/* Progress or Unlock requirement */}
          {isLocked ? (
            <div className="p-2.5 rounded-xl bg-[#171a2c] text-[11px] text-slate-400 flex items-center justify-between border border-slate-800">
              <span>Desbloqueia no {track.requiredLevel}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            </div>
          ) : (
            <ProgressBar value={track.progress} max={100} showLabel={true} />
          )}
        </div>
      </div>
    </div>
  );
}
