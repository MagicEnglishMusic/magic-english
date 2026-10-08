import React, { useEffect, useRef } from 'react';
import { Sparkles, Trophy, CheckCircle2, ArrowRight, X, Heart, Star, Music, Award, Flame, Zap, Crown } from 'lucide-react';

/**
 * Toca um efeito sonoro harmônico de celebração curto (fanfarra/chime) usando Web Audio API.
 * 100% autônomo, sem dependências de arquivos externos e seguro contra bloqueios de autoplay.
 */
function playCelebrationFanfare() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Acorde triunfal ascendente: C5, E5, G5, C6 e E6 cintilante
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.18, vol: 0.15 },
      { freq: 659.25, start: 0.10, dur: 0.20, vol: 0.18 },
      { freq: 783.99, start: 0.20, dur: 0.25, vol: 0.20 },
      { freq: 1046.50, start: 0.32, dur: 0.55, vol: 0.22 },
      { freq: 1318.51, start: 0.36, dur: 0.65, vol: 0.18 }
    ];

    notes.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (_) {
    // Autoplay policy ou ausência de suporte não quebra a interface
  }
}

/**
 * Personagem Ilustrado em SVG celebrando com os braços erguidos e expressão vitoriosa
 */
function CelebratoryCharacter() {
  return (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
      {/* Halo dourado e anéis de vitória pulsantes */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-purple-500/30 to-emerald-500/30 blur-xl animate-pulse" />
      <div className="absolute -top-2 -right-2 text-amber-400 animate-bounce">
        <Sparkles className="w-6 h-6 fill-amber-400" />
      </div>
      <div className="absolute -top-1 -left-2 text-purple-400 animate-pulse">
        <Star className="w-5 h-5 fill-purple-400" />
      </div>
      <div className="absolute bottom-2 -right-3 text-emerald-400 animate-bounce delay-150">
        <Music className="w-5 h-5" />
      </div>

      {/* Ilustração Vetorial de Estudante Vitorioso(a) */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_10px_25px_rgba(168,85,247,0.4)] animate-in zoom-in-90 duration-500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow de fundo */}
        <circle cx="100" cy="100" r="75" fill="url(#bg-glow)" opacity="0.4" />

        {/* Fones de Ouvido Mágicos */}
        <path
          d="M60 92 C60 52 140 52 140 92"
          stroke="#A855F7"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="52" y="85" width="14" height="24" rx="7" fill="#C084FC" />
        <rect x="134" y="85" width="14" height="24" rx="7" fill="#C084FC" />

        {/* Braço Esquerdo Erguido (Vitória) */}
        <path
          d="M75 125 Q50 95 42 65"
          stroke="#FDBA74"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Mão Esquerda aberta/comemorando */}
        <circle cx="40" cy="62" r="8" fill="#FDBA74" />

        {/* Braço Direito Erguido (Vitória) */}
        <path
          d="M125 125 Q150 95 158 65"
          stroke="#FDBA74"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Mão Direita aberta/comemorando */}
        <circle cx="160" cy="62" r="8" fill="#FDBA74" />

        {/* Corpo / Camiseta Magic Purple */}
        <path
          d="M72 130 C72 118 82 112 100 112 C118 112 128 118 128 130 L135 185 C135 190 130 195 125 195 L75 195 C70 195 65 190 65 185 Z"
          fill="url(#shirt-gradient)"
        />
        {/* Estrela no peito */}
        <path
          d="M100 130 L102 135 L107 135 L103 138 L105 143 L100 140 L95 143 L97 138 L93 135 L98 135 Z"
          fill="#FDE047"
        />

        {/* Cabeça / Rosto */}
        <circle cx="100" cy="85" r="28" fill="#FED7AA" />

        {/* Cabelo moderno estilizado */}
        <path
          d="M72 82 C72 60 85 52 100 52 C115 52 128 60 128 82 C120 72 115 72 100 72 C85 72 80 72 72 82 Z"
          fill="#451A03"
        />

        {/* Expressão Facial Alegre (Olhos semicerrados de felicidade + Sorrisão) */}
        {/* Olho Esquerdo */}
        <path d="M88 82 Q92 78 96 82" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
        {/* Olho Direito */}
        <path d="M104 82 Q108 78 112 82" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
        {/* Bochechas coradas */}
        <circle cx="86" cy="89" r="4" fill="#F87171" opacity="0.6" />
        <circle cx="114" cy="89" r="4" fill="#F87171" opacity="0.6" />
        {/* Sorrisão Aberto */}
        <path
          d="M91 91 Q100 104 109 91 Z"
          fill="#991B1B"
        />
        <path
          d="M94 92 Q100 97 106 92"
          fill="#FFFFFF"
        />

        <defs>
          <radialGradient id="bg-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) scale(75)">
            <stop stopColor="#A855F7" />
            <stop offset="1" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shirt-gradient" x1="65" y1="112" x2="135" y2="195" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9333EA" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Componente Global e Reutilizável de Celebração Premium (Confetes + Fanfarra + Personagem + XP)
 */
