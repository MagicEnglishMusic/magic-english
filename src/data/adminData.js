// Initial data model for Magic English Admin Area (FASE 10)
// Prepared with structure for database CRUD operations.

export const ADMIN_STATS = {
  totalStudents: 1248,
  totalModules: 6,
  totalLessons: 32,
  totalSongs: 16,
  totalContentTime: "28h 40min",
  activeStudentsToday: 342,
  completionRate: "78%"
};

export const RECENT_ACTIVITIES = [
  {
    id: "act-1",
    type: "lesson",
    title: "Nova aula criada",
    desc: "Aula 05: At the Restaurant vinculada ao Módulo 2",
    time: "15 min atrás",
    admin: "Admin Geral",
    icon: "🎬"
  },
  {
    id: "act-2",
    type: "song",
    title: "Nova música cadastrada",
    desc: "At The Airport (Distribuição automática em 5 abas)",
    time: "1 hora atrás",
    admin: "Equipe Pedagógica",
    icon: "🎵"
  },
  {
    id: "act-3",
    type: "student",
    title: "Novo aluno matriculado",
    desc: "Mariana Costa (mariana@email.com) assinou VIP Pro",
    time: "2 horas atrás",
    admin: "Sistema",
    icon: "👥"
  },
  {
    id: "act-4",
    type: "material",
    title: "Upload de Material PDF",
    desc: "Resumo_Aula_01_Apresentacoes.pdf adicionado",
    time: "4 horas atrás",
    admin: "Admin Geral",
    icon: "📄"
  }
];

export const INITIAL_ADMIN_STUDENTS = [
  {
    id: "std-1",
    name: "João Silva",
    email: "joao.silva@magicenglish.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    level: "Nível 2 • Music Learner",
    xp: 2450,
    streak: 12,
    lastAccess: "Hoje, 14:30",
    completedModules: 1,
    status: "Ativo VIP"
  },
  {
    id: "std-2",
    name: "Ana Silva",
    email: "ana.silva@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    level: "Nível 4 • Confident Speaker",
    xp: 9850,
    streak: 28,
    lastAccess: "Hoje, 15:10",
    completedModules: 3,
    status: "Ativo VIP"
  },
  {
    id: "std-3",
    name: "Carlos Souza",
    email: "carlos.souza@email.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    level: "Nível 3 • Conversation Builder",
    xp: 6420,
    streak: 19,
    lastAccess: "Ontem, 20:45",
    completedModules: 2,
    status: "Ativo VIP"
  },
  {
    id: "std-4",
    name: "Beatriz Costa",
    email: "beatriz.c@email.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    level: "Nível 2 • Music Learner",
    xp: 2890,
    streak: 14,
    lastAccess: "Hoje, 11:20",
    completedModules: 1,
    status: "Ativo"
  },
  {
    id: "std-5",
    name: "Lucas Mendes",
    email: "lucas.mendes@email.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    level: "Nível 2 • Music Learner",
    xp: 2640,
    streak: 10,
    lastAccess: "Há 2 dias",
    completedModules: 1,
    status: "Ativo"
  }
];

export const INITIAL_ADMIN_MODULES = [
  {
    id: "mod-1",
    order: 1,
    title: "Inglês para Viagens",
    description: "Aprenda inglês para situações reais no aeroporto, hotel, imigração e restaurantes.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
    lessonsCount: 8,
    songsCount: 3,
    status: "Publicado",
    track: "Inglês para Viagens"
  },
  {
    id: "mod-2",
    order: 2,
    title: "Primeiros Passos & Números",
    description: "Domine a base da conversação, números, preços, cores e apresentações formais.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    lessonsCount: 12,
    songsCount: 4,
    status: "Publicado",
    track: "Inglês do Zero"
  },
  {
    id: "mod-3",
    order: 3,
    title: "Primeiras Conversas",
    description: "Cumprimentos, rotina, diálogos naturais e expressões que nativos usam.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    lessonsCount: 10,
    songsCount: 3,
    status: "Publicado",
    track: "Conversação"
  },
  {
    id: "mod-4",
    order: 4,
    title: "Inglês para Trabalho & Negócios",
    description: "Vocabulário profissional, reuniões, e-mails executivos e apresentações.",
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80",
    lessonsCount: 10,
    songsCount: 3,
    status: "Em Breve",
    track: "Inglês para Trabalho"
  }
];

