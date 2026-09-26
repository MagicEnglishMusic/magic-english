/**
 * ============================================================================
 * SINGLE SOURCE OF TRUTH (SSOT) — CADASTRO ÚNICO DE MÚSICAS & AULAS
 * ============================================================================
 * Toda música cadastrada aqui alimenta automaticamente:
 * 1. Aba Música (Player, Karaokê Sincronizado, Letra e Tradução)
 * 2. Aba Pronúncia (Extração automática de palavras, fonética, áudio e gravação)
 * 3. Aba Prática Musical (Geração automática de tradução reversa de todas as linhas)
 * 4. Aba Material (Coleta automática de PDFs e materiais de apoio)
 * 5. Magic Classroom (Vinculação automática à aula e módulo correspondentes)
 * ============================================================================
 */

export const songsRegistry = [
  {
    id: "song-hello-01",
    title: "Hello Song",
    subtitle: "Greetings & First Impressions",
    level: "Iniciante",
    duration: "3:24",
    durationSeconds: 204,
    bpm: "108 BPM",
    genre: "Pop Acústico",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    audioUrl: "/audio/hello-song.mp3",
    moduleId: "mod-1",
    moduleName: "Módulo 1 — Inglês para Viagens",
    lessonId: "class-01",
    lessonNumber: "Aula 01",
    lessonTitle: "Hello! Como se apresentar",
    
    // Letra com tradução e timestamps (Fonte central que alimenta Karaokê, Prática e Pronúncia)
    lyrics: [
      {
        id: 1,
        startTime: 0,
        endTime: 4,
        en: "Hello, hello, good morning my friend!",
        pt: "Olá, olá, bom dia meu amigo!",
        hint: "Cumprimento matinal amigável e universal",
        keyWord: { word: "HELLO", meaning: "Olá", phonetic: "/həˈloʊ/", tip: "Ênfase na 2ª sílaba: he-LLOU" }
      },
      {
        id: 2,
        startTime: 4,
        endTime: 9,
        en: "The sun is up, a new day will begin.",
        pt: "O sol nasceu, um novo dia vai começar.",
        hint: "'Sun is up' = o dia amanheceu",
        keyWord: { word: "BEGIN", meaning: "Começar / Iniciar", phonetic: "/bɪˈɡɪn/", tip: "Som de 'g' firme e 'in'" }
      },
      {
        id: 3,
        startTime: 9,
        endTime: 14,
        en: "How are you doing on this lovely day?",
        pt: "Como você está neste lindo dia?",
        hint: "'How are you doing?' = como você está?",
        keyWord: { word: "LOVELY", meaning: "Lindo / Encantador", phonetic: "/ˈlʌv.li/", tip: "Pronuncie 'lav-li'" }
      },
      {
        id: 4,
        startTime: 14,
        endTime: 19,
        en: "I'm feeling great, ready to sing and play!",
        pt: "Estou me sentindo ótimo, pronto para cantar e brincar!",
        hint: "'Ready to...' = pronto para",
        keyWord: { word: "FEELING GREAT", meaning: "Sentindo-se ótimo", phonetic: "/ˈfiːlɪŋ ɡreɪt/", tip: "Conecte os dois sons" }
      },
      {
        id: 5,
        startTime: 19,
        endTime: 24,
        en: "Nice to meet you, welcome to the show.",
        pt: "Prazer em conhecer você, bem-vindo ao show.",
        hint: "'Nice to meet you' = prazer em te conhecer",
        keyWord: { word: "NICE TO MEET YOU", meaning: "Prazer em conhecer você", phonetic: "/naɪs tuː miːt juː/", tip: "Fale conectado: 'naistumítchu'" }
      },
      {
        id: 6,
        startTime: 24,
        endTime: 30,
        en: "Sing with the rhythm, let your English grow!",
        pt: "Cante com o ritmo, deixe seu inglês crescer!",
        hint: "'Let it grow' = deixe crescer",
        keyWord: { word: "RHYTHM", meaning: "Ritmo / Musicalidade", phonetic: "/ˈrɪð.əm/", tip: "O 'th' tem som de vibração suave" }
      }
    ],

    // Materiais Complementares (PDFs da aula e música vinculada)
    materials: [
      {
        id: "mat-1",
        name: "Resumo da Aula — Cumprimentos & Apresentações.pdf",
        type: "PDF da Aula",
        size: "2.4 MB",
        pages: "6 páginas",
        downloadUrl: "#"
      },
      {
        id: "mat-2",
        name: "Guia Fonético & Vocabulário da Música Hello Song.pdf",
        type: "Guia de Vocabulário",
        size: "1.8 MB",
        pages: "4 páginas",
        downloadUrl: "#"
      },
      {
        id: "mat-3",
        name: "Letra Completa & Tradução Comentada (E-book).pdf",
        type: "E-book Musical",
        size: "3.2 MB",
        pages: "8 páginas",
        downloadUrl: "#"
      },
      {
        id: "mat-4",
        name: "Caderno de Exercícios Reversos & Fixação.pdf",
        type: "Workbook Extra",
        size: "4.5 MB",
        pages: "10 páginas",
        downloadUrl: "#"
      }
    ]
  },

  {
    id: "song-numbers-02",
    title: "Numbers Song",
    subtitle: "Counting & Prices Made Easy",
    level: "Iniciante",
    duration: "2:58",
    durationSeconds: 178,
    bpm: "112 BPM",
    genre: "Pop Dance",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    audioUrl: "/audio/numbers-song.mp3",
    moduleId: "mod-2",
    moduleName: "Módulo 2 — Inglês com Números",
    lessonId: "class-02",
    lessonNumber: "Aula 02",
    lessonTitle: "Numbers — Preços e quantidades",
    
    lyrics: [
      {
        id: 1,
        startTime: 0,
        endTime: 5,
        en: "One, two, three, let's count for free!",
        pt: "Um, dois, três, vamos contar de graça!",
        hint: "Contagem básica de 1 a 3",
        keyWord: { word: "COUNT", meaning: "Contar", phonetic: "/kaʊnt/", tip: "Som de 'au'" }
      },
      {
        id: 2,
        startTime: 5,
        endTime: 10,
        en: "How much does it cost at the store?",
        pt: "Quanto custa na loja?",
        hint: "'How much does it cost?' = quanto custa?",
        keyWord: { word: "HOW MUCH", meaning: "Quanto custa", phonetic: "/haʊ mʌtʃ/", tip: "Use para saber preços" }
      },
      {
        id: 3,
        startTime: 10,
        endTime: 15,
        en: "It is twenty dollars, nothing more.",
        pt: "São vinte dólares, nada mais.",
        hint: "Twenty = vinte",
        keyWord: { word: "TWENTY", meaning: "Vinte", phonetic: "/ˈtwen.ti/", tip: "Muitos nativos pronunciam 'tueni'" }
      }
    ],

    materials: [
      {
        id: "mat-num-1",
        name: "Tabela Completa de Números & Preços.pdf",
        type: "PDF da Aula",
        size: "2.1 MB",
        pages: "5 páginas",
        downloadUrl: "#"
      }
    ]
  }
];
