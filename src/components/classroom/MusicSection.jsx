import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, Music, Volume2, Sparkles, CheckCircle2, RotateCcw, Radio, Square, Loader2, AlertCircle } from 'lucide-react';
import { isGoogleDriveUrl, getDriveAudioUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';
import { useGamification } from '../../context/GamificationContext';
import { XP_REWARDS } from '../../data/gamificationData';
import { findActiveVerseIndex, KARAOKE_LEAD_SECONDS } from '../../utils/karaokeSync';

export default function MusicSection({ song, onOpenFullPlayer }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [speakingLineIndex, setSpeakingLineIndex] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const audioRef = useRef(null);

  const { songMasteryList, updateSongMasteryStep, resetSongMastery, addXp } = useGamification();

  const defaultSong = {
    title: 'Magic Song de Fixação',
    subtitle: 'Pratique ouvindo e cantando as estruturas da aula',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: '3:20',
    bpm: '108 BPM',
    audioUrl: '',
    lyricsTimestamps: [
      { id: 1, startTime: 0, endTime: 4, en: "Hello, hello, good morning my friend!", pt: "Olá, olá, bom dia meu amigo!" },
      { id: 2, startTime: 4, endTime: 9, en: "The sun is up, a new day will begin.", pt: "O sol nasceu, um novo dia vai começar." },
      { id: 3, startTime: 9, endTime: 14, en: "How are you doing on this lovely day?", pt: "Como você está neste lindo dia?" },
      { id: 4, startTime: 14, endTime: 19, en: "I'm feeling great, ready to sing and play!", pt: "Estou me sentindo ótimo, pronto para cantar e brincar!" }
    ]
  };

  const activeSong = song || defaultSong;
  const songId = activeSong.id || 'default-song';

  // Get current mastery status for this song
  const currentMastery = useMemo(() => {
    const found = songMasteryList.find((s) => s.songId === songId || s.id === songId);
    return found || { status: 'not_started', checklist: { listened_full: false }, masteryPercent: 0 };
  }, [songMasteryList, songId]);

  const resolvedCover = useMemo(() => {
    const raw = activeSong.cover_url || activeSong.image || defaultSong.image;
    return isGoogleDriveUrl(raw) ? getDriveImageUrl(raw) : raw;
  }, [activeSong]);

  const resolvedAudio = useMemo(() => {
    const raw = activeSong.audio_url || activeSong.audioUrl || '';
    return isGoogleDriveUrl(raw) ? getDriveAudioUrl(raw) : raw;
  }, [activeSong]);

  const lyrics = useMemo(() => {
    if (activeSong) {
      if (Array.isArray(activeSong.timestamps) && activeSong.timestamps.length > 0) {
        return activeSong.timestamps;
      }
      if (Array.isArray(activeSong.lyricsTimestamps) && activeSong.lyricsTimestamps.length > 0) {
        return activeSong.lyricsTimestamps;
      }
      if (Array.isArray(activeSong.lyrics) && activeSong.lyrics.length > 0) {
        return activeSong.lyrics.map((l, idx) => ({
          id: idx + 1,
          startTime: idx * 4,
          endTime: (idx + 1) * 4,
          en: l.english || l.text || l.en || '',
          pt: l.portuguese || l.translation || l.pt || ''
        })).filter(l => Boolean(l.en));
      }
      if (activeSong.lyrics_en || activeSong.lyricsEn) {
        const enLines = String(activeSong.lyrics_en || activeSong.lyricsEn).split('\n').map((l) => l.trim()).filter(Boolean);
        const ptLines = String(activeSong.lyrics_pt || activeSong.lyricsPt || '').split('\n').map((l) => l.trim()).filter(Boolean);
        return enLines.map((en, idx) => ({
          id: idx + 1,
          startTime: idx * 4,
          endTime: (idx + 1) * 4,
          en,
          pt: ptLines[idx] || ''
        }));
      }
    }
    return defaultSong.lyricsTimestamps;
  }, [activeSong]);

  // Format seconds to mm:ss
  const formatVerseTime = (sec) => {
    if (sec === null || sec === undefined || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const lastIdxRef = useRef(-1);

  // High-precision rAF loop for zero-latency active verse tracking
  useEffect(() => {
    if (!isPlaying) return;

    let animId = null;
    const syncLoop = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const time = audioRef.current.currentTime;
        const lineIdx = findActiveVerseIndex(lyrics, time, duration, KARAOKE_LEAD_SECONDS);

        if (lineIdx !== lastIdxRef.current) {
          lastIdxRef.current = lineIdx;
          setActiveLineIndex(lineIdx);
        }
      }
      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, lyrics, duration]);

  // Direct Audio Event Handlers (Progress bar & Paused/Seek updates)
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // Sync active lyric line when audio is paused
    if (audioRef.current.paused) {
      const lineIdx = findActiveVerseIndex(lyrics, time, duration, KARAOKE_LEAD_SECONDS);
      lastIdxRef.current = lineIdx;
      setActiveLineIndex(lineIdx);
    }
  };

  const handleSeeked = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      const lineIdx = findActiveVerseIndex(lyrics, time, duration, KARAOKE_LEAD_SECONDS);
      lastIdxRef.current = lineIdx;
      setActiveLineIndex(lineIdx);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveLineIndex(-1);

    // Mark listening step as completed in Supabase
    if (updateSongMasteryStep) {
      updateSongMasteryStep(songId, 'listen', true);
    }
  };

  const toggleSpeakLine = (index, text) => {
    if ('speechSynthesis' in window) {
      if (speakingLineIndex === index || (speakingLineIndex !== null && window.speechSynthesis.speaking)) {
        window.speechSynthesis.cancel();
        setSpeakingLineIndex(null);
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.85;
        u.onend = () => setSpeakingLineIndex(null);
        u.onerror = () => setSpeakingLineIndex(null);
        setSpeakingLineIndex(index);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const togglePlay = () => {
    setAudioError(null);

    // Cancel speech synthesis if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingLineIndex(null);
    }

    if (resolvedAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoadingAudio(true);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoadingAudio(false);
            })
            .catch((err) => {
              setIsLoadingAudio(false);
              setIsPlaying(false);
              setAudioError('Clique novamente para autorizar a reprodução do áudio.');
              console.warn('Audio play request failed:', err);
            });
        }
      }
    } else {
      // If no audio file configured, fallback to speech synthesis of current line
      toggleSpeakLine(activeLineIndex, lyrics[activeLineIndex]?.en || activeSong.title);
    }
  };

  const handleSeekLine = (index) => {
    lastIdxRef.current = index;
    setActiveLineIndex(index);
    const line = lyrics[index];
    if (line && audioRef.current && resolvedAudio) {
      audioRef.current.currentTime = line.startTime;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else if (line) {
      toggleSpeakLine(index, line.en);
    }
  };

  const handleResetProgress = () => {
    if (resetSongMastery) {
      resetSongMastery(songId);
    }
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {resolvedAudio && (
        <audio
          ref={audioRef}
          src={resolvedAudio}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onSeeked={handleSeeked}
          onPlay={() => { setIsPlaying(true); setIsLoadingAudio(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={handleAudioEnded}
          onWaiting={() => setIsLoadingAudio(true)}
          onPlaying={() => setIsLoadingAudio(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={(e) => {
            console.warn('Audio stream error event:', e);
            setIsPlaying(false);
            setIsLoadingAudio(false);
          }}
        />
      )}

      {/* Top Explanation Card: Music as Memorization Tool & Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#15182d] to-[#0f1224] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-md">
            <Music className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Karaokê Sincronizado de Fixação
              </span>
              {currentMastery?.checklist?.listened_full && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ouvida
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">
              Magic Song: {activeSong.title || 'Música de Fixação'}
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe os versos iluminados em tempo real com áudio nativo para destravar o ritmo do inglês.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Reset Progress Button */}
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl bg-[#14182a] hover:bg-[#1c223c] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Reiniciar etapas de estudo desta música sem perder XP"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar Progresso</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1a1024] border border-rose-500/40 animate-in fade-in duration-200">
              <span className="text-[11px] text-rose-300 px-2 font-medium">Reiniciar?</span>
              <button
                onClick={handleResetProgress}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition-colors"
              >
                Sim
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 rounded-lg bg-[#222842] text-slate-300 text-[11px] hover:text-white cursor-pointer"
              >
                Não
              </button>
            </div>
          )}

          {onOpenFullPlayer && (
            <button
              onClick={() => onOpenFullPlayer(activeSong)}
              className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-md"
            >
              Abrir Prática Musical ➔
            </button>
          )}
        </div>
      </div>

      {/* Mini Player & Synced Karaoke Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Mini Player Card (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-[#111424] border border-[#1e233b] flex flex-col justify-between space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-purple-500/30 group">
            <img src={resolvedCover} alt={activeSong.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <button
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/60 hover:scale-110 active:scale-95 transition-transform cursor-pointer disabled:opacity-75"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">{activeSong.title || 'Música de Fixação'}</h4>
            <p className="text-xs text-slate-400">{activeSong.subtitle || 'Fixação da Aula'}</p>
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold pt-1">
              <span>{activeSong.duration || '3:20'}</span>
              <span className="text-cyan-400 font-bold">{activeSong.bpm || '108 BPM'}</span>
            </div>
          </div>

          {audioError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{audioError}</span>
            </div>
          )}
        </div>

        {/* Right: Synchronized Karaoke Lyrics List (8 Cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[#111424] border border-[#1e233b] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Letra Sincronizada ({lyrics.length} versos)
            </h4>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isPlaying 
                ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30 animate-pulse' 
                : 'text-slate-400 bg-slate-800/40 border-slate-700'
            }`}>
              {isPlaying ? '▶ Áudio em Reprodução' : 'Pausado'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {lyrics.map((line, index) => {
              const isCurrent = activeLineIndex === index;
              const isPast = typeof line.endTime === 'number' ? currentTime >= line.endTime : (activeLineIndex !== -1 && activeLineIndex > index);
              const isSpeakingThis = speakingLineIndex === index;

              return (
                <div
                  key={line.id || index}
                  onClick={() => handleSeekLine(index)}
                  className={`p-4 rounded-2xl border transition-all duration-100 cursor-pointer flex items-center justify-between gap-4 group ${
                    isSpeakingThis
                      ? 'bg-gradient-to-r from-purple-900/80 via-[#22284e] to-[#121528] border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/50'
                      : isCurrent
                      ? 'bg-gradient-to-r from-purple-950/60 via-[#1a1d38] to-[#121528] border-purple-400 shadow-xl shadow-purple-600/30 ring-1 ring-purple-400/60'
                      : isPast
                      ? 'bg-[#121526]/80 border-slate-800/80 text-slate-400'
                      : 'bg-[#0e101d]/60 border-slate-800/40 opacity-50 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSpeakingThis
                          ? 'bg-cyan-500 text-black font-extrabold shadow-sm animate-pulse'
                          : isCurrent
                          ? 'bg-purple-600 text-white shadow-sm'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isSpeakingThis ? 'Ouvindo...' : isPast ? '✓' : formatVerseTime(line.startTime)}
                    </span>

                    <div className="space-y-0.5">
                      <p
                        className={`text-sm sm:text-base font-black transition-colors ${
                          isSpeakingThis || isCurrent
                            ? 'text-white text-shadow-glow'
                            : isPast
                            ? 'text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {line.en}
                      </p>
                      <p
                        className={`text-xs ${
                          isSpeakingThis ? 'text-cyan-300 font-semibold' : isCurrent ? 'text-purple-300 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {line.pt}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSpeakLine(index, line.en);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isSpeakingThis
                        ? 'bg-cyan-500 text-black shadow-md'
                        : isCurrent
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-[#171b30] text-slate-400 group-hover:text-white'
                    }`}
                    title={isSpeakingThis ? "Parar pronúncia" : "Ouvir verso isolado"}
                  >
                    {isSpeakingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
