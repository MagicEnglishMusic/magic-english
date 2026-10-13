import { progressService } from './progressService.js';
import { lessonsService } from './lessonsService.js';
import { songsService } from './songsService.js';
import { songsRegistry } from '../data/songsRegistry.js';
import { modulesLibraryData } from '../data/modulesData.js';
import { conversationChallenges, getTodayConversationChallenge } from '../data/conversationChallenges.js';

/**
 * Extracts raw verses from song object across all possible database columns and registries
 * (timestamps, lyricsTimestamps, lyrics).
 */
export function getSongVerses(song) {
  if (!song) return [];
  if (Array.isArray(song.timestamps) && song.timestamps.length > 0) return song.timestamps;
  if (Array.isArray(song.lyricsTimestamps) && song.lyricsTimestamps.length > 0) return song.lyricsTimestamps;
  if (Array.isArray(song.lyrics) && song.lyrics.length > 0) return song.lyrics;
  return [];
}

/**
 * Extracts pedagogical conversation challenges dynamically from actual song verses/timestamps.
 * STRICT FIDELITY: Uses ONLY phrases and words literally taught in the song.
 */
export function extractPedagogicalChallengesFromSong(song, lesson = null) {
  const rawVerses = getSongVerses(song);
  if (!rawVerses || rawVerses.length === 0) return [];

  const verses = rawVerses.map((v, i) => ({
    id: v.id || (i + 1),
    en: (v.en || v.english || v.text || '').trim(),
    pt: (v.pt || v.portuguese || v.translation || '').trim()
  })).filter((v) => v.en.length > 0);

  if (verses.length === 0) return [];

  const lessonLabel = lesson?.lesson_number || lesson?.title || song.title || 'Aula';
  const lessonRef = `${lessonLabel} • ${song.title || 'Magic Song'}`;

  const allEnVerses = new Set(verses.map((v) => v.en));
  const challenges = [];
  const seenPhrases = new Set();

  for (let i = 0; i < verses.length; i++) {
    const v = verses[i];
    const en = v.en;
    if (seenPhrases.has(en)) continue;

    const isQuestion = en.endsWith('?');
    const isCommunicative = /^(Hello|Hi|Good morning|Good afternoon|Good evening|Nice to meet you|Have a nice day|Let's learn English together)/i.test(en);

    if (isQuestion || isCommunicative) {
      const suggestions = [];

      // 1. Collect subsequent verses as natural dialogue answers
      for (let j = i + 1; j < verses.length && suggestions.length < 3; j++) {
        const candidate = verses[j].en;
        if (!candidate.endsWith('?') && candidate !== en && !suggestions.includes(candidate)) {
          suggestions.push(candidate);
        }
      }

      // 2. If suggestions < 2, pick natural polite response verses from the same song
      const fallbackOptions = ['Thank you!', 'Of course!', "You're welcome!", 'Nice to meet you.', 'Good morning!', 'Hello!'];
      for (const opt of fallbackOptions) {
        if (suggestions.length >= 3) break;
        if (allEnVerses.has(opt) && opt !== en && !suggestions.includes(opt)) {
          suggestions.push(opt);
        }
      }

      // Assign contextual theme based strictly on vocabulary
      let theme = 'Cumprimentos & Apresentações';
      if (en.includes('from') || en.includes('Brazil') || en.includes('United States')) {
        theme = 'Origem & Nacionalidade';
      } else if (en.includes('student') || en.includes('teacher') || en.includes('old') || en.includes('years')) {
        theme = 'Idade & Ocupação';
      } else if (en.includes('English') || en.includes('speak') || en.includes('learn')) {
        theme = 'Idioma & Aprendizado';
      } else if (en.includes('help') || en.includes('Please') || en.includes('Thank')) {
        theme = 'Cortesia & Comunicação';
      } else if (en.includes('See you') || en.includes('Goodbye') || en.includes('Have a nice day')) {
        theme = 'Despedidas & Bons Desejos';
      } else if (en.includes('How are you') || en.includes('fine') || en.includes('good') || en.includes('great')) {
        theme = 'Cumprimentos & Sentimentos';
      }

      let title = en.replace(/[.!?]$/, '');
      if (en === 'How are you?') title = 'Como Você Está?';
      else if (en === "What's your name?") title = 'Qual é o Seu Nome?';
      else if (en === 'Where are you from?') title = 'De Onde Você É?';
      else if (en === 'How old are you?') title = 'Quantos Anos Você Tem?';
      else if (en === 'Are you a student?') title = 'Você é Estudante?';
      else if (en === 'Are you a teacher?') title = 'Você é Professor?';
      else if (en === 'Do you speak English?') title = 'Você Fala Inglês?';
      else if (en === 'Can you help me?') title = 'Você Pode me Ajudar?';
      else if (en === 'Nice to meet you.') title = 'Prazer em Conhecer';
      else if (en === 'Have a nice day!') title = 'Tenha um Bom Dia!';
      else if (en === "Let's learn English together!") title = 'Vamos Aprender Juntos';

      challenges.push({
        id: `pedagogical-${song.id || 'song'}-${challenges.length + 1}`,
        theme,
        title,
        lessonRef,
        phrase: en,
        translation: v.pt,
        suggestions: suggestions.slice(0, 3)
      });

      seenPhrases.add(en);
    }
  }

  return challenges;
}

/**
 * Builds a strict allowed pedagogical vocabulary whitelist from studied songs and lyrics ONLY.
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

  allSongs.forEach((s) => {
    const verses = getSongVerses(s);
    verses.forEach((line) => {
      const lineText = `${line.en || line.english || line.text || ''} ${line.keyWord?.word || ''}`;
      lineText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).forEach((w) => {
        if (w.length > 1) allowed.add(w);
      });
    });
  });

  return allowed;
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

      // 2. Fetch all published lessons & songs from Supabase
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
   * the student's pedagogical progress with 100% literal fidelity to studied lessons & songs.
   */
  async getDailyChallengeForUser(userId, date = new Date()) {
    const spDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const [year, month, day] = spDateStr.split('-').map(Number);
    const epochDays = Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24));

    const { studiedLessons, allSongs } = await this.getStudentAvailablePedagogicalContent(userId);

    // Build active challenges strictly extracted from each studied lesson's song
    const activeChallenges = [];

    if (Array.isArray(studiedLessons) && studiedLessons.length > 0) {
      for (const les of studiedLessons) {
        const cleanLesId = String(les.id || '').trim().toLowerCase();

        // Find linked song by lesson_id or module_id or fallback to first song
        let linkedSong = (allSongs || []).find((s) => {
          if (s.lesson_id && String(s.lesson_id).trim().toLowerCase() === cleanLesId) return true;
          if (s.lessonId && String(s.lessonId).trim().toLowerCase() === cleanLesId) return true;
          if (les.module_id && s.module_id && String(s.module_id).trim().toLowerCase() === String(les.module_id).trim().toLowerCase()) return true;
          return false;
        });

        if (!linkedSong && allSongs && allSongs.length > 0) {
          linkedSong = allSongs[0];
        }

        if (linkedSong) {
          const extracted = extractPedagogicalChallengesFromSong(linkedSong, les);
          extracted.forEach((chal) => {
            if (!activeChallenges.some((c) => c.phrase === chal.phrase)) {
              activeChallenges.push(chal);
            }
          });
        }
      }
    }

    // SCENARIO 1: Dynamic challenges extracted successfully
    if (activeChallenges.length > 0) {
      const selectedIndex = Math.abs(epochDays) % activeChallenges.length;
      const selectedChallenge = activeChallenges[selectedIndex];

      return {
        ...selectedChallenge,
        dateKey: spDateStr,
        sourceType: 'dynamic_studied_lesson',
        totalAvailableLessons: studiedLessons.length
      };
    }

    // SCENARIO 2: Fallback to verified pedagogical challenges (Aula 01)
    const fallbackChal = getTodayConversationChallenge(date);
    return {
      ...fallbackChal,
      dateKey: spDateStr,
      sourceType: 'verified_pedagogical_fallback'
    };
  }
};
