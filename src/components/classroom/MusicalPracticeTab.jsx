import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Zap, 
  Mic,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { progressService } from '../../services/progressService';
import { XP_REWARDS } from '../../data/gamificationData';
import CompletionCelebration from '../common/CompletionCelebration';

const DEFAULT_VERSES = [
  { id: 1, en: "Hello, hello, good morning my friend!", pt: "Olá, olá, bom dia meu amigo!", hint: "Comece com 'Hello' e use 'good morning'" },
  { id: 2, en: "The sun is up, a new day will begin.", pt: "O sol nasceu, um novo dia vai começar.", hint: "'The sun is up' para o amanhecer" },
  { id: 3, en: "How are you doing on this lovely day?", pt: "Como você está neste lindo dia?", hint: "'How are you doing?' para cumprimentar" },
  { id: 4, en: "I'm feeling great, ready to sing and play!", pt: "Estou me sentindo ótimo, pronto para cantar e brincar!", hint: "'I'm feeling great' para responder" },
  { id: 5, en: "Nice to meet you, welcome to the show.", pt: "Prazer em conhecer você, bem-vindo ao show.", hint: "'Nice to meet you' para apresentações" }
];

const getStorageKey = (userId, targetSongId, targetLessonId) => {
  return `magic_english_practice_verse_${userId || 'guest'}_${targetSongId || targetLessonId || 'default'}`;
};

const getRetakeKey = (userId, targetSongId, targetLessonId) => {
  return `magic_english_practice_retake_${userId || 'guest'}_${targetSongId || targetLessonId || 'default'}`;
};

const checkIsRetaking = (userId, targetSongId, targetLessonId) => {
  if (typeof window === 'undefined') return false;
  try {
    const cleanSongId = String(targetSongId || '').trim().toLowerCase();
    const key = getRetakeKey(userId, cleanSongId, targetLessonId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed.retaking);
    }
  } catch (_) {}
  return false;
};

