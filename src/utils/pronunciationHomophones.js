/**
 * pronunciationHomophones.js
 * 
 * Mapa de homófonos e termos foneticamente equivalentes em inglês.
 * Permite que a validação de fala aceite transcrições fonéticas idênticas
 * retornadas pelos motores de SpeechRecognition (ex: "too" -> "to", "two", "2").
 */

export const HOMOPHONE_GROUPS = [
  // Palavras explicitamente requeridas
  ['too', 'to', 'two', '2'],
  ['meet', 'meat'],
  ['where', 'wear', 'ware'],
  ["i'm", 'im', 'i am'],
  ['nice', 'nice'],

  // Saudações e despedidas
  ['bye', 'by', 'buy'],
  ['hi', 'high'],

  // Números e homófonos comuns
  ['one', 'won', '1'],
  ['four', 'for', '4', 'fore'],
  ['eight', 'ate', '8'],

  // Pronomes e contrações frequentes
  ['their', 'there', "they're", 'theyre'],
  ['your', "you're", 'youre', 'yore'],
  ['our', 'hour'],
  ["you'll", 'youll', 'you will'],
  ["we're", 'were', 'we are'],
  ["he's", 'hes', 'he is'],
  ["she's", 'shes', 'she is'],
  ["it's", 'its', 'it is'],

  // Verbos e substantivos comuns em músicas e conversação
  ['hear', 'here'],
  ['see', 'sea', 'c'],
  ['sun', 'son'],
  ['right', 'write', 'rite'],
  ['know', 'no'],
  ['new', 'knew'],
  ['be', 'bee', 'b'],
  ['peace', 'piece'],
  ['break', 'brake'],
  ['night', 'knight'],
  ['wait', 'weight'],
  ['week', 'weak'],
  ['flu', 'flew', 'flue'],
  ['way', 'weigh'],
  ['read', 'red'],
  ['would', 'wood'],
  ['which', 'witch'],
  ['weather', 'whether'],
  ['pair', 'pear', 'pare'],
  ['mail', 'male'],
  ['plain', 'plane'],
  ['stair', 'stare'],
  ['whole', 'hole'],
  ['some', 'sum'],
  ['so', 'sew', 'sow'],
  ['tail', 'tale'],
  ['die', 'dye'],
  ['fair', 'fare'],
  ['flour', 'flower'],
  ['great', 'grate'],
  ['road', 'rode', 'rowed'],
  ['sail', 'sale'],
  ['sight', 'site', 'cite'],
  ['scene', 'seen'],
  ['steal', 'steel'],
  ['sweet', 'suite'],
  ['waste', 'waist'],
  ['dear', 'deer'],
  ['eye', 'i', 'aye'],
  ['check', 'cheque'],
  ['knot', 'not'],
  ['knows', 'nose'],
  ['made', 'maid'],
  ['none', 'nun'],
  ['passed', 'past'],
  ['pray', 'prey'],
  ['rain', 'reign', 'rein'],
  ['root', 'route'],
  ['sole', 'soul'],
  ['tea', 'tee', 't'],
  ['through', 'threw']
];

/**
 * Normaliza um termo para indexação e comparação fonética.
 * - Converte para minúsculas
 * - Remove acentos/diacríticos
 * - Remove pontuação desnecessária (mantendo espaços internos)
 */
export function normalizeHomophoneWord(text = '') {
  if (text == null) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalização estrita sem apóstrofes para cruzamento amplo
 */
function stripApostrophe(text = '') {
  return normalizeHomophoneWord(text).replace(/'/g, '');
}

// Mapa indexado para busca O(1) de homófonos
const HOMOPHONE_INDEX = new Map();

HOMOPHONE_GROUPS.forEach((group, groupIdx) => {
  group.forEach((item) => {
    const norm = normalizeHomophoneWord(item);
    const normStrict = stripApostrophe(item);

    if (norm) {
      if (!HOMOPHONE_INDEX.has(norm)) {
        HOMOPHONE_INDEX.set(norm, new Set());
      }
      HOMOPHONE_INDEX.get(norm).add(groupIdx);
    }

    if (normStrict && normStrict !== norm) {
      if (!HOMOPHONE_INDEX.has(normStrict)) {
        HOMOPHONE_INDEX.set(normStrict, new Set());
      }
      HOMOPHONE_INDEX.get(normStrict).add(groupIdx);
    }
  });
});

/**
 * Verifica se duas palavras são homófonas ou foneticamente equivalentes.
 * Retorna true se forem idênticas ou pertencerem ao mesmo grupo fonético.
 */
export function areHomophones(wordA = '', wordB = '') {
  const normA = normalizeHomophoneWord(wordA);
  const normB = normalizeHomophoneWord(wordB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const strictA = stripApostrophe(normA);
  const strictB = stripApostrophe(normB);

  if (strictA === strictB) return true;

  const groupsA = new Set([
    ...(HOMOPHONE_INDEX.get(normA) || []),
    ...(HOMOPHONE_INDEX.get(strictA) || [])
  ]);

  if (groupsA.size === 0) return false;

  const groupsB = new Set([
    ...(HOMOPHONE_INDEX.get(normB) || []),
    ...(HOMOPHONE_INDEX.get(strictB) || [])
  ]);

  if (groupsB.size === 0) return false;

  for (const g of groupsA) {
    if (groupsB.has(g)) return true;
  }

  return false;
}
