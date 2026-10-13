import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Clock, BookOpen, Music, CheckCircle2, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { progressService } from '../../services/progressService';
import { songsService } from '../../services/songsService';
import { useAuth } from '../../context/AuthContext';

export default function ContinueLearningCard({ onOpenLesson, onOpenModule }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nextLessonData, setNextLessonData] = useState(null);
  const [moduleProgress, setModuleProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadNextLesson() {
      try {
        setLoading(true);
        const [modsRes, lessonsRes, songsRes, progRes] = await Promise.all([
          modulesService.getModules(),
          lessonsService.getAllLessons(),
          songsService.getSongs(),
          user?.id ? progressService.getUserProgress(user.id) : Promise.resolve({ data: [] })
        ]);

        const dbModules = modsRes.data || [];
        const dbLessons = lessonsRes.data || [];
        const dbSongs = songsRes.data || [];
        const dbProgress = progRes?.data || [];

        if (!isMounted) return;

        if (dbModules.length === 0 || dbLessons.length === 0) {
          setNextLessonData(null);
          return;
        }

        // Map of completed lesson IDs
        const completedIds = new Set(
          dbProgress
            .filter((p) => p.completed === true || Number(p.progress_percent) === 100)
            .map((p) => p.lesson_id)
        );

        // Sort modules by order_index and find first uncompleted lesson
        let foundLesson = null;
        let foundModule = null;
        let lessonIndexInModule = 0;

        for (const mod of dbModules) {
          const modLessons = dbLessons
            .filter((l) => l.module_id === mod.id)
            .sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

          for (let i = 0; i < modLessons.length; i++) {
            const l = modLessons[i];
            if (!completedIds.has(l.id)) {
              foundLesson = l;
              foundModule = mod;
              lessonIndexInModule = i + 1;
              break;
            }
          }
          if (foundLesson) break;
        }

        // Fallback: If all are completed or no lesson found, select the very first lesson
        if (!foundLesson && dbLessons.length > 0) {
          foundModule = dbModules[0] || { id: dbLessons[0].module_id, title: 'Inglês do Zero' };
          foundLesson = dbLessons[0];
          lessonIndexInModule = 1;
        }

        if (foundLesson && foundModule) {
          // Calculate module progress
          const modLessons = dbLessons.filter((l) => l.module_id === foundModule.id);
          const completedInMod = modLessons.filter((l) => completedIds.has(l.id)).length;
          const modPct = modLessons.length > 0 ? Math.round((completedInMod / modLessons.length) * 100) : 0;
          setModuleProgress(modPct);

          // Find associated song
          const matchedSong = dbSongs.find((s) => s.lesson_id === foundLesson.id || s.module_id === foundModule.id) || dbSongs[0] || null;

          const formatted = {
            id: foundLesson.id,
            moduleId: foundModule.id,
            module: foundModule.title,
            number: String(lessonIndexInModule).padStart(2, '0'),
            lessonNumber: `Aula ${String(lessonIndexInModule).padStart(2, '0')}`,
            title: foundLesson.title,
            duration: foundLesson.duration || '15 min',
            description: foundLesson.description || foundModule.description || '',
            videoUrl: foundLesson.video_url || foundLesson.videoUrl || '',
            videoThumbnail: foundLesson.thumbnail_url || foundLesson.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
            relatedSong: matchedSong,
            songId: matchedSong?.id || null
          };

          setNextLessonData(formatted);
        }
      } catch (err) {
        console.warn('[ContinueLearningCard] Erro ao carregar próxima aula:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNextLesson();
    return () => { isMounted = false; };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-6 sm:p-7 rounded-3xl bg-[#111322] border border-[#1e2338] flex items-center justify-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <span>Carregando sua próxima aula...</span>
      </div>
    );
  }

  if (!nextLessonData) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170e30] via-[#101427] to-[#0a1124] border border-purple-500/40 p-6 sm:p-7 lg:p-8 shadow-2xl group transition-all">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/25 transition-all" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left column: Badge, Module, Lesson Title, Details */}
        <div className="space-y-3.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-200 text-xs font-black tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>Continuar de Onde Parou</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181c32] border border-slate-700/60 text-slate-300 text-xs font-semibold">
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>{nextLessonData.module}</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-purple-200 transition-colors">
              {nextLessonData.lessonNumber}: {nextLessonData.title}
            </h2>
            {nextLessonData.description && (
              <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 mt-1.5 leading-relaxed">
                {nextLessonData.description}
              </p>
            )}
          </div>

          {/* Quick Metrics & Related Song */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 bg-[#121524] px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duração: <strong className="text-white">{nextLessonData.duration}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/25 font-bold">
              <span>+50 XP ao concluir</span>
            </div>

            {nextLessonData.relatedSong && (
              <div className="flex items-center gap-1.5 text-purple-300 bg-purple-500/15 px-3 py-1.5 rounded-xl border border-purple-500/30">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>Fixação: <strong className="text-white">{nextLessonData.relatedSong.title}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action Button & Module progress indicator */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-purple-500/20 pt-4 lg:pt-0 lg:pl-8 flex-shrink-0">
          <div className="w-full sm:w-auto text-left lg:text-right space-y-1">
            <div className="flex items-center justify-between lg:justify-end gap-2 text-xs text-slate-400">
              <span>Progresso do Módulo</span>
              <span className="font-bold text-white">{moduleProgress}%</span>
            </div>
            <div className="w-full sm:w-44 bg-[#141728] h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${moduleProgress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onOpenLesson && onOpenLesson(nextLessonData)}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-purple-300/30"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <span>Continuar Aula</span>
            <ArrowRight className="w-4 h-4 text-purple-200" />
          </button>
        </div>
      </div>
    </section>
  );
}
