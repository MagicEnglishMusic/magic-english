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
    streakDays: 0,
    completedLessons: 0,
    masteredSongs: 0,
    unlockedBadges: 0,
    totalStudyTime: "0 min",
    accuracyRate: "--"
  },

  // Future Magic Ranking Preparation
  rankingInfo: {
    league: "Liga Bronze",
    tier: "Iniciante",
    currentRank: 99,
    totalLeagueUsers: 50,
    weeklyPoints: 0,
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
      status: "not_started",
      statusLabel: "Não iniciada",
      progress: 0,
      bpm: "108 BPM",
      duration: "3:24"
    },
    {
      id: "song-numbers",
      title: "Numbers Song",
      subtitle: "Counting & Prices Made Easy",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
      status: "not_started",
      statusLabel: "Não iniciada",
      progress: 0,
      bpm: "115 BPM",
      duration: "2:58"
    },
    {
      id: "song-travel",
      title: "Travel Song",
      subtitle: "At The Airport & Boarding",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
      status: "not_started",
      statusLabel: "Não iniciada",
      progress: 0,
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
      progress: 0,
      lessonsCount: "12 aulas",
      songsCount: "4 músicas",
      status: "in_progress",
      statusLabel: "0% concluído"
    },
    {
      id: "mod-2",
      number: "Módulo 02",
      title: "Inglês para Viagens",
      icon: "✈️",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
      progress: 0,
      lessonsCount: "8 aulas",
      songsCount: "3 músicas",
      status: "locked",
      statusLabel: "Bloqueado"
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
  activityTimeline: []
};
