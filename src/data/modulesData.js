export const currentOngoingLesson = {
  moduleId: "mod-1",
  moduleName: "Módulo 1",
  moduleTitle: "Inglês para Viagens",
  lessonNumber: "Aula 01",
  title: "Hello — Como se apresentar",
  subtitle: "Cumprimentos e primeiras conversas no exterior",
  progress: 0,
  duration: "15 min",
  thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80"
};

export const modulesLibraryData = [
  {
    id: "mod-1",
    moduleNumber: "MÓDULO 1",
    title: "Inglês para Viagens",
    shortDescription: "Aprenda inglês para aeroportos, hotéis e situações reais.",
    fullDescription: "Prepare-se para viajar o mundo com total autoconfiança. Domine o vocabulário e os diálogos práticos para o aeroporto, hotel, restaurante e emergências com auxílio das músicas de fixação.",
    lessonsCount: 8,
    songsCount: 6,
    progress: 0,
    isLocked: false,
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-blue-900/90 via-[#0f192e] to-[#0a0c16]",
    accentColor: "blue",
    lessons: [
      {
        id: "class-viagem-01",
        lessonNumber: "Aula 01",
        title: "No aeroporto — Check-in & Alfândega",
        description: "Aprenda a responder às perguntas da imigração e fazer o check-in sem complicação.",
        duration: "15 min",
        status: "in_progress", // 'completed' | 'in_progress' | 'locked'
        thumbnail: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Travel Songs (Airport Edition)",
        xp: 50
      },
      {
        id: "class-viagem-02",
        lessonNumber: "Aula 02",
        title: "No hotel — Reservas & Check-in",
        description: "Como solicitar seu quarto, tirar dúvidas e pedir serviços na recepção do hotel.",
        duration: "14 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Hotel Magic Hit",
        xp: 50
      },
      {
        id: "class-viagem-03",
        lessonNumber: "Aula 03",
        title: "No restaurante — Fazendo pedidos",
        description: "Faça pedidos, entenda o cardápio e peça a conta com naturalidade e educação.",
        duration: "18 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Restaurant & Food Song",
        xp: 50
      },
      {
        id: "class-viagem-04",
        lessonNumber: "Aula 04",
        title: "Pedindo informações & Direções na rua",
        description: "Como se localizar, perguntar onde fica um ponto turístico ou estação de metrô.",
        duration: "16 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80",
        relatedSong: "City & Directions Song",
        xp: 50
      }
    ]
  },
  {
    id: "mod-2",
    moduleNumber: "MÓDULO 2",
    title: "Inglês com Números",
    shortDescription: "Aprenda números, datas, valores e quantidades.",
    fullDescription: "Domine a contagem, datas, horários, preços e compras em inglês. Entenda como nativos falam números rapidamente e pratique com canções de ritmo acelerado.",
    lessonsCount: 6,
    songsCount: 4,
    progress: 0,
    isLocked: false,
    coverImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-purple-900/90 via-[#160f2e] to-[#0a0c16]",
    accentColor: "purple",
    lessons: [
      {
        id: "class-num-01",
        lessonNumber: "Aula 01",
        title: "Números de 1 a 100 & Pronúncia do 'TH'",
        description: "Contagem básica e regras fáceis para nunca mais errar 'thirteen' e 'thirty'.",
        duration: "16 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Numbers Song (Count with Rhythm)",
        xp: 50
      },
      {
        id: "class-num-02",
        lessonNumber: "Aula 02",
        title: "Preços, Moedas e Compras no Shopping",
        description: "Como entender valores falados rapidamente e perguntar sobre descontos.",
        duration: "18 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Shopping & Money Song",
        xp: 50
      },
      {
        id: "class-num-03",
        lessonNumber: "Aula 03",
        title: "Horários, Agendamentos & Calendário",
        description: "Diga as horas e marque compromissos em inglês com facilidade.",
        duration: "14 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Time & Clock Song",
        xp: 50
      }
    ]
  },
  {
    id: "mod-3",
    moduleNumber: "MÓDULO 3",
    title: "Primeiras Conversas",
    shortDescription: "Aprenda a se apresentar e conversar com pessoas reais.",
    fullDescription: "Quebre a barreira da timidez e converse em qualquer situação social. Aprenda cumprimentos, como falar sobre sua profissão, hobbies e família com fluidez.",
    lessonsCount: 10,
    songsCount: 6,
    progress: 0,
    isLocked: false,
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-indigo-900/90 via-[#13152d] to-[#0a0c16]",
    accentColor: "indigo",
    lessons: [
      {
        id: "class-conv-01",
        lessonNumber: "Aula 01",
        title: "Hello! Como se apresentar em 3 passos",
        description: "Cumprimentos universais e a arte do primeiro contato em inglês.",
        duration: "15 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Hello Song",
        xp: 50
      },
      {
        id: "class-conv-02",
        lessonNumber: "Aula 02",
        title: "Falando sobre quem você é & Onde mora",
        description: "Perguntas de conexão e respostas naturais com o verbo 'To Be' sem decoreba.",
        duration: "17 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Where Are You From?",
        xp: 50
      },
      {
        id: "class-conv-03",
        lessonNumber: "Aula 03",
        title: "Hobbies, Família & Estilo de Vida",
        description: "Aprenda a falar sobre o que você gosta de fazer no tempo livre.",
        duration: "16 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        relatedSong: "My Favorite Things",
        xp: 50
      }
    ]
  },
  {
    id: "mod-4",
    moduleNumber: "MÓDULO 4",
    title: "Inglês para Trabalho",
    shortDescription: "Domine reuniões, apresentações e termos profissionais.",
    fullDescription: "Acelere seu crescimento de carreira falando com autoridade. Aprenda expressões essenciais para reuniões no Teams/Zoom, trocas de e-mails e apresentações com termos modernos.",
    lessonsCount: 12,
    songsCount: 8,
    progress: 0,
    isLocked: false,
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-cyan-900/90 via-[#0e1c2b] to-[#0a0c16]",
    accentColor: "cyan",
    lessons: [
      {
        id: "class-work-01",
        lessonNumber: "Aula 01",
        title: "Abrindo uma Reunião Corporativa no Zoom",
        description: "Frases profissionais para iniciar, cumprimentar os colegas e passar a palavra.",
        duration: "18 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Business Meeting Hit",
        xp: 50
      },
      {
        id: "class-work-02",
        lessonNumber: "Aula 02",
        title: "E-mails Profissionais & Respostas Rápidas",
        description: "Estruturas modernas para redigir e-mails formais e objetivos em minutos.",
        duration: "15 min",
        status: "locked",
        thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
        relatedSong: "Email & Office Terms",
        xp: 50
      }
    ]
  }
];
