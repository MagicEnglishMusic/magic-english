export const communityStats = {
  activeMembers: 1,
  activeChallenge: 'Domine a Primeira Música',
  onlineNow: 1,
  celebrationsToday: 0
};

export const weeklyChallengeData = {
  id: 'chal-week-1',
  title: 'Domine a Travel Song',
  category: '🎯 Desafio Magic da Semana',
  description: 'Complete as 3 etapas essenciais de fixação musical desta semana e desbloqueie o Badge Exclusivo de Viagem!',
  objectives: [
    { id: 'obj-1', label: 'Assistir a Aula 01 (No Aeroporto)', completed: false },
    { id: 'obj-2', label: 'Fazer Prática Musical da música', completed: false },
    { id: 'obj-3', label: 'Treinar pronúncia com nota > 80%', completed: false },
  ],
  xpReward: 300,
  badge: '✈️ Master Traveler',
  participatingCount: 0,
  daysLeft: 7
};

export const songOfTheWeekData = {
  id: 'song-week-1',
  title: 'Travel Time — Airport Edition',
  subtitle: 'Música oficial de fixação da semana',
  category: '🎵 Magic Song da Semana',
  cover: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
  practicingCount: 0,
  bpm: '108 BPM',
  duration: '3:24',
  level: 'Iniciante'
};

export const conversationRoomData = {
  id: 'conv-1',
  title: '💬 Conversation Room',
  topic: 'Introduce Yourself (Apresente-se)',
  promptPhrase: 'Hello, my name is João and I love learning English with music! Where are you from?',
  translationPrompt: 'Olá, meu nome é João e eu amo aprender inglês com música! De onde você é?',
  suggestedAnswers: [
    'Nice to meet you! My name is Maria, from São Paulo.',
    'Hi João! I am Carlos from Rio, let\'s practice together!',
    'Hello! Good to meet you, I\'m enjoying the songs too.'
  ],
  activeParticipants: 0,
  messages: []
};

export const communityGroupsData = [
  {
    id: 'grp-1',
    icon: '🌱',
    name: 'Beginners',
    desc: 'Alunos iniciantes dando os primeiros passos no inglês com vocabulário essencial.',
    members: '1 aluno',
    accentColor: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-300'
  },
  {
    id: 'grp-2',
    icon: '🎵',
    name: 'Music Learners',
    desc: 'Focados em dominar o método musical, ritmo, versos e fixação acelerada.',
    members: '1 aluno',
    accentColor: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-300'
  },
  {
    id: 'grp-3',
    icon: '✈️',
    name: 'Travelers',
    desc: 'Inglês prático para viagens: aeroporto, hotel, alfândega e restaurantes.',
    members: '1 aluno',
    accentColor: 'from-cyan-600/20 to-blue-600/10 border-cyan-500/30 text-cyan-300'
  },
  {
    id: 'grp-4',
    icon: '🎤',
    name: 'Speaking Practice',
    desc: 'Treino intensivo de pronúncia, ritmo vocal e redução de sotaque no Voice Lab.',
    members: '1 aluno',
    accentColor: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-300'
  }
];

export const userImpactData = {
  congratulatedCount: 0,
  participationsCount: 0,
  sharedAchievementsCount: 0,
  reputationBadge: '🌱 Aluno Iniciante'
};

export const weeklyHighlightsData = [];

export const initialCommunityFeed = [];

