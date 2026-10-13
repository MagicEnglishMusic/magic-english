import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  RotateCw, 
  Loader2, 
  AlertCircle, 
  Settings,
  Server,
  Zap,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  isGoogleDriveUrl, 
  VIDEO_STREAM_MODE,
  getVideoStreamMode,
  getDriveVideoStreamUrl, 
  getDriveVideoUrl,
  getDriveVideoProxyUrl
} from '../../utils/googleDriveHelper';

export default function VideoPlayer({ 
  lesson, 
  onVideoComplete, 
  isVideoCompleted = false 
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  // Modo de Streaming Oficial: 'drive' (Padrão, 0 Egress) ou 'proxy' (Fallback Edge Function)
  const [streamMode, setStreamMode] = useState(() => getVideoStreamMode());

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const rawVideoSrc = lesson?.videoUrl || lesson?.video_url || '';
  const isDrive = isGoogleDriveUrl(rawVideoSrc);
  const driveEmbedUrl = isDrive ? getDriveVideoUrl(rawVideoSrc) : null;
  const proxyStreamUrl = isDrive ? getDriveVideoProxyUrl(rawVideoSrc) : rawVideoSrc;

  // Duration calculation
  const [duration, setDuration] = useState(() => {
    if (lesson?.duration) {
      const parts = String(lesson.duration).split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
    }
    return 600;
  });

  // Reset state when lesson changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setHasStarted(false);
    setVideoError(null);
    setRetryCount(0);
    setIsBuffering(false);
    setShowControls(true);
  }, [lesson?.id, rawVideoSrc]);

  // Modo Drive: Auto-tracking de tempo assistido enquanto o aluno assiste à aula no Iframe
  useEffect(() => {
    if (streamMode !== 'drive' || !hasStarted || isVideoCompleted) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (duration > 0) {
          const pct = Math.min(100, (next / duration) * 100);
          setProgress(pct);
          if (pct >= 85 && onVideoComplete) {
            onVideoComplete();
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [streamMode, hasStarted, duration, isVideoCompleted]);

  // Alternância controlada de modo de streaming com persistência
  const handleToggleStreamMode = (targetMode = null) => {
    const nextMode = targetMode || (streamMode === 'drive' ? 'proxy' : 'drive');
    setStreamMode(nextMode);
    try {
      localStorage.setItem('magic_video_stream_mode', nextMode);
    } catch (_) {}
    setVideoError(null);
    setIsBuffering(false);
    if (nextMode === 'drive') {
      setIsPlaying(hasStarted);
    }
  };

  // Controls auto-hide timer during HTML5 playback
  const startHideControlsTimer = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  };

  const handleMouseMoveOrTouch = () => {
    setShowControls(true);
    startHideControlsTimer();
  };

  useEffect(() => {
    if (isPlaying) {
      startHideControlsTimer();
    } else {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // HTML5 Video Event Handlers (Modo Proxy)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);
    if (dur > 0) {
      const pct = (cur / dur) * 100;
      setProgress(pct);
      if (pct >= 85 && onVideoComplete) {
        onVideoComplete();
      }
    }
  };

  const handleLoadedMetadata = (e) => {
    if (e.target.duration && !isNaN(e.target.duration)) {
      setDuration(e.target.duration);
    }
    setIsBuffering(false);
  };

  const handlePlayPause = () => {
    if (streamMode === 'drive') {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch((err) => {
        console.warn('Erro ao reproduzir vídeo no modo proxy:', err);
      });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (onVideoComplete) onVideoComplete();
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const targetTime = (val / 100) * duration;
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const handleSkip = (seconds) => {
    if (!videoRef.current) return;
    const target = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    if (duration > 0) setProgress((target / duration) * 100);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v / 100;
      if (v > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleChangeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleToggleFullscreen = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video && !container) return;

    if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      return;
    }

    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else {
      if (container?.requestFullscreen) {
        container.requestFullscreen();
      } else if (video?.requestFullscreen) {
        video.requestFullscreen();
      }
    }
  };

  const handleVideoError = (e) => {
    console.warn('Erro no streaming via proxy:', e);
    setIsBuffering(false);
    setIsPlaying(false);
    setVideoError('Falha ao carregar streaming via servidor proxy. Recomendamos usar o Modo Direto Google Drive.');
  };

  const handleRetry = (e) => {
    if (e) e.stopPropagation();
    setVideoError(null);
    setIsBuffering(true);
    setRetryCount((prev) => prev + 1);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        setIsBuffering(false);
      }).catch(() => {
        setIsBuffering(false);
      });
    }
  };

  const formatTime = (secs) => {
    const s = Math.max(0, Math.floor(secs || 0));
    const mins = Math.floor(s / 60);
    const remainingSecs = Math.floor(s % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const thumbnailSrc = lesson?.videoThumbnail || lesson?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';

  const isUsingDriveMode = streamMode === 'drive' && isDrive && driveEmbedUrl;

  return (
    <div className="space-y-3">
      {/* 1. Main 16:9 HD Video Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMoveOrTouch}
        onTouchStart={handleMouseMoveOrTouch}
        onClick={(e) => {
          if (e.target.closest('.video-control-interactive')) return;
          if (hasStarted && !isUsingDriveMode) handlePlayPause();
        }}
        className="relative w-full rounded-3xl overflow-hidden bg-black border border-purple-500/40 shadow-2xl shadow-purple-950/60 aspect-video group select-none flex items-center justify-center cursor-pointer"
      >
        
        {/* A. MODO OFICIAL DIRETO: Iframe Nativo do Google Drive (0 BYTES SUPABASE EGRESS) */}
        {isUsingDriveMode && hasStarted && (
          <>
            <iframe
              src={`${driveEmbedUrl}?autoplay=1`}
              title={lesson?.title || 'Aula'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen={true}
              loading="lazy"
              className="w-full h-full border-0 absolute inset-0 z-10 bg-black"
            />

            {/* Máscara de Bloqueio do Ícone Externo do Google Drive (Pop-out / Abrir em nova aba) */}
            <div 
              className="video-control-interactive absolute top-0 right-0 z-20 w-16 sm:w-20 h-14 sm:h-16 pointer-events-auto select-none cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              title="Magic English Player"
              aria-label="Bloqueio de navegação externa"
            >
              {/* Overlay visual combinando com a moldura 16:9 para cobrir visualmente o ícone externo e impedir o clique */}
              <div className="w-full h-full bg-gradient-to-bl from-black via-black/95 to-transparent rounded-tr-3xl pointer-events-auto" />
            </div>
          </>
        )}

        {/* B. MODO FALLBACK / PROXY: HTML5 Video Element via Supabase video-proxy */}
        {!isUsingDriveMode && (
          <video
            ref={videoRef}
            key={`${proxyStreamUrl}-${retryCount}`}
            src={proxyStreamUrl}
            poster={thumbnailSrc}
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onError={handleVideoError}
            className="w-full h-full object-contain absolute inset-0 z-10 bg-black"
          />
        )}

        {/* C. Poster / Thumbnail Overlay antes de iniciar */}
        {!hasStarted && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <img
              src={thumbnailSrc}
              alt={lesson?.title || 'Aula'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>
        )}

        {/* D. Botão Central de Play Grande (Antes de iniciar) */}
        {!hasStarted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="video-control-interactive pointer-events-auto w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/30"
              title="Reproduzir Aula"
            >
              <Play className="w-7 sm:w-8 h-7 sm:h-8 fill-white ml-1 text-white" />
            </button>
            <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
              <span className="inline-block text-xs sm:text-sm font-bold text-white bg-black/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                ▶ Assistir aula {lesson?.duration ? `(${lesson.duration})` : ''}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Google Drive Direto • Custo Zero de Dados</span>
              </span>
            </div>
          </div>
        )}

        {/* E. Buffering Spinner (Modo Proxy) */}
        {isBuffering && isPlaying && !videoError && !isUsingDriveMode && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-xs">
            <div className="p-4 rounded-2xl bg-black/70 border border-purple-500/30 flex items-center gap-3 text-purple-300 text-xs font-bold shadow-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span>Carregando vídeo...</span>
            </div>
          </div>
        )}

        {/* F. Error Banner com Fallback Imediato */}
        {videoError && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="video-control-interactive absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/95 text-center space-y-4 animate-in fade-in duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-white">Falha no Streaming Proxy</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{videoError}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleStreamMode('drive')}
                className="video-control-interactive px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Usar Google Drive Direto (Recomendado)</span>
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="video-control-interactive px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Proxy Novamente</span>
              </button>
            </div>
          </div>
        )}

        {/* G. Controles Customizados HTML5 (Apenas no Modo Proxy) */}
        {!isUsingDriveMode && hasStarted && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`video-control-interactive absolute bottom-0 inset-x-0 z-30 p-3 sm:p-5 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col gap-2 transition-all duration-300 ${
              showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            {/* Scrubber */}
            <div className="relative flex items-center group/scrubber">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 sm:h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2.5 transition-all"
                title="Avançar / Retroceder"
              />
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between text-xs text-white pt-1">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  title={isPlaying ? "Pausar" : "Reproduzir"}
                  className="p-1.5 sm:p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Voltar 10 segundos"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Avançar 10 segundos"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleToggleMute} 
                    title={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-700 rounded-lg accent-purple-500 cursor-pointer"
                  />
                </div>

                <span className="font-mono text-[11px] sm:text-xs text-slate-300 pl-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 rounded-lg bg-[#141728] hover:bg-[#1e233d] border border-slate-700/60 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Velocidade de reprodução"
                  >
                    {playbackRate}x
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-9 right-0 bg-[#0f1224] border border-purple-500/40 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-1 min-w-[70px] animate-in fade-in">
                      {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleChangeSpeed(rate)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                            playbackRate === rate
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. Barra de Status de Modo & Fallback Controlado */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#090b14] border border-purple-500/15 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {streamMode === 'drive' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-300">
                Transmissão: <strong className="text-emerald-400">Google Drive Direto</strong> (0 Egress Supabase)
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-medium text-slate-300">
                Transmissão: <strong className="text-cyan-400">Servidor Proxy</strong> (Supabase Edge Function)
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleToggleStreamMode()}
          className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
          title="Alternar entre modo Direto (Google Drive) e modo Proxy (Servidor)"
        >
          {streamMode === 'drive' ? (
            <>
              <Server className="w-3 h-3" />
              <span>Alternar para Modo Proxy (Servidor)</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Alternar para Modo Google Drive Direto</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Barra de Conclusão Manual (Preserva tracking e callbacks) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0e101f] border border-[#1e233b] shadow-lg">
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
    </div>
  );
}
