import React, { useState } from 'react';
import { Tv, Music, BookOpen, Mic, Brain, Sparkles, Clock, FolderDown } from 'lucide-react';
import MusicSection from './MusicSection';
import MaterialsTab from './MaterialsTab';
import PronunciationPractice from './PronunciationPractice';
import MusicalPracticeTab from './MusicalPracticeTab';

export default function LessonTabs({ lesson, onOpenFullMusicPlayer }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'music' | 'material' | 'pronunciation' | 'practice'

  const tabs = [
    { id: 'video', label: '🎬 Aula', icon: Tv },
    { id: 'music', label: '🎵 Música', icon: Music },
    { id: 'material', label: '📖 Material', icon: FolderDown },
    { id: 'pronunciation', label: '🎤 Pronúncia', icon: Mic },
    { id: 'practice', label: '🧠 Prática Musical', icon: Brain },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 p-1.5 rounded-2xl bg-[#0d0f1c] border border-[#1e2338]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="pt-2">
        {/* Tab 1: 🎬 Aula Details & Chapters */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            {/* Description & Learning Goals */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-4">
              <h3 className="text-lg font-bold text-white">Sobre esta Aula</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {lesson?.description || ''}
              </p>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  ✓ O que você vai aprender:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {(lesson?.learningGoals || []).map((goal, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#141728] border border-slate-800/80 text-xs sm:text-sm text-slate-200 flex items-center gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Chapters Timeline */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Capítulos do Vídeo
                </h3>
                <span className="text-xs text-slate-400">{(lesson?.videoChapters || []).length} tópicos</span>
              </div>

              <div className="space-y-2.5">
                {(lesson?.videoChapters || []).map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#131626] hover:bg-[#181c30] border border-slate-800/60 hover:border-purple-500/30 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
                        {ch?.time || ''}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                        {ch?.title || ''}
                      </p>
                    </div>
                    <span className="text-xs text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Ir para ➔
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 🎵 Música (Karaokê Sincronizado) */}
        {activeTab === 'music' && (
          <MusicSection
            song={lesson?.relatedSong}
            onOpenFullPlayer={onOpenFullMusicPlayer}
          />
        )}

        {/* Tab 3: 📖 Material (Biblioteca de PDFs para Download) */}
        {activeTab === 'material' && (
          <MaterialsTab
            files={lesson?.downloadableFiles || []}
          />
        )}

        {/* Tab 4: 🎤 Pronúncia (Extraída da Letra da Canção) */}
        {activeTab === 'pronunciation' && (
          <PronunciationPractice
            items={lesson?.extractedPronunciation || lesson?.pronunciationList || []}
          />
        )}

        {/* Tab 5: 🧠 Prática Musical (Tradução Reversa de TODAS as Frases) */}
        {activeTab === 'practice' && (
          <MusicalPracticeTab
            lyrics={lesson?.relatedSong?.lyricsTimestamps || []}
          />
        )}
      </div>
    </div>
  );
}
