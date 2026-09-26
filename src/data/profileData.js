// Data model for Student Profile (Fase 7)
// Prepared with data for future Magic Ranking integration.

export const studentProfileData = {
  name: "João Silva",
  email: "joao.silva@magicenglish.com",
  role: "Membro VIP Pro",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  joinDate: "Membro desde Agosto de 2026",
  motto: "Continue evoluindo no seu ritmo.",
  
  // Stats
  stats: {
    streakDays: 12,
    completedLessons: 24,
    masteredSongs: 8,
    unlockedBadges: 6,
    totalStudyTime: "14h 30min",
    accuracyRate: "94%"
  },

  // Future Magic Ranking Preparation
  rankingInfo: {
    league: "Liga Diamante",
    tier: "Top 5%",
    currentRank: 4,
    totalLeagueUsers: 50,
    weeklyPoints: 680,
    seasonEndsIn: "3 dias"
  },

  // Journey Steps (Levels 1 to 6)
  journeySteps: [
    {
      level: 1,
      name: "First Steps",
      icon: "🌱",
      status: "completed", // 'completed' | 'current' | 'next' | 'future'
      statusLabel: "Concluído",
      tag: "Base Sólida",
      description: "Primeiros passos e vocabulário elementar."
    },
    {
      level: 2,
      name: "Music Learner",
      icon: "🎵",
      status: "current",
      statusLabel: "Atual",
      tag: "Em Progresso",
      description: "Aprendendo estruturas essenciais através do ritmo."
    },
    {
      level: 3,
      name: "Conversation Builder",
      icon: "💬",
      status: "next",
      statusLabel: "Próximo",
      tag: "3.000 XP",
      description: "Construindo suas primeiras conversas com segurança."
    },
    {
      level: 4,
      name: "Confident Speaker",
      icon: "🎤",
      status: "future",
      statusLabel: "Futuro",
      tag: "6.000 XP",
      description: "Falando com ritmo natural e sem medo de errar."
    },
    {
      level: 5,
      name: "English Explorer",
      icon: "🌎",
      status: "future",
      statusLabel: "Futuro",
      tag: "10.000 XP",
      description: "Preparado para viagens e situações profissionais reais."
    },
    {
      level: 6,
      name: "Magic Fluent",
      icon: "👑",
      status: "future",
      statusLabel: "Futuro",
      tag: "15.000 XP",
      description: "Domínio avançado e espontaneidade no idioma."
    }
  ],

  // Personal Music Collection
  musicCollection: [
    {
      id: "song-hello",
      title: "Hello Song",
      subtitle: "Greetings & First Impressions",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      status: "mastered", // 'mastered' | 'practicing' | 'not_started'
      statusLabel: "Dominada",
      progress: 100,
      bpm: "108 BPM",
      duration: "3:24"
    },
    {
      id: "song-numbers",
      title: "Numbers Song",
      subtitle: "Counting & Prices Made Easy",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
      status: "mastered",
      statusLabel: "Dominada",
      progress: 100,
      bpm: "115 BPM",
      duration: "2:58"
    },
    {
      id: "song-travel",
      title: "Travel Song",
      subtitle: "At The Airport & Boarding",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
      status: "practicing",
      statusLabel: "Em progresso",
      progress: 60,
      bpm: "110 BPM",
      duration: "3:40"
    },
    {
      id: "song-hotel",
      title: "Hotel Song",
      subtitle: "Check-in & Room Requests",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
      status: "not_started",
      statusLabel: "Não iniciada",
      progress: 0,
      bpm: "105 BPM",
      duration: "3:15"
    }
  ],

  // Course Modules Progress
  modulesProgress: [
    {
      id: "mod-1",
      number: "Módulo 01",
      title: "Inglês do Zero",
      icon: "🌱",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
      progress: 40,
      lessonsCount: "12 aulas",
      songsCount: "4 músicas",
      status: "in_progress",
      statusLabel: "40% concluído"
    },
    {
      id: "mod-2",
      number: "Módulo 02",
      title: "Inglês para Viagens",
      icon: "✈️",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
      progress: 20,
      lessonsCount: "8 aulas",
      songsCount: "3 músicas",
      status: "in_progress",
      statusLabel: "20% concluído"
    },
    {
      id: "mod-3",
      number: "Módulo 03",
      title: "Inglês para Trabalho",
      icon: "💼",
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80",
      progress: 0,
      lessonsCount: "10 aulas",
      songsCount: "3 músicas",
      status: "locked",
      statusLabel: "Bloqueado"
    }
  ],

  // Activity Timeline History
  activityTimeline: [
    {
      id: "act-1",
      time: "Hoje",
      timestamp: "14:30",
      type: "class",
      icon: "🎬",
      title: "Aula concluída",
      subtitle: "Aula 01: Hello! Como se apresentar",
      xp: "+30 XP",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30"
    },
    {
      id: "act-2",
      time: "Ontem",
      timestamp: "18:45",
      type: "song",
      icon: "🎵",
      title: "Magic Song dominada",
      subtitle: "Hello Song (5/5 etapas concluídas)",
      xp: "+100 XP",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30"
    },
    {
      id: "act-3",
      time: "Há 3 dias",
      timestamp: "11:20",
      type: "pronunciation",
      icon: "🎤",
      title: "Pronúncia treinada",
      subtitle: "Voice Lab: 96% de precisão vocal",
      xp: "+30 XP",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30"
    },
    {
      id: "act-4",
      time: "Há 4 dias",
      timestamp: "16:10",
      type: "practice",
      icon: "🧠",
      title: "Prática musical finalizada",
      subtitle: "Tradução reversa completa de 5 versos",
      xp: "+50 XP",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30"
    }
  ]
};
