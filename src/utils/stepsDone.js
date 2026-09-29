/**
 * Helper puro para derivar e unir os passos concluídos da Prática Musical (Etapas 1 a 4)
 * Mapeamento:
 * Etapa 1 = step_song
 * Etapa 2 = step_reverse_translation
 * Etapa 3 = step_sing_along
 * Etapa 4 = step_final_challenge
 */

export const INITIAL_STEPS_DONE = { 1: false, 2: false, 3: false, 4: false };

/**
 * Deriva os passos concluídos unindo a linha do banco (song_mastery) e o estado local.
 * D1: Etapa 1 considera APENAS step_song e o espelho local (step_video removido).
 */
export function deriveStepsDone(masteryRow = {}, localSteps = {}) {
  const row = masteryRow || {};
  const local = localSteps || {};

  return {
    1: Boolean(row.step_song || local[1] || local['1']),
    2: Boolean(row.step_reverse_translation || local[2] || local['2']),
    3: Boolean(row.step_sing_along || local[3] || local['3']),
    4: Boolean(row.step_final_challenge || local[4] || local['4'])
  };
}

/**
 * Verifica se o aluno tem permissão para acessar o card da etapa N no topo.
 * Regra A4: A etapa N só é acessível se todas as etapas anteriores (< N) estiverem concluídas.
 */
export function canAccessStep(targetStep, stepsDone = {}) {
  const s = stepsDone || {};
  if (targetStep <= 1) return true;
  if (targetStep === 2) return Boolean(s[1]);
  if (targetStep === 3) return Boolean(s[1] && s[2]);
  if (targetStep === 4) return Boolean(s[1] && s[2] && s[3]);
  return false;
}

/**
 * Verifica se o botão "Avançar" da etapa N pode ser clicado.
 * Regra A3: Habilitado se a etapa já estiver em stepsDone (repetição) OU se a condição da etapa atual foi cumprida.
 */
export function canAdvanceStep(stepNum, stepConditionMet, stepsDone = {}) {
  const s = stepsDone || {};
  return Boolean(s[stepNum] || stepConditionMet);
}

export function getLocalPracticeSteps(userId, songId) {
  if (!userId || !songId) return INITIAL_STEPS_DONE;
  try {
    const key = `magic_english_practice_steps_${userId}_${songId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        1: Boolean(parsed[1] || parsed['1']),
        2: Boolean(parsed[2] || parsed['2']),
        3: Boolean(parsed[3] || parsed['3']),
        4: Boolean(parsed[4] || parsed['4'])
      };
    }
  } catch (_) {}
  return INITIAL_STEPS_DONE;
}

export function saveLocalPracticeSteps(userId, songId, stepsObj = {}) {
  if (!userId || !songId) return;
  try {
    const key = `magic_english_practice_steps_${userId}_${songId}`;
    const current = getLocalPracticeSteps(userId, songId);
    const merged = {
      1: Boolean(current[1] || stepsObj[1] || stepsObj['1']),
      2: Boolean(current[2] || stepsObj[2] || stepsObj['2']),
      3: Boolean(current[3] || stepsObj[3] || stepsObj['3']),
      4: Boolean(current[4] || stepsObj[4] || stepsObj['4'])
    };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (_) {}
}

/**
 * Gerenciamento de versos cantados da Etapa 3 (Cantar Junto)
 * Chave: magic_english_practice_sung_<userId>_<songId>
 */
export function getLocalSungVerses(userId, songId) {
  if (!userId || !songId) return [];
  try {
    const key = `magic_english_practice_sung_${userId}_${songId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map(String)));
      }
    }
  } catch (_) {}
  return [];
}

export function saveLocalSungVerse(userId, songId, verseIdOrIndex) {
  if (!userId || !songId || verseIdOrIndex === undefined || verseIdOrIndex === null) return [];
  try {
    const key = `magic_english_practice_sung_${userId}_${songId}`;
    const current = getLocalSungVerses(userId, songId);
    const set = new Set(current);
    set.add(String(verseIdOrIndex));
    const merged = Array.from(set);
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (_) {
    return [];
  }
}
