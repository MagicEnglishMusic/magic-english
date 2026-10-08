import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  RotateCw,
  Tv, 
  HardDrive
} from 'lucide-react';
import { isGoogleDriveUrl, getDriveVideoUrl } from '../../utils/googleDriveHelper';

export default function VideoPlayer({ lesson, onVideoComplete, isVideoCompleted = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  const videoSrc = lesson?.videoUrl || '';
  const isDrive = isGoogleDriveUrl(videoSrc);
  const driveEmbedUrl = isDrive ? getDriveVideoUrl(videoSrc) : null;

  // Duration calculated from lesson or video element
  const [duration, setDuration] = useState(() => {
    if (lesson?.duration) {
      const parts = String(lesson.duration).split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
    }
    return 600;
  });

  // Reset playback position on lesson change
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, [lesson?.id, lesson?.videoUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);
    if (dur > 0) {
      const pct = (cur / dur) * 100;
      setProgress(pct);
      if (pct >= 90 && onVideoComplete) {
        onVideoComplete();
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onVideoComplete) onVideoComplete();
  };

  const formatTime = (secs) => {
    const s = Math.max(0, Math.floor(secs || 0));
    const mins = Math.floor(s / 60);
    const remainingSecs = Math.floor(s % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const newTime = (val / 100) * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const thumbnailSrc = lesson?.videoThumbnail || lesson?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-3">
      {/* Aspect Video Container */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-purple-500/40 shadow-2xl shadow-purple-950/60 aspect-video group select-none">
        
        {/* 1. Video Frame / Drive Embed / Native HTML5 Video or Thumbnail */}
        {isDrive && isPlaying ? (
          <iframe
            src={driveEmbedUrl}
            title={lesson?.title || 'Aula'}
            allow="autoplay; fullscreen"
            className="w-full h-full border-0 absolute inset-0 z-10"
          />
        ) : videoSrc && isPlaying ? (
          <video
            ref={videoRef}
            src={videoSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={(e) => {
              if (e.target.duration) setDuration(e.target.duration);
            }}
            autoPlay
            className="w-full h-full object-contain absolute inset-0 z-10"
          />
        ) : (
          <div className="absolute inset-0 z-0">
            <img
              src={thumbnailSrc}
              alt={lesson?.title || 'Aula'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';
              }}
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

          {isDrive && isPlaying && !isVideoCompleted && (
            <button
              onClick={() => {
                if (onVideoComplete) onVideoComplete();
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/40 transition-all cursor-pointer border border-emerald-400/40"
            >
              <span>✓ Marquei como assistida</span>
            </button>
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
              ▶ Assistir aula {lesson?.duration ? `(${lesson.duration})` : ''}
            </span>
          </div>
        )}

        {/* 4. Bottom Video Controls Bar (Only for direct video) */}
        {!isDrive && videoSrc && isPlaying && (
          <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2.5 opacity-95 group-hover:opacity-100 transition-opacity">
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
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  className="p-2 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
                  }}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Voltar 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
                  }}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Avançar 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      if (videoRef.current) videoRef.current.muted = nextMute;
                    }} 
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setVolume(v);
                      if (videoRef.current) videoRef.current.volume = v / 100;
                      if (isMuted) setIsMuted(false);
                    }}
                    className="w-14 sm:w-20 h-1 bg-slate-700 rounded-lg accent-purple-500 cursor-pointer"
                  />
                </div>

                <span className="font-mono text-slate-300 hidden sm:inline">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Barra de Conclusão Manual Visível para Vídeos Google Drive */}
      {isDrive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#0e101f] border border-[#1e233b] shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isVideoCompleted ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            <span>
              {isVideoCompleted 
                ? 'Etapa 1 concluída com sucesso!' 
                : 'Após assistir à videoaula, confirme a conclusão abaixo:'}
            </span>
          </div>

          <button
            onClick={() => {
              if (!isVideoCompleted && onVideoComplete) {
                onVideoComplete();
              }
            }}
            disabled={isVideoCompleted}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isVideoCompleted
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isVideoCompleted ? (
              <>
                <span className="text-emerald-400 font-black">✓</span>
                <span>Vídeo da Aula Concluído</span>
              </>
            ) : (
              <>
                <span>✅ Concluir Vídeo da Aula</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
