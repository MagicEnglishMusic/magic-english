import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Tv, Clock, BookOpen, Music, CheckCircle2, ArrowRight, Layers, Loader2 } from 'lucide-react';
import ModuleBannerCard from './ModuleBannerCard';
import ModuleDetailView from './ModuleDetailView';
import ProgressBar from '../tracks/ProgressBar';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';
import { getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function MyModulesView({ 
  selectedModuleId = null,
  onModuleChange = null,
  onOpenClassroomLesson, 
  onOpenMusicalPractice 
}) {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState(null);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync selectedModule when selectedModuleId prop changes or modules finish loading
  useEffect(() => {
    if (modules.length > 0) {
      if (selectedModuleId) {
        const found = modules.find((m) => m.id === selectedModuleId || m.moduleNumber?.toLowerCase() === String(selectedModuleId).toLowerCase());
        setSelectedModule(found || null);
      } else {
        setSelectedModule(null);
      }
    }
  }, [selectedModuleId, modules]);

  useEffect(() => {
    let isMounted = true;
    async function loadModules() {
      setIsLoading(true);
      try {
        const [modsRes, lessonsRes, progRes] = await Promise.all([
          modulesService.getModules(),
          lessonsService.getAllLessons(),
          user?.id ? progressService.getUserProgress(user.id) : Promise.resolve({ data: [] })
        ]);

        const dbModules = modsRes.data || [];
        const dbLessons = lessonsRes.data || [];
        const dbProgress = progRes?.data || [];

        if (isMounted) {
          // Filtragem de Visibilidade Dupla:
          // 1. Chave DESLIGADA (is_visible === false): oculto de forma absoluta
          // 2. Status 'draft' (Rascunho): oculto de forma absoluta
          const visibleModules = dbModules.filter((m) => m.is_visible !== false && m.status !== 'draft');

          const formatted = visibleModules.map((m, idx) => {
            const modLessons = dbLessons.filter((l) => l.module_id === m.id);
            const totalLessons = modLessons.length || m.lessons_count || 0;
            
            const completedLessons = modLessons.filter((l) => {
              const prog = (dbProgress || []).find((p) => p.lesson_id === l.id);
              return Boolean(prog?.completed === true || prog?.progress_percent === 100);
            }).length;

            const realProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            const isComingSoon = m.status === 'coming_soon';

            return {
              id: m.id,
              moduleNumber: `MÓDULO ${m.order_index || idx + 1}`,
              title: m.title || 'Módulo Sem Nome',
              shortDescription: m.subtitle || m.description || 'Módulo oficial do curso.',
              fullDescription: m.description || m.subtitle || 'Módulo oficial do curso.',
              coverImage: getDriveImageUrl(m.banner_url || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80'),
              lessonsCount: totalLessons,
              songsCount: m.songs_count ?? 0,
              progress: realProgress,
              status: m.status || 'published',
              isVisible: m.is_visible !== false,
              isComingSoon,
              isLocked: isComingSoon
            };
          });

          setModules(formatted);
          if (selectedModuleId) {
            const found = formatted.find((m) => m.id === selectedModuleId || m.moduleNumber?.toLowerCase() === String(selectedModuleId).toLowerCase());
            if (found && !found.isComingSoon) {
              setSelectedModule(found);
            } else {
              setSelectedModule(null);
            }
          } else {
            setSelectedModule((prev) => {
              if (!prev) return null;
              const found = formatted.find((m) => m.id === prev.id);
              return (found && !found.isComingSoon) ? found : null;
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching modules in MyModulesView:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadModules();
    return () => { isMounted = false; };
  }, [selectedModuleId, user?.id]);

  const handleSelectModule = (mod) => {
    // Bloquear clique se for módulo "Em Breve" ou bloqueado
    if (mod.isComingSoon || mod.isLocked) {
      return;
    }
    setSelectedModule(mod);
    if (onModuleChange) onModuleChange(mod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    if (onModuleChange) onModuleChange(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-10 animate-in fade-in duration-300">
      
      {selectedModule ? (
        <ModuleDetailView
          module={selectedModule}
          onBack={handleBackToModules}
          onSelectLesson={(lesson) => {
            if (onOpenClassroomLesson) {
              onOpenClassroomLesson({
                id: lesson.id,
                lessonNumber: lesson.lessonNumber,
                title: lesson.title,
                duration: lesson.duration,
                module: selectedModule.title,
                moduleId: selectedModule.id,
                videoThumbnail: lesson.thumbnail,
                videoUrl: lesson.videoUrl,
                relatedSong: lesson.relatedSong,
                rawLesson: lesson
              });
            }
          }}
          onOpenMusicalPractice={onOpenMusicalPractice}
        />
      ) : (
        <>
          {/* 1. Header: "Meus Módulos" */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Tv className="w-6 h-6 text-purple-400" />
              <h1 className="text-3xl font-black text-white tracking-tight">Meus Módulos</h1>
            </div>
            <p className="text-sm text-slate-400">
              Escolha sua próxima etapa e evolua no seu ritmo.
            </p>
          </div>

          {/* 2. Loading State */}
          {isLoading ? (
            <div className="p-16 rounded-3xl bg-[#111425] border border-[#1e233b] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-slate-400">Carregando módulos...</p>
            </div>
          ) : modules.length > 0 ? (
            /* 3. Grade Visual de Cards Verticais 3:4 */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {modules.map((module) => (
                <ModuleBannerCard
                  key={module.id}
                  module={module}
                  onSelectModule={handleSelectModule}
                />
              ))}
            </div>
          ) : (
            /* 4. Empty State Limpo */
            <div className="p-12 text-center rounded-3xl bg-[#111425] border border-[#1e233b] shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Nenhum módulo disponível no momento</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Os módulos de aprendizado cadastrados pelo administrador aparecerão aqui.
                </p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
