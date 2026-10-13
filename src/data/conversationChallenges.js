// Central Pedagogical Daily Conversation Challenges for Magic Conversation (Fase 1)
// Rotates automatically every day based on America/Sao_Paulo calendar date.
// Strict pedagogical fidelity: Uses ONLY vocabulary and structures from course lessons & songs.

export const conversationChallenges = [
  {
    id: "how-are-you",
    theme: "Cumprimentos & Sentimentos",
    title: "Como Você Está?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "How are you?",
    translation: "Como você está?",
    suggestions: [
      "I'm fine.",
      "I'm good.",
      "I'm great!"
    ]
  },
  {
    id: "whats-your-name",
    theme: "Apresentações & Identificação",
    title: "Qual é o Seu Nome?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "What's your name?",
    translation: "Qual é o seu nome?",
    suggestions: [
      "My name is John.",
      "My name is Sarah.",
      "Nice to meet you."
    ]
  },
  {
    id: "nice-to-meet-you",
    theme: "Apresentações & Cortesia",
    title: "Prazer em Conhecer",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Nice to meet you.",
    translation: "Prazer em conhecer você.",
    suggestions: [
      "Nice to meet you too.",
      "Hello!",
      "Good morning!"
    ]
  },
  {
    id: "where-are-you-from",
    theme: "Origem & Nacionalidade",
    title: "De Onde Você É?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Where are you from?",
    translation: "De onde você é?",
    suggestions: [
      "I'm from Brazil.",
      "I'm from the United States.",
      "And you?"
    ]
  },
  {
    id: "are-you-a-student",
    theme: "Ocupações & Estudos",
    title: "Você é Estudante?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Are you a student?",
    translation: "Você é estudante?",
    suggestions: [
      "Yes, I am.",
      "No, I'm not.",
      "I want to learn English."
    ]
  },
  {
    id: "do-you-speak-english",
    theme: "Idioma & Aprendizado",
    title: "Você Fala Inglês?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Do you speak English?",
    translation: "Você fala inglês?",
    suggestions: [
      "Yes, I speak a little English.",
      "I want to learn English.",
      "I want to speak English."
    ]
  },
  {
    id: "can-you-help-me",
    theme: "Cortesia & Ajuda",
    title: "Você Pode me Ajudar?",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Can you help me?",
    translation: "Você pode me ajudar?",
    suggestions: [
      "Of course!",
      "Thank you!",
      "You're welcome!"
    ]
  },
  {
    id: "have-a-nice-day",
    theme: "Despedidas & Bons Desejos",
    title: "Tenha um Bom Dia!",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Have a nice day!",
    translation: "Tenha um bom dia!",
    suggestions: [
      "Thank you!",
      "See you later!",
      "See you tomorrow!"
    ]
  },
  {
    id: "lets-learn-english-together",
    theme: "Convite & Aprendizado",
    title: "Vamos Aprender Juntos",
    lessonRef: "Aula 01 • Vamos aprender inglês juntos",
    phrase: "Let's learn English together!",
    translation: "Vamos aprender inglês juntos!",
    suggestions: [
      "Of course!",
      "I want to speak English.",
      "Thank you!"
    ]
  }
];

/**
 * Returns deterministic challenge for any given date.
 * Rotates smoothly across all challenges based on day of year / days since epoch.
 */
export function getTodayConversationChallenge(date = new Date()) {
  if (!Array.isArray(conversationChallenges) || conversationChallenges.length === 0) {
    return null;
  }
  
  // Calculate deterministic day index based on America/Sao_Paulo calendar date
  const spDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // 'YYYY-MM-DD'
  const [year, month, day] = spDateStr.split('-').map(Number);
  
  // Day of epoch calculation for stable index rotation
  const epochDays = Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24));
  const index = Math.abs(epochDays) % conversationChallenges.length;
  
  return {
    ...conversationChallenges[index],
    dateKey: spDateStr
  };
}
