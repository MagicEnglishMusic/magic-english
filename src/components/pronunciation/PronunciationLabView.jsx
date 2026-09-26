import React from 'react';
import { Mic, Sparkles, Volume2, Award, CheckCircle2 } from 'lucide-react';
import PronunciationPractice from '../classroom/PronunciationPractice';
import { classroomLessonData } from '../../data/classroomData';

export default function PronunciationLabView() {
  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c2035]">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Laboratório de Pronúncia IA</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Treine sua fala, ouça a pronúncia de nativos e receba avaliação de ritmo em tempo real
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Voice Lab Ativo</span>
        </span>
      </div>

      <PronunciationPractice items={classroomLessonData.pronunciationList} />
    </div>
  );
}
