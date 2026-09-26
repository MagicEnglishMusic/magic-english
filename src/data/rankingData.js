// Data model for Magic Ranking (Fase 8)
// Prepared with structure for weekly, monthly, all-time rankings, leagues, and special categories.

export const LEAGUES_LIST = [
  {
    id: "league-bronze",
    name: "Liga Bronze",
    icon: "🌱",
    subtitle: "Iniciantes",
    description: "Para quem deu os primeiros passos no inglês.",
    minXp: 0,
    color: "from-amber-700/30 to-amber-900/30",
    border: "border-amber-700/40",
    textColor: "text-amber-500",
    isCurrent: false
  },
  {
    id: "league-silver",
    name: "Liga Prata",
    icon: "🥈",
    subtitle: "Alunos em evolução",
    description: "Para quem mantém ritmo constante de estudo.",
    minXp: 1500,
    color: "from-slate-400/20 to-slate-600/20",
    border: "border-slate-400/40",
    textColor: "text-slate-300",
    isCurrent: false
  },
  {
    id: "league-gold",
    name: "Liga Ouro",
    icon: "🥇",
    subtitle: "Alunos consistentes",
    description: "Para quem pratica músicas e vídeos toda semana.",
    minXp: 4000,
    color: "from-yellow-500/20 to-amber-600/20",
    border: "border-yellow-500/40",
    textColor: "text-yellow-400",
    isCurrent: false
  },
  {
    id: "league-diamond",
    name: "Liga Diamante",
    icon: "💎",
    subtitle: "Alunos avançados",
    description: "Comunidade com alto nível de dedicação e retenção.",
    minXp: 8000,
    color: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/50",
    textColor: "text-cyan-300",
    isCurrent: true
  },
  {
    id: "league-magic",
    name: "Liga Magic",
    icon: "👑",
    subtitle: "Elite Magic English",
    description: "O mais alto patamar de fluência e consistência.",
    minXp: 15000,
    color: "from-purple-500/30 via-indigo-500/20 to-amber-500/30",
    border: "border-purple-500/50",
    textColor: "text-purple-300",
    isCurrent: false
  }
];

export const CURRENT_USER_RANKING = {
  rank: 99,
  name: "Você",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  level: "Nível 1 • First Steps",
  levelNumber: 1,
  league: "Liga Bronze",
  leagueIcon: "🌱",
  weeklyXp: 0,
  totalXp: 0,
  trend: "stable",
  positionsGained: 0,
  nextGoal: "Complete sua primeira aula ou Magic Song para pontuar no ranking!",
  xpToNextRank: 50,
  seasonEndsIn: "3 dias e 8 horas"
};

