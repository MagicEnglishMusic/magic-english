import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Compass, Flame, Clock, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Onboarding({ onComplete }) {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState('✈️ Viajar');
  const [currentSkillLevel, setCurrentSkillLevel] = useState('🌱 Iniciante');
  const [dailyStudyTime, setDailyStudyTime] = useState('20 minutos');

  const objectiveOptions = [
    { id: 'travel', label: '✈️ Viajar', desc: 'Viajar pelo mundo sem medo de se comunicar' },
    { id: 'work', label: '💼 Trabalho', desc: 'Destacar-se no mercado e avançar na carreira' },
    { id: 'speaking', label: '🗣 Conversação', desc: 'Falar com confiança e naturalidade' },
    { id: 'fluency', label: '🌎 Fluência', desc: 'Dominar o inglês de ponta a ponta com música' },
  ];

  const skillOptions = [
    { id: 'beginner', label: '🌱 Iniciante', desc: 'Começando do zero ou quase zero' },
    { id: 'basic', label: '📚 Básico', desc: 'Entendo palavras soltas e frases simples' },
    { id: 'intermediate', label: '🎵 Intermediário', desc: 'Compreendo bem, mas travo na fala' },
    { id: 'advanced', label: '🎤 Avançado', desc: 'Quero aperfeiçoar pronúncia e vocabulário nativo' },
  ];

  const timeOptions = [
    { id: '10m', label: '10 minutos', desc: 'Ritmo suave e constante' },
    { id: '20m', label: '20 minutos', desc: 'Recomendado: 1 aula + 1 Magic Song' },
    { id: '30m', label: '30 minutos', desc: 'Progresso acelerado com prática musical' },
    { id: '60m', label: '1 hora', desc: 'Imersão completa e fixação profunda' },
  ];

  const handleFinish = () => {
    completeOnboarding({ objective, currentSkillLevel, dailyStudyTime });
    if (onComplete) onComplete();
  };

  return (
    <div className="min-h-screen bg-[#070810] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Background Cinematographic Lighting */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-banner.png"
          alt="Magic English Background"
          className="w-full h-full object-cover opacity-15 scale-105 filter blur-[4px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-[#070810]/90 to-[#070810]/60" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0c0e17] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              Magic<span className="text-purple-400">English</span>
            </span>
            <p className="text-[10px] font-semibold text-purple-300/80">
              Personalização da Jornada
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-cyan-400'
                  : s < step
                  ? 'w-4 bg-purple-500/60'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-[#0f1224]/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-7 sm:p-10 shadow-2xl shadow-purple-950/80 space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Etapa {step} de 3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Vamos personalizar sua jornada{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! ✨
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              {step === 1 && 'Qual seu principal objetivo ao aprender inglês com o Magic English?'}
              {step === 2 && 'Qual é o seu nível atual de conhecimento no idioma?'}
              {step === 3 && 'Quanto tempo você deseja dedicar aos seus estudos por dia?'}
            </p>
          </div>

          {/* STEP 1: OBJETIVO */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider text-center">
                Pergunta 1: Qual seu objetivo com o inglês?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {objectiveOptions.map((opt) => {
                  const isSelected = objective === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setObjective(opt.label)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-900/30'
                          : 'bg-[#14172b] border-[#222744] hover:border-purple-500/40 hover:bg-[#191d36]'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-base font-bold text-white mb-0.5">{opt.label}</p>
                        <p className="text-xs text-slate-400">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: NÍVEL ATUAL */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider text-center">
                Pergunta 2: Qual seu nível atual?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {skillOptions.map((opt) => {
                  const isSelected = currentSkillLevel === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCurrentSkillLevel(opt.label)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-900/30'
                          : 'bg-[#14172b] border-[#222744] hover:border-purple-500/40 hover:bg-[#191d36]'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-base font-bold text-white mb-0.5">{opt.label}</p>
                        <p className="text-xs text-slate-400">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: TEMPO POR DIA */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider text-center">
                Pergunta 3: Quanto tempo você quer estudar por dia?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {timeOptions.map((opt) => {
                  const isSelected = dailyStudyTime === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDailyStudyTime(opt.label)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-900/30'
                          : 'bg-[#14172b] border-[#222744] hover:border-purple-500/40 hover:bg-[#191d36]'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-base font-bold text-white mb-0.5">⏱️ {opt.label}</p>
                        <p className="text-xs text-slate-400">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1e233b]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#14172b] border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Avançar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Começar minha Jornada no Magic English</span>
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500">
        © 2026 Magic English — Plataforma Educacional de Música & Vídeo
      </footer>

    </div>
  );
}
