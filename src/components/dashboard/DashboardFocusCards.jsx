import React from 'react';
import { Target, Clock, Sparkles, Compass, Flame, Edit3, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OBJECTIVE_DETAILS = {
  '✈️ Viajar': {
    icon: '✈️',
    title: 'Viajar pelo Mundo',
    subtitle: 'Foco em Viagens & Vivência Internacional',
    description: 'Aprender inglês com ritmo para se comunicar com naturalidade em aeroportos, hotéis, restaurantes e passeios.',
    color: 'from-cyan-500/20 via-[#121526] to-[#0a0c16]',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
    textColor: 'text-cyan-300',
    badge: 'Viagens & Lazer'
  },
  '💼 Trabalho': {
    icon: '💼',
    title: 'Mercado de Trabalho',
    subtitle: 'Foco Profissional & Carreira',
    description: 'Desenvolver vocabulário corporativo, apresentações, e-mails e reuniões com segurança e desenvoltura.',
    color: 'from-purple-500/20 via-[#121526] to-[#0a0c16]',
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    textColor: 'text-purple-300',
    badge: 'Carreira'
  },
  '🗣 Conversação': {
    icon: '🗣',
    title: 'Conversação Natural',
    subtitle: 'Foco em Fala & Ritmo',
    description: 'Destravar a fala, dominar pronúncia rítmica e conversar com nativos sem hesitação ou medo de errar.',
    color: 'from-amber-500/20 via-[#121526] to-[#0a0c16]',
    borderColor: 'border-amber-500/30 hover:border-amber-400/60',
    textColor: 'text-amber-300',
    badge: 'Conversação'
  },
  '🌎 Fluência': {
    icon: '🌎',
    title: 'Fluência Completa',
    subtitle: 'Domínio de Ponta a Ponta',
    description: 'Dominar o inglês através do método musical exclusivo com fixação profunda e raciocínio direto no idioma.',
    color: 'from-emerald-500/20 via-[#121526] to-[#0a0c16]',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
    textColor: 'text-emerald-300',
    badge: 'Fluência Total'
  }
};

const ROUTINE_DETAILS = {
  '10 minutos': {
    title: '10 Minutos / Dia',
    rhythm: 'Ritmo Suave & Constante',
    recommendation: '1 sessão diária de fixação rápida para manter a constância mesmo nos dias mais corridos.',
    badge: '🌱 Hábito Diário'
  },
  '20 minutos': {
    title: '20 Minutos / Dia',
    rhythm: 'Recomendado Magic English',
    recommendation: '1 Aula em Vídeo + 1 Magic Song no Karaokê para absorção ideal e pontuação contínua de XP.',
    badge: '⭐ Ritmo Ideal'
  },
  '30 minutos': {
    title: '30 Minutos / Dia',
    rhythm: 'Ritmo Acelerado',
    recommendation: '1 Aula + 2 Músicas + Treino de Pronúncia IA para acelerar a fluência musical.',
    badge: '⚡ Acelerado'
  },
  '1 hora': {
    title: '1 Hora / Dia',
    rhythm: 'Imersão Completa',
    recommendation: 'Ciclo completo de imersão: aulas, desafios musicais, pronúncia fonética e conversação.',
    badge: '🔥 Super Imersão'
  }
};

export default function DashboardFocusCards({ onOpenProfile }) {
  const { user } = useAuth();
  const rawObjective = user?.objective || '✈️ Viajar';
  const rawDailyTime = user?.daily_study_time || '20 minutos';

  const objDetail = OBJECTIVE_DETAILS[rawObjective] || OBJECTIVE_DETAILS['✈️ Viajar'];
  const routineDetail = ROUTINE_DETAILS[rawDailyTime] || ROUTINE_DETAILS['20 minutos'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      
      {/* 1. Card Meu Foco / Objetivo */}
      <div className={`relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${objDetail.color} border ${objDetail.borderColor} shadow-xl flex flex-col justify-between space-y-4 group transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181c32] border border-slate-700/60 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Meu Foco Principal</span>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1 bg-[#181c32] hover:bg-purple-600/30 px-2.5 py-1 rounded-lg border border-purple-500/20 transition-all cursor-pointer"
                title="Editar no perfil"
              >
                <Edit3 className="w-3 h-3" />
                <span>Alterar</span>
              </button>
            )}
          </div>

          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#181c32] border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              {objDetail.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {objDetail.title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 ${objDetail.textColor}`}>
                  {objDetail.badge}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                {objDetail.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
            {objDetail.description}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Trilhas alinhadas ao seu foco
          </span>
        </div>
      </div>

      {/* 2. Card Minha Meta Diária */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#121526] to-[#0a0c16] border border-indigo-500/30 hover:border-indigo-400/60 shadow-xl flex flex-col justify-between space-y-4 group transition-all duration-300">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181c32] border border-slate-700/60 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Minha Meta Diária</span>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1 bg-[#181c32] hover:bg-purple-600/30 px-2.5 py-1 rounded-lg border border-purple-500/20 transition-all cursor-pointer"
                title="Editar no perfil"
              >
                <Edit3 className="w-3 h-3" />
                <span>Alterar</span>
              </button>
            )}
          </div>

          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#181c32] border border-indigo-500/30 flex items-center justify-center text-xl shadow-inner text-indigo-400 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {routineDetail.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {routineDetail.badge}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                {routineDetail.rhythm}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
            {routineDetail.recommendation}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Pratique hoje para manter sua sequência
          </span>
        </div>
      </div>

    </div>
  );
}
