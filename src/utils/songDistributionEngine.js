import { songsRegistry } from '../data/songsRegistry';

/**
 * ============================================================================
 * AUTOMATIC DISTRIBUTION ENGINE — MAGIC ENGLISH
 * ============================================================================
 * Transforma automaticamente o cadastro único de uma música nos dados
 * especializados de cada aba da Magic Classroom e da plataforma:
 * - Aba Música
 * - Aba Pronúncia
 * - Aba Prática Musical (Tradução Reversa)
 * - Aba Material
 * - Magic Classroom
 * ============================================================================
 */

/**
 * 1. Distribuição Automática para a Aba Música (Karaokê Sincronizado)
 */
export function generateKaraokeData(song) {
  if (!song) return null;
  return {
    id: song.id,
    title: song.title,
    subtitle: song.subtitle,
    duration: song.duration,
    durationSeconds: song.durationSeconds || 204,
    bpm: song.bpm,
    genre: song.genre || "Pop",
    image: song.coverImage,
    audioUrl: song.audioUrl,
    lyricsTimestamps: song.lyrics.map((line) => ({
      id: line.id,
      startTime: line.startTime,
      endTime: line.endTime,
      en: line.en,
      pt: line.pt,
      hint: line.hint
    }))
  };
}

/**
 * 2. Distribuição Automática para a Aba Pronúncia (Extraída da Letra)
 */
export function generatePronunciationData(song) {
  if (!song || !song.lyrics) return [];
  return song.lyrics
    .filter((line) => line.keyWord)
    .map((line, idx) => ({
      id: `pron-${song.id}-${idx}`,
      word: line.keyWord.word,
      meaning: line.keyWord.meaning,
      phonetic: line.keyWord.phonetic,
      tip: line.keyWord.tip,
      score: 94 + (idx % 5), // score dinâmico inicial
      sourceVerseEn: line.en,
      sourceVersePt: line.pt
    }));
}

/**
 * 3. Distribuição Automática para a Aba Prática Musical (Tradução Reversa)
 */
export function generateReversePracticeData(song) {
  if (!song || !song.lyrics) return [];
  return song.lyrics.map((line, idx) => ({
    id: `rev-${song.id}-${idx}`,
    en: line.en,
    pt: line.pt,
    hint: line.hint || `Lembre-se da estrutura: "${line.en}"`,
    audioSpeed: 0.85
  }));
}

/**
 * 4. Distribuição Automática para a Aba Material (PDFs Anexados)
 */
export function generateMaterialsData(song) {
  if (!song || !song.materials) return [];
  return song.materials.map((mat) => ({
    id: mat.id,
    name: mat.name,
    type: mat.type,
    size: mat.size,
    pages: mat.pages,
    downloadUrl: mat.downloadUrl || "#"
  }));
}

/**
 * 5. Distribuidor Mestre para a Magic Classroom
 * Retorna todos os dados distribuídos automaticamente a partir de um único registro de música
 */
export function getUnifiedClassroomData(lessonId = "class-01") {
  const song = songsRegistry.find((s) => s.lessonId === lessonId) || songsRegistry[0];

  return {
    songInfo: {
      id: song.id,
      title: song.title,
      subtitle: song.subtitle,
      duration: song.duration,
      bpm: song.bpm,
      coverImage: song.coverImage,
      moduleId: song.moduleId,
      moduleName: song.moduleName,
      lessonNumber: song.lessonNumber,
      lessonTitle: song.lessonTitle
    },
    karaoke: generateKaraokeData(song),
    pronunciation: generatePronunciationData(song),
    practiceVerses: generateReversePracticeData(song),
    materials: generateMaterialsData(song)
  };
}
