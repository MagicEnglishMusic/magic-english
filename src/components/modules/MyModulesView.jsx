import React, { useState } from 'react';
import { Play, Sparkles, Tv, Clock, BookOpen, Music, CheckCircle2, ArrowRight } from 'lucide-react';
import ModuleBannerCard from './ModuleBannerCard';
import ModuleDetailView from './ModuleDetailView';
import ProgressBar from '../tracks/ProgressBar';
import { modulesLibraryData, currentOngoingLesson } from '../../data/modulesData';

export default function MyModulesView({ onOpenClassroomLesson, onOpenMusicalPractice }) {
  const [selectedModule, setSelectedModule] = useState(null);

  const handleSelectModule = (mod) => {
    setSelectedModule(mod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
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
                lessonNumber: lesson.lessonNumber,
                title: lesson.title,
                duration: lesson.duration,
                module: selectedModule.title,
                videoThumbnail: lesson.thumbnail
              });
            }
          }}
          onOpenMusicalPractice={onOpenMusicalPractice}
        />
      ) : (
        <>
          {/* 1. Área Superior: "Continue sua jornada" */}
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-r from-[#140e2b] via-[#0f132a] to-[#09152a] p-6 sm:p-8 shadow-2xl shadow-purple-950/40 group">
            <div className="absolute inset-0 z-0 opacity-25">
              <img
                src={currentOngoingLesson.thumbnail}
                alt="Continue sua jornada"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d091e] via-[#0d091e]/90 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{currentOngoingLesson.progress > 0 ? "Continue sua jornada" : "Inicie sua jornada"}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    Você está no <strong className="text-white">{currentOngoingLesson.moduleName} ({currentOngoingLesson.moduleTitle})</strong>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {currentOngoingLesson.lessonNumber} — {currentOngoingLesson.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  {currentOngoingLesson.subtitle}
                </p>

                {/* Progress Bar */}
                <div className="pt-1 max-w-md">
                  <ProgressBar value={currentOngoingLesson.progress} max={100} showLabel={true} size="sm" />
                </div>
              </div>

              {/* Action Button: Iniciar / Continuar Aula */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    if (onOpenClassroomLesson) {
                      onOpenClassroomLesson(currentOngoingLesson);
                    }
                  }}
                  className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-600/40 hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </div>
                  <span>{currentOngoingLesson.progress > 0 ? "▶ Continuar aula" : "▶ Começar primeira aula"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Área Principal: "Meus Módulos" Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Tv className="w-6 h-6 text-purple-400" />
              <h1 className="text-3xl font-black text-white tracking-tight">Meus Módulos</h1>
            </div>
            <p className="text-sm text-slate-400">
              Escolha sua próxima etapa e evolua no seu ritmo.
            </p>
          </div>

          {/* 3. Grade Visual de Cards Verticais 3:4 (Estilo Capa de Streaming Netflix / Prime Video) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {modulesLibraryData.map((module) => (
              <ModuleBannerCard
                key={module.id}
                module={module}
                onSelectModule={handleSelectModule}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
