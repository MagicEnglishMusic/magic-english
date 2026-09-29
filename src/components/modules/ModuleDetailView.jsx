import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle2, Lock, Clock, Sparkles, Music, BookOpen, Tv, Mic, ArrowRight, Brain, Zap, Loader2, BookX } from 'lucide-react';
import ProgressBar from '../tracks/ProgressBar';
import { lessonsService } from '../../services/lessonsService';
import { getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function ModuleDetailView({ module, onBack, onSelectLesson, onOpenMusicalPractice }) {
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      if (!module?.id) return;
      setIsLoadingLessons(true);
      try {
        const { data } = await lessonsService.getLessonsByModule(module.id);
        if (data) {
          const formatted = data.map((l, idx) => ({
            id: l.id,
            lessonNumber: l.lesson_number || `Aula ${String(idx + 1).padStart(2, '0')}`,
            title: l.title || 'Aula Sem Título',
            description: l.description || '',
            duration: l.duration || '15 min',
            videoUrl: l.video_url,
            thumbnail: getDriveImageUrl(l.thumbnail_url) || module.coverImage,
            status: idx === 0 ? 'in_progress' : 'locked',
            relatedSong: l.related_song || 'Magic Song'
          }));
          setLessons(formatted);
        }
      } catch (err) {
        console.warn('Error fetching module lessons:', err);
      } finally {
        setIsLoadingLessons(false);
      }
    }
    loadLessons();
  }, [module?.id]);

  if (!module) return null;

  const currentLessonsCount = lessons.length || module.lessonsCount || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1c2035]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Meus Módulos</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
          {module.moduleNumber} • {currentLessonsCount} Videoaulas • {module.songsCount || 0} Músicas
        </span>
      </div>

      {/* 2. Module Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-[#0e101f] shadow-2xl p-7 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
          <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e101f] via-[#0e101f]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 space-y-3.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Módulo Oficial Magic English</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            {module.moduleNumber} — {module.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {module.fullDescription || module.shortDescription}
          </p>

          <div className="pt-2 max-w-md">
            <ProgressBar value={module.progress} max={100} showLabel={true} size="md" />
          </div>
        </div>

        {/* Right Stats Card */}
        <div className="relative z-10 w-full md:w-auto flex-shrink-0 grid grid-cols-2 gap-3 p-5 rounded-2xl bg-[#131628]/90 backdrop-blur-md border border-[#232944]">
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-white">{currentLessonsCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Videoaulas</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-purple-400">{module.songsCount || 0}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Magic Songs</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-amber-400">+{currentLessonsCount * 50}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">XP Total</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191d32] border border-slate-800 text-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{module.progress}%</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Progresso</p>
          </div>
        </div>
      </div>

      {/* 3. Visual Learning Method Flow Roadmap */}
      {(() => {
        const modProgress = Number(module.progress) || 0;
        const currentStepNum = modProgress >= 100 ? 6 
          : modProgress >= 80 ? 5
          : modProgress >= 60 ? 4
          : modProgress >= 40 ? 3
          : modProgress >= 20 ? 2
          : 1;

        const learningSteps = [
          { number: 1, title: 'Assistir aula', icon: '🎬' },
          { number: 2, title: 'Ouvir música', icon: '🎵' },
          { number: 3, title: 'Entender tradução', icon: '📖' },
          { number: 4, title: 'Tradução reversa', icon: '🧠' },
          { number: 5, title: 'Cantar junto', icon: '🎤' },
          { number: 6, title: 'Dominar a frase', icon: '⭐' }
        ];

        return (
          <div className="p-6 rounded-3xl bg-[#0c0e1a] border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Fluxo de Aprendizagem do Módulo
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {modProgress >= 100 ? 'Módulo 100% Dominado 🏆' : `Etapa ${currentStepNum} de 6`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-center">
              {learningSteps.map((step) => {
                const isCompleted = modProgress >= 100 || (modProgress > 0 && currentStepNum > step.number);
                const isCurrent = !isCompleted && currentStepNum === step.number;
                const isLocked = !isCompleted && !isCurrent;

                return (
                  <div
                    key={step.number}
                    className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                        : isCurrent
                        ? 'bg-gradient-to-b from-purple-950/60 to-[#171b30] border-purple-500 text-white font-bold shadow-md shadow-purple-600/20 ring-1 ring-purple-400/40'
                        : 'bg-[#121526] border-slate-800/80 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-sm">{step.icon}</span>
                      {isCompleted && <span className="text-emerald-400 font-bold text-[10px]">✓</span>}
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>}
                    </div>
                    <span>{step.number}. {step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 4. Section 1: 🎬 Aulas em Vídeo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-purple-400" />
              🎬 Aulas em Vídeo do Módulo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aulas principais que ensinam as estruturas e o contexto real de uso
            </p>
          </div>
        </div>

        {isLoadingLessons ? (
          <div className="p-12 rounded-2xl bg-[#111424] border border-[#1d2238] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <p className="text-xs text-slate-400">Carregando aulas do módulo...</p>
          </div>
        ) : lessons.length > 0 ? (
          <div className="space-y-3.5">
            {lessons.map((lesson) => {
              const isCompleted = lesson.status === 'completed';
              const isInProgress = lesson.status === 'in_progress';
              const isLocked = lesson.status === 'locked';

              return (
                <div
                  key={lesson.id}
                  onClick={() => !isLocked && onSelectLesson && onSelectLesson(lesson)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLocked
                      ? 'bg-[#0d0f1a]/60 border-slate-800/60 opacity-60 cursor-not-allowed'
                      : isInProgress
                      ? 'bg-gradient-to-r from-purple-950/40 via-[#15182e] to-[#101324] border-purple-500/60 shadow-xl shadow-purple-600/15 cursor-pointer hover:border-purple-400 hover:scale-[1.01]'
                      : 'bg-[#111424] border-[#1d2238] hover:border-purple-500/40 hover:bg-[#161a2f] cursor-pointer hover:scale-[1.01]'
                  }`}
                >
                  {/* Left: Thumbnail & Lesson Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                      <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : isInProgress ? (
                          <Play className="w-5 h-5 fill-white text-white animate-pulse" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-400">
                          {lesson.lessonNumber}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {lesson.relatedSong}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate max-w-lg">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration, Status & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {lesson.duration}
                    </span>

                    {!isLocked ? (
                      <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 whitespace-nowrap cursor-pointer">
                        {isCompleted ? 'Reassistir Aula' : 'Assistir Aula'} ➔
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full">
                        Bloqueada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#111424] border border-[#1d2238] text-center space-y-2">
            <p className="text-sm font-bold text-white">Nenhuma aula cadastrada neste módulo ainda</p>
            <p className="text-xs text-slate-400">As aulas adicionadas pelo administrador neste módulo aparecerão aqui.</p>
          </div>
        )}
      </div>

      {/* 5. Section 2: 🎵 Magic Songs & Prática Musical */}
      <div className="space-y-4 pt-4 border-t border-[#1c2035]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              🎵 Magic Songs de Fixação do Módulo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Músicas criadas exclusivamente para memorização acelerada com o método das 4 etapas
            </p>
          </div>
        </div>

        {/* Featured Music Practice Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#121528] via-[#0f1224] to-[#0c0e1a] border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative border border-cyan-500/30">
              <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Music className="w-8 h-8 text-cyan-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Prática Musical Completa
              </span>
              <h3 className="text-lg font-bold text-white">
                {module.title} — Hit Musical de Fixação
              </h3>
              <p className="text-xs text-slate-300">
                Ouvir e acompanhar ➔ Tradução reversa ➔ Cantar junto ➔ Cantar sem apoio
              </p>
            </div>
          </div>

          <button
            onClick={onOpenMusicalPractice}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mic className="w-4 h-4 fill-black" />
            <span>Iniciar Prática Musical (4 Etapas) ➔</span>
          </button>
        </div>
      </div>

    </div>
  );
}
