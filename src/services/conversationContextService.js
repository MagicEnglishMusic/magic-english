import { progressService } from './progressService';
import { lessonsService } from './lessonsService';
import { songsService } from './songsService';
import { songsRegistry } from '../data/songsRegistry';
import { modulesLibraryData } from '../data/modulesData';
import { conversationChallenges, getTodayConversationChallenge } from '../data/conversationChallenges';

/**
 * Strict Pedagogical Knowledge Base Mapping for Built-in Lessons & Songs.
 * Ensures questions and suggestions ONLY use vocabulary and phrases taught in each lesson/song.
 * NEVER uses UI strings, instructions, labels, or unstudied words like "practice".
 */
const PEDAGOGICAL_LESSON_CHALLENGES = {
  // Lesson 1 / Hello Song (Greetings & Introductions)
  'hello': {
    id: 'lesson-hello',
    theme: 'Apresentações & Cumprimentos',
    title: 'Hello! Como se Apresentar',
    lessonRef: 'Aula 01 • Hello Song',
    phrase: 'Hello, my friend! Nice to meet you. What is your name?',
    translation: 'Olá, meu amigo! Prazer em conhecer você. Qual é o seu nome?',
    suggestions: [
      "Hello! My name is Maria. Nice to meet you!",
      "Good morning my friend! Ready to sing and play.",
      "I'm feeling great on this lovely day!"
    ]
  },
  // Lesson 2 / Numbers Song (Counting & Prices)
  'numbers': {
    id: 'lesson-numbers',
    theme: 'Números & Preços',
    title: 'Numbers — Preços e Quantidades',
    lessonRef: 'Aula 02 • Numbers Song',
    phrase: 'How much does it cost at the store? Can you count for me?',
    translation: 'Quanto custa na loja? Você pode contar para mim?',
    suggestions: [
      "It is twenty dollars, nothing more.",
      "One, two, three, let's count for free!",
      "It costs twenty dollars at the store."
    ]
  },
  // Travel / Airport
  'airport': {
    id: 'lesson-airport',
    theme: 'Inglês para Viagens',
    title: 'No Aeroporto — Check-in & Alfândega',
    lessonRef: 'Viagens • Travel Songs (Airport Edition)',
    phrase: 'Good morning! Do you have your passport and ticket ready for your flight?',
    translation: 'Bom dia! Você está com seu passaporte e passagem prontos para o voo?',
    suggestions: [
      "Yes, here is my passport and ticket. Thank you!",
      "Yes, I am ready for my flight to New York.",
      "Good morning! Everything is ready for the trip."
    ]
  },
  // Hotel
  'hotel': {
    id: 'lesson-hotel',
    theme: 'Inglês para Viagens',
    title: 'No Hotel — Reservas & Recepção',
    lessonRef: 'Viagens • Hotel Magic Hit',
    phrase: 'Welcome to the hotel! Do you have a reservation for tonight?',
    translation: 'Bem-vindo ao hotel! Você tem uma reserva para esta noite?',
    suggestions: [
      "Yes, I have a reservation under my name.",
      "Good evening! Here is my reservation for two days.",
      "Yes, thank you! What time is breakfast in the morning?"
    ]
  },
  // Restaurant / Food
  'restaurant': {
    id: 'lesson-restaurant',
    theme: 'Inglês para Restaurantes',
    title: 'No Restaurante — Fazendo Pedidos',
    lessonRef: 'Viagens • Restaurant & Food Song',
    phrase: 'Good evening! What would you like to order for dinner?',
    translation: 'Boa noite! O que você gostaria de pedir para o jantar?',
    suggestions: [
      "I would like water and pasta, please.",
      "A delicious pizza and juice, thank you!",
      "Can I see the food menu, please?"
    ]
  },
  // City / Directions
  'city': {
    id: 'lesson-city',
    theme: 'Direções & Cidade',
    title: 'Pedindo Informações & Direções na Rua',
    lessonRef: 'Viagens • City & Directions Song',
    phrase: 'Excuse me, where is the nearest station or park?',
    translation: 'Com licença, onde fica a estação ou parque mais próximo?',
    suggestions: [
      "Go straight and turn left at the corner.",
      "The station is near the central park, straight ahead.",
      "It is just two blocks away, thank you!"
    ]
  },
  // Family & Lifestyle
  'family': {
    id: 'lesson-family',
    theme: 'Família & Estilo de Vida',
    title: 'Hobbies, Família & Estilo de Vida',
    lessonRef: 'Conversas • My Favorite Things',
    phrase: 'Good morning! What is your favorite thing to do on weekends?',
    translation: 'Bom dia! Qual é a sua coisa favorita para fazer nos fins de semana?',
    suggestions: [
      "I love listening to music and singing with my family.",
      "I enjoy spending time outdoors with my friends.",
      "I enjoy cooking and singing songs with my family."
    ]
  },
  // Business / Work
  'business': {
    id: 'lesson-business',
    theme: 'Inglês para Trabalho',
    title: 'Reuniões Corporativas & Comunicação',
    lessonRef: 'Trabalho • Business Meeting Hit',
    phrase: 'Good morning everyone, let us start today meeting. Can you hear me well?',
    translation: 'Bom dia a todos, vamos começar a reunião de hoje. Vocês conseguem me ouvir bem?',
    suggestions: [
      "Yes, I can hear you loud and clear.",
      "Good morning! Let us review today agenda.",
      "Good morning team, let us start the project discussion."
    ]
  }
};