export const INITIAL_ADMIN_LESSONS = [
  {
    id: "les-1",
    module: "Inglês para Viagens",
    moduleId: "mod-1",
    lessonNumber: "Aula 01",
    title: "No Aeroporto — Check-in e Embarque",
    duration: "15 min",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
    relatedSong: "At The Airport",
    objectives: ["Passport control", "Boarding pass", "Gate number", "Carry-on luggage"],
    status: "Publicado"
  },
  {
    id: "les-2",
    module: "Primeiros Passos & Números",
    moduleId: "mod-2",
    lessonNumber: "Aula 01",
    title: "Hello — Como se apresentar",
    duration: "15 min",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Hello Song",
    objectives: ["Hello", "Good morning", "Nice to meet you", "How are you"],
    status: "Publicado"
  },
  {
    id: "les-3",
    module: "Primeiros Passos & Números",
    moduleId: "mod-2",
    lessonNumber: "Aula 02",
    title: "Numbers — Preços e quantidades",
    duration: "18 min",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    relatedSong: "Numbers Song",
    objectives: ["Numbers 1-100", "How much is it?", "Total price", "Credit card"],
    status: "Publicado"
  }
];

export const INITIAL_ADMIN_SONGS = [
  {
    id: "song-hello",
    title: "Hello Song",
    subtitle: "Greetings & First Impressions",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    module: "Primeiros Passos & Números",
    lesson: "Aula 01 — Hello",
    duration: "3:24",
    bpm: "108 BPM",
    lyricsEn: `Hello, hello, good morning my friend!
The sun is up, a new day will begin.
How are you doing on this lovely day?
I'm feeling great, ready to sing and play!
Nice to meet you, welcome to the show.
Sing with the rhythm, let your English grow!`,
    lyricsPt: `Olá, olá, bom dia meu amigo!
O sol nasceu, um novo dia vai começar.
Como você está neste lindo dia?
Estou me sentindo ótimo, pronto para cantar e brincar!
Prazer em conhecer você, bem-vindo ao show.
Cante com o ritmo, deixe seu inglês crescer!`,
    status: "Publicado"
  },
  {
    id: "song-numbers",
    title: "Numbers Song",
    subtitle: "Counting & Prices Made Easy",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    module: "Primeiros Passos & Números",
    lesson: "Aula 02 — Numbers",
    duration: "2:58",
    bpm: "115 BPM",
    lyricsEn: `One, two, three, count along with me.
Four, five, six, easy as can be.
Seven, eight, nine, feeling so divine.
Ten out of ten, let's do it again!`,
    lyricsPt: `Um, dois, três, conte comigo.
Quatro, cinco, seis, fácil como pode ser.
Sete, oito, nove, me sentindo incrível.
Dez de dez, vamos fazer de novo!`,
    status: "Publicado"
  }
];

export const INITIAL_ADMIN_MATERIALS = [
  {
    id: "mat-1",
    name: "Resumo da Aula 01 — Apresentações e Cumprimentos",
    type: "PDF",
    size: "2.4 MB",
    module: "Primeiros Passos",
    lesson: "Aula 01 — Hello",
    downloads: 342,
    status: "Ativo"
  },
  {
    id: "mat-2",
    name: "Guia Fonético da Hello Song",
    type: "PDF",
    size: "1.8 MB",
    module: "Primeiros Passos",
    lesson: "Aula 01 — Hello",
    downloads: 289,
    status: "Ativo"
  },
  {
    id: "mat-3",
    name: "Flashcards de Números e Preços",
    type: "PDF",
    size: "3.1 MB",
    module: "Primeiros Passos",
    lesson: "Aula 02 — Numbers",
    downloads: 195,
    status: "Ativo"
  }
];

export const INITIAL_ADMIN_VOCABULARY = [
  {
    id: "voc-1",
    word: "Hello",
    phonetic: "/həˈloʊ/",
    translation: "Olá",
    song: "Hello Song",
    tip: "Acentue a segunda sílaba com som aberto de 'ou'."
  },
  {
    id: "voc-2",
    word: "Morning",
    phonetic: "/ˈmɔːr.nɪŋ/",
    translation: "Manhã",
    song: "Hello Song",
    tip: "Som nasal suave no final '-ing'."
  },
  {
    id: "voc-3",
    word: "Friend",
    phonetic: "/frɛnd/",
    translation: "Amigo(a)",
    song: "Hello Song",
    tip: "Vogal curta e 'd' final nítido."
  },
  {
    id: "voc-4",
    word: "Airport",
    phonetic: "/ˈer.pɔːrt/",
    translation: "Aeroporto",
    song: "At The Airport",
    tip: "Articule o 'air' prolongado."
  }
];
