import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Sparkles, BookOpen, Tv, CheckCircle2, Bookmark, Share2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import LessonTabs from './LessonTabs';
import LessonProgress from './LessonProgress';
import { songsService } from '../../services/songsService';

export default function MagicClassroomView({ 
  lesson, 
  onBack, 
  onOpenMusicPlayer, 
  onNextLesson,
  onGainXp 
}) {
  const [resolvedSong, setResolvedSong] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setResolvedSong(null);
    async function loadSong() {
      if (!lesson) return;
      try {
        const { data } = await songsService.findSongForLesson({
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          lessonTitle: lesson.title,
          songTitle: typeof lesson.relatedSong === 'string' 
            ? lesson.relatedSong 
            : (lesson.relatedSong?.title || '')
        });
        if (isMounted && data) {
          setResolvedSong(data);
        }
      } catch (err) {
        console.warn('Error fetching song for classroom:', err);
      }
    }
    loadSong();
    return () => { isMounted = false; };
  }, [lesson?.id, lesson?.moduleId, lesson?.title, lesson?.relatedSong]);

  if (!lesson) {
    return (
      <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-[#1c2035]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar</span>
          </button>
        </div>
        <div className="p-12 text-center rounded-3xl bg-[#111424] border border-[#1d2238] space-y-3">
          <p className="text-base font-bold text-white">Nenhuma aula selecionada</p>
          <p className="text-xs text-slate-400">Escolha uma aula em "Meus Módulos" para começar seus estudos.</p>
        </div>
      </div>
    );
  }

  const enrichedLesson = {
    ...lesson,
    relatedSong: resolvedSong || lesson.relatedSong
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1c2035]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para trilha</span>
          </button>

          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
            {lesson.lessonNumber}
          </span>
        </div>

        {/* Lesson Meta Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121526] border border-slate-800 text-slate-300">
            <span className="text-slate-500">Módulo:</span>
            <strong className="text-white">{lesson.module}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121526] border border-slate-800 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>{lesson.duration}</span>
          </div>

          <div className="px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold">
            {lesson.level || 'Iniciante'}
          </div>
        </div>
      </div>

      {/* Lesson Title Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
          <Tv className="w-3.5 h-3.5 text-purple-400" />
          <span>Magic Classroom • Aula Oficial</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          {lesson.lessonNumber} — {lesson.title}
        </h1>
      </div>

      {/* 2. Main 16:9 HD Video Player (Top Focal Element) */}
      <VideoPlayer lesson={enrichedLesson} />

      {/* 3. Main Body Grid: Learning Tabs (8 Cols) & Lesson Progress / Next Lesson (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center: Interactive Lesson Tabs (8 Cols) */}
        <div className="lg:col-span-8">
          <LessonTabs
            lesson={enrichedLesson}
            onOpenFullMusicPlayer={(song) => {
              if (onOpenMusicPlayer) {
                onOpenMusicPlayer(song || resolvedSong || enrichedLesson.relatedSong);
              }
            }}
          />
        </div>

        {/* Right: Lesson Progress Checklist & Next Lesson (4 Cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <LessonProgress
            lessonId={lesson?.id}
            nextLesson={lesson.nextLesson}
            onCompleteLesson={(xp) => {
              if (onGainXp) onGainXp(xp);
            }}
            onNextLesson={onNextLesson}
          />
        </div>

      </div>

    </div>
  );
}
