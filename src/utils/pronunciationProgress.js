/**
 * Helper puro para progresso e associação de pronúncia da aula (Passo 3 / Voice Lab)
 * Regras:
 * - Tabela pronunciation_words não tem song_id; usa a coluna song (título ou id).
 * - Casamento de palavra com música normalizado (minúsculas, sem acentos, pontuação e espaços colapsados).
 * - Ordenação estável por created_at ASC e desempate por id ASC.
 * - Exige no máximo 25 termos ou o total de palavras cadastradas para a música da aula.
 * - Conclui o passo quando a quantidade de termos distintos aprovados atingir o exigido.
 */

export const PRONUNCIATION_REQUIRED = 25;

/**
 * Normaliza títulos de músicas para comparação resiliente.
 */
export function normalizeSongTitle(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^a-z0-9]/g, ' ') // caracteres especiais viram espaço
    .replace(/\s+/g, ' ') // colapsa múltiplos espaços
    .trim();
}

/**
 * Verifica se um registro de pronunciation_words pertence à música em questão.
 */
export function doesWordMatchSong(wordItem, songObj = null, songId = null) {
  if (!wordItem) return false;
  const cleanSongId = String(songId || songObj?.id || '').trim().toLowerCase();
  const wordSongId = String(wordItem.song_id || '').trim().toLowerCase();

  // Se ambos tiverem UUID de música e coincidirem
  if (cleanSongId && wordSongId && cleanSongId === wordSongId) {
    return true;
  }

  const wordSongRaw = String(wordItem.song || '').trim();
  if (!wordSongRaw || wordSongRaw.toLowerCase() === 'geral') return false;

  if (cleanSongId && wordSongRaw.toLowerCase() === cleanSongId) return true;

  const normWordSong = normalizeSongTitle(wordSongRaw);
  const normSongTitle = normalizeSongTitle(songObj?.title || '');
  if (normWordSong && normSongTitle && normWordSong === normSongTitle) {
    return true;
  }
  return false;
}

/**
 * Ordenação estável de palavras de pronúncia:
 * 1. sort_order ASC (se existir)
 * 2. created_at ASC
 * 3. id ASC
 */
export function sortPronunciationWords(words = []) {
  if (!Array.isArray(words)) return [];
  return [...words].sort((a, b) => {
    const orderA = typeof a?.sort_order === 'number' ? a.sort_order : (a?.sort_order !== undefined && a?.sort_order !== null ? Number(a.sort_order) : null);
    const orderB = typeof b?.sort_order === 'number' ? b.sort_order : (b?.sort_order !== undefined && b?.sort_order !== null ? Number(b.sort_order) : null);

    if (orderA !== null && orderB !== null && !isNaN(orderA) && !isNaN(orderB) && orderA !== orderB) {
      return orderA - orderB;
    }
    const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    const idA = String(a?.id || '');
    const idB = String(b?.id || '');
    return idA.localeCompare(idB);
  });
}

/**
 * Calcula a meta de palavras exigidas para a música da aula.
 */
export function getRequiredPronunciationCount(totalWords = 0) {
  const count = typeof totalWords === 'number' ? totalWords : 0;
  if (count <= 0) return 0;
  return Math.min(PRONUNCIATION_REQUIRED, count);
}

/**
 * Verifica se o passo de pronúncia da aula está concluído.
 * Retorna true se totalWords > 0 e a quantidade de índices aprovados for >= required.
 */
export function isPronunciationStepCompleted(approvedIndices = [], totalWords = 0) {
  const req = getRequiredPronunciationCount(totalWords);
  if (req === 0) return false;
  const uniqueCount = new Set((approvedIndices || []).map(Number).filter((n) => !isNaN(n))).size;
  return uniqueCount >= req;
}

/**
 * Lê os índices de pronúncia aprovados salvos no localStorage para a aula.
 * Chave: magic_english_pronunciation_done_<userId>_<lessonId>
 */
export function getLocalPronunciationDone(userId, lessonId) {
  if (!userId || !lessonId) return [];
  try {
    const key = `magic_english_pronunciation_done_${userId}_${lessonId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map(Number).filter((n) => !isNaN(n))));
      }
    }
  } catch (_) {}
  return [];
}

/**
 * Salva e une os índices de pronúncia aprovados no localStorage.
 */
export function saveLocalPronunciationDone(userId, lessonId, newIndices = []) {
  if (!userId || !lessonId) return [];
  try {
    const key = `magic_english_pronunciation_done_${userId}_${lessonId}`;
    const current = getLocalPronunciationDone(userId, lessonId);
    const set = new Set([...current, ...(newIndices || []).map(Number).filter((n) => !isNaN(n))]);
    const merged = Array.from(set).sort((a, b) => a - b);
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (_) {
    return [];
  }
}
