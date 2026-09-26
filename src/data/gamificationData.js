// Central Gamification Data Model & Configuration
// Single Source of Truth for XP values, levels, badges, streaks, and song mastery.

export const XP_REWARDS = {
  WATCH_LESSON: 30,             // 🎬 Assistir uma aula
  COMPLETE_MAGIC_SONG: 50,      // 🎵 Completar uma Magic Song
  COMPLETE_MUSICAL_PRACTICE: 50,// 🧠 Completar Prática Musical
  COMPLETE_PRONUNCIATION: 30,   // 🎤 Completar treino de pronúncia
  COMPLETE_LESSON: 100,         // 📚 Concluir uma aula
  COMPLETE_MODULE: 500,         // 🏆 Concluir um módulo
  COMPLETE_TRACK: 1000,         // 🌎 Completar uma trilha
  MASTER_SONG: 100,             // 🎉 Dominar uma música
  DAILY_CHALLENGE_DEFAULT: 30   // 🎯 Desafio diário
};

export const LEVELS_CONFIG = [
  {
    level: 1,
    title: "First Steps",
    icon: "🌱",
    subtitle: "Primeiros passos no inglês.",
    minXp: 0,
    maxXp: 1000,
    color: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400"
  },
  {
    level: 2,
    title: "Music Learner",
    icon: "🎵",
    subtitle: "Aprendendo através do ritmo.",
    minXp: 1000,
    maxXp: 3000,
    color: "from-purple-500 via-indigo-500 to-blue-500",
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-purple-400"
  },
  {
    level: 3,
    title: "Conversation Builder",
    icon: "💬",
    subtitle: "Construindo suas primeiras conversas.",
    minXp: 3000,
    maxXp: 6000,
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400"
  },
  {
    level: 4,
    title: "Confident Speaker",
    icon: "🎤",
    subtitle: "Falando com mais confiança.",
    minXp: 6000,
    maxXp: 10000,
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400"
  },
  {
    level: 5,
    title: "English Explorer",
    icon: "🌎",
    subtitle: "Preparado para situações reais.",
    minXp: 10000,
    maxXp: 15000,
    color: "from-cyan-500 to-teal-400",
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400"
  },
  {
    level: 6,
    title: "Magic Fluent",
    icon: "👑",
    subtitle: "Domínio avançado do idioma.",
    minXp: 15000,
    maxXp: 25000,
    color: "from-yellow-400 via-amber-500 to-purple-600",
    border: "border-yellow-400/50",
    bg: "bg-yellow-400/10",
    text: "text-yellow-300"
  }
];

export const INITIAL_USER_GAMIFICATION = {
  xp: 2450,
  streak: 12,
  nextGoalHint: "Complete mais uma música para subir de nível.",
  weeklyDays: [
    { day: "Seg", date: "22/09", completed: true },
    { day: "Ter", date: "23/09", completed: true },
    { day: "Qua", date: "24/09", completed: true },
    { day: "Qui", date: "25/09", completed: true },
    { day: "Sex", date: "26/09", completed: true, isToday: true },
    { day: "Sáb", date: "27/09", completed: false },
    { day: "Dom", date: "28/09", completed: false }
  ]
};

export const INITIAL_BADGES = [
  {
    id: "badge-first-song",
    title: "Primeira Música",
    icon: "🎧",
    condition: "Completar primeira Magic Song.",
    rewardXp: 50,
    category: "Música",
    unlocked: true,
    unlockedAt: "Ontem",
    progress: { current: 1, total: 1 }
  },
  {
    id: "badge-first-step",
    title: "Primeiro Passo",
    icon: "🎬",
    condition: "Assistir primeira aula.",
    rewardXp: 30,
    category: "Aulas",
    unlocked: true,
    unlockedAt: "3 dias atrás",
    progress: { current: 1, total: 1 }
  },
  {
    id: "badge-perfect-week",
    title: "Semana Perfeita",
    icon: "🔥",
    condition: "Estudar 7 dias seguidos.",
    rewardXp: 100,
    category: "Foco",
    unlocked: true,
    unlockedAt: "Hoje",
    progress: { current: 7, total: 7 }
  },
  {
    id: "badge-voice-evolution",
    title: "Voz em Evolução",
    icon: "🎤",
    condition: "Completar 10 práticas de pronúncia.",
    rewardXp: 150,
    category: "Pronúncia",
    unlocked: false,
    progress: { current: 6, total: 10 }
  },
  {
    id: "badge-music-master",
    title: "Music Master",
    icon: "🎵",
    condition: "Dominar 20 músicas completas.",
    rewardXp: 300,
    category: "Música",
    unlocked: false,
    progress: { current: 3, total: 20 }
  },
  {
    id: "badge-module-complete",
    title: "Módulo Completo",
    icon: "📚",
    condition: "Finalizar um módulo inteiro.",
    rewardXp: 200,
    category: "Módulos",
    unlocked: true,
    unlockedAt: "Semana passada",
    progress: { current: 1, total: 1 }
  },
  {
    id: "badge-traveler-ready",
    title: "Traveler Ready",
    icon: "🌎",
    condition: "Concluir Inglês para Viagens.",
    rewardXp: 500,
    category: "Trilhas",
    unlocked: false,
    progress: { current: 2, total: 8 }
  }
];

