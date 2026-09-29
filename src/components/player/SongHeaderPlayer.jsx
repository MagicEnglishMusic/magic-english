import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  Clock, 
  Sliders,
  Radio,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { isGoogleDriveUrl, getDriveAudioUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';
import { findActiveVerseIndex, KARAOKE_LEAD_SECONDS } from '../../utils/karaokeSync';

export default function SongHeaderPlayer({ song, currentLineIndex, onLineChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [progress, setProgress] = useState(0); // percentage
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [durationSeconds, setDurationSeconds] = useState(200); // default duration
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef(null);

  const resolvedAudio = useMemo(() => {
    const raw = song?.audioUrl || song?.audio_url || '';
    if (!raw) return '';
    return isGoogleDriveUrl(raw) ? getDriveAudioUrl(raw) : raw;
  }, [song]);

  const resolvedCover = useMemo(() => {
    const raw = song?.image || song?.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
    return isGoogleDriveUrl(raw) ? getDriveImageUrl(raw) : raw;
  }, [song]);

  const lyrics = useMemo(() => {
    if (Array.isArray(song?.timestamps) && song.timestamps.length > 0) {
      return song.timestamps;
    }
    if (Array.isArray(song?.lyrics) && song.lyrics.length > 0) {
      return song.lyrics;
    }
    return [];
  }, [song]);

  const lastIdxRef = useRef(currentLineIndex);

  useEffect(() => {
    lastIdxRef.current = currentLineIndex;
  }, [currentLineIndex]);

  // High-precision rAF loop for zero-latency active verse tracking
  useEffect(() => {
    if (!isPlaying) return;

    let animId = null;
    const syncLoop = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const time = audioRef.current.currentTime;
        const lineIdx = findActiveVerseIndex(lyrics, time, durationSeconds, KARAOKE_LEAD_SECONDS);

        if (onLineChange && lineIdx !== lastIdxRef.current) {
          lastIdxRef.current = lineIdx;
          onLineChange(lineIdx);
        }
      }
      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, lyrics, durationSeconds, onLineChange]);

  // Audio Event Handlers (Progress bar & Paused/Seek updates)
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    const dur = audioRef.current.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setDurationSeconds(dur);
      setProgress((time / dur) * 100);
    }

    // Sync active lyric line when audio is paused
    if (audioRef.current.paused && onLineChange && lyrics.length > 0) {
      const lineIdx = findActiveVerseIndex(lyrics, time, durationSeconds, KARAOKE_LEAD_SECONDS);
      onLineChange(lineIdx);
    }
  };

  const handleSeeked = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      if (onLineChange && lyrics.length > 0) {
        const lineIdx = findActiveVerseIndex(lyrics, time, durationSeconds, KARAOKE_LEAD_SECONDS);
        onLineChange(lineIdx);
      }
    }
  };

  const handleLoadedMetadata = (e) => {
    const dur = e.currentTarget.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setDurationSeconds(dur);
    }
  };

  const handleAudioEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
      if (onLineChange) onLineChange(-1);
    }
  };

  const togglePlay = () => {
    setAudioError(null);
    if (!resolvedAudio || !audioRef.current) {
      // Fallback speech synthesis if no audio
      if ('speechSynthesis' in window && lyrics.length > 0) {
        const lyric = lyrics[currentLineIndex >= 0 ? currentLineIndex : 0]?.english || lyrics[currentLineIndex >= 0 ? currentLineIndex : 0]?.en || song?.title;
        const u = new SpeechSynthesisUtterance(lyric);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
      }
      return;
    }

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
            console.warn('Audio play failed:', err);
            setIsLoadingAudio(false);
            setIsPlaying(false);
            setAudioError('Clique novamente para autorizar a reprodução.');
          });
      }
    }
  };

  const handleSeek = (e) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    const newTime = (newProgress / 100) * durationSeconds;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const skipTime = (seconds) => {
    if (!audioRef.current) return;
    const next = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), durationSeconds);
    audioRef.current.currentTime = next;
    setCurrentTime(next);
    setProgress((next / durationSeconds) * 100);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol / 100;
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  const formatTime = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#121528] via-[#0e101f] to-[#0a0c18] border border-purple-500/30 p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
      
      {/* Real HTML5 Audio Element for Full Synchronization */}
      {resolvedAudio && (
        <audio
          ref={audioRef}
          src={resolvedAudio}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onSeeked={handleSeeked}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => { setIsPlaying(true); setIsLoadingAudio(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={handleAudioEnded}
          onWaiting={() => setIsLoadingAudio(true)}
          onPlaying={() => setIsLoadingAudio(false)}
          onError={(e) => {
            console.warn('Audio stream error event:', e);
            setIsPlaying(false);
            setIsLoadingAudio(false);
          }}
        />
      )}

      {/* Background Neon Ambience */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        {/* Left Column: Cover & Music Meta (5 Cols) */}
        <div className="lg:col-span-5 flex items-center gap-5">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border border-purple-500/40 group">
            <img
              src={resolvedCover}
              alt={song?.title || 'Música'}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-110' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                {song?.level || 'Iniciante'}
              </span>
            </div>
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <Radio className="w-8 h-8 text-purple-300 animate-pulse" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Magic Song Lesson</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white truncate tracking-tight">
              {song?.title || 'Magic Song Oficial'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 truncate">
              {song?.subtitle || 'Fixação da Aula'}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-purple-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {song?.duration || formatTime(durationSeconds)}
              </span>
              <span>•</span>
              <span className="text-slate-400">{song?.genre || 'Pop'}</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{song?.bpm || '108 BPM'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Player Controls & Waveform (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          
          {/* Animated Soundwave Visualizer Bars */}
          <div className="flex items-center justify-between gap-1 h-8 px-4 py-1.5 rounded-xl bg-[#090b14]/70 border border-slate-800/80">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-semibold text-slate-300">Áudio Masterizado Real</span>
            </div>
            {/* 20 Animated EQ bars */}
            <div className="flex items-end gap-1 h-5 flex-1 max-w-xs justify-end">
              {[4, 8, 3, 6, 9, 5, 7, 10, 4, 8, 6, 9, 3, 7, 5, 8, 4, 9, 6, 3].map((height, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-purple-500 to-cyan-400 animate-bounce'
                      : 'bg-slate-700 h-1.5'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(height * 2.2, 4)}px` : '4px',
                    animationDelay: `${(i % 5) * 80}ms`,
                    animationDuration: '600ms'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar and Timers */}
          <div className="space-y-1.5">
            <div className="relative group flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-[#1a1e32] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span className="text-purple-300">Tempo restante: -{formatTime(Math.max(durationSeconds - currentTime, 0))}</span>
            </div>
          </div>

          {/* Main Controls: Skip, Play/Pause, Repeat, Volume */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Skip Back 10s */}
              <button
                onClick={() => skipTime(-10)}
                className="p-2.5 rounded-full bg-[#161a2e] hover:bg-[#1e233d] text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800"
                title="Voltar 10 segundos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Big Play / Pause Button with Neon Glow */}
              <button
                onClick={togglePlay}
                disabled={isLoadingAudio}
                className={`p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-500 text-white font-bold transition-all duration-200 cursor-pointer shadow-xl disabled:opacity-75 ${
                  isPlaying
                    ? 'shadow-purple-500/70 scale-105 ring-4 ring-purple-500/30'
                    : 'shadow-purple-600/40 hover:scale-105'
                }`}
                title={isPlaying ? 'Pausar música' : 'Tocar música'}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              {/* Skip Forward 10s */}
              <button
                onClick={() => skipTime(10)}
                className="p-2.5 rounded-full bg-[#161a2e] hover:bg-[#1e233d] text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800"
                title="Avançar 10 segundos"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Repeat Loop */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer border ${
                  isLooping
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-[#161a2e] border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Repetir em loop"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-purple-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1.5 bg-[#1a1e32] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {audioError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{audioError}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

