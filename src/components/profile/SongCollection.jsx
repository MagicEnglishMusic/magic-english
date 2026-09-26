import React, { useState } from 'react';
import { Music, Play, CheckCircle2, Sparkles, Clock, ArrowRight } from 'lucide-react';
import SongMasteryBadge from '../gamification/SongMasteryBadge';

export default function SongCollection({
  songs = [],
  onOpenSong,
  className = ""
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'mastered' | 'practicing' | 'not_started'

  const filteredSongs = filter === 'all'
    ? songs
    : songs.filter((s) => s.status === filter);

  const masteredCount = songs.filter((s) => s.status === 'mastered').length;

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141728] via-[#101222] to-[#0a0c16] border border-purple-500/30 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Fixação Ativa
          </span>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-400" />
            <span>Biblioteca Musical Pessoal</span>
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#121524] p-1 rounded-xl border border-slate-800 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({songs.length})
          </button>
          <button
            onClick={() => setFilter('mastered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'mastered'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🟢 Dominadas ({masteredCount})
          </button>
          <button
            onClick={() => setFilter('practicing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'practicing'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🟣 Em Progresso
          </button>
        </div>
      </div>

      {/* Songs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSongs.map((song) => {
          const isMastered = song.status === 'mastered';

          return (
            <div
              key={song.id}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                isMastered
                  ? 'bg-gradient-to-b from-[#131929] to-[#0c0f1c] border-emerald-500/35 hover:border-emerald-500/60 shadow-lg'
                  : song.status === 'practicing'
                  ? 'bg-gradient-to-b from-[#16172e] to-[#0e101f] border-purple-500/30 hover:border-purple-500/50'
                  : 'bg-[#0f111d] border-slate-800/70 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Cover Image */}
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 group-hover:border-purple-500/40 transition-colors">
                  <img
                    src={song.image}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Top Status Badge */}
                  <div className="absolute top-2 right-2">
                    <SongMasteryBadge status={song.status} size="sm" />
                  </div>

                  <div className="absolute bottom-2 left-2.5 text-[11px] font-mono text-slate-300 font-bold">
                    {song.bpm} • {song.duration}
                  </div>
                </div>

                {/* Song Details */}
                <div>
                  <h4 className="text-sm font-black text-white truncate">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {song.subtitle}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Domínio</span>
                    <span className={isMastered ? 'text-emerald-400 font-bold' : 'text-purple-300'}>
                      {song.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-[#181c2f] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                      }`}
                      style={{ width: `${song.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-3 border-t border-[#1d2238]">
                <button
                  onClick={() => onOpenSong && onOpenSong(song)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isMastered
                      ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30'
                      : 'bg-purple-600/25 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 shadow-sm'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isMastered ? 'Cantar Novamente' : song.status === 'practicing' ? 'Continuar Prática' : 'Iniciar Canção'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
