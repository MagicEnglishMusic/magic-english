import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Star, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Award
} from 'lucide-react';

export default function PracticeCards({ challenge, xpReward = 50, onClaimXp }) {
  // Practice 1: Pronunciation State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedScore, setRecordedScore] = useState(null);

  // Practice 2: Challenge Quiz State
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizStatus, setQuizStatus] = useState(null); // 'correct' | 'wrong' | null

  // Practice 3: XP Claim State
  const [isClaimed, setIsClaimed] = useState(false);

  // Simulate pronunciation recording
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordedScore(96); // 96% accuracy
    } else {
      setIsRecording(true);
      setRecordedScore(null);
      setTimeout(() => {
        setIsRecording(false);
        setRecordedScore(96);
      }, 3000);
    }
  };

  const handleSelectAnswer = (option) => {
    setSelectedOption(option);
    if (option === challenge.correctAnswer) {
      setQuizStatus('correct');
    } else {
      setQuizStatus('wrong');
    }
  };

  const handleClaim = () => {
    if (!isClaimed) {
      setIsClaimed(true);
      if (onClaimXp) onClaimXp(xpReward);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Área de Prática & Desafios
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: 🎤 Treinar Pronúncia */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131628] to-[#0e101f] border border-purple-500/25 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-400" />
                Treinar Pronúncia
              </span>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full font-semibold border border-purple-500/20">
                IA Vocal
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              Cante a frase: "Hello, good morning my friend!"
            </p>
            <p className="text-xs text-slate-400">
              Pressione o botão e fale no microfone para avaliar seu ritmo.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {recordedScore !== null && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pronúncia Excelente!</span>
                </div>
                <span className="text-sm font-black text-emerald-400">{recordedScore}%</span>
              </div>
            )}

            <button
              onClick={handleToggleRecord}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
                  : 'bg-[#181c32] hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500 shadow-purple-900/20'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 animate-spin" />
                  <span>Gravando sua voz... Fale agora!</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>{recordedScore ? 'Gravar Novamente' : 'Iniciar Gravação'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: ⭐ Desafio da Música */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131628] to-[#0e101f] border border-blue-500/25 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-blue-400" />
                Desafio da Música
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-500/20">
                Quiz
              </span>
            </div>
            <p className="text-xs text-slate-400">{challenge.question}</p>
            <p className="text-sm font-bold text-white bg-[#161a2f] p-2.5 rounded-xl border border-slate-800">
              "{challenge.prompt}"
            </p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {challenge.options.map((option) => {
                const isSelected = selectedOption === option;
                const isCorrect = isSelected && quizStatus === 'correct';
                const isWrong = isSelected && quizStatus === 'wrong';

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isCorrect
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : isWrong
                        ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                        : 'bg-[#181c30] border-slate-800 text-slate-300 hover:border-blue-400/50 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {quizStatus === 'correct' && (
              <p className="text-[11px] text-emerald-400 font-semibold pt-1 text-center">
                ✓ Correto! {challenge.explanation}
              </p>
            )}
            {quizStatus === 'wrong' && (
              <p className="text-[11px] text-rose-400 font-semibold pt-1 text-center">
                ✕ Tente novamente!
              </p>
            )}
          </div>
        </div>

        {/* Card 3: 🏆 Ganhar XP */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131628] to-[#0e101f] border border-amber-500/25 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Ganhar XP
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
                Recompensa
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              Conclua esta aula e resgate seus pontos
            </p>
            <p className="text-xs text-slate-400">
              Cante a canção até o final para desbloquear a pontuação de maestria vocal.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClaim}
              disabled={isClaimed}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isClaimed
                  ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 shadow-sm cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isClaimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>+{xpReward} XP Resgatados com Sucesso!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Resgatar +{xpReward} XP da Música</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
