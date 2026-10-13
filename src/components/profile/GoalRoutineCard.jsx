import React from 'react';
import { Target, Clock, Sparkles, Compass, Flame, Edit3, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

const OBJECTIVE_DETAILS = {
  '✈️ Viajar': {
    icon: '✈️',
    title: 'Viajar pelo Mundo',
    subtitle: 'Foco em Viagens & Vivência Internacional',
    description: 'Aprender inglês com ritmo para se comunicar com naturalidade em aeroportos, hotéis, restaurantes e passeios.',
    color: 'from-cyan-500/20 to-blue-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-300',
    badge: 'Viagens & Lazer'
  },
  '💼 Trabalho': {
    icon: '💼',
    title: 'Mercado de Trabalho',
    subtitle: 'Foco Profissional & Carreira',
    description: 'Desenvolver vocabulário corporativo, apresentações, e-mails e reuniões com segurança e desenvoltura.',
    color: 'from-purple-500/20 to-indigo-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    badge: 'Carreira'
  },
  '🗣 Conversação': {
    icon: '🗣',
    title: 'Conversação Natural',
    subtitle: 'Foco em Fala & Ritmo',
    description: 'Destravar a fala, dominar pronúncia rítmica e conversar com nativos sem hesitação ou medo de errar.',
    color: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-300',
    badge: 'Conversação'
  },
  '🌎 Fluência': {
    icon: '🌎',
    title: 'Fluência Completa',
    subtitle: 'Domínio de Ponta a Ponta',
    description: 'Dominar o inglês através do método musical exclusivo com fixação profunda e raciocínio direto no idioma.',
    color: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-500/30',
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

export default function GoalRoutineCard({
  objective = '✈️ Viajar',
  dailyStudyTime = '20 minutos',
  onOpenEdit,
  className = ""
}) {
  const objDetail = OBJECTIVE_DETAILS[objective] || OBJECTIVE_DETAILS['✈️ Viajar'];
  const routineDetail = ROUTINE_DETAILS[dailyStudyTime] || ROUTINE_DETAILS['20 minutos'];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ${className}`}>
      
      {/* 1. Card Meu Objetivo Principal */}
      <div className={`relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${objDetail.color} via-[#121526] to-[#0a0c16] border ${objDetail.borderColor} shadow-xl flex flex-col justify-between space-y-4 group hover:border-purple-500/50 transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181c32] border border-slate-700/60 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Meu Objetivo</span>
            </div>
            {onOpenEdit && (
              <button
                onClick={onOpenEdit}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1 bg-[#181c32] hover:bg-purple-600/30 px-2.5 py-1 rounded-lg border border-purple-500/20 transition-all cursor-pointer"
                title="Alterar meu objetivo"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <div className="flex items-start gap-4 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1f38] border border-[#2b335a] flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
              {objDetail.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-black text-white tracking-tight">
                  {objDetail.title}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 ${objDetail.textColor}`}>
                  {objDetail.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-purple-200/90 mt-0.5">
                {objDetail.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1 font-medium">
            {objDetail.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#1e243c] flex items-center justify-between text-[11px] relative z-10">
          <span className="text-slate-400">Direcionamento de Conteúdo:</span>
          <span className="text-white font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Personalizado
          </span>
        </div>
      </div>

      {/* 2. Card Minha Rotina & Meta Diária */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-cyan-950/20 via-[#121526] to-[#0a0c16] border border-cyan-500/30 shadow-xl flex flex-col justify-between space-y-4 group hover:border-cyan-400/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181c32] border border-slate-700/60 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Minha Rotina</span>
            </div>
            {onOpenEdit && (
              <button
                onClick={onOpenEdit}
                className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 bg-[#181c32] hover:bg-cyan-600/30 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition-all cursor-pointer"
                title="Alterar minha meta diária"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <div className="flex items-start gap-4 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#162238] border border-[#23385c] flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-black text-white tracking-tight">
                  {routineDetail.title}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {routineDetail.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-cyan-200/90 mt-0.5">
                {routineDetail.rhythm}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1 font-medium">
            {routineDetail.recommendation}
          </p>
        </div>

        <div className="pt-3 border-t border-[#1e243c] flex items-center justify-between text-[11px] relative z-10">
          <span className="text-slate-400">Status de Prática:</span>
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Meta Ativa
          </span>
        </div>
      </div>

    </div>
  );
}