export default function MusicalPracticeTab({ 
  lyrics, 
  song, 
  onComplete, 
  songId = "song-hello",
  lessonId,
  isCompletedInitially = false 
}) {
  const { user } = useAuth();
  const { addXp, updateSongMasteryStep, resetSongMastery, songMasteryList } = useGamification();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const cleanSongId = String(songId || '').trim().toLowerCase();
        const key = getStorageKey(user.id, cleanSongId, lessonId);
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.currentIndex === 'number' && parsed.currentIndex >= 0) {
            return parsed.currentIndex;
          }
        }
      } catch (_) {}
    }
    return 0;
  });
  const [typedAnswer, setTypedAnswer] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'wrong' | null

  // Persistent official completion (keeps badge & DB achievement)
  const [isOfficiallyCompleted, setIsOfficiallyCompleted] = useState(() => {
    if (isCompletedInitially) return true;
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const cleanSongId = String(songId || '').trim().toLowerCase();
        const key = getStorageKey(user.id, cleanSongId, lessonId);
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isCompleted) return true;
        }
      } catch (_) {}
    }
    return false;
  });

  // Controls whether we show the Finished Trophy Screen or the Interactive Practice Form
  const [isViewingFinished, setIsViewingFinished] = useState(() => {
    if (checkIsRetaking(user?.id, songId, lessonId)) return false;
    if (isCompletedInitially) return true;
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const cleanSongId = String(songId || '').trim().toLowerCase();
        const key = getStorageKey(user.id, cleanSongId, lessonId);
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isCompleted) return true;
        }
      } catch (_) {}
    }
    return false;
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleRestartPractice = () => {
    setIsRetaking(true);
    setIsViewingFinished(false);
    setCurrentIndex(0);
    setTypedAnswer('');
    setStatus(null);
    setShowResetConfirm(false);
    setShowCelebration(false);
    try {
      const cleanSongId = String(songId || '').trim().toLowerCase();
      const rKey = getRetakeKey(user?.id, cleanSongId, lessonId);
      localStorage.setItem(rKey, JSON.stringify({ retaking: true }));
      const key = getStorageKey(user?.id, cleanSongId, lessonId);
      localStorage.setItem(key, JSON.stringify({ currentIndex: 0, isCompleted: isOfficiallyCompleted }));
    } catch (_) {}
  };

  const verses = React.useMemo(() => {
    // 1. Array passed directly
    if (Array.isArray(lyrics) && lyrics.length > 0) {
      const parsed = lyrics.map((l, idx) => ({
        id: l?.id || idx + 1,
        en: l?.en || l?.english || l?.text || '',
        pt: l?.pt || l?.portuguese || l?.translation || '',
        hint: l?.hint || l?.structure || `Frase ${idx + 1}`
      })).filter((item) => Boolean(item.en && item.en.trim()));

      if (parsed.length > 0) return parsed;
    }

    // 2. Parse from song object (SSOT)
    if (song) {
      if (Array.isArray(song.lyrics) && song.lyrics.length > 0) {
        const parsed = song.lyrics.map((l, idx) => ({
          id: l?.id || idx + 1,
          en: l?.english || l?.text || l?.en || '',
          pt: l?.portuguese || l?.translation || l?.pt || '',
          hint: l?.hint || l?.structure || `Frase ${idx + 1}`
        })).filter((item) => Boolean(item.en && item.en.trim()));
        if (parsed.length > 0) return parsed;
      }

      const rawEn = song.lyrics_en || song.lyricsEn || '';
      const rawPt = song.lyrics_pt || song.lyricsPt || '';
      if (rawEn) {
        const enLines = String(rawEn).split('\n').map((l) => l.trim()).filter(Boolean);
        const ptLines = String(rawPt).split('\n').map((l) => l.trim()).filter(Boolean);
        const parsed = enLines.map((en, idx) => ({
          id: idx + 1,
          en,
          pt: ptLines[idx] || 'Tradução da frase',
          hint: `Verso ${idx + 1}`
        }));
        if (parsed.length > 0) return parsed;
      }
    }

    return DEFAULT_VERSES;
  }, [lyrics, song]);

  // Sync if isCompletedInitially becomes true from parent
  useEffect(() => {
    if (isCompletedInitially) {
      setIsOfficiallyCompleted(true);
      const hasRetakeFlag = checkIsRetaking(user?.id, songId, lessonId);
      if (!isRetaking && !hasRetakeFlag) {
        setIsViewingFinished(true);
      }
    }
  }, [isCompletedInitially, isRetaking, user?.id, songId, lessonId]);

  // Restore saved progress from Supabase and LocalStorage on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSavedProgress() {
      if (!user?.id) return;

      try {
        const cleanSongId = String(songId || '').trim().toLowerCase();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSongId);

        // 1. Fetch user_progress for lesson
        let lessonPracticeDone = false;
        let lessonPracticeVerse = null;
        if (lessonId) {
          const { data: progressList } = await progressService.getUserProgress(user.id);
          if (isMounted && Array.isArray(progressList)) {
            const match = progressList.find((p) => p.lesson_id === lessonId);
            if (match) {
              if (match.completed || match.steps?.practice) {
                lessonPracticeDone = true;
              }
              if (match.steps?.practice_verse !== undefined && match.steps?.practice_verse !== null) {
                lessonPracticeVerse = parseInt(match.steps.practice_verse, 10);
              }
            }
          }
        }

        // 2. Fetch song_mastery
        let masteryReverseDone = false;
        let masteryChallengeIndex = null;
        if (isUuid) {
          const { data: masteryList } = await progressService.getSongMastery(user.id);
          if (isMounted && Array.isArray(masteryList)) {
            const match = masteryList.find((m) => m.song_id === cleanSongId);
            if (match) {
              if (match.step_reverse_translation) {
                masteryReverseDone = true;
              }
              if (match.challenge_index !== undefined && match.challenge_index !== null) {
                masteryChallengeIndex = parseInt(match.challenge_index, 10);
              }
            }
          }
        }

        // 3. LocalStorage fallback
        let localVerseIdx = null;
        let localDone = false;
        try {
          const key = getStorageKey(user.id, cleanSongId, lessonId);
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.isCompleted) localDone = true;
            if (typeof parsed.currentIndex === 'number') localVerseIdx = parsed.currentIndex;
          }
        } catch (_) {}

        if (!isMounted) return;

        const hasRetakeFlag = checkIsRetaking(user.id, cleanSongId, lessonId);

        if (lessonPracticeDone || masteryReverseDone || localDone) {
          setIsOfficiallyCompleted(true);
          if (!isRetaking && !hasRetakeFlag) {
            setIsViewingFinished(true);
          }
        }

        // Restore candidate index if not retaking
        if (!isRetaking && !hasRetakeFlag) {
          const candidateIdx = [lessonPracticeVerse, masteryChallengeIndex, localVerseIdx].find(
            (n) => typeof n === 'number' && !isNaN(n) && n >= 0
          );

          if (candidateIdx !== undefined && candidateIdx !== null) {
            const clamped = Math.min(candidateIdx, Math.max(0, verses.length - 1));
            setCurrentIndex(clamped);
          }
        }
      } catch (err) {
        console.warn('[MusicalPracticeTab] Erro ao restaurar progresso:', err);
      }
    }

    restoreSavedProgress();
    return () => { isMounted = false; };
  }, [user?.id, songId, lessonId, verses.length, isRetaking]);

  const isMastered = React.useMemo(() => {
    if (isOfficiallyCompleted) return true;
    const cleanSongId = String(songId || '').trim().toLowerCase();
    const s = songMasteryList.find((item) => (item.songId && String(item.songId).toLowerCase() === cleanSongId) || (item.id && String(item.id).toLowerCase() === cleanSongId));
    return Boolean(s?.checklist?.reverse_translation || s?.checklist?.reverse);
  }, [isOfficiallyCompleted, songMasteryList, songId]);

  const currentVerse = verses[currentIndex] || verses[0] || DEFAULT_VERSES[0];

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
        u.rate = 0.85;
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const handleVerify = (answer) => {
    const userClean = (answer || typedAnswer).trim().toLowerCase().replace(/[.,?!]/g, '');
    const expectedClean = currentVerse.en.toLowerCase().replace(/[.,?!]/g, '');

    if (userClean === expectedClean) {
      setStatus('correct');
      toggleSpeak(currentVerse.en);
    } else {
      setStatus('wrong');
    }
  };

  const handleNext = async () => {
    setSaveError(null);
    const nextIdx = currentIndex + 1;
    const cleanSongId = String(songId || '').trim().toLowerCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSongId);

    if (currentIndex < verses.length - 1) {
      setCurrentIndex(nextIdx);
      setTypedAnswer('');
      setStatus(null);

      // 1. Save immediately to LocalStorage
      try {
        const key = getStorageKey(user?.id, cleanSongId, lessonId);
        localStorage.setItem(key, JSON.stringify({ currentIndex: nextIdx, isCompleted: false }));
      } catch (_) {}

      // 2. Persist to Supabase with await
      if (user?.id) {
        setIsSaving(true);
        try {
          if (lessonId) {
            const resProgress = await progressService.saveLessonProgressSteps(user.id, lessonId, { practice_verse: nextIdx });
            if (resProgress?.error) {
              console.warn('[MusicalPracticeTab] Falha ao sincronizar frase em user_progress:', resProgress.error);
            }
          }
          if (isUuid) {
            const resMastery = await progressService.updateSongMastery(user.id, cleanSongId, { challenge_index: nextIdx });
            if (resMastery?.error) {
              console.warn('[MusicalPracticeTab] Falha ao sincronizar frase em song_mastery:', resMastery.error);
            }
          }
        } catch (err) {
          console.warn('[MusicalPracticeTab] Exceção ao salvar progresso da frase:', err);
          setSaveError('Aviso: Não foi possível sincronizar o progresso com o servidor.');
        } finally {
          setIsSaving(false);
        }
      }
    } else {
      setIsOfficiallyCompleted(true);
      setIsViewingFinished(true);
      setShowCelebration(true);
      setIsRetaking(false);

      // 0. Remove retake flag from LocalStorage
      try {
        const rKey = getRetakeKey(user?.id, cleanSongId, lessonId);
        localStorage.removeItem(rKey);
      } catch (_) {}

      // 1. Save completion immediately to LocalStorage
      try {
        const key = getStorageKey(user?.id, cleanSongId, lessonId);
        localStorage.setItem(key, JSON.stringify({ currentIndex: verses.length - 1, isCompleted: true }));
      } catch (_) {}

      // 2. Update song_mastery in Supabase with await
      if (user?.id && isUuid) {
        try {
          await progressService.updateSongMastery(user.id, cleanSongId, { step_reverse_translation: true });
        } catch (err) {
          console.warn('[MusicalPracticeTab] Falha ao atualizar song_mastery:', err);
        }
      }

      // 3. Update song_mastery in context
      updateSongMasteryStep(songId, 'reverse_translation', true);

      // 4. Grant XP
      addXp('practice_complete', cleanSongId, {
        showModal: true,
        type: 'xp',
        title: '🧠 Prática Musical Concluída!',
        subtitle: `Você fez a tradução reversa de todas as ${verses.length} frases da canção!`,
        icon: '🎵',
        bonusText: `+75 Magic XP conquistados!`
      });

      // 5. Notify parent (MagicClassroomView saves steps.practice = true in user_progress)
      if (onComplete) onComplete(XP_REWARDS.COMPLETE_MUSICAL_PRACTICE);
    }
  };

  return (
    <div className="p-6 sm:p-9 rounded-3xl bg-[#0e101f] border border-[#1e233b] space-y-6 max-w-3xl mx-auto shadow-2xl animate-in fade-in duration-300">
      
      {/* Completion Celebration Overlay (shows once upon completing all phrases) */}
      <CompletionCelebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="🎉 Parabéns!"
        subtitle="Você concluiu a Prática Musical!"
        description="Você recuperou e fixou todas as frases da canção. Continue praticando e evoluindo no Magic English!"
        type="musical_practice"
        ctaText="Ver Resultado da Prática ➔"
        onCtaClick={() => setShowCelebration(false)}
      />

      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              🎤 Prática Musical — Tradução Reversa
            </h3>
            {isMastered && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Concluída
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Recupere o inglês a partir do significado de todas as frases da canção
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-2.5 py-1 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              title="Reiniciar prática desta música do zero sem perder XP"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetar</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1a1024] border border-rose-500/40 animate-in fade-in duration-200">
              <span className="text-[10px] text-rose-300 px-1.5 font-medium">Resetar?</span>
              <button
                onClick={handleRestartPractice}
                className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
              >
                Sim
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-0.5 rounded-lg bg-[#222842] text-slate-300 text-[10px] cursor-pointer"
              >
                Não
              </button>
            </div>
          )}

          <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 w-fit">
            Frase {currentIndex + 1} de {verses.length}
          </span>
        </div>
      </div>

      {!isViewingFinished ? (
        <div className="space-y-6">
          
          {/* Step 1: Frase Original & Tradução Preview */}
          <div className="p-4 rounded-2xl bg-[#121526] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Estude a frase da música:
              </span>
              <button
                onClick={() => toggleSpeak(currentVerse.en)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                  isSpeaking
                    ? 'bg-purple-600 text-white font-bold animate-pulse'
                    : 'text-purple-300 hover:text-purple-200 bg-purple-500/10'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? '⏹ Parar Áudio' : 'Ouvir Nativo'}</span>
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
              onClick={handleRestartPractice}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 cursor-pointer hover:bg-purple-500 transition-all"
            >
              Refazer Prática
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
