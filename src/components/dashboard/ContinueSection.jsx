import React from 'react';
import { Play, Clock, Tv, Music } from 'lucide-react';
import { continueLessonsList } from '../../data/mockData';

export default function ContinueSection({ onSelectLesson }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            Continue sua aula
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aulas em vídeo em andamento prontas para você retomar de onde parou
          </p>
        </div>
        <span className="text-xs font-semibold text-purple-400">
          Aulas Recentes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {continueLessonsList.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => onSelectLesson && onSelectLesson(lesson)}
            className="group relative rounded-2xl bg-[#111424] border border-[#1f243c] hover:border-purple-500/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-600/15 cursor-pointer flex flex-col justify-between"
          >
            {/* Thumbnail Header with Video Badge */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-900">
              <img
                src={lesson.image}
                alt={lesson.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-black/30 to-transparent"></div>

              {/* Lesson Number Tag */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-purple-600 text-white backdrop-blur-md shadow-sm">
                  {lesson.lessonNumber}
                </span>
              </div>

              {/* Related Song Pill */}
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-cyan-300 border border-cyan-500/20 backdrop-blur-md">
                <Music className="w-2.5 h-2.5 text-cyan-400" />
                <span>{lesson.relatedSong}</span>
              </div>

              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                  {lesson.title}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {lesson.category}
                </p>
              </div>

              {/* Progress & Duration */}
              <div className="space-y-1.5 pt-1 border-t border-[#1c2138]">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-purple-300 font-semibold">
                    <Clock className="w-3 h-3" />
                    {lesson.duration}
                  </span>
                  <span className="font-bold text-white">
                    {lesson.progress > 0 ? `${lesson.progress}% concluído` : 'Disponível'}
                  </span>
                </div>

                <div className="w-full bg-[#181d30] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full"
                    style={{ width: `${lesson.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
