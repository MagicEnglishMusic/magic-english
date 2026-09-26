import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Headphones, 
  Brain, 
  Mic, 
  Sparkles, 
  Volume2, 
  Play, 
  Pause, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Trophy,
  RotateCcw,
  MicOff
} from 'lucide-react';
import { travelSongMethodData } from '../../data/songMethodData';

export default function MusicalPracticeView({ data = travelSongMethodData, onBack, onGainXp }) {
  const [currentStep, setCurrentStep] = useState(1); // 1 | 2 | 3 | 4
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);

  // Step 2 State: Reverse Translation
  const [reverseIndex, setReverseIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [reverseStatus, setReverseStatus] = useState(null); // 'correct' | 'wrong' | null

  // Step 3 State: Sing Along
  const [isSingingPlaying, setIsSingingPlaying] = useState(false);
  const [singingLine, setSingingLine] = useState(0);

  // Step 4 State: Challenge Without Support
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [isRecordingChallenge, setIsRecordingChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  // Reverse Translation Verification
  const checkReverseAnswer = (answerToCheck) => {
    const cleanAnswer = (answerToCheck || typedAnswer).trim().toLowerCase().replace(/[.,?!]/g, '');
    const currentRev = data.reverseExercises[reverseIndex];
    const expected = currentRev.expectedEn.toLowerCase().replace(/[.,?!]/g, '');

    if (cleanAnswer === expected) {
      setReverseStatus('correct');
      speak(currentRev.expectedEn);
    } else {
      setReverseStatus('wrong');
    }
  };

  const nextReverse = () => {
    if (reverseIndex < data.reverseExercises.length - 1) {
      setReverseIndex((prev) => prev + 1);
      setTypedAnswer('');
      setReverseStatus(null);
    } else {
      setCurrentStep(3);
    }
  };

  // Challenge Recording Simulation
  const handleRecordChallenge = () => {
    if (isRecordingChallenge) {
      setIsRecordingChallenge(false);
    } else {
      setIsRecordingChallenge(true);
      setChallengeScore(null);
      setTimeout(() => {
        setIsRecordingChallenge(false);
        setChallengeScore(98);
        if (challengeIndex === data.challengeVerses.length - 1) {
          setIsChallengeCompleted(true);
          if (onGainXp) onGainXp(100);
        }
      }, 2500);
    }
  };

  const nextChallenge = () => {
    if (challengeIndex < data.challengeVerses.length - 1) {
      setChallengeIndex((prev) => prev + 1);
      setChallengeScore(null);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1c2035]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para o Módulo</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            🎵 Método Magic English de Fixação Musical
          </span>
        </div>
      </div>

      {/* Song Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
            {data.module}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Prática Musical — {data.title}
          </h1>
        </div>

        <span className="text-xs font-mono font-bold text-slate-400 bg-[#141728] px-3 py-1 rounded-lg border border-slate-800 w-fit">
          {data.bpm} • {data.duration}
        </span>
      </div>

      {/* 2. Step Navigator Tabs (Roadmap de 4 Etapas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.methodSteps.map((step) => {
          const isActive = currentStep === step.number;
          const isDone = currentStep > step.number;

          return (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-b from-purple-900/40 via-[#15182c] to-[#0e101f] border-purple-500/80 shadow-xl shadow-purple-600/20 ring-1 ring-purple-400/50'
                  : isDone
                  ? 'bg-[#101322] border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-[#0e101f] border-slate-800 hover:border-purple-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-purple-400">
                  Etapa {step.number}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-400 animate-ping' : 'bg-slate-700'}`}></span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">{step.name}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{step.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 3. STEP CONTENT PANELS */}

      {/* ================================================================ */}
      {/* ETAPA 1 — OUVIRE ACOMPANHAR                                      */}
      {/* ================================================================ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-400" />
                  Etapa 1: Ouvir e Acompanhar
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ouça a pronúncia e compare o inglês com a tradução verso por verso
                </p>
              </div>
              <button
                onClick={() => speak(data.studyVerses.map(v => v.en).join('. '))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all w-fit cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Música Completa</span>
              </button>
            </div>

            {/* Verses List with Side-by-side Study */}
            <div className="space-y-3 pt-2">
              {data.studyVerses.map((verse, idx) => (
                <div
                  key={verse.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#121526] border border-[#1f243c] hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    {/* English Verse */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                        🇺🇸 Inglês
                      </span>
                      <p className="text-base sm:text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        {verse.en}
                      </p>
                    </div>

                    {/* Portuguese Translation */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        🇧🇷 Tradução
                      </span>
                      <p className="text-sm font-semibold text-slate-300">
                        {verse.pt}
                      </p>
                    </div>

                    {/* Quick Vocabulary Hint */}
                    <p className="text-[11px] text-purple-300/80 pt-1">
                      💡 {verse.hint}
                    </p>
                  </div>

                  {/* Listen Voice Button */}
                  <button
                    onClick={() => speak(verse.en)}
                    className="p-3 rounded-xl bg-[#191e36] hover:bg-purple-600 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 w-fit shadow-md"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Ouvir Verso</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Action: Next Step */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-600/40 cursor-pointer"
              >
                <span>Avançar para Etapa 2: Tradução Reversa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ETAPA 2 — TRADUÇÃO REVERSA (RECUPERAÇÃO DO SIGNIFICADO)           */}
      {/* ================================================================ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-7 sm:p-9 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Etapa 2: Tradução Reversa
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recupere o inglês através do significado da canção
                </p>
              </div>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                {reverseIndex + 1} de {data.reverseExercises.length}
              </span>
            </div>

            {/* Exercise Box */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#14172a] border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Como você canta / diz em inglês:
                </span>
                <p className="text-2xl font-black text-white">
                  "{data.reverseExercises[reverseIndex].pt}"
                </p>
                <p className="text-xs text-purple-300/80 pt-1">
                  💡 Dica: {data.reverseExercises[reverseIndex].hint}
                </p>
              </div>

              {/* Quick Select Options */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">
                  Selecione a frase correta:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.reverseExercises[reverseIndex].options.map((opt) => {
                    const isSelected = typedAnswer === opt;
                    const isCorrect = isSelected && reverseStatus === 'correct';
                    const isWrong = isSelected && reverseStatus === 'wrong';

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setTypedAnswer(opt);
                          checkReverseAnswer(opt);
                        }}
                        className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer text-left ${
                          isCorrect
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : isWrong
                            ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                            : 'bg-[#15192c] border-slate-800 text-slate-200 hover:border-purple-500/50 hover:bg-[#1d223c]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Alert */}
              {reverseStatus === 'correct' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Perfeito! Você resgatou a frase com sucesso!</span>
                  </div>
                  <button
                    onClick={nextReverse}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    {reverseIndex < data.reverseExercises.length - 1 ? 'Próxima Frase ➔' : 'Ir para Etapa 3 ➔'}
                  </button>
                </div>
              )}

              {reverseStatus === 'wrong' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>✕ Quase lá! Lembre-se do ritmo da música e tente de novo.</span>
                  <button
                    onClick={() => setReverseStatus(null)}
                    className="underline text-xs font-bold"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ETAPA 3 — CANTAR JUNTO                                           */}
      {/* ================================================================ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-7 sm:p-9 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 max-w-3xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  Etapa 3: Cantar Junto
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhe a música cantando em voz alta para soltar a fala e o ritmo
                </p>
              </div>

              <button
                onClick={() => {
                  const next = !isSingingPlaying;
                  setIsSingingPlaying(next);
                  if (next) speak(data.studyVerses.map(v => v.en).join('. '));
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                {isSingingPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                <span>{isSingingPlaying ? 'Pausar Ritmo' : 'Iniciar Playback'}</span>
              </button>
            </div>

            {/* Karaoke Style Dynamic Verses */}
            <div className="space-y-3">
              {data.studyVerses.map((verse, idx) => (
                <div
                  key={verse.id}
                  onClick={() => {
                    setSingingLine(idx);
                    speak(verse.en);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    singingLine === idx
                      ? 'bg-gradient-to-r from-purple-950/50 via-[#191d36] to-[#121528] border-purple-500/70 shadow-lg shadow-purple-600/20 scale-[1.01]'
                      : 'bg-[#121526] border-[#1f243c] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <p className={`text-base sm:text-xl font-black ${singingLine === idx ? 'text-white' : 'text-slate-300'}`}>
                      {verse.en}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                      {verse.pt}
                    </p>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${singingLine === idx ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {singingLine === idx ? 'Cantando 🎵' : 'Cantar'}
                  </span>
                </div>
              ))}
            </div>

            {/* Next Step CTA */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-600/40 cursor-pointer"
              >
                <span>Avançar para Etapa 4: Cantar sem apoio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ETAPA 4 — CANTAR SEM APOIO (MODO DESAFIO DE MAESTRIA)             */}
      {/* ================================================================ */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-b from-[#14102c] via-[#0e101f] to-[#0a0c16] border border-purple-500/40 space-y-6 max-w-2xl mx-auto shadow-2xl text-center">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Etapa 4: Desafio Final de Maestria</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Cantar Sem Apoio em Inglês
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Veja o significado em português e cante a frase completa em inglês!
              </p>
            </div>

            {/* Challenge Target Box */}
            <div className="p-6 rounded-2xl bg-[#15192c] border border-purple-500/30 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Frase em Português ({challengeIndex + 1}/{data.challengeVerses.length})
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white">
                "{data.challengeVerses[challengeIndex].pt}"
              </p>
            </div>

            {/* Vocal Score Badge */}
            {challengeScore && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between animate-in fade-in duration-300 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase">Pontuação Vocal</p>
                    <p className="text-lg font-black text-white">{challengeScore}% — Maestria Vocal Atingida!</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-400">+100 XP</span>
              </div>
            )}

            {/* Record / Voice Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleRecordChallenge}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
                  isRecordingChallenge
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50'
                    : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-blue-600 text-white shadow-purple-600/40 hover:scale-105'
                }`}
              >
                {isRecordingChallenge ? (
                  <>
                    <MicOff className="w-5 h-5 animate-spin" />
                    <span>Ouvindo sua voz... Cante agora!</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>🎙 Gravar & Cantar em Inglês</span>
                  </>
                )}
              </button>

              {challengeScore && challengeIndex < data.challengeVerses.length - 1 && (
                <button
                  onClick={nextChallenge}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all cursor-pointer"
                >
                  Próximo Desafio ➔
                </button>
              )}
            </div>

            {/* Finished Reward Banner */}
            {isChallengeCompleted && (
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-[#181d32] to-purple-600/20 border border-amber-500/40 text-center space-y-3 animate-in zoom-in-95 duration-500">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Prática Musical Concluída com Sucesso!</h3>
                <p className="text-xs text-slate-300">
                  Você dominou as estruturas desta canção e acelerou sua fluência em inglês.
                </p>
                <button
                  onClick={onBack}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  Voltar para o Módulo
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
