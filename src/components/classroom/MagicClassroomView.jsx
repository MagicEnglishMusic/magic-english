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
  saveLocalPronunciationDone,
  getLocalPronunciationCompleted,
  saveLocalPronunciationCompleted
} from '../../utils/pronunciationProgress';

export default function MagicClassroomView({ 
  lesson, 
  onBack, 
  onOpenMusicPlayer, 
  onNextLesson,
  onGainXp 
}) {
  const { user } = useAuth();
  const { addXp, songMasteryList } = useGamification();
  const [resolvedSong, setResolvedSong] = useState(null);
  const [pronunciationWords, setPronunciationWords] = useState([]);
  const [lessonSteps, setLessonSteps] = useState({
    video: false,
    song: false,
    pronunciation: false,
    pronunciation_completed: false,
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
          const localPronunciationCompleted = getLocalPronunciationCompleted(
            user.id, 
            lesson.relatedSong?.id || lesson.songId, 
            lesson.id
          );

          // Sincronização da Etapa 2: Concluída se match.steps.song for true OU se a música tiver step_song true em songMasteryList
          const targetSongId = lesson?.relatedSong?.id || lesson?.songId || resolvedSong?.id;
          const cleanSongId = targetSongId ? String(targetSongId).trim().toLowerCase() : null;

          const matchingContextSong = (songMasteryList || []).find((s) => {
            const sId = String(s.songId || s.id || '').trim().toLowerCase();
            return cleanSongId && sId === cleanSongId;
          });

          const isSongDone = Boolean(
            match?.completed ||
            match?.steps?.song ||
            matchingContextSong?.checklist?.listened_full ||
            matchingContextSong?.checklist?.step_song ||
            matchingContextSong?.step_song
          );

          if (match) {
            const rawDone = Array.isArray(match.steps?.pronunciation_done) 
              ? match.steps.pronunciation_done 
              : [];
            const mergedDone = Array.from(new Set([...rawDone, ...localDone])).map(Number).filter(n => !isNaN(n));
            const isPronunciationDone = Boolean(
              match.completed ||
              match.steps?.pronunciation_completed ||
              match.steps?.pronunciation ||
              localPronunciationCompleted
            );

            if (match.completed) {
              setIsLessonCompleted(true);
              setLessonSteps({
                video: true,
                song: true,
                pronunciation: true,
                pronunciation_completed: true,
                practice: true,
                pronunciation_done: mergedDone
              });
            } else if (match.steps && typeof match.steps === 'object') {
              setLessonSteps({
                video: Boolean(match.steps.video),
                song: isSongDone,
                pronunciation: isPronunciationDone,
                pronunciation_completed: isPronunciationDone,
                practice: Boolean(match.steps.practice),
                pronunciation_done: mergedDone
              });
            }
          } else {
            setLessonSteps((prev) => ({
              ...prev,
              song: isSongDone || prev.song,
              pronunciation_done: localDone,
              pronunciation: localPronunciationCompleted || prev.pronunciation,
              pronunciation_completed: localPronunciationCompleted || prev.pronunciation_completed
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading lesson progress:', err);
      }
    }
    loadProgress();
    return () => { isMounted = false; };
  }, [lesson?.id, user?.id, songMasteryList]);

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

            // Sincronização reativa com songMasteryList do contexto
            if (user?.id && data?.id) {
              const cleanId = String(data.id).trim().toLowerCase();

              const matchingContextSong = (songMasteryList || []).find((s) => {
                const sId = String(s.songId || s.id || '').trim().toLowerCase();
                return cleanId && sId === cleanId;
              });

              if (matchingContextSong?.checklist?.listened_full || matchingContextSong?.checklist?.step_song || matchingContextSong?.step_song) {
                setLessonSteps((prev) => (prev.song ? prev : { ...prev, song: true }));
              }

              // Se o vídeo já foi assistido anteriormente, sincroniza imediatamente com o UUID real da música
              progressService.getUserProgress(user.id).then(({ data: progData }) => {
                const match = (progData || []).find((p) => p.lesson_id === lesson.id);
                if (match?.completed || match?.steps?.video) {
                  progressService.updateSongMastery(user.id, data.id, { step_video: true }).catch(() => {});
                }
              });
            }
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
  }, [lesson?.id, lesson?.moduleId, lesson?.title, lessonRelatedSongKey, songMasteryList]);

  // Helper para obter estritamente o UUID real da música (NUNCA strings de título)
  const getRealSongId = () => {
    if (resolvedSong?.id && typeof resolvedSong.id === 'string' && resolvedSong.id.length > 10) {
      return resolvedSong.id;
    }
    if (typeof lesson?.relatedSong === 'object' && !Array.isArray(lesson?.relatedSong) && lesson?.relatedSong?.id) {
      return lesson.relatedSong.id;
    }
    if (Array.isArray(lesson?.relatedSong) && lesson.relatedSong[0]?.id) {
      return lesson.relatedSong[0].id;
    }
    if (lesson?.songId && typeof lesson.songId === 'string' && lesson.songId.length > 10) {
      return lesson.songId;
    }
    return null;
  };

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

  // Auto-reparação: Se o vídeo já foi assistido anteriormente, garante a sincronização com song_mastery.step_video
  useEffect(() => {
    if (!user?.id || !lessonSteps.video) return;
    const realSongId = getRealSongId();

    if (realSongId) {
      progressService.updateSongMastery(user.id, realSongId, { step_video: true }).catch((err) => {
        console.warn('[MagicClassroomView] Auto-repair step_video error:', err);
      });
    } else if (lesson) {
      songsService.getSongForLesson({
        lessonId: lesson.id,
        moduleId: lesson.moduleId,
        lessonTitle: lesson.title,
        songTitle: typeof lesson.relatedSong === 'string' ? lesson.relatedSong : (lesson.relatedSong?.title || '')
      }).then(({ data: fetchedSong }) => {
        if (fetchedSong?.id && user?.id) {
          progressService.updateSongMastery(user.id, fetchedSong.id, { step_video: true }).catch(() => {});
        }
      });
    }
  }, [user?.id, lessonSteps.video, resolvedSong?.id, lesson?.id]);

  const [saveStepWarning, setSaveStepWarning] = useState(null);

  // Helper to mark a step complete and persist in user_progress and song_mastery
  const handleUpdateStep = async (stepKey) => {
    setLessonSteps((prev) => {
      if (prev[stepKey]) return prev;
      return { ...prev, [stepKey]: true };
    });

    if (!user?.id || !lesson?.id) return;

    const realSongId = getRealSongId();

    // Sincroniza a conclusão do vídeo diretamente em song_mastery.step_video com UUID garantido
    if (stepKey === 'video') {
      if (realSongId) {
        progressService.updateSongMastery(user.id, realSongId, { step_video: true }).catch((err) => {
          console.warn('[MagicClassroomView] Erro ao sincronizar step_video em song_mastery:', err);
        });
      } else {
        songsService.getSongForLesson({
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          lessonTitle: lesson.title,
          songTitle: typeof lesson.relatedSong === 'string' ? lesson.relatedSong : (lesson.relatedSong?.title || '')
        }).then(({ data: fetchedSong }) => {
          if (fetchedSong?.id) {
            progressService.updateSongMastery(user.id, fetchedSong.id, { step_video: true }).catch(() => {});
          }
        });
      }
    }

    try {
      const res = await progressService.saveLessonProgressSteps(user.id, lesson.id, { [stepKey]: true });
      if (res?.error) {
        const errCode = res.error.code ? ` (${res.error.code})` : '';
        const errMsg = typeof res.error === 'string' ? res.error : (res.error.message || 'Erro ao sincronizar passo');
        console.error(`Erro ao salvar passo "${stepKey}" no Supabase${errCode}:`, res.error);
        setSaveStepWarning(`Aviso: Falha ao sincronizar passo no banco: ${errMsg}${errCode}`);
      } else {
        setSaveStepWarning(null);
      }
    } catch (err) {
      const errCode = err?.code ? ` (${err.code})` : '';
      const errMsg = err?.message || String(err);
      console.error(`Erro ao salvar passo "${stepKey}" no Supabase${errCode}:`, err);
      setSaveStepWarning(`Aviso: Falha ao sincronizar passo no banco: ${errMsg}${errCode}`);
    }
  };

  // Callback when a word is approved in Voice Lab (merges pronunciation_done and awaits Supabase save)
  const handlePronunciationWordApproved = async (wordIndex, allApprovedIndices) => {
    const cleanDone = Array.from(
      new Set((allApprovedIndices || []).map(Number).filter((n) => !isNaN(n)))
    ).sort((a, b) => a - b);

    // 1. Update UI state immediately
    setLessonSteps((prev) => ({
      ...prev,
      pronunciation_done: cleanDone
    }));

    if (!user?.id || !lesson?.id) return;

    // 2. Persist to localStorage
    saveLocalPronunciationDone(user.id, lesson.id, cleanDone);

    // 3. Persist to Supabase with await and explicit error feedback
    try {
      const res = await progressService.saveLessonProgressSteps(user.id, lesson.id, {
        pronunciation_done: cleanDone
      });

      if (res?.error) {
        const errCode = res.error.code ? ` (${res.error.code})` : '';
        const errMsg = typeof res.error === 'string' ? res.error : (res.error.message || 'Erro ao sincronizar progresso no banco');
        console.error(`Erro ao salvar progresso de pronúncia no Supabase${errCode}:`, res.error);
        setSaveStepWarning(`Aviso: Falha ao gravar palavra aprovada no banco: ${errMsg}${errCode}`);
      } else {
        setSaveStepWarning(null);
      }
    } catch (err) {
      const errCode = err?.code ? ` (${err.code})` : '';
      const errMsg = err?.message || String(err);
      console.error(`Erro ao salvar progresso de pronúncia no Supabase${errCode}:`, err);
      setSaveStepWarning(`Aviso: Falha ao gravar palavra aprovada no banco: ${errMsg}${errCode}`);
    }
  };

  // Callback when pronunciation step is concluded via Voice Lab button
  const handlePronunciationComplete = async () => {
    setLessonSteps((prev) => ({
      ...prev,
      pronunciation: true,
      pronunciation_completed: true
    }));

    if (!user?.id || !lesson?.id) return;

    const targetSongId = resolvedSong?.id || lesson?.relatedSong?.id || lesson?.songId;
    saveLocalPronunciationCompleted(user.id, targetSongId, lesson.id);

    try {
      const res = await progressService.saveLessonProgressSteps(user.id, lesson.id, {
        pronunciation: true,
        pronunciation_completed: true
      });

      if (res?.error) {
        const errCode = res.error.code ? ` (${res.error.code})` : '';
        const errMsg = typeof res.error === 'string' ? res.error : (res.error.message || 'Erro ao salvar conclusão de pronúncia');
        console.error(`Erro ao salvar conclusão de pronúncia no Supabase${errCode}:`, res.error);
        setSaveStepWarning(`Aviso: Conclusão salva apenas localmente: ${errMsg}${errCode}`);
      } else {
        setSaveStepWarning(null);
      }
    } catch (err) {
      const errCode = err?.code ? ` (${err.code})` : '';
      const errMsg = err?.message || String(err);
      console.error(`Erro ao salvar conclusão de pronúncia no Supabase${errCode}:`, err);
      setSaveStepWarning(`Aviso: Conclusão salva apenas localmente: ${errMsg}${errCode}`);
    }
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

      {/* Visual Step Save Warning Banner if saving failed */}
      {saveStepWarning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{saveStepWarning}</span>
          </div>
          <button
            onClick={() => setSaveStepWarning(null)}
            className="text-xs text-amber-400 hover:text-white px-2 py-1 rounded bg-amber-500/20 cursor-pointer"
          >
            Fechar
          </button>
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
            isPronunciationCompleted={Boolean(lessonSteps.pronunciation_completed || lessonSteps.pronunciation)}
            isPracticeCompleted={Boolean(lessonSteps.practice)}
            onOpenFullMusicPlayer={(song) => {
              if (onOpenMusicPlayer) {
                onOpenMusicPlayer(song || resolvedSong || enrichedLesson.relatedSong);
              }
            }}
            onSongComplete={() => handleUpdateStep('song')}
            onPronunciationWordApproved={handlePronunciationWordApproved}
            onPronunciationComplete={handlePronunciationComplete}
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
