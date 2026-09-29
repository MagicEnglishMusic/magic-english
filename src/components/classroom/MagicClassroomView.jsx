import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Sparkles, BookOpen, Tv, CheckCircle2, Bookmark, Share2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import LessonTabs from './LessonTabs';
import LessonProgress from './LessonProgress';
import { songsService } from '../../services/songsService';
import { pronunciationService } from '../../services/pronunciationService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { 
  getRequiredPronunciationCount, 
  getLocalPronunciationDone, 
  saveLocalPronunciationDone 
} from '../../utils/pronunciationProgress';

export default function MagicClassroomView({ 
  lesson, 
  onBack, 
  onOpenMusicPlayer, 
  onNextLesson,
  onGainXp 
}) {
  const { user } = useAuth();
  const { addXp } = useGamification();
  const [resolvedSong, setResolvedSong] = useState(null);
  const [pronunciationWords, setPronunciationWords] = useState([]);
  const [lessonSteps, setLessonSteps] = useState({
    video: false,
    song: false,
    pronunciation: false,
    practice: false,
    pronunciation_done: []
  });
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [songLoadError, setSongLoadError] = useState(null);

  // Load persistent lesson steps & completed state on mount / lesson change
  useEffect(() => {
    let isMounted = true;
    async function loadProgress() {
      if (!lesson?.id || !user?.id) return;
      try {
        const { data } = await progressService.getUserProgress(user.id);
        if (isMounted && data && Array.isArray(data)) {
          const match = data.find((p) => p.lesson_id === lesson.id);
          const localDone = getLocalPronunciationDone(user.id, lesson.id);

          if (match) {
            const rawDone = Array.isArray(match.steps?.pronunciation_done) 
              ? match.steps.pronunciation_done 
              : [];
            const mergedDone = Array.from(new Set([...rawDone, ...localDone])).map(Number).filter(n => !isNaN(n));

            if (match.completed) {
              setIsLessonCompleted(true);
              setLessonSteps({
                video: true,
                song: true,
                pronunciation: true,
                practice: true,
                pronunciation_done: mergedDone
              });
            } else if (match.steps && typeof match.steps === 'object') {
              setLessonSteps({
                video: Boolean(match.steps.video),
                song: Boolean(match.steps.song),
                pronunciation: Boolean(match.steps.pronunciation),
                practice: Boolean(match.steps.practice),
                pronunciation_done: mergedDone
              });
            }
          } else if (localDone.length > 0) {
            setLessonSteps((prev) => ({
              ...prev,
              pronunciation_done: localDone
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading lesson progress:', err);
      }
    }
    loadProgress();
    return () => { isMounted = false; };
  }, [lesson?.id, user?.id]);

  const lessonRelatedSongKey = typeof lesson?.relatedSong === 'string' 
    ? lesson.relatedSong 
    : (lesson?.relatedSong?.id || lesson?.relatedSong?.title || '');

  // 1. Resolve Song Data
  useEffect(() => {
    let isMounted = true;
    async function loadSong() {
      if (!lesson) return;
      try {
        setSongLoadError(null);
        const { data, error } = await songsService.getSongForLesson({
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          lessonTitle: lesson.title,
          songTitle: typeof lesson.relatedSong === 'string' 
            ? lesson.relatedSong 
            : (lesson.relatedSong?.title || '')
        });

        if (error) {
          const errCode = error.code ? ` (${error.code})` : '';
          const errMsg = typeof error === 'string' ? error : (error.message || 'Erro ao carregar música');
          console.error(`Error fetching song for classroom${errCode}:`, error);
          if (isMounted) {
            setSongLoadError(`Não foi possível carregar a música da aula: ${errMsg}${errCode}`);
          }
          return;
        }

        if (isMounted) {
          if (data) {
            setResolvedSong(data);
          } else {
            setResolvedSong(null);
          }
        }
      } catch (err) {
        const errCode = err?.code ? ` (${err.code})` : '';
        const errMsg = err?.message || String(err);
        console.error(`Error fetching song for classroom${errCode}:`, err);
        if (isMounted) {
          setSongLoadError(`Não foi possível carregar a música da aula: ${errMsg}${errCode}`);
        }
      }
    }
    loadSong();
    return () => { isMounted = false; };
  }, [lesson?.id, lesson?.moduleId, lesson?.title, lessonRelatedSongKey]);

  // Load Real Pronunciation Words for this lesson's song (stable dependencies)
  useEffect(() => {
    let isMounted = true;
    async function loadPronunciationWords() {
      const targetSong = resolvedSong || (typeof lesson?.relatedSong === 'object' ? lesson.relatedSong : null);
      const songIdToFetch = targetSong?.id || lesson?.songId;

      if (!songIdToFetch && !targetSong) {
        setPronunciationWords([]);
        return;
      }

      try {
        const { data: words } = await pronunciationService.getWordsForSong(songIdToFetch, targetSong);
        if (isMounted && Array.isArray(words)) {
          setPronunciationWords(words);
        }
      } catch (err) {
        console.warn('Error loading pronunciation words for lesson song:', err);
      }
    }

    loadPronunciationWords();
    return () => { isMounted = false; };
  }, [resolvedSong?.id, lesson?.songId, lessonRelatedSongKey]);

  const [saveStepWarning, setSaveStepWarning] = useState(null);

  // Helper to mark a step complete and persist in user_progress
  const handleUpdateStep = (stepKey) => {
    setLessonSteps((prev) => {
      if (prev[stepKey]) return prev;
      const updated = { ...prev, [stepKey]: true };
      if (user?.id && lesson?.id) {
        progressService.saveLessonProgressSteps(user.id, lesson.id, updated).then((res) => {
          if (res?.error) {
            setSaveStepWarning('Aviso: Progresso salvo apenas localmente.');
          }
        });
      }
      return updated;
    });
  };

  // Callback when a word is approved in Voice Lab
  const handlePronunciationWordApproved = (wordIndex, allApprovedIndices) => {
    const required = getRequiredPronunciationCount(pronunciationWords.length);
    const isStepDone = pronunciationWords.length > 0 && allApprovedIndices.length >= required;

    setLessonSteps((prev) => {
      const updated = {
        ...prev,
        pronunciation_done: allApprovedIndices,
        pronunciation: isStepDone || prev.pronunciation
      };

      if (user?.id && lesson?.id) {
        saveLocalPronunciationDone(user.id, lesson.id, allApprovedIndices);
        progressService.saveLessonProgressSteps(user.id, lesson.id, updated).catch(() => {});
      }

      return updated;
    });
  };

  const handleCompleteLessonAction = async (xpAmount = 100) => {
    if (!user?.id || !lesson?.id) {
      setIsLessonCompleted(true);
      return;
    }

    try {
      const cleanLessonId = String(lesson.id).trim().toLowerCase();
      await progressService.completeLessonProgress(user.id, lesson.id);
      setIsLessonCompleted(true);
      await addXp('lesson_complete', cleanLessonId, {
        showModal: true,
        type: 'xp',
        title: '🎉 Aula Concluída!',
        subtitle: `${lesson.lessonNumber || 'Aula'} — ${lesson.title || 'Parabéns pela conclusão!'}`,
        icon: '🎓',
        bonusText: '+100 Magic XP adicionados à sua jornada!'
      });
      if (onGainXp) {
        onGainXp(100);
      }
    } catch (err) {
      console.error('Erro ao concluir aula:', err);
      setIsLessonCompleted(true);
    }
  };

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

  const pronunciationRequired = getRequiredPronunciationCount(pronunciationWords.length);
  const pronunciationDoneCount = (lessonSteps.pronunciation_done || []).length;

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
            <span>Voltar</span>
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

      {/* Visual Song Error Banner if query failed */}
      {songLoadError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
          <span className="text-base">⚠️</span>
          <span>{songLoadError}</span>
        </div>
      )}

      {/* 2. Main 16:9 HD Video Player (Top Focal Element) */}
      <VideoPlayer 
        lesson={enrichedLesson} 
        onVideoComplete={() => handleUpdateStep('video')}
      />

      {/* 3. Main Body Grid: Learning Tabs (8 Cols) & Lesson Progress / Next Lesson (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center: Interactive Lesson Tabs (8 Cols) */}
        <div className="lg:col-span-8">
          <LessonTabs
            lesson={enrichedLesson}
            pronunciationWords={pronunciationWords}
            pronunciationApprovedIndices={lessonSteps.pronunciation_done || []}
            onOpenFullMusicPlayer={(song) => {
              if (onOpenMusicPlayer) {
                onOpenMusicPlayer(song || resolvedSong || enrichedLesson.relatedSong);
              }
            }}
            onSongComplete={() => handleUpdateStep('song')}
            onPronunciationWordApproved={handlePronunciationWordApproved}
            onPronunciationComplete={() => handleUpdateStep('pronunciation')}
            onPracticeComplete={() => handleUpdateStep('practice')}
          />
        </div>

        {/* Right: Lesson Progress Checklist & Next Lesson (4 Cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <LessonProgress
            lessonId={lesson?.id}
            steps={lessonSteps}
            pronunciationMeta={{ done: pronunciationDoneCount, required: pronunciationRequired }}
            isCompleted={isLessonCompleted}
            nextLesson={lesson.nextLesson}
            onCompleteLesson={handleCompleteLessonAction}
            onNextLesson={onNextLesson}
          />
        </div>

      </div>

    </div>
  );
}
