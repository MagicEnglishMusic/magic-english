import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Zap, 
  Mic 
} from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';

export default function MusicalPracticeTab({ lyrics, onComplete, songId = "song-hello" }) {
  const verses = lyrics || [
    { id: 1, en: "Hello, hello, good morning my friend!", pt: "Olá, olá, bom dia meu amigo!", hint: "Comece com 'Hello' e use 'good morning'" },
    { id: 2, en: "The sun is up, a new day will begin.", pt: "O sol nasceu, um novo dia vai começar.", hint: "'The sun is up' para o amanhecer" },
    { id: 3, en: "How are you doing on this lovely day?", pt: "Como você está neste lindo dia?", hint: "'How are you doing?' para cumprimentar" },
    { id: 4, en: "I'm feeling great, ready to sing and play!", pt: "Estou me sentindo ótimo, pronto para cantar e brincar!", hint: "'I'm feeling great' para responder" },
    { id: 5, en: "Nice to meet you, welcome to the show.", pt: "Prazer em conhecer você, bem-vindo ao show.", hint: "'Nice to meet you' para apresentações" }
  ];

  const { addXp, updateSongMasteryStep } = useGamification();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'wrong' | null
  const [isCompleted, setIsCompleted] = useState(false);

  const currentVerse = verses[currentIndex];

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleVerify = (answer) => {
    const userClean = (answer || typedAnswer).trim().toLowerCase().replace(/[.,?!]/g, '');
    const expectedClean = currentVerse.en.toLowerCase().replace(/[.,?!]/g, '');

    if (userClean === expectedClean) {
      setStatus('correct');
      speak(currentVerse.en);
    } else {
      setStatus('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < verses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTypedAnswer('');
      setStatus(null);
    } else {
      setIsCompleted(true);
      // Give XP and update Song Mastery step
      addXp(XP_REWARDS.COMPLETE_MUSICAL_PRACTICE, 'Prática Musical Concluída!', {
        showModal: true,
        type: 'xp',
        title: '🧠 Prática Musical Concluída!',
        subtitle: `Você fez a tradução reversa de todas as ${verses.length} frases da canção!`,
        icon: '🎵',
        bonusText: `+${XP_REWARDS.COMPLETE_MUSICAL_PRACTICE} Magic XP conquistados!`
      });
      updateSongMasteryStep(songId, 'reverse_translation', true);
      if (onComplete) onComplete(XP_REWARDS.COMPLETE_MUSICAL_PRACTICE);
    }
  };

  return (
    <div className="p-6 sm:p-9 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 max-w-3xl mx-auto shadow-2xl animate-in fade-in duration-300">
      
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            🎤 Prática Musical — Tradução Reversa
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recupere o inglês a partir do significado de todas as frases da canção
          </p>
        </div>

        <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 w-fit">
          Frase {currentIndex + 1} de {verses.length}
        </span>
      </div>

      {!isCompleted ? (
        <div className="space-y-6">
          
          {/* Step 1: Frase Original & Tradução Preview */}
          <div className="p-4 rounded-2xl bg-[#121526] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Estude a frase da música:
              </span>
              <button
                onClick={() => speak(currentVerse.en)}
                className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 bg-purple-500/10 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Ouvir Nativo</span>
              </button>
            </div>
            
            <p className="text-base font-bold text-white">
              🇺🇸 {currentVerse.en}
            </p>
            <p className="text-sm text-slate-300 font-medium">
              🇧🇷 {currentVerse.pt}
            </p>
          </div>

          {/* Step 2: Tradução Reversa (Inversão) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#15192e] to-[#101324] border border-purple-500/30 space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              2. Agora faça a tradução reversa:
            </span>

            <div className="space-y-1">
              <p className="text-xs text-slate-400">Em português:</p>
              <p className="text-xl sm:text-2xl font-black text-white">
                "{currentVerse.pt}"
              </p>
            </div>

            {/* Answer Input or Quick Answer */}
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Digite a frase em inglês aqui..."
                className="w-full bg-[#0d0f1a] border border-[#222842] text-white text-sm sm:text-base rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleVerify(typedAnswer)}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Verificar Resposta
                </button>

                <button
                  onClick={() => {
                    setTypedAnswer(currentVerse.en);
                    handleVerify(currentVerse.en);
                  }}
                  className="px-4 py-3 rounded-xl bg-[#1a1e34] hover:bg-[#222844] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Revelar Frase
                </button>
              </div>
            </div>

            {/* Result Status Feedback */}
            {status === 'correct' && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>✓ Correto! Você recuperou a frase perfeitamente!</span>
                </div>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                >
                  {currentIndex < verses.length - 1 ? 'Próxima Frase ➔' : 'Finalizar Prática'}
                </button>
              </div>
            )}

            {status === 'wrong' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>✕ Revise a escrita ou use o botão revelar para fixar.</span>
                <button onClick={() => setStatus(null)} className="underline font-bold cursor-pointer">
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Finished Screen */
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Prática Musical Concluída!</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Você traduziu e fixou todas as {verses.length} frases da canção. Seu cérebro agora recupera o inglês automaticamente!
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
                setStatus(null);
                setTypedAnswer('');
              }}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Refazer Prática
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
