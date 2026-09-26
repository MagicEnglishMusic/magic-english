import React from 'react';
import { Music, Play, Headphones, Sparkles, Users, ArrowRight } from 'lucide-react';

export default function SongChallenge({ song, onPlaySong }) {
  return (
    <div className="relative overflow-hidden p-6 rounded-3xl bg-[#101324] border border-cyan-500/30 shadow-2xl space-y-4 group">
      
      {/* Background ambient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-2.5 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
          <Music className="w-3.5 h-3.5 text-cyan-400" />
          <span>{song.category}</span>
        </span>

        <span className="text-xs text-slate-400 font-mono font-bold">
          {song.bpm}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-cyan-500/40 group-hover:scale-105 transition-transform">
          <img
            src={song.cover}
            alt={song.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-cyan-300" />
          </div>
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-black text-white truncate">
            {song.title}
          </h3>
          <p className="text-xs text-slate-400">
            {song.subtitle}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              <Users className="w-3 h-3" /> {song.practicingCount.toLocaleString('pt-BR')} praticando
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onPlaySong}
        className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Praticar agora</span>
      </button>

    </div>
  );
}