export const INITIAL_DAILY_CHALLENGES = [
  {
    id: "daily-1",
    title: "Assistir uma aula em vídeo",
    icon: "🎬",
    rewardXp: 30,
    current: 1,
    target: 1,
    completed: true,
    claimed: false
  },
  {
    id: "daily-2",
    title: "Praticar uma Magic Song",
    icon: "🎵",
    rewardXp: 50,
    current: 1,
    target: 1,
    completed: true,
    claimed: true
  },
  {
    id: "daily-3",
    title: "Treinar pronúncia no Voice Lab",
    icon: "🎤",
    rewardXp: 20,
    current: 0,
    target: 1,
    completed: false,
    claimed: false
  }
];

// Song Mastery Status Constants & Criteria
export const SONG_MASTERY_STATUS = {
  NOT_STARTED: {
    key: "not_started",
    label: "Não iniciada",
    icon: "⚪",
    color: "text-slate-400",
    border: "border-slate-700",
    bg: "bg-slate-800/40"
  },
  LEARNING: {
    key: "learning",
    label: "Em aprendizado",
    icon: "🔵",
    color: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10"
  },
  PRACTICING: {
    key: "practicing",
    label: "Em prática",
    icon: "🟣",
    color: "text-purple-400",
    border: "border-purple-500/40",
    bg: "bg-purple-500/10"
  },
  MASTERED: {
    key: "mastered",
    label: "Dominada",
    icon: "🟢",
    color: "text-emerald-400",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/15"
  }
};

export const SONG_MASTERY_CHECKLIST = [
  { id: "watched_lesson", label: "Assistiu aula relacionada", icon: "🎬" },
  { id: "listened_full", label: "Ouviu música completa", icon: "🎵" },
  { id: "reverse_translation", label: "Fez tradução reversa", icon: "🧠" },
  { id: "sing_along", label: "Cantou junto com ritmo", icon: "🎤" },
  { id: "final_challenge", label: "Passou no desafio final", icon: "🏆" }
];

export const INITIAL_SONG_MASTERY = [
  {
    songId: "song-hello",
    title: "Hello Song",
    subtitle: "Greetings & First Impressions",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    status: "mastered", // 🟢 Dominada
    checklist: {
      watched_lesson: true,
      listened_full: true,
      reverse_translation: true,
      sing_along: true,
      final_challenge: true
    },
    masteredAt: "Hoje"
  },
  {
    songId: "song-numbers",
    title: "Numbers Song",
    subtitle: "Counting & Prices Made Easy",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    status: "practicing", // 🟣 Em prática
    checklist: {
      watched_lesson: true,
      listened_full: true,
      reverse_translation: true,
      sing_along: false,
      final_challenge: false
    }
  },
  {
    songId: "song-colors",
    title: "Colors Song",
    subtitle: "Vivid Descriptions & Synonyms",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    status: "learning", // 🔵 Em aprendizado
    checklist: {
      watched_lesson: true,
      listened_full: true,
      reverse_translation: false,
      sing_along: false,
      final_challenge: false
    }
  },
  {
    songId: "song-airport",
    title: "At The Airport",
    subtitle: "Travel English & Boarding",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
    status: "mastered", // 🟢 Dominada
    checklist: {
      watched_lesson: true,
      listened_full: true,
      reverse_translation: true,
      sing_along: true,
      final_challenge: true
    },
    masteredAt: "3 dias atrás"
  },
  {
    songId: "song-animals",
    title: "Animals Song",
    subtitle: "Nature & Everyday Idioms",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    status: "not_started", // ⚪ Não iniciada
    checklist: {
      watched_lesson: false,
      listened_full: false,
      reverse_translation: false,
      sing_along: false,
      final_challenge: false
    }
  }
];