export const LEADERBOARDS = {
  weekly: [
    {
      rank: 1,
      name: "Ana Silva",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      level: "Nível 4 • Confident Speaker",
      levelNumber: 4,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 820,
      streak: 28,
      masteredSongs: 14,
      trend: "stable",
      tag: "🥇 Líder da Semana"
    },
    {
      rank: 2,
      name: "Carlos Souza",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      level: "Nível 3 • Conversation Builder",
      levelNumber: 3,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 750,
      streak: 19,
      masteredSongs: 11,
      trend: "up",
      tag: "🥈 Top 2"
    },
    {
      rank: 3,
      name: "Maria Oliveira",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      level: "Nível 3 • Conversation Builder",
      levelNumber: 3,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 710,
      streak: 15,
      masteredSongs: 9,
      trend: "up",
      tag: "🥉 Top 3"
    },
    {
      rank: 4,
      name: "João Silva (Você)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      level: "Nível 2 • Music Learner",
      levelNumber: 2,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 680,
      streak: 12,
      masteredSongs: 8,
      trend: "up",
      isCurrentUser: true,
      tag: "⭐ Sua Posição"
    },
    {
      rank: 5,
      name: "Lucas Mendes",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      level: "Nível 2 • Music Learner",
      levelNumber: 2,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 640,
      streak: 10,
      masteredSongs: 7,
      trend: "down"
    },
    {
      rank: 6,
      name: "Beatriz Costa",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      level: "Nível 3 • Conversation Builder",
      levelNumber: 3,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 590,
      streak: 14,
      masteredSongs: 6,
      trend: "up"
    },
    {
      rank: 7,
      name: "Rafael Lima",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      level: "Nível 2 • Music Learner",
      levelNumber: 2,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 550,
      streak: 8,
      masteredSongs: 5,
      trend: "down"
    },
    {
      rank: 8,
      name: "Juliana Santos",
      avatar: "https://images.unsplash.com/photo-1534751516642-a171edd25218?w=150&auto=format&fit=crop&q=80",
      level: "Nível 2 • Music Learner",
      levelNumber: 2,
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 510,
      streak: 9,
      masteredSongs: 5,
      trend: "stable"
    }
  ],
  monthly: [
    {
      rank: 1,
      name: "Ana Silva",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      level: "Nível 4 • Confident Speaker",
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 3450,
      streak: 28,
      tag: "🥇 Mais Consistente"
    },
    {
      rank: 2,
      name: "Carlos Souza",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      level: "Nível 3 • Conversation Builder",
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 3100,
      streak: 19,
      tag: "🥈 Top 2"
    },
    {
      rank: 3,
      name: "João Silva (Você)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      level: "Nível 2 • Music Learner",
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 2850,
      streak: 12,
      isCurrentUser: true,
      tag: "🥉 Pódio Mensal"
    },
    {
      rank: 4,
      name: "Maria Oliveira",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      level: "Nível 3 • Conversation Builder",
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 2790,
      streak: 15
    }
  ],
  allTime: [
    {
      rank: 1,
      name: "Fernanda Rocha",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      level: "Nível 6 • Magic Fluent",
      league: "Liga Magic",
      leagueIcon: "👑",
      xp: 18450,
      streak: 142,
      tag: "👑 Lenda da Comunidade"
    },
    {
      rank: 2,
      name: "Gabriel Martins",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      level: "Nível 5 • English Explorer",
      league: "Liga Magic",
      leagueIcon: "👑",
      xp: 14200,
      streak: 98,
      tag: "🥈 Top Explorer"
    },
    {
      rank: 3,
      name: "Ana Silva",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      level: "Nível 4 • Confident Speaker",
      league: "Liga Diamante",
      leagueIcon: "💎",
      xp: 9850,
      streak: 28,
      tag: "🥉 Top Speaker"
    }
  ]
};

export const SPECIAL_RANKINGS = [
  {
    id: "music-master",
    title: "Music Master",
    subtitle: "Alunos que dominaram mais músicas.",
    icon: "🎵",
    color: "from-purple-500/20 to-indigo-600/20",
    border: "border-purple-500/40",
    textColor: "text-purple-300",
    leader: {
      name: "Carlos Souza",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      value: "18 músicas dominadas",
      badge: "🥇 1º Lugar"
    },
    userStat: "Domine músicas para entrar no ranking"
  },
  {
    id: "voice-champion",
    title: "Voice Champion",
    subtitle: "Maior evolução na pronúncia e precisão.",
    icon: "🎤",
    color: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/40",
    textColor: "text-cyan-300",
    leader: {
      name: "Ana Silva",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      value: "98% precisão vocal média",
      badge: "🥇 1º Lugar"
    },
    userStat: "Pratique no Voice Lab para pontuar"
  },
  {
    id: "streak-master",
    title: "Streak Master",
    subtitle: "Maior sequência diária estudando sem parar.",
    icon: "🔥",
    color: "from-amber-500/20 to-orange-600/20",
    border: "border-amber-500/40",
    textColor: "text-amber-300",
    leader: {
      name: "Fernanda Rocha",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      value: "142 dias seguidos",
      badge: "🥇 1º Lugar"
    },
    userStat: "Estude diariamente para construir sua sequência"
  },
  {
    id: "study-master",
    title: "Study Master",
    subtitle: "Mais aulas em vídeo assistidas e praticadas.",
    icon: "📚",
    color: "from-emerald-500/20 to-teal-600/20",
    border: "border-emerald-500/40",
    textColor: "text-emerald-300",
    leader: {
      name: "Maria Oliveira",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      value: "42 aulas concluídas",
      badge: "🥇 1º Lugar"
    },
    userStat: "Assista às aulas para subir nesta categoria"
  }
];