export default function CompletionCelebration({
  show = false,
  isOpen = false,
  onClose,
  title = "🎉 Parabéns!",
  subtitle = "Você conquistou uma nova etapa no Magic English!",
  description = "",
  xp = 0,
  icon = "⭐",
  bonusText = "",
  badge = null,
  type = "xp",
  ctaText = "Continuar Aprendendo ➔",
  onCtaClick
}) {
  const isVisible = Boolean(show || isOpen);
  const canvasRef = useRef(null);
  const soundPlayedRef = useRef(false);

  // Efeito sonoro único quando a celebração abre
  useEffect(() => {
    if (isVisible && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playCelebrationFanfare();
    }
    if (!isVisible) {
      soundPlayedRef.current = false;
    }
  }, [isVisible]);

  // Handle ESC
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  // Efeito de partículas de confetes caindo pela tela
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Gerar 75 confetes vibrantes com física suave
    const colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#F472B6', '#60A5FA'];
    const particles = Array.from({ length: 75 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 8 - 4,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Categoria dinâmica
  const renderTag = () => {
    switch (type) {
      case 'level_up':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Nível Desbloqueado</span>
          </div>
        );
      case 'badge':
      case 'badge_claim':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Conquista Especial</span>
          </div>
        );
      case 'song_mastery':
      case 'final_mastery':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Maestria Musical</span>
          </div>
        );
      case 'pronunciation':
      case 'pronunciation_complete':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>Pronúncia IA Concluída</span>
          </div>
        );
      case 'lesson_complete':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aula Concluída</span>
          </div>
        );
      case 'challenge':
      case 'daily_challenge':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Desafio Diário Concluído</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evolução Magic English</span>
          </div>
        );
    }
  };

  const displayText = description || subtitle || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Canvas de Confetes cobrindo toda a janela */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Cartão Modal de Celebração Premium */}
      <div className="relative z-20 w-full max-w-lg bg-gradient-to-b from-[#181c32] via-[#121526] to-[#0c0e1a] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 overflow-hidden text-center animate-in zoom-in-95 duration-400">
        
        {/* Glow Superior */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-b from-purple-500/30 via-emerald-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-[#1e2338]/80 text-slate-400 hover:text-white hover:bg-[#282e4a] transition-all cursor-pointer z-30"
            title="Fechar celebração"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Ilustração Animada do Personagem Vitorioso */}
        <div className="mb-3">
          <CelebratoryCharacter />
        </div>

        {/* Tag do Tipo de Conquista */}
        {renderTag()}

        {/* Título Principal */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          {title}
        </h2>

        {/* Subtítulo / Descrição */}
        {displayText && (
          <p className="text-sm sm:text-base text-slate-300 font-medium mt-2 max-w-md mx-auto leading-relaxed">
            {displayText}
          </p>
        )}

        {/* Card Especial de XP */}
        {Number(xp) > 0 && (
          <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-500/40 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/10 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-500/50 flex items-center justify-center text-amber-300 text-xl font-bold">
              {icon ? (typeof icon === 'string' ? <span>{icon}</span> : icon) : <Zap className="w-5 h-5 fill-amber-400" />}
            </div>
            <div className="text-left">
              <span className="text-lg sm:text-xl font-black text-amber-300 tracking-tight block">
                +{xp} ⭐ Magic XP
              </span>
              <p className="text-xs text-slate-300 font-semibold">
                {bonusText || "Adicionado à sua evolução no Magic English!"}
              </p>
            </div>
          </div>
        )}

        {/* Botão de Ação CTA */}
        <div className="mt-5 pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if (onCtaClick) onCtaClick();
              else if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

