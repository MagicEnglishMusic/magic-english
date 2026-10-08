import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Star, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Lock, 
  RotateCcw, 
  ArrowRight, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { useSpeechEvaluator } from '../../hooks/useSpeechEvaluator';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { progressService } from '../../services/progressService';

const VERSES_PER_QUESTION = 5;

// Deterministic seed helper to shuffle arrays stably without Math.random
function seededShuffle(array, seedStr = 'magic') {
  const result = [...array];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function PracticeCards({ song, xpReward = 50, onClaimXp }) {
  const { user } = useAuth();
  const { addXp } = useGamification();

  // Normalize verses from song (reads en/english/text/verse and pt/portuguese/translation)
  const verses = useMemo(() => {
    if (!song) return [];
    const lyricsList = Array.isArray(song.timestamps) && song.timestamps.length > 0
      ? song.timestamps
      : Array.isArray(song.lyrics) && song.lyrics.length > 0
      ? song.lyrics
      : Array.isArray(song.lyricsTimestamps) && song.lyricsTimestamps.length > 0
      ? song.lyricsTimestamps
      : [];

    return lyricsList
      .map((l, idx) => ({
        id: l.id || idx + 1,
        english: (l.en || l.english || l.text || l.verse || '').trim(),
        portuguese: (l.pt || l.portuguese || l.translation || '').trim(),
        time: l.startTime !== undefined ? l.startTime : (l.time || '')
      }))
      .filter((v) => Boolean(v.english && v.portuguese));
  }, [song?.id, song?.timestamps, song?.lyrics, song?.lyricsTimestamps]);

  // ==========================================
  // CARD 1: Treinar Pronúncia Real
  // ==========================================
  const [pronunciationIdx, setPronunciationIdx] = useState(0);
  const isLastVerse = verses.length > 0 && pronunciationIdx === verses.length - 1;
  const isPronunciationFinished = verses.length > 0 && pronunciationIdx >= verses.length;
  const currentVerse = verses[pronunciationIdx] || verses[0] || null;

  const handleSpeechResult = async (evalData) => {
    if (evalData.score >= 80) {
      setTimeout(() => {
        if (pronunciationIdx < verses.length - 1) {
          setPronunciationIdx((prev) => prev + 1);
          setEvaluation(null);
        } else {
          setPronunciationIdx(verses.length);
          setEvaluation(null);
        }
      }, 2000);
    }
  };

  const {
    isRecording,
    evaluation,
    isSupported,
    startRecording,
    stopRecording,
    setEvaluation
  } = useSpeechEvaluator({ onResult: handleSpeechResult });

  const handleToggleRecord = () => {
    if (!currentVerse || isPronunciationFinished) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(currentVerse.english);
    }
  };

  const handleRestartPronunciation = () => {
    setPronunciationIdx(0);
    setEvaluation(null);
  };

  // ==========================================
  // CARD 2: Desafio da Música (Quiz de Tradução em Blocos de 5 Versos)
  // ==========================================
  const quizQuestions = useMemo(() => {
    if (!song?.id || verses.length < 2) return [];

    const questions = [];
    const totalBlocks = Math.ceil(verses.length / VERSES_PER_QUESTION);
    const songSeed = String(song.id);

    for (let b = 0; b < totalBlocks; b++) {
      const startIdx = b * VERSES_PER_QUESTION;
      const endIdx = Math.min(verses.length, startIdx + VERSES_PER_QUESTION);
      const blockVerses = verses.slice(startIdx, endIdx);
      const targetVerse = blockVerses[0];

      // Sorteia 3 distratores reais de outros versos em inglês da música
      const otherVerses = verses.filter((v) => v.english !== targetVerse.english);
      const shuffledOthers = seededShuffle(otherVerses, `${songSeed}-block-${b}`);
      const distractors = shuffledOthers.slice(0, 3).map((v) => v.english);

      const options = seededShuffle([targetVerse.english, ...distractors], `${songSeed}-opts-${b}`);

      questions.push({
        id: `block-${b + 1}`,
        blockNumber: b + 1,
        totalBlocks: totalBlocks,
        verseRange: `${startIdx + 1} a ${endIdx}`,
        promptPt: targetVerse.portuguese,
        correctAnswer: targetVerse.english,
        options: options,
        explanation: `"${targetVerse.english}" traduz-se como "${targetVerse.portuguese}".`
      });
    }

    return questions;
  }, [song?.id, verses]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizStatus, setQuizStatus] = useState(null); // 'correct' | 'wrong' | null
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);

  const activeQuestion = quizQuestions[currentQuestionIdx] || null;

  const handleSelectAnswer = async (option) => {
    if (!activeQuestion || isChallengeCompleted) return;
    setSelectedOption(option);

    if (option === activeQuestion.correctAnswer) {
      setQuizStatus('correct');
      if (currentQuestionIdx === quizQuestions.length - 1) {
        setIsChallengeCompleted(true);
        if (user?.id && song?.id) {
          await progressService.updateSongMastery(user.id, song.id, { step_final_challenge: true });
        }
      }
    } else {
      setQuizStatus('wrong');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setQuizStatus(null);
    }
  };

  // ==========================================
  // CARD 3: Ganhar XP (Atômico & Seguro no Servidor)
  // ==========================================
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Load initial mastery and XP claim state from Supabase / localStorage on mount / song change
  useEffect(() => {
    let isMounted = true;
    async function loadMasteryState() {
      if (!user?.id || !song?.id) return;
      try {
        const cleanSongId = String(song.id).trim().toLowerCase();
        const [masteryRes, xpEventsRes] = await Promise.all([
          progressService.getSongMastery(user.id),
          progressService.getUserXpEvents(user.id)
        ]);

        if (isMounted) {
          const masteryData = masteryRes?.data || [];
          const xpEvents = xpEventsRes?.data || [];

          const match = masteryData.find(
            (m) => String(m.song_id || '').trim().toLowerCase() === cleanSongId
          );

          if (match?.step_final_challenge) {
            setIsChallengeCompleted(true);
          }

          // Só considera resgatado se confirmado em xp_events (fonte de verdade)
          const isClaimedInEvents = xpEvents.some(
            (ev) => ev.source === 'song_claim' && String(ev.ref || '').trim().toLowerCase() === cleanSongId
          );

          if (isClaimedInEvents) {
            setIsClaimed(true);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar song_mastery em PracticeCards:', err);
      }
    }
    loadMasteryState();
    return () => { isMounted = false; };
  }, [user?.id, song?.id]);

  const handleClaim = async () => {
    if (!isChallengeCompleted || isClaimed || isClaiming) return;

    if (!user?.id || !song?.id) {
      alert('Não foi possível identificar o aluno ou a música.');
      return;
    }

    const cleanSongId = String(song.id).trim().toLowerCase();
    setIsClaiming(true);
    try {
      // 1. Garante que o desafio final está registrado no banco
      await progressService.updateSongMastery(user.id, song.id, { step_final_challenge: true });

      // 2. Concede o XP de forma 100% atômica no servidor via addXp (a RPC valida e atualiza song_mastery.xp_claimed_at)
      const xpRes = await addXp('song_claim', cleanSongId, {
        showModal: true,
        type: 'xp',
        title: '🎵 Recompensa da Música!',
        subtitle: `Parabéns por dominar os desafios de "${song.title || 'Magic Song'}"!`,
        icon: '⭐',
        bonusText: `+${xpReward || 50} Magic XP creditados na sua conta!`
      });

      if (xpRes && xpRes.success) {
        setIsClaimed(true);
        if (onClaimXp) onClaimXp(50);
      }
    } catch (err) {
      console.warn('Erro ao resgatar XP da música:', err);
      alert('Erro de conexão ao resgatar XP.');
    } finally {
      setIsClaiming(false);
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
                {isPronunciationFinished 
                  ? 'Concluído' 
                  : `Verso ${Math.min(pronunciationIdx + 1, verses.length)}/${verses.length || 0}`}
              </span>
            </div>
            
            {isPronunciationFinished ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pronúncia Concluída!
                </p>
                <p className="text-[11px] text-slate-300">
                  Parabéns! Você treinou e validou todos os versos desta música.
                </p>
              </div>
            ) : currentVerse ? (
              <>
                <p className="text-sm font-bold text-white">
                  "{currentVerse.english}"
                </p>
                <p className="text-xs text-purple-300 font-medium">
                  {currentVerse.portuguese}
                </p>
                <p className="text-[11px] text-slate-400">
                  Fale no microfone para avaliar sua precisão vocal.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Cadastre a letra da canção no SongManager para habilitar o treino vocal.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {/* Feedback Box */}
            {evaluation && (
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 animate-in fade-in duration-300 ${
                evaluation.status === 'excellent'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : evaluation.status === 'almost'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {evaluation.status === 'excellent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{evaluation.message}</span>
                  </div>
                  {evaluation.score > 0 && (
                    <span className="text-xs font-black">{evaluation.score}%</span>
                  )}
                </div>

                {evaluation.transcript && (
                  <p className="text-[11px] text-slate-300">
                    Entendido: <span className="italic font-semibold text-white">"{evaluation.transcript}"</span>
                  </p>
                )}
              </div>
            )}

            {isPronunciationFinished ? (
              <button
                onClick={handleRestartPronunciation}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#181c32] hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Treinar Pronúncia Novamente</span>
              </button>
            ) : (
              <button
                onClick={handleToggleRecord}
                disabled={!currentVerse}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
                    : 'bg-[#181c32] hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500 shadow-purple-900/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 animate-spin" />
                    <span>Gravando... Fale agora!</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{evaluation?.score >= 80 ? 'Treinar Próximo Verso ➔' : 'Iniciar Gravação'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: ⭐ Desafio da Música (Quiz de Tradução) */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131628] to-[#0e101f] border border-blue-500/25 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-blue-400" />
                Desafio da Música (Tradução)
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-500/20">
                {quizQuestions.length > 0 ? `Bloco ${currentQuestionIdx + 1}/${quizQuestions.length}` : 'Quiz Indisponível'}
              </span>
            </div>

            {quizQuestions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                Esta música ainda não possui versos em inglês e português suficientes cadastrados para compor o quiz.
              </div>
            ) : isChallengeCompleted ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Desafio Cumprido!
                </p>
                <p className="text-[11px] text-slate-300">
                  Você acertou a tradução de todos os blocos de versos desta canção.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">Qual é o verso em inglês correspondente a:</p>
                <p className="text-sm font-bold text-white bg-[#161a2f] p-2.5 rounded-xl border border-slate-800">
                  "{activeQuestion?.promptPt}"
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            {quizQuestions.length > 0 && !isChallengeCompleted && activeQuestion && (
              <>
                <div className="grid grid-cols-1 gap-2">
                  {(activeQuestion.options || []).map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = isSelected && quizStatus === 'correct';
                    const isWrong = isSelected && quizStatus === 'wrong';

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectAnswer(option)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border truncate text-left ${
                          isCorrect
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : isWrong
                            ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                            : 'bg-[#181c30] border-slate-800 text-slate-300 hover:border-blue-400/50 hover:text-white'
                        }`}
                        title={option}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {quizStatus === 'correct' && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-emerald-400 font-semibold text-center">
                      ✓ Correto! {activeQuestion.explanation}
                    </p>
                    {currentQuestionIdx < quizQuestions.length - 1 && (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Próximo Bloco de Versos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {quizStatus === 'wrong' && (
                  <p className="text-[11px] text-rose-400 font-semibold pt-1 text-center">
                    ✕ Tradução incorreta. Tente novamente!
                  </p>
                )}
              </>
            )}

            {isChallengeCompleted && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCurrentQuestionIdx(0);
                    setSelectedOption(null);
                    setQuizStatus(null);
                    setIsChallengeCompleted(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#181c30] hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refazer Desafio da Canção</span>
                </button>
              </div>
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
                +{xpReward} XP
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              {isClaimed
                ? 'XP Resgatado com Sucesso!'
                : isChallengeCompleted
                ? 'Desafio Concluído!'
                : 'Complete o Desafio da Música'}
            </p>
            <p className="text-xs text-slate-400">
              {isClaimed
                ? 'XP resgatado com sucesso nesta música.'
                : isChallengeCompleted
                ? 'Desafio concluído! Resgate seus 50 XP da música.'
                : 'Complete o Desafio da Música acima para liberar seus pontos.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClaim}
              disabled={!isChallengeCompleted || isClaimed || isClaiming}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                isClaimed
                  ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 shadow-sm cursor-default'
                  : isChallengeCompleted
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Validando Resgate no Servidor...</span>
                </>
              ) : isClaimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>+{xpReward} XP Resgatados!</span>
                </>
              ) : isChallengeCompleted ? (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Resgatar +{xpReward} XP da Música</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Bloqueado (Complete o Quiz)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
