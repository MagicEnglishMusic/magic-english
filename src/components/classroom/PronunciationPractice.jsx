import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, Sparkles, Award, Zap, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { calculateWordSimilarity } from '../../hooks/useSpeechEvaluator';
import { 
  getRequiredPronunciationCount, 
  getLocalPronunciationDone, 
  saveLocalPronunciationDone,
  getLocalLabPronunciationDone,
  saveLocalLabPronunciationDone,
  getLocalPronunciationCompleted,
  saveLocalPronunciationCompleted
} from '../../utils/pronunciationProgress';

const getPronunciationRetakeKey = (userId, targetSongId, targetLessonId) => {
  return `magic_english_pronunciation_retake_${userId || 'guest'}_${targetSongId || targetLessonId || 'default'}`;
};

const checkIsPronunciationRetaking = (userId, targetSongId, targetLessonId) => {
  if (typeof window === 'undefined') return false;
  try {
    const cleanSongId = String(targetSongId || '').trim().toLowerCase();
    const key = getPronunciationRetakeKey(userId, cleanSongId, targetLessonId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed.retaking);
    }
  } catch (_) {}
  return false;
};

export default function PronunciationPractice({ 
  items = [], 
  songId, 
  lessonId, 
  context,
  initialApprovedIndices = [], 
  isCompletedInitially = false, 
  onWordApproved, 
  onCompleteStep 
}) {
  const { user } = useAuth();
  const { addXp } = useGamification();
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scores, setScores] = useState({});
  const [recognitionFeedback, setRecognitionFeedback] = useState(null);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const recognitionRef = useRef(null);
  const initialIndexComputed = useRef(false);
  const isRetakingRef = useRef(false);

  const isLessonMode = Boolean(lessonId);
  const labContext = context || songId || 'general';

  // Permanent completion state (DB union + localStorage)
  const [isOfficiallyCompleted, setIsOfficiallyCompleted] = useState(() => {
    if (isCompletedInitially) return true;
    return getLocalPronunciationCompleted(user?.id, songId, lessonId, labContext);
  });

  // Controls visual display of completed state vs active practice
  const [isViewingCompleted, setIsViewingCompleted] = useState(() => {
    if (checkIsPronunciationRetaking(user?.id, songId, lessonId || labContext)) return false;
    if (isCompletedInitially) return true;
    return getLocalPronunciationCompleted(user?.id, songId, lessonId, labContext);
  });

  useEffect(() => {
    if (isCompletedInitially) {
      setIsOfficiallyCompleted(true);
      const isRetakingNow = checkIsPronunciationRetaking(user?.id, songId, lessonId || labContext) || isRetakingRef.current;
      if (!isRetakingNow) {
        setIsViewingCompleted(true);
      }
    }
  }, [isCompletedInitially, user?.id, songId, lessonId, labContext]);

  useEffect(() => {
    if (user?.id) {
      if (getLocalPronunciationCompleted(user.id, songId, lessonId, labContext)) {
        setIsOfficiallyCompleted(true);
        const isRetakingNow = checkIsPronunciationRetaking(user.id, songId, lessonId || labContext) || isRetakingRef.current;
        if (!isRetakingNow) {
          setIsViewingCompleted(true);
        }
      }
    }
  }, [user?.id, songId, lessonId, labContext]);

  // Stable signature for input items to prevent unnecessary recomputations
  const itemsSignature = useMemo(() => {
    if (!Array.isArray(items)) return '';
    return items.map((i) => `${i?.id || i?.word || ''}_${i?.sort_order ?? ''}`).join('|');
  }, [items]);

  // Normalize input items with sort_order preserved for DB words
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    return items.map((item, idx) => {
      const isDb = item?.is_db_word === true;
      const sortOrder = typeof item?.sort_order === 'number' ? item.sort_order : (item?.sort_order != null ? Number(item.sort_order) : null);
      if (typeof item === 'string') {
        return {
          id: `item-${idx}`,
          word: item,
          phonetic: `/${item.toLowerCase()}/`,
          tip: "Pratique a entonação clara e natural.",
          sort_order: null,
          is_db_word: false
        };
      }
      return {
        id: item?.id || `item-${idx}`,
        word: item?.word || item?.text || item?.term || `Palavra ${idx + 1}`,
        phonetic: item?.phonetic || item?.ipa || `/${(item?.word || '').toLowerCase()}/`,
        tip: item?.tip || item?.meaning || item?.translation || "Pronuncie com naturalidade e ritmo.",
        translation: item?.translation || '',
        sort_order: sortOrder,
        is_db_word: isDb
      };
    }).filter((i) => Boolean(i.word && i.word.trim()));
  }, [itemsSignature]);

  const totalWords = normalizedItems.length;
  const requiredCount = getRequiredPronunciationCount(totalWords);

  // State of approved word sort_orders (persisted in DB or Lab LocalStorage)
  const [approvedSortOrders, setApprovedSortOrders] = useState(() => {
    const local = isLessonMode
      ? getLocalPronunciationDone(user?.id, lessonId)
      : getLocalLabPronunciationDone(user?.id, labContext);
    const combined = new Set([
      ...(Array.isArray(initialApprovedIndices) ? initialApprovedIndices : []),
      ...local
    ]);
    return Array.from(combined);
  });

  // Session approved list for retaking mode
  const [sessionApprovedSortOrders, setSessionApprovedSortOrders] = useState(() => {
    if (checkIsPronunciationRetaking(user?.id, songId, lessonId || labContext)) return [];
    const local = isLessonMode
      ? getLocalPronunciationDone(user?.id, lessonId)
      : getLocalLabPronunciationDone(user?.id, labContext);
    const combined = new Set([
      ...(Array.isArray(initialApprovedIndices) ? initialApprovedIndices : []),
      ...local
    ]);
    return Array.from(combined);
  });

  const isRetaking = checkIsPronunciationRetaking(user?.id, songId, lessonId || labContext) || isRetakingRef.current;
  const activeApproved = isRetaking ? sessionApprovedSortOrders : approvedSortOrders;
  const hasReachedTarget = activeApproved.length >= requiredCount;

  // Sync approved sort_orders if prop updates (union only)
  useEffect(() => {
    if (Array.isArray(initialApprovedIndices) && initialApprovedIndices.length > 0) {
      setApprovedSortOrders((prev) => {
        const set = new Set([...prev, ...initialApprovedIndices]);
        return Array.from(set);
      });
    }
  }, [initialApprovedIndices]);

  // Set initial selected index ONCE on mount: open on first unapproved word
  useEffect(() => {
    if (normalizedItems.length > 0 && !initialIndexComputed.current) {
      initialIndexComputed.current = true;
      if (checkIsPronunciationRetaking(user?.id, songId, lessonId || labContext)) {
        setSelectedWordIndex(0);
        return;
      }
      const firstUnapprovedIdx = normalizedItems.findIndex((item, idx) => {
        const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
        const key = isLessonMode
          ? (isDb ? item.sort_order : (item.id || item.word))
          : (item.id || item.word || idx);
        return !approvedSortOrders.includes(key);
      });
      if (firstUnapprovedIdx !== -1) {
        setSelectedWordIndex(firstUnapprovedIdx);
      } else {
        setSelectedWordIndex(normalizedItems.length - 1);
      }
    }
  }, [normalizedItems, approvedSortOrders, user?.id, songId, lessonId, labContext, isLessonMode]);

  useEffect(() => {
    if (totalWords === 0 && songId) {
      console.warn(`[PronunciationPractice] Música "${songId}" sem palavras de pronúncia cadastradas.`);
    }
  }, [totalWords, songId]);

  const currentItem = normalizedItems[selectedWordIndex] || normalizedItems[0] || null;

  // Stop synthetic audio if playing
  const toggleSpeak = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      if (isSpeaking || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.8;
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(u);
      }
    }
  };

  // Real Microphone Recording & Speech Recognition
  const handleRecord = async () => {
    if (!currentItem) return;

    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      return;
    }

    setRecognitionFeedback(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = async (event) => {
          setIsRecording(false);

          let bestScore = 0;
          let bestTranscript = '';

          if (event.results && event.results.length > 0) {
            const firstResult = event.results[0];
            for (let i = 0; i < firstResult.length; i++) {
              const altTranscript = firstResult[i]?.transcript || '';
              if (!altTranscript.trim()) continue;
              const altScore = calculateWordSimilarity(currentItem.word, altTranscript);
              if (altScore > bestScore || !bestTranscript) {
                bestScore = altScore;
                bestTranscript = altTranscript;
              }
              if (bestScore === 100) break;
            }
          }

          if (!bestTranscript && event.results?.[0]?.[0]?.transcript) {
            bestTranscript = event.results[0][0].transcript;
            bestScore = calculateWordSimilarity(currentItem.word, bestTranscript);
          }

          const calculatedScore = bestScore;
          const transcript = bestTranscript;

          if (calculatedScore >= 80) {
            setScores((prev) => ({
              ...prev,
              [selectedWordIndex]: calculatedScore
            }));

            setRecognitionFeedback({
              status: 'success',
              transcript,
              score: calculatedScore,
              message: `Excelente! Entendi: "${transcript}" com ${calculatedScore}% de precisão.`
            });

            const isDbWord = currentItem.is_db_word === true && typeof currentItem.sort_order === 'number';
            const currentKey = isLessonMode
              ? (isDbWord ? currentItem.sort_order : (currentItem.id || selectedWordIndex))
              : (currentItem.id || currentItem.word || selectedWordIndex);

            // 1. Update session list for retake mode
            let nextSessionApproved = sessionApprovedSortOrders;
            if (!sessionApprovedSortOrders.includes(currentKey)) {
              nextSessionApproved = [...sessionApprovedSortOrders, currentKey];
              setSessionApprovedSortOrders(nextSessionApproved);
            }

            // 2. Update persistent approvedSortOrders and database/localStorage (always union, never delete)
            const isNewApproval = !approvedSortOrders.includes(currentKey);
            let nextApproved = approvedSortOrders;

            if (isNewApproval) {
              nextApproved = Array.from(new Set([...approvedSortOrders, currentKey]));
              setApprovedSortOrders(nextApproved);

              if (isLessonMode) {
                saveLocalPronunciationDone(user?.id, lessonId, nextApproved);
              } else {
                saveLocalLabPronunciationDone(user?.id, labContext, nextApproved);
              }

              if (onWordApproved) {
                onWordApproved(currentKey, nextApproved);
              }
            }

            const activeProgressionList = isRetaking ? nextSessionApproved : nextApproved;

            // Auto-advance to the next unapproved word in active session
            setTimeout(() => {
              setSelectedWordIndex((currentIdx) => {
                const nextUnapprovedIdx = normalizedItems.findIndex((item, idx) => {
                  if (idx <= currentIdx) return false;
                  const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
                  const key = isLessonMode
                    ? (isDb ? item.sort_order : (item.id || idx))
                    : (item.id || item.word || idx);
                  return !activeProgressionList.includes(key);
                });

                if (nextUnapprovedIdx !== -1) {
                  setRecognitionFeedback(null);
                  return nextUnapprovedIdx;
                }

                // If no unapproved words ahead, look from start
                const wrapUnapprovedIdx = normalizedItems.findIndex((item, idx) => {
                  const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
                  const key = isLessonMode
                    ? (isDb ? item.sort_order : (item.id || item.word))
                    : (item.id || item.word || idx);
                  return !activeProgressionList.includes(key);
                });

                if (wrapUnapprovedIdx !== -1) {
                  setRecognitionFeedback(null);
                  return wrapUnapprovedIdx;
                }

                return currentIdx;
              });
            }, 1400);
          } else if (calculatedScore >= 50) {
            setRecognitionFeedback({
              status: 'warning',
              transcript,
              score: calculatedScore,
              message: `Quase lá (${calculatedScore}%)! Entendi: "${transcript}". Tente falar com mais clareza: "${currentItem.word}".`
            });
          } else {
            setRecognitionFeedback({
              status: 'error',
              transcript,
              score: calculatedScore,
              message: `Entendi: "${transcript || 'não identificado'}" (${calculatedScore}%). A palavra esperada era "${currentItem.word}". Ouça o áudio e tente novamente!`
            });
          }
        };

        recognition.onerror = (event) => {
          setIsRecording(false);
          if (event.error === 'no-speech') {
            setRecognitionFeedback({
              status: 'warning',
              transcript: '',
              score: 0,
              message: 'Nenhum som detectado pelo microfone. Fale claramente após clicar no botão.'
            });
          } else if (event.error === 'not-allowed') {
            setRecognitionFeedback({
              status: 'error',
              transcript: '',
              score: 0,
              message: 'Acesso ao microfone negado. Permita o uso do microfone no seu navegador.'
            });
          } else {
            setRecognitionFeedback({
              status: 'warning',
              transcript: '',
              score: 0,
              message: `Erro na captura de áudio (${event.error}). Tente novamente.`
            });
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed to start:', err);
        setIsRecording(false);
      }
    } else {
      setRecognitionFeedback({
        status: 'error',
        transcript: '',
        score: 0,
        message: 'Use o Google Chrome ou Microsoft Edge para treinar e validar sua pronúncia.'
      });
      setIsRecording(false);
    }
  };

  const handleResetTraining = () => {
    isRetakingRef.current = true;
    setSelectedWordIndex(0);
    setRecognitionFeedback(null);
    setScores({});
    setSessionApprovedSortOrders([]);
    setIsViewingCompleted(false);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
    try {
      const cleanSongId = String(songId || '').trim().toLowerCase();
      const rKey = getPronunciationRetakeKey(user?.id, cleanSongId, lessonId || labContext);
      localStorage.setItem(rKey, JSON.stringify({ retaking: true }));
    } catch (_) {}
  };

  // Conclude pronunciation step (Grants 20 XP once per context, then marks permanently complete)
  const handleConcludePronunciation = async () => {
    if (isViewingCompleted || isSubmittingComplete) return;
    setIsSubmittingComplete(true);
    setCompleteError(null);

    const cleanSongId = String(songId || '').trim().toLowerCase();
    const cleanLessonId = String(lessonId || '').trim().toLowerCase();
    const cleanLabContext = String(labContext || '').trim().toLowerCase();

    // Determina a referência conforme contexto: songId se existir, senão lessonId, senão labContext, senão 'general'
    const targetRef = cleanSongId || cleanLessonId || cleanLabContext || 'general';

    try {
      // (a) Grant XP via server RPC
      const xpRes = await addXp('pronunciation_complete', targetRef, {
        showModal: true,
        type: 'xp',
        title: '🎤 Pronúncia Concluída!',
        subtitle: isLessonMode
          ? 'Parabéns! Você concluiu todos os termos fonéticos desta aula.'
          : 'Parabéns! Você concluiu todos os termos fonéticos do Laboratório de Pronúncia.',
        icon: '🎤',
        bonusText: '+20 Magic XP adicionados à sua jornada!'
      });

      if (!xpRes?.success) {
        console.warn('[PronunciationPractice] Aviso ao validar XP no servidor:', xpRes?.error);
      }
    } catch (err) {
      console.warn('[PronunciationPractice] Erro ao tentar conceder XP:', err);
    } finally {
      // (b) Grava como concluído e nunca bloqueia o término da prática pelo aluno
      setIsOfficiallyCompleted(true);
      setIsViewingCompleted(true);
      isRetakingRef.current = false;
      saveLocalPronunciationCompleted(user?.id, cleanSongId, lessonId, labContext);

      // Remove retaking flag upon conclusion
      try {
        const rKey = getPronunciationRetakeKey(user?.id, cleanSongId, lessonId || labContext);
        localStorage.removeItem(rKey);
      } catch (_) {}

      if (onCompleteStep) {
        try {
          onCompleteStep();
        } catch (e) {
          console.error('[PronunciationPractice] Erro no callback onCompleteStep:', e);
        }
      }

      setIsSubmittingComplete(false);
    }
  };

  // If 0 words exist for this song: show message and do not block lesson
  if (totalWords === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[#0e101f] border border-slate-800 space-y-3 max-w-xl mx-auto">
        <Mic className="w-10 h-10 text-purple-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Esta música ainda não tem palavras de pronúncia cadastradas</h3>
        <p className="text-xs text-slate-400">
          Você pode continuar estudando os outros passos da aula normalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Meta: Progress counter & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400" />
            Voice Lab — Pronúncia com Inteligência Artificial
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Valide sua pronúncia palavra por palavra da música oficial da aula
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isViewingCompleted ? (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pronúncia Concluída</span>
            </span>
          ) : hasReachedTarget ? (
            <button
              onClick={handleConcludePronunciation}
              disabled={isSubmittingComplete}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmittingComplete ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Concluir Pronúncia (+20 XP)</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-purple-500/15 border-purple-500/30 text-purple-300">
              Termos: {activeApproved.length} / {requiredCount}
            </span>
          )}

          <button
            onClick={handleResetTraining}
            className="px-3 py-1.5 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Reiniciar treino visual de pronúncia sem perder termos já aprovados no banco"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Treino</span>
          </button>
        </div>
      </div>

      {/* Complete Error Banner if XP grant failed */}
      {completeError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{completeError}</span>
          </div>
          <button
            onClick={handleConcludePronunciation}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] cursor-pointer flex-shrink-0"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Word Selector Chips */}
      <div className="flex flex-wrap items-center gap-2.5 max-h-48 overflow-y-auto p-1">
        {normalizedItems.map((item, idx) => {
          const isSelected = selectedWordIndex === idx;
          const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
          const itemKey = isLessonMode
            ? (isDb ? item.sort_order : (item.id || idx))
            : (item.id || item.word || idx);
          const isApproved = activeApproved.includes(itemKey);
          const score = scores[idx];

          return (
            <button
              key={item.id || idx}
              onClick={() => {
                setSelectedWordIndex(idx);
                setRecognitionFeedback(null);
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 ring-1 ring-purple-300'
                  : isApproved
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/50'
                  : 'bg-[#111424] border border-[#1e233b] text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item.word}</span>
              {isApproved && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              )}
              {score && !isApproved && (
                <span className="text-[10px] font-black bg-black/40 px-1.5 py-0.2 rounded text-emerald-400">
                  {score}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Pronunciation Lab Box */}
      {currentItem && (
        <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-b from-[#121528] to-[#0d0f1c] border border-purple-500/30 shadow-2xl flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Inteligência Artificial Vocal</span>
          </div>

          {/* Big Word Display */}
          <div className="space-y-1">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wide">
              {currentItem.word}
            </h2>
            <p className="text-sm font-mono text-purple-400">{currentItem.phonetic}</p>
            <p className="text-xs text-slate-400 max-w-md pt-1">{currentItem.tip}</p>
          </div>

          {/* Real Speech Recognition Feedback */}
          {recognitionFeedback && (
            <div className={`p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300 w-full text-left ${
              recognitionFeedback.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : recognitionFeedback.status === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  recognitionFeedback.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : recognitionFeedback.status === 'error'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {recognitionFeedback.status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <MicOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {recognitionFeedback.status === 'success' ? 'Análise Vocal Concluída' : 'Validação de Áudio'}
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {recognitionFeedback.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons: Ouvir & Gravar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 w-full">
            <button
              onClick={() => toggleSpeak(currentItem.word)}
              className={`flex-1 max-w-xs py-3.5 px-6 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/50'
                  : 'bg-[#181c32] hover:bg-[#202540] border-purple-500/30 text-white hover:border-purple-400'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-white' : 'text-purple-400'}`} />
              <span>{isSpeaking ? '⏹ Parar Áudio' : '🎤 Ouvir Nativo'}</span>
            </button>

            <button
              onClick={handleRecord}
              className={`flex-1 max-w-xs py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40 hover:scale-105'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Ouvindo sua voz... Fale agora!</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>🎙 Gravar Minha Voz</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
