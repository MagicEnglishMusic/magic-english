export const classroomLessonData = {
  id: "class-01",
  lessonNumber: "Aula 01",
  title: "Hello! Como se apresentar",
  module: "Primeiros Passos",
  duration: "15 minutos",
  level: "Iniciante",
  videoThumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&auto=format&fit=crop&q=80",
  description: "Nesta aula você aprenderá as primeiras formas de cumprimentar pessoas em inglês e dominará a diferença entre cumprimentos formais e informais no dia a dia.",
  learningGoals: [
    "Hello (Olá formal e universal)",
    "Hi / Hey (Cumprimentos casuais entre amigos)",
    "Good morning / Good afternoon (Saudações por horário)",
    "How are you? / How's it going? (Como perguntar como a pessoa está)"
  ],
  videoChapters: [
    { time: "00:00", title: "Introdução & Bem-vindo ao Magic English" },
    { time: "03:20", title: "Cumprimentos Formais vs. Informais" },
    { time: "07:45", title: "Perguntando 'Como você está?' com naturalidade" },
    { time: "11:10", title: "Conectando o aprendizado com a música Hello Song" },
    { time: "14:15", title: "Resumo & Próximos Passos" }
  ],
  
  // Magic Song de Fixação com Timestamps para Karaokê Sincronizado
  relatedSong: {
    id: "song-1",
    title: "Hello Song",
    subtitle: "Greetings & First Impressions",
    duration: "3:24",
    durationSeconds: 204,
    bpm: "108 BPM",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    lyricsTimestamps: [
      {
        id: 1,
        startTime: 0,
        endTime: 4,
        en: "Hello, hello, good morning my friend!",
        pt: "Olá, olá, bom dia meu amigo!",
        hint: "Cumprimento matinal universal"
      },
      {
        id: 2,
        startTime: 4,
        endTime: 9,
        en: "The sun is up, a new day will begin.",
        pt: "O sol nasceu, um novo dia vai começar.",
        hint: "'Sun is up' = o dia amanheceu"
      },
      {
        id: 3,
        startTime: 9,
        endTime: 14,
        en: "How are you doing on this lovely day?",
        pt: "Como você está neste lindo dia?",
        hint: "'How are you doing?' = como você está?"
      },
      {
        id: 4,
        startTime: 14,
        endTime: 19,
        en: "I'm feeling great, ready to sing and play!",
        pt: "Estou me sentindo ótimo, pronto para cantar e brincar!",
        hint: "'Ready to...' = pronto para"
      },
      {
        id: 5,
        startTime: 19,
        endTime: 24,
        en: "Nice to meet you, welcome to the show.",
        pt: "Prazer em conhecer você, bem-vindo ao show.",
        hint: "'Nice to meet you' = prazer em te conhecer"
      },
      {
        id: 6,
        startTime: 24,
        endTime: 30,
        en: "Sing with the rhythm, let your English grow!",
        pt: "Cante com o ritmo, deixe seu inglês crescer!",
        hint: "'Let it grow' = deixe crescer"
      }
    ]
  },

  // Biblioteca de Arquivos para Download da Aula (Aba Material)
  downloadableFiles: [
    {
      id: "doc-1",
      name: "Resumo da Aula — Cumprimentos & Apresentações.pdf",
      type: "PDF da Aula",
      size: "2.4 MB",
      pages: "6 páginas",
      downloadUrl: "#"
    },
    {
      id: "doc-2",
      name: "Vocabulário Complementar & Tabela Fonética.pdf",
      type: "Guia de Vocabulário",
      size: "1.8 MB",
      pages: "4 páginas",
      downloadUrl: "#"
    },
    {
      id: "doc-3",
      name: "Letra da Música & Tradução Comentada (Hello Song).pdf",
      type: "E-book Musical",
      size: "3.2 MB",
      pages: "8 páginas",
      downloadUrl: "#"
    },
    {
      id: "doc-4",
      name: "Material Extra — Caderno de Fixação & Anotações.pdf",
      type: "Workbook Extra",
      size: "4.5 MB",
      pages: "10 páginas",
      downloadUrl: "#"
    }
  ],

  // Extraído automaticamente da letra da música para Pronúncia IA
  extractedPronunciation: [
    { word: "HELLO", meaning: "Olá", phonetic: "/həˈloʊ/", tip: "Ênfase na segunda sílaba: he-LLOU", score: 96 },
    { word: "GOOD MORNING", meaning: "Bom dia", phonetic: "/ɡʊd ˈmɔːr.nɪŋ/", tip: "O 'r' deve soar suave e enrolado", score: 94 },
    { word: "NICE TO MEET YOU", meaning: "Prazer em conhecer você", phonetic: "/naɪs tuː miːt juː/", tip: "Fale conectado: 'naistumítchu'", score: 98 },
    { word: "FRIEND", meaning: "Amigo(a)", phonetic: "/frend/", tip: "Som de 'e' curto, não pronuncie o 'i'", score: 95 }
  ],

  nextLesson: {
    number: "Aula 02",
    title: "Numbers — Aprenda os números em inglês",
    duration: "18 minutos",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
  }
};
