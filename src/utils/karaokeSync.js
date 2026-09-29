/**
 * karaokeSync.js
 * Utilitário centralizado de sincronização de alta precisão para o Karaokê Magic English.
 */

// Tempo de antecipação visual (lead time) em segundos:
// O marcador ilumina 400ms antes da voz para teste de sincronização.
export const KARAOKE_LEAD_SECONDS = 0.40;

/**
 * Localiza o índice do verso ativo estritamente dentro da janela [startTime, endTime)
 * aplicando o lead time de antecipação.
 * 
 * @param {Array} lyrics - Array de versos com { startTime, endTime, ... }
 * @param {number} currentTime - Tempo atual do áudio em segundos (audio.currentTime)
 * @param {number} duration - Duração total do áudio em segundos (opcional)
 * @param {number} leadSeconds - Segundos de antecipação (padrão: KARAOKE_LEAD_SECONDS)
 * @returns {number} Índice do verso ativo (0-based) ou -1 se fora de versos (intro/pausa)
 */
export function findActiveVerseIndex(lyrics, currentTime, duration = 0, leadSeconds = KARAOKE_LEAD_SECONDS) {
  if (!Array.isArray(lyrics) || lyrics.length === 0 || typeof currentTime !== 'number' || isNaN(currentTime)) {
    return -1;
  }

  // Tempo efetivo com antecipação
  const effectiveTime = currentTime + leadSeconds;

  return lyrics.findIndex((l, idx) => {
    const start = typeof l.startTime === 'number' ? l.startTime : null;
    if (start === null) return false;

    const nextVerse = lyrics[idx + 1];
    const nextStart = nextVerse && typeof nextVerse.startTime === 'number' ? nextVerse.startTime : null;
    
    // Calcula endTime com fallback no próximo verso ou na duração
    const end = typeof l.endTime === 'number' 
      ? l.endTime 
      : (nextStart !== null ? nextStart : (duration > 0 ? duration : start + 3.5));

    return effectiveTime >= start && effectiveTime < end;
  });
}