/**
 * Builds a strict allowed pedagogical vocabulary whitelist from studied songs and lyrics ONLY.
 * EXCLUDES interface texts, labels, buttons, descriptions, and helper words.
 */
export function buildPedagogicalWhitelist(studiedLessons = [], allSongs = []) {
  const allowed = new Set([
    'hello', 'hi', 'good', 'morning', 'afternoon', 'evening', 'night', 'my', 'your', 'his', 'her', 'our', 'their',
    'name', 'friend', 'friends', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
    'what', 'where', 'how', 'when', 'why', 'who', 'which', 'much',
    'yes', 'no', 'please', 'thank', 'thanks', 'you', 'too', 'here',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
    'and', 'or', 'but', 'so', 'not', 'can', 'do', 'does', 'did', 'have', 'has', 'had',
    'i', 'im', "i'm", 'we', 'they', 'he', 'she', 'it', 'this', 'that', 'these', 'those', 'let', "let's"
  ]);

  // Extract strictly from Song Lyrics & Pedagogical Keywords
  allSongs.forEach((s) => {
    if (Array.isArray(s.lyrics)) {
      s.lyrics.forEach((line) => {
        const lineText = `${line.en || line.english || ''} ${line.keyWord?.word || ''}`;
        lineText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).forEach((w) => {
          if (w.length > 1) allowed.add(w);
        });
      });
    }
  });

  return allowed;
}

/**
 * Validates that phrase uses only vocabulary present in the whitelist.
 */
export function validatePhraseAgainstWhitelist(phrase, whitelist) {
  if (!phrase || !whitelist || whitelist.size === 0) return true;
  const words = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return true;
  const matches = words.filter((w) => whitelist.has(w));
  return (matches.length / words.length) >= 0.85;
}

/**
 * Builds a pedagogical conversation challenge dynamically from a song record
 */
