export const travelSongMethodData = {
  id: "song-travel-01",
  title: "Travel Songs (Airport & Hotel Edition)",
  module: "Módulo 1 — Inglês para Viagens",
  duration: "3:24",
  bpm: "105 BPM",
  image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
  methodSteps: [
    { number: 1, name: "Ouvir e Acompanhar", icon: "Headphones", desc: "Inglês e Português sincronizados" },
    { number: 2, name: "Tradução Reversa", icon: "Brain", desc: "Recupere o inglês a partir do significado" },
    { number: 3, name: "Cantar Junto", icon: "Mic", desc: "Acompanhe no ritmo da música" },
    { number: 4, name: "Cantar Sem Apoio", icon: "Sparkles", desc: "Desafio final de memorização" }
  ],
  studyVerses: [
    {
      id: 1,
      en: "I need help with my flight.",
      pt: "Eu preciso de ajuda com meu voo.",
      hint: "I need help = Eu preciso de ajuda",
      audioSpeed: 0.85
    },
    {
      id: 2,
      en: "Where is the airport gate?",
      pt: "Onde fica o portão de embarque?",
      hint: "Where is = Onde fica / Onde está",
      audioSpeed: 0.85
    },
    {
      id: 3,
      en: "Here is my passport and ticket.",
      pt: "Aqui está meu passaporte e passagem.",
      hint: "Here is = Aqui está",
      audioSpeed: 0.85
    },
    {
      id: 4,
      en: "What time is boarding?",
      pt: "A que horas é o embarque?",
      hint: "What time is = A que horas é",
      audioSpeed: 0.85
    },
    {
      id: 5,
      en: "I would like to check in my luggage.",
      pt: "Eu gostaria de despachar minha bagagem.",
      hint: "I would like to = Eu gostaria de",
      audioSpeed: 0.85
    }
  ],
  reverseExercises: [
    {
      id: "rev-1",
      pt: "Eu preciso de ajuda.",
      expectedEn: "I need help",
      acceptableEn: ["i need help", "i need help."],
      options: ["I need help", "I want sleep", "Where is help", "I am happy"],
      hint: "Comece com 'I' (Eu) e use o verbo 'need' (precisar)."
    },
    {
      id: "rev-2",
      pt: "Onde fica o aeroporto?",
      expectedEn: "Where is the airport?",
      acceptableEn: ["where is the airport", "where is the airport?"],
      options: ["Where is the airport?", "How is the airport?", "Here is the airport", "What is airport?"],
      hint: "Lembre-se da pergunta 'Where is...' para localização."
    },
    {
      id: "rev-3",
      pt: "Aqui está meu passaporte.",
      expectedEn: "Here is my passport.",
      acceptableEn: ["here is my passport", "here is my passport."],
      options: ["Here is my passport.", "This is passport.", "I have ticket.", "Where is passport?"],
      hint: "Use 'Here is' para entregar documentos."
    },
    {
      id: "rev-4",
      pt: "A que horas é o embarque?",
      expectedEn: "What time is boarding?",
      acceptableEn: ["what time is boarding", "what time is boarding?"],
      options: ["What time is boarding?", "When is flight?", "How much is boarding?", "Where is time?"],
      hint: "Use 'What time is...' para saber horários específicos."
    }
  ],
  challengeVerses: [
    {
      id: "chal-1",
      pt: "Eu preciso de ajuda com meu voo.",
      targetEn: "I need help with my flight."
    },
    {
      id: "chal-2",
      pt: "Onde fica o portão de embarque?",
      targetEn: "Where is the airport gate?"
    },
    {
      id: "chal-3",
      pt: "Aqui está meu passaporte e passagem.",
      targetEn: "Here is my passport and ticket."
    }
  ]
};
