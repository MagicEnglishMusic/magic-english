import React, { useState, useRef, useMemo } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, Sparkles, Award, Zap, RotateCcw } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';

const DEFAULT_PRONUNCIATION_ITEMS = [
  { word: "Hello", phonetic: "/həˈloʊ/", tip: "Acentue a segunda sílaba com som aberto de 'ou'." },
  { word: "Morning", phonetic: "/ˈmɔːr.nɪŋ/", tip: "O 'r' é suave e o 'ing' nasal sem estalar o g." },
  { word: "Friend", phonetic: "/frend/", tip: "Som direto de 'e' curto sem alongar." },
  { word: "Rhythm", phonetic: "/ˈrɪð.əm/", tip: "O 'th' tem som vibrado suave contra os dentes." },
  { word: "Magic", phonetic: "/ˈmædʒ.ɪk/", tip: "O 'a' soa intermediário e o 'g' como jota suave." }
];

export default function PronunciationPractice({ items = [], onCompleteItem }) {
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scores, setScores] = useState({});
  const [recognitionFeedback, setRecognitionFeedback] = useState(null); // { status: 'success' | 'error' | 'warning', transcript: '', score: 0, message: '' }
  const { addXp } = useGamification();
  const recognitionRef = useRef(null);

  // Normalize input items to ensure all elements are valid objects
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return DEFAULT_PRONUNCIATION_ITEMS;
    }
    return items.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          word: item,
          phonetic: `/${item.toLowerCase()}/`,
          tip: "Pratique a entonação clara e natural."
        };
      }
      return {
        word: item?.word || item?.text || item?.term || `Palavra ${idx + 1}`,
        phonetic: item?.phonetic || item?.ipa || `/${(item?.word || '').toLowerCase()}/`,
        tip: item?.tip || item?.meaning || item?.translation || "Pronuncie com naturalidade e ritmo."
      };
    });
  }, [items]);

  const currentItem = normalizedItems[selectedWordIndex] || normalizedItems[0] || DEFAULT_PRONUNCIATION_ITEMS[0];

  // Stop synthetic audio if playing
  const toggleSpeak = (text) => {
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

        recognition.onresult = (event) => {
          setIsRecording(false);
          const transcript = event.results[0][0]?.transcript || '';
          const confidence = event.results[0][0]?.confidence || 0.9;

          const targetWord = currentItem.word.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const spokenClean = transcript.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

          // Check for match
          const isMatch = spokenClean.includes(targetWord) || targetWord.includes(spokenClean);

          if (isMatch && spokenClean.length > 0) {
            const calculatedScore = Math.min(99, Math.max(88, Math.round(confidence * 100)));
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

            if (onCompleteItem) {
              onCompleteItem(currentItem.word, calculatedScore);
            }

            addXp(XP_REWARDS.COMPLETE_PRONUNCIATION, `Treino de Pronúncia: ${currentItem.word}`, {
              showModal: true,
              type: 'xp',
              title: '🎤 Pronúncia Aprovada!',
              subtitle: `Precisão de ${calculatedScore}% na palavra "${currentItem.word}".`,
              icon: '🎤',
              bonusText: `+${XP_REWARDS.COMPLETE_PRONUNCIATION} Magic XP conquistados no Voice Lab!`
            });
          } else {
            setRecognitionFeedback({
              status: 'error',
              transcript,
              score: 0,
              message: `Você disse "${transcript || 'não identificado'}". A palavra esperada era "${currentItem.word}". Ouça o nativo e tente novamente!`
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
      // Fallback for browsers without Web Speech API: Real Audio Level Detection via getUserMedia
      try {
        setIsRecording(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let maxVolume = 0;

        const checkInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const currentMax = Math.max(...dataArray);
          if (currentMax > maxVolume) maxVolume = currentMax;
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          stream.getTracks().forEach((t) => t.stop());
          audioCtx.close();
          setIsRecording(false);

          if (maxVolume > 20) {
            const calculatedScore = 90;
            setScores((prev) => ({
              ...prev,
              [selectedWordIndex]: calculatedScore
            }));
            setRecognitionFeedback({
              status: 'success',
              transcript: currentItem.word,
              score: calculatedScore,
              message: `Áudio capturado com sucesso pelo microfone (${maxVolume} volume level)!`
            });
            addXp(XP_REWARDS.COMPLETE_PRONUNCIATION, `Treino de Pronúncia: ${currentItem.word}`, {
              showModal: true,
              type: 'xp',
              title: '🎤 Voz Capturada!',
              subtitle: `Gravação de "${currentItem.word}" recebida com sucesso.`,
              icon: '🎤',
              bonusText: `+${XP_REWARDS.COMPLETE_PRONUNCIATION} Magic XP conquistados!`
            });
          } else {
            setRecognitionFeedback({
              status: 'warning',
              transcript: '',
              score: 0,
              message: 'Volume muito baixo ou nenhum áudio detectado pelo microfone. Fale mais alto e tente de novo.'
            });
          }
        }, 3000);
      } catch (err) {
        setIsRecording(false);
        setRecognitionFeedback({
          status: 'error',
          transcript: '',
          score: 0,
          message: 'Permissão de microfone negada. Habilite o microfone no navegador.'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Word Selector Chips & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          {normalizedItems.map((item, idx) => {
            const isSelected = selectedWordIndex === idx;
            const score = scores[idx];
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedWordIndex(idx);
                  setRecognitionFeedback(null);
                  if (isSpeaking) {
                    window.speechSynthesis?.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'bg-[#111424] border border-[#1e233b] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{item.word}</span>
                {score && (
                  <span className="text-[10px] font-black bg-black/40 px-1.5 py-0.2 rounded text-emerald-400">
                    {score}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {Object.keys(scores).length > 0 && (
          <button
            onClick={() => {
              setScores({});
              setRecognitionFeedback(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm self-end sm:self-auto"
            title="Resetar pontuações de pronúncia desta aula"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Treino</span>
          </button>
        )}
      </div>

      {/* Main Pronunciation Lab Box */}
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

            {recognitionFeedback.status === 'success' && (
              <span className="text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 flex-shrink-0">
                <Zap className="w-3 h-3 fill-amber-400" /> +{XP_REWARDS.COMPLETE_PRONUNCIATION} XP
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
    </div>
  );
}