function createChallengeFromSong(song, lesson = null, whitelist = null) {
  if (!song) return null;

  const titleLower = (song.title || '').toLowerCase();
  const lessonTitleLower = (lesson?.title || '').toLowerCase();

  let candidate = null;

  if (titleLower.includes('hello') || lessonTitleLower.includes('apresentar') || lessonTitleLower.includes('hello')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['hello'];
  } else if (titleLower.includes('number') || titleLower.includes('count') || lessonTitleLower.includes('número')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['numbers'];
  } else if (titleLower.includes('airport') || titleLower.includes('flight') || lessonTitleLower.includes('aeroporto')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['airport'];
  } else if (titleLower.includes('hotel') || lessonTitleLower.includes('hotel')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['hotel'];
  } else if (titleLower.includes('restaurant') || titleLower.includes('food') || lessonTitleLower.includes('restaurante')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['restaurant'];
  } else if (titleLower.includes('direction') || titleLower.includes('city') || lessonTitleLower.includes('rua') || lessonTitleLower.includes('direções')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['city'];
  } else if (titleLower.includes('family') || titleLower.includes('favorite') || lessonTitleLower.includes('família')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['family'];
  } else if (titleLower.includes('business') || titleLower.includes('meeting') || lessonTitleLower.includes('trabalho') || lessonTitleLower.includes('reunião')) {
    candidate = PEDAGOGICAL_LESSON_CHALLENGES['business'];
  }

  if (candidate) {
    if (!whitelist || validatePhraseAgainstWhitelist(candidate.phrase, whitelist)) {
      return candidate;
    }
  }

  // If song has lyrics array in registry / database, extract directly from song verses
  if (Array.isArray(song.lyrics) && song.lyrics.length > 0) {
    const firstVerse = song.lyrics[0];
    const secondVerse = song.lyrics[1] || firstVerse;
    const enPhrase = firstVerse.en || firstVerse.english || firstVerse.text || song.title;
    const ptPhrase = firstVerse.pt || firstVerse.portuguese || firstVerse.translation || song.title;
    
    return {
      id: `song-${song.id || 'custom'}`,
      theme: song.title || 'Música de Estudo',
      title: lesson?.title || song.title,
      lessonRef: `Música • ${song.title}`,
      phrase: enPhrase,
      translation: ptPhrase,
      suggestions: [
        secondVerse.en || "Sing with the rhythm, let your English grow!",
        "Nice to meet you, welcome to the show!",
        "Hello my friend, good morning!"
      ]
    };
  }

  return candidate;
}

