import React from 'react';
import { Play, Sparkles, Clock, Tv, Music, ArrowRight, Zap } from 'lucide-react';
import { nextLessonsList } from '../../data/mockData';

export default function NextStepsSection({ onSelectLesson }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-indigo-400" />
            Próximos passos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suas próximas aulas recomendadas para avançar na sua trilha
          </p>
        </div>
        <span className="text-xs font-semibold text-purple-400">
          Recomendado para Você
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nextLessonsList.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => onSelectLesson && onSelectLesson(lesson)}
            className="group relative rounded-2xl bg-[#111424] border border-[#1f243c] hover:border-purple-500/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-600/15 cursor-pointer flex flex-col justify-between"
          >
            {/* Thumbnail Header */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-900">
              <img
                src={lesson.image}
                alt={lesson.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-black/20 to-transparent"></div>

              {/* Lesson Number Tag */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-sm">
                  {lesson.lessonNumber}
                </span>
              </div>

              {/* XP Pill */}
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{lesson.xp}</span>
              </div>

              {/* Play Button Overlay on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 scale-75 group-hover:scale-100 transition-transform">
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
                  Módulo: {lesson.module}
                </p>
              </div>

              {/* Footer details: duration and associated memory song */}
              <div className="pt-2 border-t border-[#1c2138] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3 h-3 text-purple-400" />
                  {lesson.duration}
                </span>

                <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <Music className="w-3 h-3" />
                  {lesson.songFix}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
