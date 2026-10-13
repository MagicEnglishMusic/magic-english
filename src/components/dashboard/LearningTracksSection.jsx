import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plane, 
  Briefcase, 
  MessageCircle, 
  ChevronRight, 
  BookOpen, 
  Compass,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';

const MODULE_THEMES = [
  {
    icon: Sparkles,
    tag: 'Essencial',
    gradient: 'from-purple-900/60 via-purple-950/40 to-[#12141e]',
    borderHover: 'hover:border-purple-500/50',
    iconColor: 'text-purple-400'
  },
  {
    icon: Plane,
    tag: 'Prático',
    gradient: 'from-blue-900/60 via-blue-950/40 to-[#12141e]',
    borderHover: 'hover:border-blue-500/50',
    iconColor: 'text-cyan-400'
  },
  {
    icon: Briefcase,
    tag: 'Carreira',
    gradient: 'from-indigo-900/60 via-indigo-950/40 to-[#12141e]',
    borderHover: 'hover:border-indigo-500/50',
    iconColor: 'text-indigo-400'
  },
  {
    icon: MessageCircle,
    tag: 'Fluência',
    gradient: 'from-violet-900/60 via-violet-950/40 to-[#12141e]',
    borderHover: 'hover:border-violet-500/50',
    iconColor: 'text-fuchsia-400'
  }
];

export default function LearningTracksSection({ onSelectTrack, onSelectModule, onViewAll }) {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRealModules() {
      try {
        setLoading(true);
        const [modsRes, lessonsRes, progRes] = await Promise.all([
          modulesService.getModules(),
          lessonsService.getAllLessons(),
          user?.id ? progressService.getUserProgress(user.id) : Promise.resolve({ data: [] })
        ]);

        const dbModules = modsRes.data || [];
        const dbLessons = lessonsRes.data || [];
        const dbProgress = progRes?.data || [];

        if (!isMounted) return;

        const completedLessonIds = new Set(
          dbProgress
            .filter((p) => p.completed === true || Number(p.progress_percent) === 100)
            .map((p) => p.lesson_id)
        );

        const enriched = dbModules.map((mod, idx) => {
          const modLessons = dbLessons.filter((l) => l.module_id === mod.id);
          const totalLessons = modLessons.length || Number(mod.lessons_count) || 0;
          const completedCount = modLessons.filter((l) => completedLessonIds.has(l.id)).length;
          const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
          const theme = MODULE_THEMES[idx % MODULE_THEMES.length];

          return {
            ...mod,
            lessonsCount: totalLessons,
            completedLessons: completedCount,
            progressPercent,
            theme,
            isCompleted: totalLessons > 0 && completedCount === totalLessons
          };
        });

        setModules(enriched);
      } catch (err) {
        console.warn('[LearningTracksSection] Erro ao carregar módulos reais:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRealModules();
    return () => { isMounted = false; };
  }, [user?.id]);

  const handleCardClick = (mod) => {
    if (onSelectModule) {
      onSelectModule(mod.id);
    } else if (onSelectTrack) {
      onSelectTrack(mod);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-blue-400" />
            Trilhas & Módulos de Aprendizado
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jornadas estruturadas passo a passo do iniciante à fluência
          </p>
        </div>
        <button 
          onClick={onViewAll || onSelectTrack}
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
        >
          Ver todas as trilhas
        </button>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-[#111424] border border-[#1f243c] flex items-center justify-center gap-3 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span>Carregando módulos de aprendizado...</span>
        </div>
      ) : modules.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#111424] border border-dashed border-[#1f243c] text-center space-y-2">
          <BookOpen className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
          <h4 className="text-sm font-bold text-white">Nenhum módulo encontrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Os módulos oficiais do curso estarão disponíveis em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const IconComponent = mod.theme.icon;
            const progressPercent = mod.progressPercent;

            return (
              <div
                key={mod.id}
                onClick={() => handleCardClick(mod)}
                className={`p-5 rounded-2xl bg-gradient-to-br ${mod.theme.gradient} border border-[#1f243a] ${mod.theme.borderHover} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#141728] border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:text-cyan-400 group-hover:border-cyan-400/40 transition-all shadow-md">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                          {mod.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {mod.theme.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {mod.completedLessons} de {mod.lessonsCount} {mod.lessonsCount === 1 ? 'aula concluída' : 'aulas concluídas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#171b2d] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-purple-600 transition-all">
                    {mod.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {mod.description && (
                  <p className="text-xs text-slate-300/80 mt-4 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progresso do Módulo</span>
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
      )}
    </section>
  );
}
