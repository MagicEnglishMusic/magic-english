import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function ExerciseCard({ questions, onCompleteExercise }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIdx] || questions[0];

  const handleSelect = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQ.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (onCompleteExercise) onCompleteExercise(score * 20);
    }
  };

  return (
    <div className="p-7 sm:p-9 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Exercício {currentIdx + 1} de {questions.length}
        </span>
        <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          +20 XP por acerto
        </span>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">{currentQ.question}</h3>
            <p className="text-2xl font-black text-white bg-[#14172a] p-4 rounded-2xl border border-slate-800">
              "{currentQ.prompt}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === currentQ.correct;

              let style = 'bg-[#15182c] border-slate-800 text-white hover:border-purple-500/50 hover:bg-[#1c2038]';
              if (isAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold';
                } else if (isSelected) {
                  style = 'bg-rose-600/30 border-rose-500 text-rose-300';
                } else {
                  style = 'bg-[#15182c] border-slate-800 opacity-50';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`py-3.5 px-4 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="space-y-3 pt-2">
              <div
                className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
                  selectedOption === currentQ.correct
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {selectedOption === currentQ.correct ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>✓ Resposta correta! {currentQ.explanation}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>✕ Incorreto. {currentQ.explanation}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-purple-600/30"
              >
                {currentIdx < questions.length - 1 ? 'Próxima Questão ➔' : 'Ver Resultado'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Exercício Concluído!</h3>
          <p className="text-sm text-slate-300">
            Você acertou {score} de {questions.length} questões e faturou <strong className="text-amber-400">+{score * 20} XP</strong>!
          </p>
        </div>
      )}
    </div>
  );
}
