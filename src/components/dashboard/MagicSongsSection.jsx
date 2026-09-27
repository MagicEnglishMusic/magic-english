import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Headphones, Music, Radio, Loader2 } from 'lucide-react';
import { songsService } from '../../services/songsService';

export default function MagicSongsSection({ onSelectSong }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSongs() {
      try {
        const { data } = await songsService.getSongs();
        setSongs(data || []);
      } catch (err) {
        setSongs([]);
      } finally {
        setLoading(false);
      }
    }
    loadSongs();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">
              Reforce seu aprendizado com músicas
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            🎵 Método Musical Exclusivo de Fixação — Cante para fixar os conteúdos das suas aulas em vídeo
          </p>
        </div>
        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 w-fit">
          Fixação Acelerada
        </span>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-[#111424] border border-[#1f243c] flex items-center justify-center gap-3 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span>Carregando catálogo de músicas...</span>
        </div>
      ) : songs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#111424] border border-dashed border-[#1f243c] text-center space-y-2">
          <Music className="w-8 h-8 text-cyan-400 mx-auto opacity-60" />
          <h4 className="text-sm font-bold text-white">Nenhuma música disponível no momento</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Novas Magic Songs serão liberadas conforme você avança nas suas aulas e módulos de inglês!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {songs.map((song) => {
            const coverImg = song.image || song.cover_image || song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
            const levelLabel = song.level || song.difficulty || 'Iniciante';
            const tagsList = Array.isArray(song.tags) ? song.tags : (song.tags ? [song.tags] : ['Magic Method']);
            
            return (
              <div
                key={song.id}
                onClick={() => onSelectSong && onSelectSong(song)}
                className="group relative rounded-2xl bg-[#111424] border border-[#1f243c] hover:border-purple-500/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-600/15 cursor-pointer flex flex-col justify-between"
              >
                {/* Cover container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={coverImg}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-black/20 to-transparent"></div>

                  {/* Lesson Fixation Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-600/90 text-white backdrop-blur-md shadow-sm">
                      {levelLabel}
                    </span>
                  </div>

                  {/* Plays Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-slate-300 backdrop-blur-md">
                    <Headphones className="w-3 h-3 text-cyan-400" />
                    <span>{song.plays || 0}</span>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40">
                    <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-cyan-600/50 scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {song.title}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {song.duration || '3:00'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {song.subtitle || song.artist || 'Música de Fixação'}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1c2138]">
                    {tagsList.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#181c30] text-slate-300 border border-slate-800 group-hover:border-purple-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
