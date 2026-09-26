export const defaultSongLesson = {
  id: "song-1",
  title: "Hello Song",
  subtitle: "Greetings & First Impressions",
  level: "Iniciante",
  duration: "3:24",
  genre: "Pop Acústico",
  bpm: "108 BPM",
  image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
  xpReward: 50,
  lyrics: [
    {
      id: 1,
      time: "0:05",
      english: "Hello, hello, good morning my friend!",
      portuguese: "Olá, olá, bom dia meu amigo!",
      notes: "Cumprimento matinal amigável e universal."
    },
    {
      id: 2,
      time: "0:18",
      english: "The sun is up, a new day will begin.",
      portuguese: "O sol nasceu, um novo dia vai começar.",
      notes: "'Sun is up' é uma forma natural de dizer que o dia amanheceu."
    },
    {
      id: 3,
      time: "0:32",
      english: "How are you doing on this lovely day?",
      portuguese: "Como você está neste lindo dia?",
      notes: "'How are you doing?' é muito usado em conversas casuais."
    },
    {
      id: 4,
      time: "0:47",
      english: "I'm feeling great, ready to sing and play!",
      portuguese: "Estou me sentindo ótimo, pronto para cantar e brincar!",
      notes: "'Ready to...' indica prontidão para uma ação."
    },
    {
      id: 5,
      time: "1:02",
      english: "Hello to the world, smile and say hi!",
      portuguese: "Olá para o mundo, sorria e diga oi!",
      notes: "'Say hi' é a expressão mais comum para cumprimentar alguém."
    },
    {
      id: 6,
      time: "1:18",
      english: "Together we learn under the blue sky.",
      portuguese: "Juntos nós aprendemos sob o céu azul.",
      notes: "'Under the blue sky' expressa liberdade e entusiasmo."
    }
  ],
  vocabulary: [
    {
      word: "Hello",
      phonetic: "/həˈloʊ/",
      meaning: "Olá / Alô",
      type: "Interjeição",
      example: "Hello! How have you been?"
    },
    {
      word: "Morning",
      phonetic: "/ˈmɔːr.nɪŋ/",
      meaning: "Manhã",
      type: "Substantivo",
      example: "Good morning! Did you sleep well?"
    },
    {
      word: "Friend",
      phonetic: "/frend/",
      meaning: "Amigo(a)",
      type: "Substantivo",
      example: "She is my best friend."
    },
    {
      word: "Smile",
      phonetic: "/smaɪl/",
      meaning: "Sorrir / Sorriso",
      type: "Verbo / Substantivo",
      example: "Always smile when you greet someone."
    }
  ],
  keyPhrases: [
    {
      phrase: "Good morning!",
      translation: "Bom dia!",
      context: "Usado do amanhecer até as 12:00. Soa educado e caloroso.",
      audioText: "Good morning!"
    },
    {
      phrase: "How are you?",
      translation: "Como você está?",
      context: "A pergunta mais clássica da língua inglesa para abrir qualquer conversa.",
      audioText: "How are you?"
    },
    {
      phrase: "I'm feeling great!",
      translation: "Estou me sentindo ótimo(a)!",
      context: "Resposta positiva e animada para quando alguém perguntar como você está.",
      audioText: "I'm feeling great!"
    }
  ],
  challenge: {
    question: "Complete a letra da música:",
    prompt: "Hello, hello, good _______ my friend!",
    options: ["morning", "night", "goodbye", "sleep"],
    correctAnswer: "morning",
    explanation: "Na canção, 'Good morning' é usado para dar as boas-vindas ao novo dia!"
  }
};
