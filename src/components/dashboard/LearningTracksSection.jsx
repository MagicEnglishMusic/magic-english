import React from 'react';
import { 
  Sparkles, 
  Plane, 
  Briefcase, 
  MessageCircle, 
  ChevronRight, 
  BookOpen, 
  Compass 
} from 'lucide-react';
import { learningTracksList } from '../../data/mockData';

const iconMap = {
  Sparkles: Sparkles,
  Plane: Plane,
  Briefcase: Briefcase,
  MessageCircle: MessageCircle,
};

export default function LearningTracksSection({ onSelectTrack }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-blue-400" />
            Trilhas de Aprendizado
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jornadas estruturadas passo a passo do iniciante à fluência
          </p>
        </div>
        <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
          Ver todas as trilhas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {learningTracksList.map((track) => {
          const IconComponent = iconMap[track.icon] || Sparkles;
          const progressPercent = Math.round((track.completedModules / track.modules) * 100);

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack && onSelectTrack(track)}
              className={`p-5 rounded-2xl bg-gradient-to-br ${track.gradient} border border-[#1f243a] ${track.borderHover} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between group`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#141728] border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:text-cyan-400 group-hover:border-cyan-400/40 transition-all shadow-md">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                        {track.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {track.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>{track.completedModules} de {track.modules} módulos completados</span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#171b2d] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-purple-600 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-300/80 mt-4 leading-relaxed line-clamp-2">
                {track.description}
              </p>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Progresso da Trilha</span>
                  <span className="font-semibold text-slate-200">{progressPercent}%</span>
                </div>
                <div className="w-full bg-[#141726] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
