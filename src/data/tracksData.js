export const tracksData = [
  {
    id: "track-zero",
    title: "Inglês do Zero",
    emoji: "🌱",
    tagline: "Fundamentos & Primeiras Expressões",
    description: "Comece sua jornada aprendendo as palavras e frases mais importantes do inglês cantando estruturas essenciais.",
    fullDescription: "Construa uma base sólida e natural com o método musical. Aprenda cumprimentos, números, cores, rotina e estruturas essenciais sem decorar regras complicadas.",
    lessonsCount: 24,
    songsCount: 12,
    progress: 0,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000&auto=format&fit=crop&q=80",
    gradient: "from-purple-900/80 via-[#141226] to-[#0c0e17]",
    accentColor: "purple",
    modules: [
      {
        id: "mod-1",
        title: "Módulo 1: Primeiros Passos",
        description: "Cumprimentos, números e identificação de objetos",
        lessons: [
          {
            id: "less-1",
            number: "01",
            title: "Hello Song",
            type: "Música & Vocabulário",
            duration: "3:24",
            status: "in_progress", // 'completed' | 'in_progress' | 'locked'
            xp: 50,
            songId: "song-1"
          },
          {
            id: "less-2",
            number: "02",
            title: "Numbers Song",
            type: "Música & Contagem",
            duration: "2:58",
            status: "locked",
            xp: 50,
            songId: "song-2"
          },
          {
            id: "less-3",
            number: "03",
            title: "Colors Song",
            type: "Música & Descrições",
            duration: "3:45",
            status: "locked",
            xp: 50,
            songId: "song-3"
          },
          {
            id: "less-4",
            number: "04",
            title: "Animals Song",
            type: "Música & Expressões",
            duration: "4:12",
            status: "locked",
            xp: 50,
            songId: "song-4"
          }
        ]
      },
      {
        id: "mod-2",
        title: "Módulo 2: Rotina & Vida Cotidiana",
        description: "Present Simple e ações do dia a dia",
        lessons: [
          {
            id: "less-5",
            number: "05",
            title: "Daily Routine",
            type: "Música & Ações",
            duration: "3:15",
            status: "locked",
            xp: 50,
            songId: "cont-2"
          },
          {
            id: "less-6",
            number: "06",
            title: "My Family Song",
            type: "Vocabulário Familiar",
            duration: "3:30",
            status: "locked",
            xp: 50,
            songId: "song-6"
          }
        ]
      }
    ]
  },
  {
    id: "track-travel",
    title: "Inglês para Viagens",
    emoji: "✈️",
    tagline: "Aeroportos, Hotéis & Restaurantes",
    description: "Prepare-se para aeroportos, hotéis e situações reais no exterior sem travar.",
    fullDescription: "Domine todas as situações práticas de uma viagem internacional: alfândega, reservas, compras, pedir direções e resolver emergências.",
    lessonsCount: 18,
    songsCount: 10,
    progress: 0,
    isLocked: true,
    requiredLevel: "Nível 5",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&auto=format&fit=crop&q=80",
    gradient: "from-blue-900/80 via-[#10192e] to-[#0c0e17]",
    accentColor: "blue",
    modules: []
  },
  {
    id: "track-work",
    title: "Inglês para Trabalho",
    emoji: "💼",
    tagline: "Business & Comunicação Corporativa",
    description: "Aprenda inglês para reuniões, apresentações e ambiente profissional com segurança.",
    fullDescription: "Acelere sua carreira aprendendo vocabulário de negócios, como escrever e-mails formais e participar de reuniões sem medo de falar.",
    lessonsCount: 30,
    songsCount: 15,
    progress: 0,
    isLocked: true,
    requiredLevel: "Nível 7",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80",
    gradient: "from-indigo-900/80 via-[#13152c] to-[#0c0e17]",
    accentColor: "indigo",
    modules: []
  },
  {
    id: "track-conversation",
    title: "Conversação",
    emoji: "💬",
    tagline: "Fluência & Entonação Natural",
    description: "Desenvolva confiança para conversar em inglês com o ritmo e musicalidade de nativos.",
    fullDescription: "Conquiste a fluência real através de diálogos musicais dinâmicos, conectivos de fala, gírias comuns e pronúncia conectada.",
    lessonsCount: 40,
    songsCount: 20,
    progress: 0,
    isLocked: true,
    requiredLevel: "Nível 10",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80",
    gradient: "from-violet-900/80 via-[#18112c] to-[#0c0e17]",
    accentColor: "violet",
    modules: []
  }
];

export const userJourneyLevels = [
  { id: 1, name: "Iniciante", emoji: "🌱", status: "completed", desc: "Primeiras palavras e sons" },
  { id: 2, name: "Music Learner", emoji: "🎵", status: "current", desc: "Fixando ritmo e estruturas" },
  { id: 3, name: "Speaker", emoji: "🗣", status: "upcoming", desc: "Conversação fluida e natural" },
  { id: 4, name: "Fluent", emoji: "🌎", status: "locked", desc: "Domínio total e automático" }
];
