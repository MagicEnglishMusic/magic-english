import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, Sparkles, Award, Zap, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { calculateWordSimilarity } from '../../hooks/useSpeechEvaluator';
import { 
  getRequiredPronunciationCount, 
  getLocalPronunciationDone, 
  saveLocalPronunciationDone 
} from '../../utils/pronunciationProgress';

export default function PronunciationPractice({ 
  items = [], 
  songId, 
  lessonId, 
  initialApprovedIndices = [], 
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
  const recognitionRef = useRef(null);
  const initialIndexComputed = useRef(false);

  // Normalize input items without fake fallbacks for real lessons
  const [lastGrantedXp, setLastGrantedXp] = useState(20);

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

  // State of approved word sort_orders (persisted in DB and LocalStorage)
  const [approvedSortOrders, setApprovedSortOrders] = useState(() => {
    const local = getLocalPronunciationDone(user?.id, lessonId);
    const combined = new Set([
      ...(Array.isArray(initialApprovedIndices) ? initialApprovedIndices : []),
      ...local
    ]);
    return Array.from(combined);
  });

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
      const firstUnapprovedIdx = normalizedItems.findIndex((item) => {
        const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
        const key = isDb ? item.sort_order : (item.id || item.word);
        return !approvedSortOrders.includes(key);
      });
      if (firstUnapprovedIdx !== -1) {
        setSelectedWordIndex(firstUnapprovedIdx);
      } else {
        setSelectedWordIndex(normalizedItems.length - 1);
      }
    }
  }, [normalizedItems, approvedSortOrders]);

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
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = async (event) => {
          setIsRecording(false);
          const transcript = event.results[0][0]?.transcript || '';
          const calculatedScore = calculateWordSimilarity(currentItem.word, transcript);

          if (calculatedScore >= 80) {
            setScores((prev) => ({
              ...prev,
              [selectedWordIndex]: calculatedScore
            }));

            setRecognitionFeedback({
              status: 'success',
              transcript,
              score: calculatedScore,
              message: `Excelente! Você pronunciou "${transcript}" com ${calculatedScore}% de precisão.`
            });

            const isDbWord = currentItem.is_db_word === true && typeof currentItem.sort_order === 'number';
            const currentKey = isDbWord ? currentItem.sort_order : (currentItem.id || selectedWordIndex);
            const isNewApproval = !approvedSortOrders.includes(currentKey);
            let nextApproved = approvedSortOrders;

            if (isNewApproval) {
              nextApproved = Array.from(new Set([...approvedSortOrders, currentKey]));
              setApprovedSortOrders(nextApproved);
              saveLocalPronunciationDone(user?.id, lessonId, nextApproved);

              if (onWordApproved) {
                onWordApproved(currentKey, nextApproved);
              }

              if (nextApproved.length >= requiredCount && onCompleteStep) {
                onCompleteStep();
              }

              // Only call grant_xp for real database words with sort_order
              if (isDbWord) {
                const cleanSongId = String(songId || '').trim().toLowerCase();
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSongId);

                if (isUuid) {
                  const xpRes = await addXp('pronunciation_item', `${cleanSongId}:${currentItem.sort_order}`, {
                    showModal: true,
                    type: 'xp',
                    title: '🎤 Pronúncia Aprovada!',
                    subtitle: `Precisão de ${calculatedScore}% na palavra "${currentItem.word}".`,
                    icon: '🎤',
                    bonusText: `+${lastGrantedXp || 20} Magic XP conquistados no Voice Lab!`
                  });
                  if (xpRes && typeof xpRes.amount === 'number') {
                    setLastGrantedXp(xpRes.amount);
                  }
                } else if (!cleanSongId) {
                  console.warn('[PronunciationPractice] ID da música não configurado para envio de XP.');
                }
              }
            }

            // Auto-advance to the next unapproved word after feedback display
            setTimeout(() => {
              setSelectedWordIndex((currentIdx) => {
                const nextUnapprovedIdx = normalizedItems.findIndex((item, idx) => {
                  if (idx <= currentIdx) return false;
                  const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
                  const key = isDb ? item.sort_order : (item.id || idx);
                  return !nextApproved.includes(key);
                });

                if (nextUnapprovedIdx !== -1) {
                  setRecognitionFeedback(null);
                  return nextUnapprovedIdx;
                }

                // If no unapproved words ahead, look from start
                const wrapUnapprovedIdx = normalizedItems.findIndex((item) => {
                  const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
                  const key = isDb ? item.sort_order : (item.id || item.word);
                  return !nextApproved.includes(key);
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
              message: `Quase lá (${calculatedScore}%)! Você disse "${transcript}". Tente falar com mais clareza: "${currentItem.word}".`
            });
          } else {
            setRecognitionFeedback({
              status: 'error',
              transcript,
              score: calculatedScore,
              message: `Você disse "${transcript || 'não identificado'}". A palavra esperada era "${currentItem.word}". Ouça o áudio e tente novamente!`
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

  const isStepCompleted = approvedSortOrders.length >= requiredCount;

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

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isStepCompleted 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
          }`}>
            {isStepCompleted ? '✓ Passo 3 Concluído' : `Termos: ${approvedSortOrders.length} / ${requiredCount}`}
          </span>

          <button
            onClick={() => {
              setSelectedWordIndex(0);
              setRecognitionFeedback(null);
              if (isSpeaking) {
                window.speechSynthesis?.cancel();
                setIsSpeaking(false);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Voltar ao início do treino visual sem perder termos já aprovados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Treino</span>
          </button>
        </div>
      </div>

      {/* Word Selector Chips */}
      <div className="flex flex-wrap items-center gap-2.5 max-h-48 overflow-y-auto p-1">
        {normalizedItems.map((item, idx) => {
          const isSelected = selectedWordIndex === idx;
          const isDb = item.is_db_word === true && typeof item.sort_order === 'number';
          const itemKey = isDb ? item.sort_order : (item.id || idx);
          const isApproved = approvedSortOrders.includes(itemKey);
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

              {recognitionFeedback.status === 'success' && currentItem.is_db_word && (
                <span className="text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 flex-shrink-0">
                  <Zap className="w-3 h-3 fill-amber-400" /> +{lastGrantedXp || 20} XP
                </span>
              )}
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
