// Central Pedagogical Daily Conversation Challenges for Magic Conversation (Fase 1)
// Rotates automatically every day based on America/Sao_Paulo calendar date.
// Strict pedagogical fidelity: Uses ONLY vocabulary and structures from course lessons & songs.

export const conversationChallenges = [
  {
    id: "introduce-yourself",
    theme: "Apresentações & Cumprimentos",
    title: "Apresente-se em Inglês",
    phrase: "Hello! My name is João. Nice to meet you! Where are you from?",
    translation: "Olá! Meu nome é João. Prazer em conhecer você! De onde você é?",
    suggestions: [
      "Hello! My name is Maria. I am from Brazil, nice to meet you!",
      "Good morning! I am from São Paulo. Nice to meet you too.",
      "Hi João! Nice to meet you!"
    ]
  },
  {
    id: "feelings-and-greetings",
    theme: "Cumprimentos & Sentimentos",
    title: "Como Você Está Hoje?",
    phrase: "Good morning my friend! How are you doing on this lovely day?",
    translation: "Bom dia meu amigo! Como você está neste lindo dia?",
    suggestions: [
      "I'm feeling great, ready to sing and play!",
      "Hello! I am doing well, ready for a new day.",
      "Good morning! I am very happy today."
    ]
  },
  {
    id: "numbers-and-prices",
    theme: "Números & Preços",
    title: "Contando Números & Preços",
    phrase: "How much does it cost at the store? Can you count for me?",
    translation: "Quanto custa na loja? Você pode contar para mim?",
    suggestions: [
      "It is twenty dollars, nothing more.",
      "One, two, three, let's count together!",
      "It costs ten dollars at the store."
    ]
  },
  {
    id: "airport-and-travel",
    theme: "Inglês para Viagens",
    title: "No Aeroporto — Check-in",
    phrase: "Good morning! Do you have your passport and ticket ready for your flight?",
    translation: "Bom dia! Você está com seu passaporte e passagem prontos para o voo?",
    suggestions: [
      "Yes, here is my passport and ticket. Thank you!",
      "Yes, I am ready for my flight to New York.",
      "Good morning! Everything is ready for the trip."
    ]
  },
  {
    id: "hotel-and-checkin",
    theme: "No Hotel — Reservas",
    title: "No Hotel — Recepção",
    phrase: "Welcome to the hotel! Do you have a reservation for tonight?",
    translation: "Bem-vindo ao hotel! Você tem uma reserva para esta noite?",
    suggestions: [
      "Yes, I have a reservation under my name.",
      "Good evening! Here is my reservation for two days.",
      "Yes, thank you! What time is breakfast in the morning?"
    ]
  },
  {
    id: "restaurant-and-food",
    theme: "No Restaurante",
    title: "Fazendo Pedidos no Restaurante",
    phrase: "Good evening! What would you like to order for dinner?",
    translation: "Boa noite! O que você gostaria de pedir para o jantar?",
    suggestions: [
      "I would like water and pasta, please.",
      "A delicious pizza and juice, thank you!",
      "Can I see the food menu, please?"
    ]
  },
  {
    id: "city-and-directions",
    theme: "Direções & Cidade",
    title: "Pedindo Informações na Rua",
    phrase: "Excuse me, where is the nearest station or park?",
    translation: "Com licença, onde fica a estação ou parque mais próximo?",
    suggestions: [
      "Go straight and turn left at the corner.",
      "The station is near the central park, straight ahead.",
      "It is just two blocks away, thank you!"
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
