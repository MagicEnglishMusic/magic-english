export const communityStats = {
  activeMembers: 12540,
  activeChallenge: 'Domine a Travel Song',
  onlineNow: 342,
  celebrationsToday: 184
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
  participatingCount: 1240,
  daysLeft: 4
};

export const songOfTheWeekData = {
  id: 'song-week-1',
  title: 'Travel Time — Airport Edition',
  subtitle: 'Música oficial de fixação da semana',
  category: '🎵 Magic Song da Semana',
  cover: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
  practicingCount: 2450,
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
  activeParticipants: 89,
  messages: [
    {
      id: 'msg-1',
      author: 'Beatriz Lima',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      level: '🎵 Music Learner',
      content: 'Hello everyone! Nice to meet you all. I am practicing the Airport Song today!',
      time: '12 min atrás',
      likes: 6
    },
    {
      id: 'msg-2',
      author: 'Lucas Rocha',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      level: '💬 Conversation Builder',
      content: 'Hi Beatriz! Good luck with the practice, the lyrics rhythm is awesome.',
      time: '5 min atrás',
      likes: 4
    }
  ]
};

export const communityGroupsData = [
  {
    id: 'grp-1',
    icon: '🌱',
    name: 'Beginners',
    desc: 'Alunos iniciantes dando os primeiros passos no inglês com vocabulário essencial.',
    members: '4.820 alunos',
    accentColor: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-300'
  },
  {
    id: 'grp-2',
    icon: '🎵',
    name: 'Music Learners',
    desc: 'Focados em dominar o método musical, ritmo, versos e fixação acelerada.',
    members: '3.410 alunos',
    accentColor: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-300'
  },
  {
    id: 'grp-3',
    icon: '✈️',
    name: 'Travelers',
    desc: 'Inglês prático para viagens: aeroporto, hotel, alfândega e restaurantes.',
    members: '2.680 alunos',
    accentColor: 'from-cyan-600/20 to-blue-600/10 border-cyan-500/30 text-cyan-300'
  },
  {
    id: 'grp-4',
    icon: '🎤',
    name: 'Speaking Practice',
    desc: 'Treino intensivo de pronúncia, ritmo vocal e redução de sotaque no Voice Lab.',
    members: '1.630 alunos',
    accentColor: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-300'
  }
];

export const userImpactData = {
  congratulatedCount: 0,
  participationsCount: 0,
  sharedAchievementsCount: 0,
  reputationBadge: '🌱 Aluno Iniciante'
};

export const weeklyHighlightsData = [
  {
    category: 'Maior Evolução',
    name: 'João Silva',
    stat: '+650 XP nesta semana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: '🚀 Foguete da Semana'
  },
  {
    category: 'Maior Sequência',
    name: 'Maria Fernandes',
    stat: '45 dias consecutivos 🔥',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: '👑 Mestra do Hábito'
  },
  {
    category: 'Mais Músicas Dominadas',
    name: 'Carlos Eduardo',
    stat: '8 Magic Songs 100%',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: '🎸 Cantor Fluente'
  }
];

export const initialCommunityFeed = [
  {
    id: 'post-1',
    type: 'achievement',
    author: {
      name: 'João Silva',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      level: '🎵 Music Learner • Nível 2'
    },
    message: '🎉 João dominou sua primeira Magic Song!',
    badgeTitle: 'Primeira Música Dominada',
    badgeIcon: '🎵',
    xpAwarded: 50,
    time: 'Há 15 minutos',
    claps: 18,
    isClapped: false
  },
  {
    id: 'post-2',
    type: 'module_completed',
    author: {
      name: 'Maria Fernandes',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      level: '💬 Conversation Builder • Nível 3'
    },
    message: '✈️ Concluiu o módulo oficial: Inglês para Viagens!',
    badgeTitle: 'Módulo 01 Concluído',
    badgeIcon: '🏆',
    xpAwarded: 500,
    time: 'Há 1 hora',
    claps: 32,
    isClapped: false
  },
  {
    id: 'post-3',
    type: 'streak',
    author: {
      name: 'Carlos Eduardo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      level: '🎤 Fluency Singer • Nível 4'
    },
    message: '🔥 Carlos completou 30 dias seguidos estudando sem interrupção!',
    badgeTitle: 'Hábito de Aço (30 Dias)',
    badgeIcon: '🔥',
    xpAwarded: 150,
    time: 'Há 3 horas',
    claps: 45,
    isClapped: true
  },
  {
    id: 'post-4',
    type: 'achievement',
    author: {
      name: 'Ana Paula Souza',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      level: '🌱 First Steps • Nível 1'
    },
    message: '🎤 Acabou de fazer o primeiro treino no Voice Lab de Pronúncia com 95% de precisão!',
    badgeTitle: 'Voz Afiada',
    badgeIcon: '🎤',
    xpAwarded: 30,
    time: 'Há 4 horas',
    claps: 27,
    isClapped: false
  }
];
