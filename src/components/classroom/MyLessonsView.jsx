import React from 'react';
import { Tv, Play, Clock, Sparkles, CheckCircle2, BookOpen, Music, Search } from 'lucide-react';
import { continueLessonsList, nextLessonsList } from '../../data/mockData';

export default function MyLessonsView({ onOpenLesson }) {
  const allLessons = [...continueLessonsList, ...nextLessonsList];

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c2035]">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Minhas Aulas</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Seu acervo completo de videoaulas com fixação musical integrada
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            24 Aulas no Curso
          </span>
        </div>
      </div>

      {/* Continue Watching Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
          Em Andamento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {continueLessonsList.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => onOpenLesson && onOpenLesson(lesson)}
              className="p-4 rounded-2xl bg-[#111424] border border-[#1e243c] hover:border-purple-500/60 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between space-y-3 group shadow-lg"
            >
              <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-900">
                <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-600 text-white">
                    {lesson.lessonNumber}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                  {lesson.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{lesson.category}</p>
              </div>

              <div className="pt-2 border-t border-[#1c2138] space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{lesson.duration}</span>
                  <span className="font-bold text-white">{lesson.progress > 0 ? `${lesson.progress}%` : 'Disponível'}</span>
                </div>
                <div className="w-full bg-[#181d30] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: `${lesson.progress || 0}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Available Video Lessons */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Módulo 1: Primeiros Passos (Vídeos & Músicas)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allLessons.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onOpenLesson && onOpenLesson(item)}
              className="p-4 sm:p-5 rounded-2xl bg-[#111424] border border-[#1e243c] hover:border-purple-500/50 transition-all flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                    {item.lessonNumber}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.duration || item.totalDuration || '15 min'}
                    </span>
                    <span>•</span>
                    <span className="text-cyan-300 flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {item.relatedSong || item.songFix || 'Magic Song'}
                    </span>
                  </div>
                </div>
              </div>

              <button className="px-4 py-2 rounded-xl bg-[#191d32] group-hover:bg-purple-600 text-slate-300 group-hover:text-white text-xs font-bold transition-all whitespace-nowrap">
                Assistir Aula ➔
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
