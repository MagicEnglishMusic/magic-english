import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Share2, Bookmark, CheckCircle2, Music } from 'lucide-react';
import SongHeaderPlayer from './SongHeaderPlayer';
import LearningTabs from './LearningTabs';
import PracticeCards from './PracticeCards';

export default function MagicSongView({ song, onBack, onGainXp }) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!song) {
    return (
      <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c2035]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar</span>
          </button>
        </div>
        <div className="p-12 text-center rounded-3xl bg-[#111425] border border-[#1e233b] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mx-auto">
            <Music className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Nenhuma música disponível no momento</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              As Magic Songs cadastradas pelo administrador aparecerão aqui no catálogo musical.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
      {/* Top Navigation Bar with Back button and Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1c2035]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-[#121524] border-[#22273e] text-slate-400 hover:text-white hover:border-purple-500/30'
            }`}
            title="Salvar na Minha Lista"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-purple-400 text-purple-400' : ''}`} />
            <span className="hidden sm:inline">{isBookmarked ? 'Salva na Lista' : 'Salvar Música'}</span>
          </button>

          <button
            className="p-2.5 rounded-xl bg-[#121524] border border-[#22273e] hover:border-purple-500/30 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Compartilhar aula"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Main Header Player on Top */}
      <SongHeaderPlayer
        song={song}
        currentLineIndex={currentLineIndex}
        onLineChange={setCurrentLineIndex}
      />

      {/* 2. Learning Tabs: Letra, Tradução, Aprenda */}
      <LearningTabs
        song={song}
        currentLineIndex={currentLineIndex}
        onSelectLine={setCurrentLineIndex}
      />

      {/* 3. Practice Cards: Treinar pronúncia, Desafio, Ganhar XP */}
      <PracticeCards
        song={song}
        challenge={song.challenge}
        xpReward={song.xpReward || 50}
        onClaimXp={onGainXp}
      />
    </div>
  );
}
