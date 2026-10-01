import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  MicOff,
  Lock
} from 'lucide-react';
import { songsService } from '../../services/songsService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { isGoogleDriveUrl, getDriveAudioUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';
import { evaluateSpeechAccuracy, SIMILARITY_THRESHOLD } from '../../utils/speechEvaluation';
import { 
  deriveStepsDone, 
  getLocalPracticeSteps, 
  saveLocalPracticeSteps, 
  getLocalSungVerses,
  saveLocalSungVerse,
  canAccessStep,
  canAdvanceStep,
  INITIAL_STEPS_DONE 
} from '../../utils/stepsDone';
import CompletionCelebration from '../common/CompletionCelebration';

export default function MusicalPracticeView({ song, data, onBack, onGainXp }) {
  const { user } = useAuth();
  const { addXp } = useGamification();
  const [dbSong, setDbSong] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const restoredKeyRef = useRef(null);
  const audioRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Fetch real database song if not provided
  useEffect(() => {
    let isMounted = true;
    async function loadFallbackSong() {
      if (song) return;
      try {
        const { data: songs } = await songsService.getSongs();
        if (isMounted && songs && songs.length > 0) {
          setDbSong(songs[0]);
        }
      } catch (err) {
        console.warn('Error fetching fallback song for MusicalPracticeView:', err);
      }
    }
    loadFallbackSong();
    return () => { isMounted = false; };
  }, [song]);

  const activeSong = song || dbSong;

  const resolvedAudioUrl = useMemo(() => {
    const raw = activeSong?.audio_url || activeSong?.audioUrl || '';
    if (!raw) return '';
    return isGoogleDriveUrl(raw) ? getDriveAudioUrl(raw) : raw;
  }, [activeSong]);

  const practiceData = useMemo(() => {
    if (activeSong) {
      let verses = [];
      if (Array.isArray(activeSong.lyrics) && activeSong.lyrics.length > 0) {
        verses = activeSong.lyrics.map((l, idx) => ({
          id: idx + 1,
          en: l.english || l.text || l.en || '',
          pt: l.portuguese || l.pt || l.translation || '',
          hint: l.structure || l.tip || `Verso ${idx + 1} da música ${activeSong.title}`,
          audioSpeed: 0.85
        })).filter(v => Boolean(v.en && v.en.trim()));
      } else {
        const enLines = String(activeSong.lyrics_en || activeSong.lyricsEn || '').split('\n').map(l => l.trim()).filter(Boolean);
        const ptLines = String(activeSong.lyrics_pt || activeSong.lyricsPt || '').split('\n').map(l => l.trim()).filter(Boolean);
        verses = enLines.map((en, idx) => ({
          id: idx + 1,
          en,
          pt: ptLines[idx] || 'Tradução do verso',
          hint: `Verso ${idx + 1}`,
          audioSpeed: 0.85
        }));
      }

      if (verses.length > 0) {
        const reverseExercises = verses.map((v, idx) => {
          const otherEn = verses.filter((_, i) => i !== idx).map(item => item.en);
          const distractors = otherEn.slice(0, 3);
          const options = [v.en, ...distractors].sort(() => 0.5 - Math.random());

          return {
            id: `rev-${v.id}`,
            pt: v.pt,
            expectedEn: v.en,
            acceptableEn: [v.en.toLowerCase().replace(/[.,?!]/g, '').trim()],
            options: options.length >= 2 ? options : [v.en, "Goodbye", "Thank you", "Please"],
            hint: v.hint
          };
        });

        const challengeVerses = verses.map((v) => ({
          id: `chal-${v.id}`,
          pt: v.pt,
          targetEn: v.en
        }));

        const coverRaw = activeSong.cover_url || activeSong.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';

        return {
          id: activeSong.id,
          title: activeSong.title || 'Magic Song Oficial',
          module: activeSong.module || activeSong.category || 'Módulo Oficial',
          duration: activeSong.duration || '3:20',
          bpm: activeSong.bpm || '108 BPM',
          image: isGoogleDriveUrl(coverRaw) ? getDriveImageUrl(coverRaw) : coverRaw,
          methodSteps: [
            { number: 1, name: "Ouvir e Acompanhar", icon: "Headphones", desc: "Inglês e Português sincronizados" },
            { number: 2, name: "Tradução Reversa", icon: "Brain", desc: "Recupere o inglês a partir do significado" },
            { number: 3, name: "Cantar Junto", icon: "Mic", desc: "Acompanhe no ritmo da música" },
            { number: 4, name: "Cantar Sem Apoio", icon: "Sparkles", desc: "Desafio final de memorização" }
          ],
          studyVerses: verses,
          reverseExercises: reverseExercises,
          challengeVerses: challengeVerses
        };
      }
    }

    return {
      id: "default-song",
      title: "Hit Musical de Fixação",
      module: "Módulo 1",
      duration: "3:20",
      bpm: "108 BPM",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
      methodSteps: [
        { number: 1, name: "Ouvir e Acompanhar", icon: "Headphones", desc: "Inglês e Português sincronizados" },
        { number: 2, name: "Tradução Reversa", icon: "Brain", desc: "Recupere o inglês a partir do significado" },
        { number: 3, name: "Cantar Junto", icon: "Mic", desc: "Acompanhe no ritmo da música" },
        { number: 4, name: "Cantar Sem Apoio", icon: "Sparkles", desc: "Desafio final de memorização" }
      ],
      studyVerses: [
        { id: 1, en: "Hello, good morning my friend!", pt: "Olá, bom dia meu amigo!", hint: "Cumprimentos iniciais" },
        { id: 2, en: "How are you doing today?", pt: "Como você está hoje?", hint: "Perguntando o estado" }
      ],
      reverseExercises: [
        { id: "rev-1", pt: "Olá, bom dia meu amigo!", expectedEn: "Hello, good morning my friend!", options: ["Hello, good morning my friend!", "Goodbye my friend", "See you later"], hint: "Cumprimentos" }
      ],
      challengeVerses: [
        { id: "chal-1", pt: "Olá, bom dia meu amigo!", targetEn: "Hello, good morning my friend!" }
      ]
    };
  }, [activeSong]);

  const [currentStep, setCurrentStep] = useState(1); // 1 | 2 | 3 | 4
  const [stepsDone, setStepsDone] = useState(INITIAL_STEPS_DONE);
  const [celebrationConfig, setCelebrationConfig] = useState(null);

  // Step 1 State: Audio listening completion
  const [isStep1Listened, setIsStep1Listened] = useState(false);
  const [accumulatedPlayedTime, setAccumulatedPlayedTime] = useState(0);

  // Step 2 State: Reverse Translation
  const [reverseIndex, setReverseIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [reverseStatus, setReverseStatus] = useState(null); // 'correct' | 'wrong' | null

  // Step 3 State: Sing Along (with sung verses tracking)
  const [isSingingPlaying, setIsSingingPlaying] = useState(false);
  const [singingLine, setSingingLine] = useState(0);
  const [sungVerses, setSungVerses] = useState([]);
  const [singingRecordingId, setSingingRecordingId] = useState(null);
  const [singingFeedback, setSingingFeedback] = useState(null);

  // Step 4 State: Challenge Without Support
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [isRecordingChallenge, setIsRecordingChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState(null);
  const [challengeFeedback, setChallengeFeedback] = useState(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);
  const [isRepeatingStep4, setIsRepeatingStep4] = useState(false);

  // Restore saved progress on mount (DB + LocalStorage with guarded execution per song)
  useEffect(() => {
    let isMounted = true;
    const targetSongId = song?.id || dbSong?.id;
    if (!targetSongId) return;

    const currentKey = `${user?.id || 'guest'}_${targetSongId}`;
    if (restoredKeyRef.current === currentKey) return;

    setStepsDone(INITIAL_STEPS_DONE);

    async function restoreProgress() {
      try {
        const localSteps = getLocalPracticeSteps(user?.id, targetSongId);
        const localSung = getLocalSungVerses(user?.id, targetSongId);
        if (isMounted && localSung.length > 0) {
          setSungVerses(localSung);
        }

        let match = null;
        if (user?.id) {
          const { data: masteryList } = await progressService.getSongMastery(user.id);
          if (Array.isArray(masteryList)) {
            match = masteryList.find((m) => m.song_id === targetSongId);
          }
        }

        if (!isMounted) return;

        const mergedSteps = deriveStepsDone(match, localSteps);
        setStepsDone(mergedSteps);
        saveLocalPracticeSteps(user?.id, targetSongId, mergedSteps);

        if (mergedSteps[4]) {
          setIsChallengeCompleted(true);
        }

        // Open at the first non-completed step, or Step 4 if all completed
        if (!mergedSteps[1]) {
          setCurrentStep(1);
        } else if (!mergedSteps[2]) {
          setCurrentStep(2);
        } else if (!mergedSteps[3]) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }

        // Restore saved challenge verse index if in Step 4 and not completed
        if (!mergedSteps[4] && match?.challenge_index !== undefined) {
          const restoredIdx = Math.max(0, parseInt(match.challenge_index, 10) || 0);
          if (practiceData.challengeVerses && practiceData.challengeVerses.length > 0) {
            const clampedIdx = Math.min(restoredIdx, practiceData.challengeVerses.length - 1);
            setChallengeIndex(clampedIdx);
          }
        }

        restoredKeyRef.current = currentKey;
      } catch (err) {
        console.warn('Aviso ao restaurar progresso da prática musical:', err);
      }
    }

    restoreProgress();
    return () => { isMounted = false; };
  }, [user?.id, song?.id, dbSong?.id, practiceData.challengeVerses]);

  // Audio Progress Listener for Step 1
  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 180;
    const last = lastTimeRef.current;
    const dt = current - last;

    // Count only normal forward playback without forward seeks (dt between 0 and 2.5s)
    if (dt > 0 && dt <= 2.5) {
      setAccumulatedPlayedTime((prev) => {
        const next = prev + dt;
        if (next >= 0.9 * dur) {
          setIsStep1Listened(true);
        }
        return next;
      });
    }
    lastTimeRef.current = current;
  };

  const handleAudioEnded = () => {
    setIsStep1Listened(true);
  };

  // Speech Toggle: stops when clicked again
  const toggleSpeak = (text, onFinish = null) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.85;
        u.onend = () => {
          setIsSpeaking(false);
          if (onFinish) onFinish();
        };
        u.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(u);
      }
    }
  };

  // Reverse Translation Verification
  const checkReverseAnswer = (answerToCheck) => {
    const cleanAnswer = (answerToCheck || typedAnswer).trim().toLowerCase().replace(/[.,?!]/g, '');
    const currentRev = practiceData.reverseExercises[reverseIndex] || practiceData.reverseExercises[0];
    if (!currentRev) return;
    const expected = currentRev.expectedEn.toLowerCase().replace(/[.,?!]/g, '');

    if (cleanAnswer === expected) {
      setReverseStatus('correct');
      toggleSpeak(currentRev.expectedEn);
    } else {
      setReverseStatus('wrong');
    }
  };

  const nextReverse = () => {
    if (reverseIndex < practiceData.reverseExercises.length - 1) {
      setReverseIndex((prev) => prev + 1);
      setTypedAnswer('');
      setReverseStatus(null);
    } else {
      setStepsDone((prev) => ({ ...prev, 2: true }));
      const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();
      if (cleanSongId) {
        saveLocalPracticeSteps(user?.id, cleanSongId, { 2: true });
        if (user?.id) {
          progressService.updateSongMastery(user.id, cleanSongId, { step_reverse_translation: true }).catch((err) => {
            console.warn('Falha ao gravar etapa 2 no banco:', err);
          });
        }
      }
      setCelebrationConfig({
        title: '🧠 Etapa 2 Concluída!',
        subtitle: 'Seu cérebro resgatou todas as estruturas em inglês.',
        description: 'Sua memória foi ativada com sucesso. Agora prepare sua voz para a Etapa 3!',
        type: 'step_reverse_translation',
        ctaText: 'Ir para Etapa 3: Cantar Junto ➔',
        onCtaClick: () => {
          setCelebrationConfig(null);
          setCurrentStep(3);
        }
      });
    }
  };

  // Sing Verse Recording for Step 3
  const handleSingVerse = (verse) => {
    if (singingRecordingId === verse.id) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setSingingRecordingId(null);
      return;
    }

    setSingingRecordingId(verse.id);
    setSingingFeedback(null);
    const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;
        rec.maxAlternatives = 5;

        rec.onstart = () => {
          setSingingRecordingId(verse.id);
        };

        rec.onresult = (event) => {
          setSingingRecordingId(null);

          let bestScore = 0;
          let bestTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const resultList = event.results[i];
            for (let j = 0; j < resultList.length; j++) {
              const altTranscript = resultList[j]?.transcript || '';
              const evalRes = evaluateSpeechAccuracy(verse.en, altTranscript);
              if (evalRes.score >= bestScore) {
                bestScore = evalRes.score;
                bestTranscript = altTranscript;
              }
            }
          }

          if (!bestTranscript && event.results[0]?.[0]?.transcript) {
            bestTranscript = event.results[0][0].transcript;
            const evalRes = evaluateSpeechAccuracy(verse.en, bestTranscript);
            bestScore = evalRes.score;
          }

          if (bestScore >= SIMILARITY_THRESHOLD) {
            const updated = saveLocalSungVerse(user?.id, cleanSongId, verse.id);
            setSungVerses(updated);
            setSingingFeedback({
              verseId: verse.id,
              status: 'success',
              message: `Você cantou: "${bestTranscript}" — Excelente (${bestScore}%)!`,
              score: bestScore
            });
          } else {
            setSingingFeedback({
              verseId: verse.id,
              status: 'error',
              message: `Entendi: "${bestTranscript || 'não identificado'}" (${bestScore}%). Esperado: "${verse.en}". Cante novamente!`,
              score: bestScore
            });
          }
        };

        rec.onerror = (event) => {
          setSingingRecordingId(null);
          setSingingFeedback({
            verseId: verse.id,
            status: 'error',
            message: event.error === 'no-speech'
              ? 'Nenhum som detectado pelo microfone. Cante a frase após clicar em Cantar.'
              : `Erro na captura de áudio (${event.error}). Tente novamente.`
          });
        };

        rec.onend = () => {
          setSingingRecordingId(null);
        };

        rec.start();
      } catch (err) {
        console.warn('SpeechRecognition failed to start for singing:', err);
        setSingingRecordingId(null);
        setSingingFeedback({
          verseId: verse.id,
          status: 'error',
          message: 'Não foi possível acessar o microfone. Permita o microfone no navegador.'
        });
      }
    } else {
      setSingingRecordingId(null);
      setSingingFeedback({
        verseId: verse.id,
        status: 'error',
        message: 'Use o Google Chrome ou Microsoft Edge para cantar e validar com microfone.'
      });
    }
  };

  // Unified Completion Handler for Step 4
  const handleCompletePractice = async () => {
    const wasAlreadyDone = Boolean(stepsDone[4]) || isRepeatingStep4;
    setStepsDone((prev) => ({ ...prev, 4: true }));
    setIsChallengeCompleted(true);
    const songTarget = song || dbSong;
    const cleanSongId = String(songTarget?.id || '').trim().toLowerCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSongId);

    if (cleanSongId) {
      saveLocalPracticeSteps(user?.id, cleanSongId, { 4: true });
      if (user?.id) {
        try {
          await progressService.updateSongMastery(user.id, cleanSongId, {
            step_final_challenge: true,
            challenge_index: practiceData.challengeVerses.length
          });
        } catch (err) {
          console.warn('Erro ao atualizar maestria final no banco:', err);
        }
      }
    }

    // Regra A6: XP (+75) só na primeira conclusão E se etapas 1, 2 e 3 estiverem todas feitas
    const allPrerequisitesDone = Boolean(stepsDone[1] && stepsDone[2] && stepsDone[3]);
    if (!wasAlreadyDone && allPrerequisitesDone && isUuid) {
      await addXp('practice_complete', cleanSongId, {
        showModal: true,
        type: 'xp',
        title: '🧠 Prática Musical Completa!',
        subtitle: `Você concluiu os desafios de "${songTarget?.title || 'Magic Song'}"!`,
        icon: '🎵',
        bonusText: '+75 Magic XP conquistados!'
      });
      if (onGainXp) onGainXp(75);
    }

    setCelebrationConfig({
      title: '🏆 Canção Dominada com Sucesso!',
      subtitle: 'Você concluiu todas as etapas da Prática Musical (+75 XP)!',
      description: 'Parabéns! Você alcançou a maestria completa desta canção.',
      type: 'final_mastery',
      ctaText: 'Ver Resultado da Maestria ➔',
      onCtaClick: () => {
        setCelebrationConfig(null);
      }
    });
  };

  // Step 4 Repeat Handler (D2)
  const handleRepeatStep4 = () => {
    setChallengeIndex(0);
    setChallengeScore(null);
    setChallengeFeedback(null);
    setIsChallengeCompleted(false);
    setIsRepeatingStep4(true);
  };

  // Real Challenge Voice Recognition
  const handleRecordChallenge = async () => {
    if (isRecordingChallenge) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsRecordingChallenge(false);
      return;
    }

    setChallengeScore(null);
    setChallengeFeedback(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const currentTarget = practiceData.challengeVerses[challengeIndex] || practiceData.challengeVerses[0];

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
          setIsRecordingChallenge(true);
        };

        recognition.onresult = async (event) => {
          setIsRecordingChallenge(false);

          let bestScore = 0;
          let bestTranscript = '';
          let bestResult = null;

          for (let i = 0; i < event.results.length; i++) {
            const resultList = event.results[i];
            for (let j = 0; j < resultList.length; j++) {
              const altTranscript = resultList[j]?.transcript || '';
              const evalRes = evaluateSpeechAccuracy(currentTarget?.targetEn || '', altTranscript);
              if (evalRes.score >= bestScore) {
                bestScore = evalRes.score;
                bestTranscript = altTranscript;
                bestResult = evalRes;
              }
            }
          }

          if (!bestTranscript && event.results[0]?.[0]?.transcript) {
            bestTranscript = event.results[0][0].transcript;
            bestResult = evaluateSpeechAccuracy(currentTarget?.targetEn || '', bestTranscript);
            bestScore = bestResult.score;
          }

          if (bestScore >= SIMILARITY_THRESHOLD) {
            setChallengeScore(bestScore);
            setChallengeFeedback({
              status: 'success',
              message: `Você cantou: "${bestTranscript}" — Excelente!`,
              transcript: bestTranscript,
              score: bestScore
            });

            const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();
            if (user?.id && cleanSongId && !isRepeatingStep4) {
              await progressService.updateSongMastery(user.id, cleanSongId, {
                challenge_index: challengeIndex + 1
              });
            }

            if (challengeIndex === practiceData.challengeVerses.length - 1) {
              await handleCompletePractice();
            }
          } else {
            setChallengeFeedback({
              status: 'error',
              message: `Você disse: "${bestTranscript || 'não identificado'}". O verso esperado era "${currentTarget?.targetEn}". Tente novamente!`,
              transcript: bestTranscript,
              score: bestScore
            });
          }
        };

        recognition.onerror = (event) => {
          setIsRecordingChallenge(false);
          setChallengeFeedback({
            status: 'error',
            message: event.error === 'no-speech' 
              ? 'Nenhum áudio detectado pelo microfone. Cante a frase após clicar no botão.' 
              : `Erro na captura: ${event.error}`
          });
        };

        recognition.onend = () => {
          setIsRecordingChallenge(false);
        };

        recognition.start();
      } catch (err) {
        setIsRecordingChallenge(false);
      }
    } else {
      // Browsers without SpeechRecognition: DO NOT approve, DO NOT grant XP
      setIsRecordingChallenge(false);
      setChallengeFeedback({
        status: 'error',
        message: 'Use o Google Chrome ou Microsoft Edge para praticar a fala.',
        transcript: '',
        score: 0
      });
    }
  };

  const nextChallenge = async () => {
    if (challengeIndex < practiceData.challengeVerses.length - 1) {
      const nextIdx = challengeIndex + 1;
      setChallengeIndex(nextIdx);
      setChallengeScore(null);
      setChallengeFeedback(null);

      const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();
      if (user?.id && cleanSongId && !isRepeatingStep4) {
        await progressService.updateSongMastery(user.id, cleanSongId, {
          challenge_index: nextIdx
        });
      }
    }
  };

  // Step completion flags
  const canAdvance1 = canAdvanceStep(1, isStep1Listened, stepsDone);
  const isStep2Completed = reverseStatus === 'correct' && reverseIndex === practiceData.reverseExercises.length - 1;
  const canAdvance2 = canAdvanceStep(2, isStep2Completed, stepsDone);
  const isStep3Completed = practiceData.studyVerses.length > 0 && sungVerses.length >= practiceData.studyVerses.length;
  const canAdvance3 = canAdvanceStep(3, isStep3Completed, stepsDone);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Hidden Audio Element for listening tracking */}
      {resolvedAudioUrl && (
        <audio
          ref={audioRef}
          src={resolvedAudioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1c2035]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#1a1f36] border border-[#22273e] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
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
            {practiceData.module}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Prática Musical — {practiceData.title}
          </h1>
        </div>

        <span className="text-xs font-mono font-bold text-slate-400 bg-[#141728] px-3 py-1 rounded-lg border border-slate-800 w-fit">
          {practiceData.bpm} • {practiceData.duration}
        </span>
      </div>

      {/* 2. Step Navigator Tabs (Roadmap de 4 Etapas com Bloqueio Real) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {practiceData.methodSteps.map((step) => {
          const isAccessible = canAccessStep(step.number, stepsDone);
          const isActive = currentStep === step.number;
          const isDone = Boolean(stepsDone[step.number]);

          return (
            <button
              key={step.number}
              disabled={!isAccessible}
              onClick={() => {
                if (isAccessible) setCurrentStep(step.number);
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                !isAccessible
                  ? 'bg-[#0a0c16] border-slate-900 opacity-50 cursor-not-allowed'
                  : isActive
                  ? 'bg-gradient-to-b from-purple-900/40 via-[#15182c] to-[#0e101f] border-purple-500/80 shadow-xl shadow-purple-600/20 ring-1 ring-purple-400/50 cursor-pointer'
                  : isDone
                  ? 'bg-[#101322] border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer'
                  : 'bg-[#0e101f] border-slate-800 hover:border-purple-500/30 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-purple-400">
                  Etapa {step.number}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : !isAccessible ? (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
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

      {/* ETAPA 1 — OUVIRE ACOMPANHAR */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-400" />
                  Etapa 1: Ouvir e Acompanhar ({practiceData.studyVerses.length} versos)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ouça a canção até o fim para liberar a Etapa 2
                </p>
              </div>
              <button
                onClick={() => {
                  if (resolvedAudioUrl && audioRef.current) {
                    if (audioRef.current.paused) {
                      audioRef.current.play().catch(() => {});
                    } else {
                      audioRef.current.pause();
                    }
                  } else {
                    toggleSpeak(practiceData.studyVerses.map(v => v.en).join('. '), () => {
                      setIsStep1Listened(true);
                    });
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all w-fit cursor-pointer border ${
                  isSpeaking
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border-purple-500/40'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? '⏹ Parar Áudio' : 'Ouvir Música Completa'}</span>
              </button>
            </div>

            {/* Verses List with Side-by-side Study */}
            <div className="space-y-3 pt-2 max-h-[500px] overflow-y-auto pr-1">
              {practiceData.studyVerses.map((verse) => (
                <div
                  key={verse.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#121526] border border-[#1f243c] hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                        🇺🇸 Inglês
                      </span>
                      <p className="text-base sm:text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        {verse.en}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        🇧🇷 Tradução
                      </span>
                      <p className="text-sm font-semibold text-slate-300">
                        {verse.pt}
                      </p>
                    </div>

                    <p className="text-[11px] text-purple-300/80 pt-1">
                      💡 {verse.hint}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleSpeak(verse.en)}
                    className="p-3 rounded-xl bg-[#191e36] hover:bg-purple-600 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 w-fit shadow-md"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Ouvir</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Action: Next Step with Real Locking */}
            <div className="pt-4 flex flex-col items-end gap-1">
              <button
                disabled={!canAdvance1}
                aria-disabled={!canAdvance1}
                onClick={() => {
                  if (!canAdvance1) return;
                  setStepsDone((prev) => ({ ...prev, 1: true }));
                  const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();
                  if (cleanSongId) {
                    saveLocalPracticeSteps(user?.id, cleanSongId, { 1: true });
                    if (user?.id) {
                      progressService.updateSongMastery(user.id, cleanSongId, { step_song: true }).catch((err) => {
                        console.warn('Falha ao gravar etapa 1 no banco:', err);
                      });
                    }
                  }
                  setCelebrationConfig({
                    title: '🎧 Etapa 1 Concluída!',
                    subtitle: 'Você acompanhou o ritmo e a letra da música.',
                    description: 'Excelente ritmo! Agora vamos testar sua retenção na Tradução Reversa.',
                    type: 'step_song',
                    ctaText: 'Ir para Etapa 2: Tradução Reversa ➔',
                    onCtaClick: () => {
                      setCelebrationConfig(null);
                      setCurrentStep(2);
                    }
                  });
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                  canAdvance1
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-600/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>Avançar para Etapa 2: Tradução Reversa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {!canAdvance1 && (
                <p className="text-xs text-slate-400">
                  Ouça a música completa para liberar o avanço
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 2 — TRADUÇÃO REVERSA */}
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
                {reverseIndex + 1} de {practiceData.reverseExercises.length}
              </span>
            </div>

            {/* Exercise Box */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#14172a] border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Como você canta / diz em inglês:
                </span>
                <p className="text-2xl font-black text-white">
                  "{practiceData.reverseExercises[reverseIndex]?.pt}"
                </p>
                <p className="text-xs text-purple-300/80 pt-1">
                  💡 Dica: {practiceData.reverseExercises[reverseIndex]?.hint}
                </p>
              </div>

              {/* Quick Select Options */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">
                  Selecione a frase correta:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(practiceData.reverseExercises[reverseIndex]?.options || []).map((opt) => {
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
                    {reverseIndex < practiceData.reverseExercises.length - 1 ? 'Próxima Frase ➔' : 'Ir para Etapa 3 ➔'}
                  </button>
                </div>
              )}

              {reverseStatus === 'wrong' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>✕ Quase lá! Lembre-se do ritmo da música e tente de novo.</span>
                  <button
                    onClick={() => setReverseStatus(null)}
                    className="underline text-xs font-bold cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3 — CANTAR JUNTO */}
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
                  Cante cada verso para destravar o Desafio Final ({sungVerses.length}/{practiceData.studyVerses.length} versos cantados)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isStep3Completed 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                }`}>
                  {sungVerses.length} / {practiceData.studyVerses.length} cantados
                </span>
              </div>
            </div>

            {/* Karaoke Style Dynamic Verses */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {practiceData.studyVerses.map((verse, idx) => {
                const isSung = sungVerses.includes(String(verse.id));
                const isRecordingThis = singingRecordingId === verse.id;

                return (
                  <div
                    key={verse.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isSung
                        ? 'bg-[#101526] border-emerald-500/40'
                        : singingLine === idx
                        ? 'bg-gradient-to-r from-purple-950/50 via-[#191d36] to-[#121528] border-purple-500/70 shadow-lg'
                        : 'bg-[#121526] border-[#1f243c]'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <p className={`text-base sm:text-lg font-black ${isSung ? 'text-emerald-200' : 'text-white'}`}>
                        {verse.en}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        {verse.pt}
                      </p>
                      {singingFeedback && singingFeedback.verseId === verse.id && (
                        <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
                          singingFeedback.status === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}>
                          {singingFeedback.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <MicOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                          <span>{singingFeedback.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSpeak(verse.en)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                        title="Ouvir"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSingVerse(verse)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isRecordingThis
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isSung
                            ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90'
                        }`}
                      >
                        {isSung ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cantado ✓</span>
                          </>
                        ) : isRecordingThis ? (
                          <>
                            <MicOff className="w-3.5 h-3.5 animate-spin" />
                            <span>Gravando...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>Cantar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Step CTA */}
            <div className="pt-2 flex flex-col items-end gap-1">
              <button
                disabled={!canAdvance3}
                aria-disabled={!canAdvance3}
                onClick={() => {
                  if (!canAdvance3) return;
                  setStepsDone((prev) => ({ ...prev, 3: true }));
                  const cleanSongId = String((song || dbSong)?.id || '').trim().toLowerCase();
                  if (cleanSongId) {
                    saveLocalPracticeSteps(user?.id, cleanSongId, { 3: true });
                    if (user?.id) {
                      progressService.updateSongMastery(user.id, cleanSongId, { step_sing_along: true }).catch((err) => {
                        console.warn('Falha ao gravar etapa 3 no banco:', err);
                      });
                    }
                  }
                  setCelebrationConfig({
                    title: '🎤 Etapa 3 Concluída!',
                    subtitle: 'Você cantou todos os versos com validação de voz.',
                    description: 'Pronúncia afinada no ritmo da música! Chegou a hora do Desafio Final.',
                    type: 'step_sing_along',
                    ctaText: 'Ir para Etapa 4: Cantar Sem Apoio ➔',
                    onCtaClick: () => {
                      setCelebrationConfig(null);
                      setCurrentStep(4);
                    }
                  });
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all ${
                  canAdvance3
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>Avançar para Etapa 4: Cantar sem apoio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {!canAdvance3 && (
                <p className="text-xs text-slate-400">
                  Cante todos os versos ({sungVerses.length}/{practiceData.studyVerses.length}) para liberar
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 4 — CANTAR SEM APOIO */}
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
                Frase em Português ({challengeIndex + 1}/{practiceData.challengeVerses.length})
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white">
                "{practiceData.challengeVerses[challengeIndex]?.pt}"
              </p>
            </div>

            {/* Vocal Score Badge & Feedback */}
            {challengeFeedback && (
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300 text-left ${
                challengeFeedback.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    challengeFeedback.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase">Validação de Canto</p>
                    <p className="text-sm font-bold text-white">{challengeFeedback.message}</p>
                    {challengeFeedback.transcript && (
                      <p className="text-xs text-slate-300/90 mt-0.5 font-medium">
                        Entendi: <span className="italic font-bold text-white">"{challengeFeedback.transcript}"</span> ({challengeFeedback.score}%)
                      </p>
                    )}
                  </div>
                </div>
                {challengeScore && (
                  <span className="text-sm font-black text-amber-400">+{challengeScore} XP</span>
                )}
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

              {challengeScore && challengeIndex < practiceData.challengeVerses.length - 1 && (
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
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleRepeatStep4}
                    className="px-5 py-3 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-300 hover:text-white border border-slate-700/60 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <span>Repetir Etapa</span>
                  </button>
                  <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer"
                  >
                    Voltar para o Módulo
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal de Celebração de Conclusão por Etapa */}
      {celebrationConfig && (
        <CompletionCelebration
          show={Boolean(celebrationConfig)}
          onClose={() => setCelebrationConfig(null)}
          title={celebrationConfig.title}
          subtitle={celebrationConfig.subtitle}
          description={celebrationConfig.description}
          type={celebrationConfig.type}
          ctaText={celebrationConfig.ctaText}
          onCtaClick={celebrationConfig.onCtaClick}
        />
      )}

    </div>
  );
}
