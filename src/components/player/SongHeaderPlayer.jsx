import React, { useState, useEffect, useRef } from 'react';
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
  Radio
} from 'lucide-react';

export default function SongHeaderPlayer({ song, currentLineIndex, onLineChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(15); // percentage
  const [currentTime, setCurrentTime] = useState(30); // in seconds
  const [durationSeconds, setDurationSeconds] = useState(204); // 3:24 = 204s
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Timer simulation for playback
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return durationSeconds;
          }
          const next = prev + 1;
          setProgress((next / durationSeconds) * 100);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds, isLooping]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    // Use Web Speech Synthesis to pronounce the active line if supported
    if (nextState && 'speechSynthesis' in window && song?.lyrics?.length > 0) {
      window.speechSynthesis.cancel();
      const currentLyric = song.lyrics[currentLineIndex || 0]?.english || song.title;
      const utterance = new SpeechSynthesisUtterance(currentLyric);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSeek = (e) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    setCurrentTime(Math.floor((newProgress / 100) * durationSeconds));
  };

  const skipTime = (seconds) => {
    setCurrentTime((prev) => {
      const next = Math.min(Math.max(prev + seconds, 0), durationSeconds);
      setProgress((next / durationSeconds) * 100);
      return next;
    });
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#121528] via-[#0e101f] to-[#0a0c18] border border-purple-500/30 p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
      {/* Background Neon Ambience */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        {/* Left Column: Cover & Music Meta (5 Cols) */}
        <div className="lg:col-span-5 flex items-center gap-5">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border border-purple-500/40 group">
            <img
              src={song.image}
              alt={song.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-110' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                {song.level}
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
              {song.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 truncate">
              {song.subtitle}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-purple-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {song.duration}
              </span>
              <span>•</span>
              <span className="text-slate-400">{song.genre || 'Pop'}</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{song.bpm}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Player Controls & Waveform (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          
          {/* Animated Soundwave Visualizer Bars */}
          <div className="flex items-center justify-between gap-1 h-8 px-4 py-1.5 rounded-xl bg-[#090b14]/70 border border-slate-800/80">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-semibold text-slate-300">Áudio Masterizado</span>
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
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-[#1a1e32] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span className="text-purple-300">Tempo restante: -{formatTime(durationSeconds - currentTime)}</span>
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
                className={`p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-500 text-white font-bold transition-all duration-200 cursor-pointer shadow-xl ${
                  isPlaying
                    ? 'shadow-purple-500/70 scale-105 ring-4 ring-purple-500/30'
                    : 'shadow-purple-600/40 hover:scale-105'
                }`}
                title={isPlaying ? 'Pausar música' : 'Tocar música'}
              >
                {isPlaying ? (
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
                onClick={() => setIsMuted(!isMuted)}
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
                onChange={(e) => {
                  setVolume(parseInt(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 sm:w-24 h-1.5 bg-[#1a1e32] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