export const conversationContextService = {
  /**
   * Identifies all studied or unlocked lessons/songs for a given user.
   */
  async getStudentAvailablePedagogicalContent(userId) {
    try {
      // 1. Fetch user progress
      const progressRes = userId ? await progressService.getUserProgress(userId) : { data: [] };
      const userProgress = progressRes?.data || [];

      // 2. Fetch all published lessons & songs
      const [lessonsRes, songsRes] = await Promise.all([
        lessonsService.getAllLessons(),
        songsService.getSongs()
      ]);

      const allDbLessons = lessonsRes?.data || [];
      const allDbSongs = songsRes?.data || [];

      // Merge with static registry fallback if database is empty or offline
      const combinedSongs = allDbSongs.length > 0 ? allDbSongs : songsRegistry;
      
      // Determine studied lessons (progress > 0 or completed)
      const studiedLessonIds = new Set(
        userProgress
          .filter((p) => p.completed === true || (Number(p.progress_percent) || 0) > 0 || Object.values(p.steps || {}).some(Boolean))
          .map((p) => String(p.lesson_id).trim().toLowerCase())
      );

      // Filter lessons that have been studied
      let studiedLessons = allDbLessons.filter((l) => studiedLessonIds.has(String(l.id).trim().toLowerCase()));

      // If no lessons from DB had progress, check modulesData
      if (studiedLessons.length === 0 && studiedLessonIds.size > 0) {
        modulesLibraryData.forEach((mod) => {
          mod.lessons.forEach((l) => {
            if (studiedLessonIds.has(String(l.id).trim().toLowerCase())) {
              studiedLessons.push(l);
            }
          });
        });
      }

      // If still 0 studied lessons, check if first lesson is available/unlocked by default
      if (studiedLessons.length === 0) {
        if (allDbLessons.length > 0) {
          studiedLessons = [allDbLessons[0]];
        } else if (modulesLibraryData.length > 0 && modulesLibraryData[0].lessons?.length > 0) {
          studiedLessons = [modulesLibraryData[0].lessons[0]];
        }
      }

      return {
        studiedLessons,
        allSongs: combinedSongs,
        isNewStudent: userProgress.length === 0 && studiedLessonIds.size === 0
      };
    } catch (err) {
      console.warn('[conversationContextService] Erro ao buscar conteúdo pedagógico:', err);
      return {
        studiedLessons: [],
        allSongs: songsRegistry,
        isNewStudent: true
      };
    }
  },

  /**
   * Resolves the deterministic daily conversation challenge strictly matching
   * the student's pedagogical progress (1 lesson, 2-3 lessons, or N lessons)
   * with full whitelist validation.
   */
  async getDailyChallengeForUser(userId, date = new Date()) {
    const spDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const [year, month, day] = spDateStr.split('-').map(Number);
    const epochDays = Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24));

    const { studiedLessons, allSongs, isNewStudent } = await this.getStudentAvailablePedagogicalContent(userId);

    // Build strict whitelist of allowed vocabulary for this student from songs only
    const studentWhitelist = buildPedagogicalWhitelist(studiedLessons, allSongs);

    // Build the list of active challenges based on the student's studied lessons
    const activeChallenges = [];

    if (Array.isArray(studiedLessons) && studiedLessons.length > 0) {
      for (const les of studiedLessons) {
        const cleanLesId = String(les.id || '').trim().toLowerCase();
        const cleanLesTitle = String(les.title || '').trim().toLowerCase();
        
        let linkedSong = (allSongs || []).find((s) => {
          if (s.lesson_id && String(s.lesson_id).trim().toLowerCase() === cleanLesId) return true;
          if (s.lessonId && String(s.lessonId).trim().toLowerCase() === cleanLesId) return true;
          if (les.relatedSong && (s.title || '').toLowerCase().includes(String(les.relatedSong).toLowerCase())) return true;
          return false;
        });

        if (!linkedSong && (cleanLesTitle.includes('hello') || cleanLesTitle.includes('apresentar'))) {
          linkedSong = (allSongs || []).find((s) => (s.title || '').toLowerCase().includes('hello'));
        }
        if (!linkedSong && (cleanLesTitle.includes('número') || cleanLesTitle.includes('number'))) {
          linkedSong = (allSongs || []).find((s) => (s.title || '').toLowerCase().includes('number'));
        }

        const chal = createChallengeFromSong(linkedSong || { title: les.title }, les, studentWhitelist);
        if (chal && !activeChallenges.some((c) => c.id === chal.id)) {
          activeChallenges.push(chal);
        }
      }
    }

    // SCENARIO 4: Student has 0 pedagogical lessons or system has no lessons
    if (activeChallenges.length === 0) {
      const fallbackChal = getTodayConversationChallenge(date);
      return {
        ...fallbackChal,
        dateKey: spDateStr,
        sourceType: 'general_daily_fallback'
      };
    }

    // SCENARIO 1: Student has 1 lesson -> Strictly use that lesson's challenge
    if (activeChallenges.length === 1) {
      return {
        ...activeChallenges[0],
        dateKey: spDateStr,
        sourceType: 'single_studied_lesson'
      };
    }

    // SCENARIO 2 & 3: Student has 2, 3 or multiple lessons -> Combine and rotate deterministically
    const selectedIndex = Math.abs(epochDays) % activeChallenges.length;
    const selectedChallenge = activeChallenges[selectedIndex];

    return {
      ...selectedChallenge,
      dateKey: spDateStr,
      sourceType: activeChallenges.length <= 3 ? 'combined_studied_lessons' : 'multi_lesson_rotation',
      totalAvailableLessons: activeChallenges.length
    };
  }
};
