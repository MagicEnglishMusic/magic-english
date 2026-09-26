import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Subtitles, 
  Gauge, 
  RotateCcw, 
  RotateCw,
  Sparkles,
  Settings,
  Tv,
  HardDrive
} from 'lucide-react';
import { isGoogleDriveUrl, getDriveVideoUrl } from '../../utils/googleDriveHelper';

export default function VideoPlayer({ lesson }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(22); // percent
  const [currentTime, setCurrentTime] = useState(198); // in seconds (3:18)
  const [duration, setDuration] = useState(900); // 15 mins = 900s
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [captionMode, setCaptionMode] = useState('en'); // 'en' | 'pt' | 'off'
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);

  const videoSrc = lesson?.videoUrl || '';
  const isDrive = isGoogleDriveUrl(videoSrc);
  const driveEmbedUrl = isDrive ? getDriveVideoUrl(videoSrc) : null;

  // Playback timer simulation for custom overlay
  useEffect(() => {
    let timer = null;
    if (isPlaying && !isDrive) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          const next = prev + 1;
          setProgress((next / duration) * 100);
          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration, playbackSpeed, isDrive]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    setCurrentTime(Math.floor((val / 100) * duration));
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-purple-500/40 shadow-2xl shadow-purple-950/60 aspect-video group select-none">
      
      {/* 1. Video Frame / Drive Embed or Thumbnail */}
      {isDrive && isPlaying ? (
        <iframe
          src={driveEmbedUrl}
          title={lesson.title}
          allow="autoplay; fullscreen"
          className="w-full h-full border-0 absolute inset-0 z-10"
        />
      ) : (
        <div className="absolute inset-0 z-0">
          <img
            src={lesson.videoThumbnail || lesson.thumbnail}
            alt={lesson.title}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isPlaying ? 'brightness-90' : 'brightness-60 group-hover:scale-105'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
        </div>
      )}

      {/* 2. Top Bar (Overlay) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
          <Tv className="w-3.5 h-3.5 text-purple-400" />
          <span>Magic Classroom HD • 1080p</span>
          {isDrive && (
            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1 bg-cyan-500/20 px-1.5 py-0.2 rounded border border-cyan-500/30">
              <HardDrive className="w-2.5 h-2.5" /> Drive Stream
            </span>
          )}
        </div>

        {captionMode !== 'off' && !isDrive && (
          <div className="px-3 py-1 rounded-full bg-purple-600/80 backdrop-blur-md text-white text-xs font-bold border border-purple-400/40 shadow-md">
            Legendas: {captionMode === 'en' ? '🇺🇸 Inglês' : '🇧🇷 Português'}
          </div>
        )}
      </div>

      {/* 3. Center Big Play Button (When Paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/20"
          >
            <Play className="w-8 h-8 fill-white ml-1 text-white" />
          </button>
          <span className="text-sm font-bold text-white bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            ▶ Assistir aula ({lesson.duration})
          </span>
        </div>
      )}

      {/* 4. Active Subtitles / Caption Box in Bottom Center (Only for custom player) */}
      {isPlaying && !isDrive && captionMode !== 'off' && (
        <div className="absolute bottom-20 inset-x-0 z-20 flex justify-center px-6 pointer-events-none">
          <div className="px-5 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-purple-500/30 text-center shadow-2xl max-w-xl">
            {captionMode === 'en' ? (
              <p className="text-sm sm:text-base font-bold text-white">
                "Hello everyone! Welcome to your first English lesson with music."
              </p>
            ) : (
              <p className="text-sm sm:text-base font-bold text-purple-200">
                "Olá a todos! Bem-vindos à sua primeira aula de inglês com música."
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. Bottom Video Controls Bar (Only when not iframe) */}
      {!isDrive && (
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2.5 opacity-95 group-hover:opacity-100 transition-opacity">
          
          {/* Progress Scrubber */}
          <div className="relative flex items-center group/scrubber">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1.5 sm:h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2.5 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white">
            {/* Left Controls: Play, Skip, Timers */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => setCurrentTime((prev) => Math.max(prev - 10, 0))}
                className="text-slate-300 hover:text-white transition-colors"
                title="Voltar 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTime((prev) => Math.min(prev + 10, duration))}
                className="text-slate-300 hover:text-white transition-colors"
                title="Avançar 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="text-slate-300 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
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
                  className="w-14 sm:w-20 h-1 bg-slate-700 rounded-lg accent-purple-500"
                />
              </div>

              <span className="font-mono text-slate-300 hidden sm:inline">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls: CC, Speed, Fullscreen */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              {/* CC Captions Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCaptionMenu(!showCaptionMenu);
                    setShowSpeedMenu(false);
                  }}
                  className={`p-1.5 px-2 rounded-md text-xs font-bold border transition-colors flex items-center gap-1 ${
                    captionMode !== 'off'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-black/50 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Legendas"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>CC</span>
                </button>

                {showCaptionMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-36 bg-[#121526] border border-purple-500/30 rounded-xl p-1.5 shadow-2xl z-50 text-xs space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">Legendas</p>
                    <button
                      onClick={() => { setCaptionMode('en'); setShowCaptionMenu(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${captionMode === 'en' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <span>🇺🇸 Inglês</span>
                      {captionMode === 'en' && '✓'}
                    </button>
                    <button
                      onClick={() => { setCaptionMode('pt'); setShowCaptionMenu(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${captionMode === 'pt' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <span>🇧🇷 Português</span>
                      {captionMode === 'pt' && '✓'}
                    </button>
                    <button
                      onClick={() => { setCaptionMode('off'); setShowCaptionMenu(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${captionMode === 'off' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <span>Desativado</span>
                      {captionMode === 'off' && '✓'}
                    </button>
                  </div>
                )}
              </div>

              {/* Playback Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowCaptionMenu(false);
                  }}
                  className="p-1.5 px-2 rounded-md text-xs font-semibold bg-black/50 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors flex items-center gap-1"
                >
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-28 bg-[#121526] border border-purple-500/30 rounded-xl p-1.5 shadow-2xl z-50 text-xs space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">Velocidade</p>
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }}
                        className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${playbackSpeed === speed ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>{speed}x</span>
                        {playbackSpeed === speed && '✓'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
