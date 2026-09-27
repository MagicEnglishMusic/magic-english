export const userData = {
  name: "Aluno Magic English",
  role: "Membro VIP Pro",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
  streak: 0,
  overallProgress: 0,
  currentLevel: "Nível 1 - First Steps",
  xp: 0,
  nextLevelXp: 500,
  weeklyGoal: { completed: 0, target: 7 },
  motivationalQuote: {
    text: "Video brings the context, music brings the retention. Sing and master your English!",
    author: "Magic English"
  }
};

export const continueLessonsList = [
  {
    id: "class-1",
    lessonNumber: "Aula 01",
    title: "Hello! Como se apresentar",
    category: "Módulo 1: Primeiros Passos",
    progress: 0,
    duration: "15 min",
    totalDuration: "15 min",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Hello Song"
  },
  {
    id: "class-2",
    lessonNumber: "Aula 02",
    title: "Numbers — Preços e quantidades",
    category: "Módulo 1: Primeiros Passos",
    progress: 0,
    duration: "18 min",
    totalDuration: "18 min",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Numbers Song"
  },
  {
    id: "class-3",
    lessonNumber: "Aula 03",
    title: "Colors & Describing Things",
    category: "Módulo 1: Primeiros Passos",
    progress: 0,
    duration: "16 min",
    totalDuration: "16 min",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Colors Song"
  },
  {
    id: "class-4",
    lessonNumber: "Aula 04",
    title: "Daily Routine & Habit Verbs",
    category: "Módulo 2: Rotina & Vida",
    progress: 0,
    duration: "20 min",
    totalDuration: "20 min",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Daily Routine"
  }
];

export const nextLessonsList = [
  {
    id: "next-1",
    lessonNumber: "Aula 02",
    title: "Numbers — Aprenda os números em inglês",
    module: "Primeiros Passos",
    duration: "18 min",
    xp: "+50 XP",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    songFix: "Numbers Song"
  },
  {
    id: "next-2",
    lessonNumber: "Aula 03",
    title: "Colors — Cores e adjetivos essenciais",
    module: "Primeiros Passos",
    duration: "16 min",
    xp: "+50 XP",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80",
    songFix: "Colors Song"
  },
  {
    id: "next-3",
    lessonNumber: "Aula 04",
    title: "Animals & Idioms — Expressões com animais",
    module: "Primeiros Passos",
    duration: "17 min",
    xp: "+50 XP",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    songFix: "Animals Song"
  },
  {
    id: "next-4",
    lessonNumber: "Aula 05",
    title: "Daily Routine — Present Simple na prática",
    module: "Rotina & Vida",
    duration: "20 min",
    xp: "+50 XP",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
    songFix: "Routine Hit"
  }
];

export const magicSongsList = [
  {
    id: "song-1",
    title: "Hello Song",
    subtitle: "Greetings & First Impressions",
    level: "Fixação da Aula 01",
    duration: "3:24",
    plays: "14.2k",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    tags: ["Greetings", "Fluency", "Aula 01"]
  },
  {
    id: "song-2",
    title: "Numbers Song",
    subtitle: "Counting & Prices Made Easy",
    level: "Fixação da Aula 02",
    duration: "2:58",
    plays: "18.9k",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    tags: ["Numbers", "Pronunciation", "Aula 02"]
  },
  {
    id: "song-3",
    title: "Colors Song",
    subtitle: "Vivid Descriptions & Synonyms",
    level: "Fixação da Aula 03",
    duration: "3:45",
    plays: "11.5k",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    tags: ["Colors", "Vocabulary", "Aula 03"]
  },
  {
    id: "song-4",
    title: "Animals Song",
    subtitle: "Nature & Everyday Idioms",
    level: "Fixação da Aula 04",
    duration: "4:12",
    plays: "9.8k",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    tags: ["Idioms", "Animals", "Aula 04"]
  }
];

export const learningTracksList = [
  {
    id: "track-1",
    title: "Inglês do Zero",
    description: "Construa sua base sólida com videoaulas completas e músicas exclusivas de fixação.",
    modules: 12,
    completedModules: 0,
    tag: "Essencial",
    icon: "Sparkles",
    gradient: "from-purple-900/60 via-purple-950/40 to-[#12141e]",
    borderHover: "hover:border-purple-500/50"
  },
  {
    id: "track-2",
    title: "Inglês para Viagens",
    description: "Domine aeroportos, hotéis, restaurantes e situações reais no exterior sem travar.",
    modules: 8,
    completedModules: 0,
    tag: "Prático",
    icon: "Plane",
    gradient: "from-blue-900/60 via-blue-950/40 to-[#12141e]",
    borderHover: "hover:border-blue-500/50"
  },
  {
    id: "track-3",
    title: "Inglês para Trabalho",
    description: "Vocabulário corporativo, reuniões, e-mails e apresentações com autoconfiança.",
    modules: 10,
    completedModules: 0,
    tag: "Carreira",
    icon: "Briefcase",
    gradient: "from-indigo-900/60 via-indigo-950/40 to-[#12141e]",
    borderHover: "hover:border-indigo-500/50"
  },
  {
    id: "track-4",
    title: "Conversação",
    description: "Perca o medo de falar, melhore a entonação e domine o ritmo natural de nativos.",
    modules: 15,
    completedModules: 0,
    tag: "Fluência",
    icon: "MessageCircle",
    gradient: "from-violet-900/60 via-violet-950/40 to-[#12141e]",
    borderHover: "hover:border-violet-500/50"
  }
];

export const achievementsList = [
  {
    id: "ach-1",
    title: "Primeira Aula Concluída",
    description: "Assistiu ao vídeo e praticou a pronúncia",
    icon: "Tv",
    unlocked: false,
    date: "Bloqueado"
  },
  {
    id: "ach-2",
    title: "Ritmo Perfeito",
    description: "100% de precisão na canção da aula",
    icon: "Music",
    unlocked: false,
    date: "Bloqueado"
  },
  {
    id: "ach-3",
    title: "Explorador de Trilhas",
    description: "Finalizou o Módulo 1 com sucesso",
    icon: "Compass",
    unlocked: false,
    date: "Bloqueado"
  },
  {
    id: "ach-4",
    title: "Mestre da Canção",
    description: "Domine 50 músicas completas",
    icon: "Trophy",
    unlocked: false,
    date: "Bloqueado"
  }
];
