import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { progressService } from './progressService';
import { songsService } from './songsService';
import { communityService } from './communityService';
import {
  uploadAvatarMessageAudioToDrive,
  checkExistingDriveAvatarMessageAudio,
  fetchDriveAudioArrayBuffer,
  checkDriveAudioStatus
} from '../utils/googleDriveHelper';

const LOCAL_SESSION_KEY_PREFIX = 'magic_avatar_practice_session_';
const AVATAR_AUDIO_CATALOG_APP_KEY = 'avatar_messages_audio_catalog';
const AVATAR_AUDIO_CATALOG_STORAGE_KEY = 'magic_avatar_messages_catalog_v1';
const AVATAR_AUDIO_SYNTHESIS_VERSION = 'v1';

export const PARTIAL_PHRASE_RETRY_MESSAGE = 'Você falou apenas parte da frase. Ouça com atenção e repita a frase inteira:';

export const AVATAR_MESSAGE_CATEGORIES = [
  { field: 'welcomeMessage', category: 'saudacoes', label: 'Saudações Iniciais' },
  { field: 'successMessage', category: 'elogios', label: 'Elogios de Acerto / Celebração' },
  { field: 'retryMessage', category: 'encorajamentos', label: 'Encorajamentos ao Errar / Repetir' },
  { field: 'farewellMessage', category: 'despedidas', label: 'Mensagens de Despedida' },
  { field: 'resumeMessage', category: 'retomadas', label: 'Mensagens de Retomada de Sessão' }
];

export const TEACHER_PRESETS = [
  {
    id: 'sarah',
    name: 'Profª Sarah',
    gender: 'F',
    role: 'Professora Titular',
    modelUrl: '/avatars/brunette.glb',
    voiceEn: 'en-US-JennyNeural',
    voicePt: 'pt-BR-FranciscaNeural',
    description: 'Elegante e acolhedora, voz cristalina.'
  },
  {
    id: 'james',
    name: 'Prof. James',
    gender: 'M',
    role: 'Professor Britânico/Americano',
    modelUrl: '/avatars/james.glb',
    voiceEn: 'en-US-GuyNeural',
    voicePt: 'pt-BR-AntonioNeural',
    description: 'Executivo de terno, voz masculina madura e firme.'
  },
  {
    id: 'emma',
    name: 'Profª Emma',
    gender: 'F',
    role: 'Professora Dinâmica',
    modelUrl: '/avatars/emma.glb',
    baseline: { headRotateX: -0.05, eyeBlinkLeft: 0.15, eyeBlinkRight: 0.15 },
    voiceEn: 'en-US-AriaNeural',
    voicePt: 'pt-BR-ThalitaNeural',
    description: 'Moderna e expressiva, textura fotorrealista.'
  },
  {
    id: 'david',
    name: 'Prof. David',
    gender: 'M',
    role: 'Professor Jovem',
    modelUrl: '/avatars/david.glb',
    voiceEn: 'en-US-DavisNeural',
    voicePt: 'pt-BR-NicolauNeural',
    description: 'Casual e descontraído, ideal para conversação rápida.'
  },
  {
    id: 'lucas',
    name: 'Mascote Lucas (Pixar 3D)',
    gender: 'M',
    role: 'Mascote & Instrutor Júnior',
    modelUrl: '/avatars/lucas.glb',
    voiceEn: 'en-US-DavisNeural',
    voicePt: 'pt-BR-NicolauNeural',
    cameraDistance: -1.0,     // Enquadramento de meio-corpo focado no Lucas
    cameraY: 0.65,            // Foco vertical na altura dos olhos/peito dele (0.70m)
    isMixamo: true,           // Flag para preservar a anatomia natural sem torções
    description: 'Alegre, expressivo e divertido, mascote oficial no estilo animação Pixar 3D!'
  }
];

export const DEFAULT_AVATAR_SETTINGS = {
  sessionDurationMinutes: 15,
  cooldownEnabled: true,
  cooldownHours: 24,
  cooldownResetMode: '24h', // '24h' | 'midnight'
  toleranceMode: 'medium', // 'easy' | 'medium' | 'hard'
  teacherPresetId: 'sarah',
  modelUrl: '/avatars/brunette.glb',
  backgroundTheme: 'classroom', // 'classroom' | 'library' | 'studio' | 'custom'
  backgroundUrl: '', // Imagem customizada se houver
  backgroundBlur: 0, // 0 a 10px
  ttsVoice: 'Jenny',
  ttsSpeed: 1.0,
  welcomeMessage: `Olá, {nome_aluno}! Tudo bem? Vi que você já estudou a música {titulo_musica}, então hoje vamos praticar o que você aprendeu nela. Vamos começar?
Hi {nome_aluno}! Que ótimo ter você aqui hoje. Vamos praticar os versos incríveis de {titulo_musica}?
Welcome, {nome_aluno}! Pronta para afiar sua pronúncia em inglês com {titulo_musica}?
Olá, {nome_aluno}! Que bom ver você de volta. Hoje vamos soltar a voz com a música {titulo_musica}!`,
  resumeMessage: `Olá novamente, {nome_aluno}! Vamos continuar de onde paramos!
Que bom que você voltou, {nome_aluno}! Vamos retomar nosso treino!
Pronto para continuar, {nome_aluno}? Vamos direto para a nossa frase!`,
  successMessage: `Boa! Gostei muito. Vamos para a próxima frase!
Muito Bom! Vamos para a próxima frase!
Muito bem! Sua pronúncia foi ótima. Vamos para a próxima frase!
Maravilha! Sua pronúncia foi muito boa! Vamos para a próxima frase!
Uau! Estou impressionada. Sua pronúncia está muito boa! Vamos para mais uma.
Muito bom {nome_aluno}! Estou adorando sua pronúncia. Está muito boa! Vamos para a próxima frase!`,
  retryMessage: `Quase lá! Escute com atenção mais uma vez e repita a frase inteira comigo:
Muito bom esforço! Vamos tentar mais uma vez prestando atenção em cada detalhe:
Você está no caminho certo! Escute mais uma vez com calma e repita comigo:
Não se preocupe, a repetição traz a perfeição! Vamos falar essa frase juntos:`,
  farewellMessage: `Parabéns pelo treino de hoje, {nome_aluno}! Nosso tempo terminou. Te vejo amanhã para continuar praticando!
Excelente prática, {nome_aluno}! Você treinou com muita dedicação hoje. Te vejo na próxima sessão!
Tempo concluído por hoje, {nome_aluno}! Descanse a voz e te espero amanhã para mais evolução!`
};

/**
 * Utilitário para sortear dinamicamente variações de falas sem repetição imediata
 */
export function pickRandomAvatarPhrase(textOrArray, fallback = '', lastPicked = null) {
  if (!textOrArray && !fallback) return '';
  const raw = textOrArray || fallback;
  const list = Array.isArray(raw)
    ? raw.map((s) => String(s || '').trim()).filter(Boolean)
    : String(raw)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

  if (list.length === 0) return fallback;
  if (list.length === 1) return list[0];

  // Filtra a última opção para nunca repetir duas vezes seguidas
  const eligible = lastPicked ? list.filter((item) => item !== lastPicked) : list;
  const pool = eligible.length > 0 ? eligible : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const AZURE_SPEECH_CONFIG = {
  region: 'eastus',
  defaultVoiceEn: 'en-US-JennyNeural',
  defaultVoicePt: 'pt-BR-FranciscaNeural'
};

/**
 * Síntese neural Microsoft Azure Speech TTS (Modo Mono-Voz Seguro via Supabase Edge Function)
 * A credencial AZURE_SPEECH_KEY fica 100% protegida no backend serverless (Deno Secrets).
 * O navegador nunca recebe ou transita a chave de API da Microsoft.
 */
export async function requestAzureTTS(text, lang = 'en', customKey = null, voiceOverride = null) {
  const isPt = lang === 'pt' || lang === 'pt-BR';
  const voiceName = voiceOverride || (isPt ? AZURE_SPEECH_CONFIG.defaultVoicePt : AZURE_SPEECH_CONFIG.defaultVoiceEn);

  if (!isSupabaseConfigured || !supabase?.functions) {
    throw new Error('Supabase client não está inicializado para síntese de voz.');
  }

  // Garante a obtenção do token JWT da sessão ativa do Supabase Auth
  let authHeaders = {};
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      authHeaders = { Authorization: `Bearer ${token}` };
    }
  } catch (tokenErr) {
    console.warn('[azure-tts-proxy] Aviso ao resolver token da sessão:', tokenErr);
  }

  const { data, error } = await supabase.functions.invoke('azure-tts-proxy', {
    headers: authHeaders,
    body: {
      mode: 'single',
      text,
      lang: isPt ? 'pt' : 'en',
      voice: voiceName
    }
  });

  if (error || !data?.base64Audio) {
    const errorMsg = error?.message || 'Falha ao receber áudio sintetizado da Edge Function';
    console.error('[azure-tts-proxy] Erro na síntese mono-voz:', errorMsg);
    throw new Error(`Erro na síntese de voz via backend: ${errorMsg}`);
  }

  return {
    base64Audio: data.base64Audio,
    mimeType: data.mimeType || 'audio/wav'
  };
}

/**
 * Síntese neural bilíngue Microsoft Azure (Instrução em PT-BR + Exemplo nativo em EN)
 * Executa síntese com duas vozes neurais e pausas calculadas via Supabase Edge Function.
 */
export async function requestAzureBilingualTTS(instructionPt, phraseEn, customKey = null, voices = null) {
  const voicePt = voices?.voicePt || AZURE_SPEECH_CONFIG.defaultVoicePt;
  const voiceEn = voices?.voiceEn || AZURE_SPEECH_CONFIG.defaultVoiceEn;

  if (!isSupabaseConfigured || !supabase?.functions) {
    throw new Error('Supabase client não está inicializado para síntese bilíngue.');
  }

  // Garante a obtenção do token JWT da sessão ativa do Supabase Auth
  let authHeaders = {};
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      authHeaders = { Authorization: `Bearer ${token}` };
    }
  } catch (tokenErr) {
    console.warn('[azure-tts-proxy] Aviso ao resolver token da sessão bilíngue:', tokenErr);
  }

  const { data, error } = await supabase.functions.invoke('azure-tts-proxy', {
    headers: authHeaders,
    body: {
      mode: 'bilingual',
      instructionPt,
      phraseEn,
      voicePt,
      voiceEn
    }
  });

  if (error || !data?.base64Audio) {
    const errorMsg = error?.message || 'Falha ao receber áudio bilíngue da Edge Function';
    console.error('[azure-tts-proxy] Erro na síntese bilíngue:', errorMsg);
    throw new Error(`Erro na síntese de voz bilíngue via backend: ${errorMsg}`);
  }

  return {
    base64Audio: data.base64Audio,
    mimeType: data.mimeType || 'audio/wav'
  };
}

/**
 * Validação rigorosa de voz: Cobertura da Frase Inteira (Word Coverage)
 * Impede que o aluno passe falando apenas pedaços isolados da frase.
 */
export function validateSpeech(transcript, expectedPhrase, sensitivity = "medium") {
  // 1. Normalização dos textos (sem pontuações, minúsculas)
  const clean = (text) => 
    (text || "")
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, "")
      .trim();

  const studentWords = clean(transcript).split(/\s+/).filter(Boolean);
  const targetWords = clean(expectedPhrase).split(/\s+/).filter(Boolean);

  if (studentWords.length === 0 || targetWords.length === 0) {
    return { passed: false, score: 0, reason: "Nenhum áudio detectado." };
  }

  // 2. Trava de Frase Incompleta:
  // Se o aluno falou menos de 75% da quantidade de palavras esperadas, reprova imediatamente
  if (studentWords.length < Math.ceil(targetWords.length * 0.75)) {
    return {
      passed: false,
      score: Math.round((studentWords.length / targetWords.length) * 100),
      reason: "Frase incompleta. Por favor, fale a frase inteira!"
    };
  }

  // 3. Contagem de palavras corretas presentes
  let matchedCount = 0;
  targetWords.forEach(word => {
    if (studentWords.includes(word)) {
      matchedCount++;
    }
  });

  const accuracy = matchedCount / targetWords.length;

  // 4. Limiares de Rigor lidos do Painel Admin (com fallback)
  const thresholds = {
    easy: 0.70,     // 70% da frase completa
    medium: 0.85,   // 85% da frase completa (Padrão)
    hard: 0.95      // 95% da frase completa
  };

  const minRequired = thresholds[sensitivity] || thresholds.medium;
  const passed = accuracy >= minRequired;

  return {
    passed,
    score: Math.round(accuracy * 100),
    matchedCount,
    totalExpected: targetWords.length,
    reason: passed 
      ? "Pronúncia excelente!" 
      : "Frase incompleta ou com pronúncia imprecisa. Tente novamente!"
  };
}

/**
 * Normaliza frases de músicas a partir dos timestamps ou lyrics
 */
function extractPhrasesFromSong(song) {
  if (!song) return [];
  const list = [];
  const rawVerses = Array.isArray(song.timestamps) && song.timestamps.length > 0
    ? song.timestamps
    : Array.isArray(song.lyrics) && song.lyrics.length > 0
      ? song.lyrics
      : [];

  rawVerses.forEach((verse, idx) => {
    const en = (verse.en || verse.english || '').trim();
    const pt = (verse.pt || verse.portuguese || '').trim();
    if (en && en.length > 2) {
      list.push({
        id: `${song.id}_phrase_${idx + 1}`,
        songId: song.id,
        songTitle: song.title,
        english: en,
        portuguese: pt,
        startTime: verse.startTime ?? null,
        endTime: verse.endTime ?? null,
        audioUrl: verse.audioUrl || verse.audio_url || verse.driveUrl || verse.drive_url || null
      });
    }
  });

  return list;
}

const SETTINGS_STORAGE_KEY = 'magic_avatar_admin_settings_v2';

// ============================================================================
// MOTOR DRIVE-FIRST DE CACHE PERMANENTE PARA MENSAGENS DINÂMICAS DA AVATAR
// ============================================================================

const K_SHA256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotr(n, x) {
  return (x >>> n) | (x << (32 - n));
}

/**
 * SHA-256 síncrono e determinístico (compatível com Browser e Node.js)
 */
export function sha256HexSync(input) {
  const utf8 = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(String(input ?? ''))
    : Uint8Array.from( unescape(encodeURIComponent(String(input ?? ''))), c => c.charCodeAt(0) );

  const bitLen = utf8.length * 8;
  const padLen = ((utf8.length + 9 + 63) & ~63);
  const msg = new Uint8Array(padLen);
  msg.set(utf8);
  msg[utf8.length] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const W = new Uint32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
      const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K_SHA256[i] + W[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(v => v.toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Normaliza texto falado para chave determinística (trim + colapso de espaços)
 */
export function normalizeAvatarSpokenText(text) {
  return String(text || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta o idioma predominante da fala da Avatar (consistente entre Admin e Aluno)
 */
export function detectAvatarSpeechLanguage(text, explicitLang = null) {
  if (explicitLang === 'pt' || explicitLang === 'en') return explicitLang;
  const t = String(text || '');
  const isPortuguese = (
    /[áàâãéèêíïóôõöúçñ]/i.test(t) ||
    /\b(olá|vamos|muito|bem|treino|tempo|continuar|parabéns|praticar|você|hoje|quase|escutem|escute|repita|frase|inteira|aluno|novamente|que|bom|gostei|ótimo|ótima|pronta|pronto|maravilha|uau|estou|caminho|certo|não|descanse|excelente)\b/i.test(t)
  );
  return isPortuguese ? 'pt' : 'en';
}

/**
 * Resolve o professor ativo com base nas configurações
 */
export function resolveActiveTeacherPreset(settings = DEFAULT_AVATAR_SETTINGS) {
  return (
    TEACHER_PRESETS.find(t => t.id === settings?.teacherPresetId) ||
    TEACHER_PRESETS.find(t => t.modelUrl === settings?.modelUrl) ||
    TEACHER_PRESETS[0]
  );
}

/**
 * Gera chave/hash determinístico público para um segmento de áudio da Avatar.
 * Considera: versão + voz + idioma + texto normalizado.
 */
export function computeAvatarAudioHash({
  text,
  lang = null,
  voice = null,
  version = AVATAR_AUDIO_SYNTHESIS_VERSION
}) {
  const normText = normalizeAvatarSpokenText(text);
  const resolvedLang = detectAvatarSpeechLanguage(normText, lang);
  const resolvedVoice = String(
    voice || (resolvedLang === 'pt' ? AZURE_SPEECH_CONFIG.defaultVoicePt : AZURE_SPEECH_CONFIG.defaultVoiceEn)
  ).trim();
  const canonicalInput = `${version}|${resolvedVoice}|${resolvedLang}|${normText}`;
  return sha256HexSync(canonicalInput).slice(0, 24);
}

/**
 * Gera chave determinística PRIVADA para trecho com nome do aluno.
 * NUNCA expõe o nome do aluno na chave ou em arquivos públicos.
 */
export function computePrivateStudentAudioHash({
  userId = 'guest',
  text,
  lang = null,
  voice = null,
  version = AVATAR_AUDIO_SYNTHESIS_VERSION
}) {
  const normText = normalizeAvatarSpokenText(text);
  const resolvedLang = detectAvatarSpeechLanguage(normText, lang);
  const resolvedVoice = String(
    voice || (resolvedLang === 'pt' ? AZURE_SPEECH_CONFIG.defaultVoicePt : AZURE_SPEECH_CONFIG.defaultVoiceEn)
  ).trim();
  const safeUser = String(userId || 'guest').trim();
  return 'priv_' + sha256HexSync(`${version}|${safeUser}|${resolvedVoice}|${resolvedLang}|${normText}`).slice(0, 24);
}

/**
 * Extrai dinamicamente todas as linhas válidas de um campo de mensagens do Admin.
 * Suporta qualquer quantidade de linhas (1, 2, 3, 6, 10, 50...), sem números fixos.
 */
export function parseDynamicMessageLines(textOrArray) {
  if (!textOrArray) return [];
  const rawLines = Array.isArray(textOrArray)
    ? textOrArray
    : String(textOrArray).split(/\r?\n/);

  const seen = new Set();
  const result = [];
  for (const line of rawLines) {
    const clean = normalizeAvatarSpokenText(line);
    if (clean.length > 0 && !seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
    }
  }
  return result;
}

/**
 * Constrói versão neutra e natural de uma frase removendo {nome_aluno} e vírgulas adjacentes.
 * Ex: "Olá, {nome_aluno}! Tudo bem?" -> "Olá! Tudo bem?"
 */
export function buildNeutralAvatarText(templateText) {
  if (!templateText) return '';
  return String(templateText)
    .replace(/,\s*\{nome_aluno\}/gi, '')
    .replace(/\{nome_aluno\}\s*,/gi, '')
    .replace(/\s+\{nome_aluno\}/gi, '')
    .replace(/\{nome_aluno\}\s+/gi, '')
    .replace(/\{nome_aluno\}/gi, '')
    .replace(/\s+([!?.:,;])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Divide um template de mensagem em cláusulas naturais (por pontuação ! ? .)
 * separando trechos pessoais ({nome_aluno}) de trechos estáticos/públicos reutilizáveis no Google Drive.
 * Agrupa frases estáticas adjacentes em um único segmento contínuo para preservar a naturalidade.
 */
export function splitAvatarMessageClauses(templateText) {
  const norm = normalizeAvatarSpokenText(templateText);
  if (!norm) return [];

  if (!/\{nome_aluno\}/i.test(norm)) {
    return [{
      template: norm,
      hasStudentName: false,
      hasSongTitle: /\{titulo_musica\}/i.test(norm),
      isStaticPublic: true
    }];
  }

  // Divide mantendo pontuação final de cada sentença (!, ?, .)
  const rawSentences = norm
    .split(/(?<=[!?.])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (rawSentences.length <= 1) {
    return [{
      template: norm,
      hasStudentName: true,
      hasSongTitle: /\{titulo_musica\}/i.test(norm),
      isStaticPublic: false
    }];
  }

  const mergedClauses = [];
  for (const sentence of rawSentences) {
    const hasStudentName = /\{nome_aluno\}/i.test(sentence);
    const isStaticPublic = !hasStudentName;
    const prev = mergedClauses[mergedClauses.length - 1];

    if (prev && prev.isStaticPublic && isStaticPublic) {
      prev.template = `${prev.template} ${sentence}`;
      prev.hasSongTitle = prev.hasSongTitle || /\{titulo_musica\}/i.test(sentence);
    } else {
      mergedClauses.push({
        template: sentence,
        hasStudentName,
        hasSongTitle: /\{titulo_musica\}/i.test(sentence),
        isStaticPublic
      });
    }
  }

  return mergedClauses;
}

/**
 * Extrai todos os segmentos públicos reutilizáveis para as 5 categorias do Painel Admin.
 * NUNCA inclui nomes pessoais de alunos.
 */
export function extractReusablePublicSegmentsForSettings(
  settings = DEFAULT_AVATAR_SETTINGS,
  songTitles = ['Magic English']
) {
  const activeTeacher = resolveActiveTeacherPreset(settings);
  const cleanSongTitles = Array.from(
    new Set(
      [...(Array.isArray(songTitles) ? songTitles : []), 'Magic English', 'Magic English - Aprenda Inglês com Música']
        .map(t => String(t || '').trim())
        .filter(Boolean)
    )
  );

  const segmentsMap = new Map();

  const registerPublicSegment = (text, category, segmentKind, sourceTemplate) => {
    const cleanText = normalizeAvatarSpokenText(text);
    if (!cleanText || /\{nome_aluno\}|\{titulo_musica\}/i.test(cleanText)) return;

    const lang = detectAvatarSpeechLanguage(cleanText);
    const voice = lang === 'pt' ? activeTeacher.voicePt : activeTeacher.voiceEn;
    const hash = computeAvatarAudioHash({ text: cleanText, lang, voice });

    if (!segmentsMap.has(hash)) {
      segmentsMap.set(hash, {
        hash,
        text: cleanText,
        category,
        lang,
        voice,
        teacherId: activeTeacher.id,
        segmentKind,
        sourceTemplate: normalizeAvatarSpokenText(sourceTemplate),
        fileName: `msg_${hash}.wav`
      });
    }
  };

  for (const catDef of AVATAR_MESSAGE_CATEGORIES) {
    const rawValue = settings?.[catDef.field] ?? DEFAULT_AVATAR_SETTINGS[catDef.field] ?? '';
    const lines = parseDynamicMessageLines(rawValue);

    if (catDef.category === 'encorajamentos') {
      const partialNorm = normalizeAvatarSpokenText(PARTIAL_PHRASE_RETRY_MESSAGE);
      if (!lines.includes(partialNorm)) {
        lines.push(partialNorm);
      }
    }

    for (const line of lines) {
      const hasSongTag = /\{titulo_musica\}/i.test(line);
      const titleVariants = hasSongTag ? cleanSongTitles : ['Magic English'];

      for (const songTitle of titleVariants) {
        const lineWithSong = line.replace(/\{titulo_musica\}/gi, songTitle);

        if (!/\{nome_aluno\}/i.test(lineWithSong)) {
          // Mensagem 100% pública/estática
          registerPublicSegment(lineWithSong, catDef.category, 'full_static', line);
        } else {
          // 1. Versão neutra completa (fallback público imediato custo zero)
          const neutralFull = buildNeutralAvatarText(lineWithSong);
          if (neutralFull) {
            registerPublicSegment(neutralFull, catDef.category, 'neutral_full', line);
          }

          // 2. Cláusulas estáticas/públicas separadas do trecho {nome_aluno}
          const clauses = splitAvatarMessageClauses(lineWithSong);
          for (const clause of clauses) {
            if (clause.isStaticPublic) {
              registerPublicSegment(clause.template, catDef.category, 'static_clause', line);
            } else {
              const neutralClause = buildNeutralAvatarText(clause.template);
              if (neutralClause) {
                registerPublicSegment(neutralClause, catDef.category, 'neutral_clause', line);
              }
            }
          }
        }
      }
    }
  }

  return Array.from(segmentsMap.values());
}

// Cache em memória e registro de requisições em voo (in-flight deduplication)
const memoryAudioBase64Cache = new Map();
const inFlightTtsPromises = new Map();
let cachedCatalogMemory = null;

export const avatarAudioTelemetry = {
  azureCallsCount: 0,
  driveSharedHitsCount: 0,
  privateCacheHitsCount: 0,
  inFlightDeduplicatedCount: 0,
  composedPlaybackCount: 0,
  lastResolutionSource: null,
  reset() {
    this.azureCallsCount = 0;
    this.driveSharedHitsCount = 0;
    this.privateCacheHitsCount = 0;
    this.inFlightDeduplicatedCount = 0;
    this.composedPlaybackCount = 0;
    this.lastResolutionSource = null;
  }
};

// Persistência local em IndexedDB (com fallback seguro em memória/localStorage)
const IDB_NAME = 'magic_avatar_audio_cache_db';
const IDB_STORE = 'audio_blobs_v1';

function openAvatarAudioIDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

export async function getLocalCachedAudioBase64(key) {
  if (!key) return null;
  if (memoryAudioBase64Cache.has(key)) {
    return memoryAudioBase64Cache.get(key);
  }
  const db = await openAvatarAudioIDB();
  if (db) {
    const fromIdb = await new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result?.base64Audio || null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
    if (fromIdb) {
      memoryAudioBase64Cache.set(key, fromIdb);
      return fromIdb;
    }
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`magic_av_aud_${key}`);
      if (raw) {
        memoryAudioBase64Cache.set(key, raw);
        return raw;
      }
    }
  } catch (_) {}
  return null;
}

export async function setLocalCachedAudioBase64(key, base64Audio) {
  if (!key || !base64Audio) return;
  const clean = String(base64Audio).replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');
  memoryAudioBase64Cache.set(key, clean);

  const db = await openAvatarAudioIDB();
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ key, base64Audio: clean, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  } else {
    try {
      if (typeof localStorage !== 'undefined' && clean.length < 180000) {
        localStorage.setItem(`magic_av_aud_${key}`, clean);
      }
    } catch (_) {}
  }
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}

export function base64ToArrayBufferSafe(base64) {
  const clean = String(base64 || '').replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binaryString = atob(clean);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const buf = Buffer.from(clean, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Combina múltiplos AudioBuffers em um único AudioBuffer contínuo para o TalkingHead
 */
export function concatAudioBuffers(audioCtx, buffers, gapSeconds = 0.04) {
  const valid = (buffers || []).filter(Boolean);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];

  const sampleRate = valid[0].sampleRate || 24000;
  const gapSamples = Math.max(0, Math.round(gapSeconds * sampleRate));
  const totalLength = valid.reduce((acc, b, idx) => acc + b.length + (idx < valid.length - 1 ? gapSamples : 0), 0);

  const combined = audioCtx.createBuffer(1, totalLength, sampleRate);
  const outData = combined.getChannelData(0);

  let offset = 0;
  valid.forEach((buf, idx) => {
    const chData = buf.getChannelData(0);
    outData.set(chData, offset);
    offset += buf.length;
    if (idx < valid.length - 1) {
      offset += gapSamples;
    }
  });

  return combined;
}

/**
 * Síntese Azure protegida contra chamadas duplicadas concorrentes (in-flight deduplication)
 */
export async function synthesizeWithDeduplication(text, lang, voice, customTtsFn = null) {
  const hash = computeAvatarAudioHash({ text, lang, voice });
  if (inFlightTtsPromises.has(hash)) {
    avatarAudioTelemetry.inFlightDeduplicatedCount += 1;
    return inFlightTtsPromises.get(hash);
  }

  const synthFn = customTtsFn || requestAzureTTS;
  const promise = (async () => {
    try {
      avatarAudioTelemetry.azureCallsCount += 1;
      const res = await synthFn(text, lang, null, voice);
      return res;
    } finally {
      inFlightTtsPromises.delete(hash);
    }
  })();

  inFlightTtsPromises.set(hash, promise);
  return promise;
}

export const avatarPracticeService = {
  /**
   * Obtém as configurações do avatar salvas no app_settings com prioridade em cache local
   */
  async getSettings() {
    let settings = { ...DEFAULT_AVATAR_SETTINGS };

    // 1. Tenta carregar do cache local imediato
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        settings = { ...settings, ...JSON.parse(cached) };
      }
    } catch (_) {}

    // 2. Sincroniza com o Supabase se disponível
    try {
      const res = await communityService.getAppSettings('avatar_settings');
      if (res?.data && typeof res.data === 'object') {
        settings = { ...settings, ...res.data };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch (err) {
      console.warn('Aviso ao carregar avatar_settings do banco:', err);
    }

    return settings;
  },

  /**
   * Salva configurações do avatar no app_settings (apenas admin) com cache imediato
   */
  async saveSettings(settings) {
    // Salva imediatamente em cache local para efeito instantâneo em todas as abas
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
    return communityService.updateAppSettings('avatar_settings', settings);
  },

  /**
   * Obtém o catálogo compartilhado de áudios das mensagens da Avatar (Supabase app_settings + cache local)
   */
  async getAvatarAudioCatalog(forceRefresh = false) {
    if (!forceRefresh && cachedCatalogMemory && cachedCatalogMemory.items) {
      return cachedCatalogMemory;
    }

    let catalog = {
      version: AVATAR_AUDIO_SYNTHESIS_VERSION,
      updatedAt: cachedCatalogMemory?.updatedAt || null,
      items: { ...(cachedCatalogMemory?.items || {}) }
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const localRaw = localStorage.getItem(AVATAR_AUDIO_CATALOG_STORAGE_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && typeof parsed.items === 'object') {
            catalog = { ...catalog, ...parsed, items: { ...parsed.items } };
          }
        }
      }
    } catch (_) {}

    try {
      const res = await communityService.getAppSettings(AVATAR_AUDIO_CATALOG_APP_KEY);
      if (res?.data && typeof res.data === 'object' && typeof res.data.items === 'object') {
        catalog = {
          version: res.data.version || AVATAR_AUDIO_SYNTHESIS_VERSION,
          updatedAt: res.data.updatedAt || null,
          items: { ...catalog.items, ...res.data.items }
        };
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(AVATAR_AUDIO_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
          }
        } catch (_) {}
      }
    } catch (_) {}

    cachedCatalogMemory = catalog;
    return catalog;
  },

  /**
   * Persiste o catálogo compartilhado de áudios das mensagens da Avatar no Supabase e localStorage
   */
  async saveAvatarAudioCatalog(catalog) {
    const normalizedCatalog = {
      version: AVATAR_AUDIO_SYNTHESIS_VERSION,
      updatedAt: new Date().toISOString(),
      items: catalog?.items || {}
    };
    cachedCatalogMemory = normalizedCatalog;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AVATAR_AUDIO_CATALOG_STORAGE_KEY, JSON.stringify(normalizedCatalog));
      }
    } catch (_) {}

    return communityService.updateAppSettings(AVATAR_AUDIO_CATALOG_APP_KEY, normalizedCatalog);
  },

  /**
   * Recupera um buffer WAV compartilhado pelo hash (IndexedDB -> Google Drive -> Supabase Shared WAV)
   * NUNCA chama a Azure.
   */
  async getSharedAudioBase64ByHash(hash, catalogEntry = null) {
    if (!hash) return null;

    // 1. Cache rápido local (Memória / IndexedDB)
    const localBase64 = await getLocalCachedAudioBase64(hash);
    if (localBase64) {
      return { base64Audio: localBase64, source: 'local_shared_cache' };
    }

    // 2. Google Drive (se houver URL registrada no catálogo)
    const driveUrl = catalogEntry?.driveUrl || catalogEntry?.url || null;
    if (driveUrl) {
      const driveRes = await fetchDriveAudioArrayBuffer(driveUrl);
      if (driveRes.ok && driveRes.arrayBuffer) {
        const b64 = arrayBufferToBase64(driveRes.arrayBuffer);
        await setLocalCachedAudioBase64(hash, b64);
        return { base64Audio: b64, source: 'google_drive' };
      }
    }

    // 3. Fallback compartilhado no Supabase app_settings (à prova de CORS entre dispositivos/navegadores)
    try {
      const sharedRes = await communityService.getAppSettings(`avatar_audio_wav_${hash}`);
      if (sharedRes?.data?.base64Audio) {
        await setLocalCachedAudioBase64(hash, sharedRes.data.base64Audio);
        return { base64Audio: sharedRes.data.base64Audio, source: 'supabase_shared_wav' };
      }
    } catch (_) {}

    return null;
  },

  /**
   * Calcula o diagnóstico de cobertura do catálogo para as configurações atuais
   */
  async getAvatarMessagesCacheStatus(settings = DEFAULT_AVATAR_SETTINGS, songTitles = null) {
    let resolvedSongTitles = songTitles;
    if (!Array.isArray(resolvedSongTitles) || resolvedSongTitles.length === 0) {
      try {
        const { data: songs } = await songsService.getSongs();
        resolvedSongTitles = Array.isArray(songs) && songs.length > 0
          ? songs.map(s => s.title).filter(Boolean)
          : ['Vamos aprender ingles juntos', 'Magic English'];
      } catch (_) {
        resolvedSongTitles = ['Vamos aprender ingles juntos', 'Magic English'];
      }
    }

    const segments = extractReusablePublicSegmentsForSettings(settings, resolvedSongTitles);
    const catalog = await this.getAvatarAudioCatalog();

    const byCategory = {};
    for (const cat of AVATAR_MESSAGE_CATEGORIES) {
      const lines = parseDynamicMessageLines(settings?.[cat.field] ?? DEFAULT_AVATAR_SETTINGS[cat.field]);
      byCategory[cat.category] = {
        label: cat.label,
        field: cat.field,
        linesCount: lines.length,
        totalSegments: 0,
        cachedSegments: 0,
        driveUploadedSegments: 0,
        missingSegments: 0
      };
    }

    let totalCached = 0;
    let totalDriveUploaded = 0;
    let totalMissing = 0;

    for (const seg of segments) {
      const entry = catalog?.items?.[seg.hash];
      const hasLocalMemory = memoryAudioBase64Cache.has(seg.hash);
      const isCached = Boolean(entry && (entry.driveUrl || entry.sharedWavStored || hasLocalMemory));
      const isDrive = Boolean(entry && entry.driveUrl && entry.storageStatus === 'DRIVE_READY');

      if (byCategory[seg.category]) {
        byCategory[seg.category].totalSegments += 1;
        if (isCached) byCategory[seg.category].cachedSegments += 1;
        else byCategory[seg.category].missingSegments += 1;
        if (isDrive) byCategory[seg.category].driveUploadedSegments += 1;
      }

      if (isCached) totalCached += 1;
      else totalMissing += 1;
      if (isDrive) totalDriveUploaded += 1;
    }

    return {
      totalSegments: segments.length,
      totalCached,
      totalDriveUploaded,
      totalMissing,
      isFullyCached: totalMissing === 0 && segments.length > 0,
      byCategory,
      segments
    };
  },

  /**
   * Pré-gera e sincroniza todos os segmentos públicos reutilizáveis das 5 categorias da Professora Avatar.
   * - Reutiliza áudios já existentes no catálogo/Google Drive sem chamar a Azure.
   * - Gera apenas o que estiver ausente.
   * - Nunca grava {nome_aluno} real em arquivo público.
   */
  async pregenerateAvatarMessagesAudio(settings = DEFAULT_AVATAR_SETTINGS, options = {}) {
    const {
      onProgress = null,
      songTitles = null,
      customTtsFn = null,
      customDriveUploadFn = null,
      customDriveCheckFn = null
    } = options;

    let resolvedSongTitles = songTitles;
    if (!Array.isArray(resolvedSongTitles) || resolvedSongTitles.length === 0) {
      try {
        const { data: songs } = await songsService.getSongs();
        resolvedSongTitles = Array.isArray(songs) && songs.length > 0
          ? songs.map(s => s.title).filter(Boolean)
          : ['Vamos aprender ingles juntos', 'Magic English'];
      } catch (_) {
        resolvedSongTitles = ['Vamos aprender ingles juntos', 'Magic English'];
      }
    }

    const segments = extractReusablePublicSegmentsForSettings(settings, resolvedSongTitles);
    const catalog = await this.getAvatarAudioCatalog();
    const items = { ...(catalog.items || {}) };

    let reusedCount = 0;
    let generatedCount = 0;
    let driveUploadedCount = 0;
    let sharedCacheReadyCount = 0;
    let failedCount = 0;
    const errors = [];

    const checkDriveFn = customDriveCheckFn || checkExistingDriveAvatarMessageAudio;
    const uploadDriveFn = customDriveUploadFn || uploadAvatarMessageAudioToDrive;

    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      const existing = items[seg.hash];

      if (typeof onProgress === 'function') {
        try {
          onProgress({
            current: idx + 1,
            total: segments.length,
            segment: seg,
            reusedCount,
            generatedCount,
            driveUploadedCount,
            sharedCacheReadyCount,
            failedCount
          });
        } catch (_) {}
      }

      try {
        // 1. Verifica se já existe no catálogo compartilhado com áudio válido
        if (existing && (existing.driveUrl || existing.sharedWavStored)) {
          const cachedAudio = await this.getSharedAudioBase64ByHash(seg.hash, existing);

          if (cachedAudio?.base64Audio) {
            // Se já estava no cache compartilhado mas ainda não tinha driveUrl (ex: antes do deploy do Apps Script V2.2),
            // tenta enviar ao Google Drive usando o WAV já existente, SEM chamar a Azure!
            if (!existing.driveUrl) {
              const upRes = await uploadDriveFn({
                messageHash: seg.hash,
                category: seg.category,
                voice: seg.voice,
                lang: seg.lang,
                base64: cachedAudio.base64Audio
              });
              if (upRes?.uploadedToDrive && upRes.url) {
                items[seg.hash] = {
                  ...existing,
                  fileId: upRes.fileId,
                  driveUrl: upRes.url,
                  directUrl: upRes.directUrl || upRes.url,
                  folderPath: upRes.folderPath,
                  storageStatus: 'DRIVE_READY',
                  updatedAt: new Date().toISOString()
                };
                driveUploadedCount += 1;
              } else {
                sharedCacheReadyCount += 1;
              }
            } else {
              driveUploadedCount += 1;
            }

            reusedCount += 1;
            continue;
          }
        }

        // 2. Consulta prévia no Google Drive (reaproveitamento custo zero se o arquivo já existir na pasta oficial)
        const existingOnDrive = await checkDriveFn({
          messageHash: seg.hash,
          category: seg.category,
          voice: seg.voice,
          lang: seg.lang
        });

        if (existingOnDrive?.exists && existingOnDrive.url) {
          items[seg.hash] = {
            hash: seg.hash,
            category: seg.category,
            voice: seg.voice,
            lang: seg.lang,
            text: seg.text,
            segmentKind: seg.segmentKind,
            fileName: seg.fileName,
            fileId: existingOnDrive.fileId || null,
            driveUrl: existingOnDrive.url,
            directUrl: existingOnDrive.directUrl || existingOnDrive.url,
            folderPath: existingOnDrive.folderPath || `Mensagens Avatar / ${seg.voice} / ${seg.lang} / ${seg.category}`,
            sharedWavStored: Boolean(existing?.sharedWavStored),
            storageStatus: 'DRIVE_READY',
            updatedAt: new Date().toISOString()
          };
          reusedCount += 1;
          driveUploadedCount += 1;
          continue;
        }

        // 3. Geração única via Azure TTS (com deduplicação in-flight)
        const ttsResult = await synthesizeWithDeduplication(seg.text, seg.lang, seg.voice, customTtsFn);
        const cleanBase64 = String(ttsResult.base64Audio || '')
          .replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '')
          .replace(/\s+/g, '');

        if (!cleanBase64) {
          throw new Error('Áudio sintetizado retornou vazio.');
        }

        // 4. Salva imediatamente no cache local (IndexedDB) e no cache compartilhado do Supabase (app_settings)
        await setLocalCachedAudioBase64(seg.hash, cleanBase64);
        let sharedStored = false;
        try {
          const saveWavRes = await communityService.updateAppSettings(`avatar_audio_wav_${seg.hash}`, {
            hash: seg.hash,
            category: seg.category,
            voice: seg.voice,
            lang: seg.lang,
            base64Audio: cleanBase64,
            mimeType: ttsResult.mimeType || 'audio/wav',
            updatedAt: new Date().toISOString()
          });
          sharedStored = Boolean(saveWavRes?.success);
        } catch (_) {}

        // 5. Envia ao Google Drive (Mensagens Avatar / <Voz> / <Idioma> / <Categoria> / msg_<Hash>.wav)
        const driveUpload = await uploadDriveFn({
          messageHash: seg.hash,
          category: seg.category,
          voice: seg.voice,
          lang: seg.lang,
          base64: cleanBase64
        });

        items[seg.hash] = {
          hash: seg.hash,
          category: seg.category,
          voice: seg.voice,
          lang: seg.lang,
          text: seg.text,
          segmentKind: seg.segmentKind,
          fileName: seg.fileName,
          fileId: driveUpload?.fileId || null,
          driveUrl: driveUpload?.uploadedToDrive ? driveUpload.url : null,
          directUrl: driveUpload?.uploadedToDrive ? (driveUpload.directUrl || driveUpload.url) : null,
          folderPath: driveUpload?.folderPath || `Mensagens Avatar / ${seg.voice} / ${seg.lang} / ${seg.category}`,
          sharedWavStored: sharedStored || true,
          storageStatus: driveUpload?.uploadedToDrive ? 'DRIVE_READY' : 'SHARED_CACHE_READY',
          pendingBackendDeploy: Boolean(driveUpload?.pendingBackendDeploy),
          updatedAt: new Date().toISOString()
        };

        generatedCount += 1;
        if (driveUpload?.uploadedToDrive) {
          driveUploadedCount += 1;
        } else {
          sharedCacheReadyCount += 1;
        }
      } catch (segErr) {
        failedCount += 1;
        errors.push({
          hash: seg.hash,
          category: seg.category,
          error: segErr?.message || String(segErr)
        });
      }
    }

    const updatedCatalog = {
      version: AVATAR_AUDIO_SYNTHESIS_VERSION,
      updatedAt: new Date().toISOString(),
      items
    };
    await this.saveAvatarAudioCatalog(updatedCatalog);

    const finalStatus = await this.getAvatarMessagesCacheStatus(settings, resolvedSongTitles);

    return {
      totalSegments: segments.length,
      reusedCount,
      generatedCount,
      driveUploadedCount,
      sharedCacheReadyCount,
      failedCount,
      errors,
      catalog: updatedCatalog,
      status: finalStatus
    };
  },

  /**
   * Promove em background (não-bloqueante) um WAV público já existente em cache local/compartilhado
   * para a pasta oficial do Google Drive:
   * Magic English - Áudios do Avatar (Oficial) [165Y0jB82ROZY74b1EgfG-xgMXzJ9RR7J]
   * └── Mensagens Avatar / <Voz> / <Idioma> / <Categoria> / msg_<hash>.wav
   * NUNCA chama a Azure (reutiliza exclusivamente o base64Audio já existente).
   */
  syncPublicSegmentToDriveInBackground({
    hash,
    category = 'geral',
    voice,
    lang,
    text,
    segmentKind = 'full_static',
    base64Audio
  }) {
    if (!hash || !base64Audio || !voice || !lang) return;
    if (!this._inFlightDrivePromotions) {
      this._inFlightDrivePromotions = new Set();
    }
    if (this._inFlightDrivePromotions.has(hash)) return;
    this._inFlightDrivePromotions.add(hash);

    Promise.resolve().then(async () => {
      try {
        const cleanBase64 = String(base64Audio)
          .replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '')
          .replace(/\s+/g, '');
        if (!cleanBase64) return;

        const upRes = await uploadAvatarMessageAudioToDrive({
          messageHash: hash,
          category: category || 'geral',
          voice,
          lang,
          base64: cleanBase64
        });

        if (upRes?.uploadedToDrive && upRes.url) {
          const currentCatalog = await this.getAvatarAudioCatalog();
          const currentEntry = currentCatalog?.items?.[hash] || {};
          const nextItems = {
            ...(currentCatalog?.items || {}),
            [hash]: {
              ...currentEntry,
              hash,
              category: category || currentEntry.category || 'geral',
              voice,
              lang,
              text: text || currentEntry.text || '',
              segmentKind: currentEntry.segmentKind || segmentKind,
              fileName: `msg_${hash}.wav`,
              fileId: upRes.fileId || currentEntry.fileId || null,
              driveUrl: upRes.url,
              directUrl: upRes.directUrl || upRes.url,
              folderPath: upRes.folderPath || `Mensagens Avatar / ${voice} / ${lang} / ${category || 'geral'}`,
              storageStatus: 'DRIVE_READY',
              updatedAt: new Date().toISOString()
            }
          };
          await this.saveAvatarAudioCatalog({
            version: AVATAR_AUDIO_SYNTHESIS_VERSION,
            updatedAt: new Date().toISOString(),
            items: nextItems
          });
        }
      } catch (_) {
        // Falha silenciosa em background: o áudio já está garantido no IndexedDB/cache local
      } finally {
        this._inFlightDrivePromotions.delete(hash);
      }
    });
  },

  /**
   * Resolve a fala da Professora Avatar em modo Drive-First para o aluno:
   * 1. Mensagens estáticas ou com {titulo_musica}: 100% do catálogo compartilhado / Google Drive (0 chamadas Azure).
   * 2. Mensagens com {nome_aluno}:
   *    - Divide em cláusula pessoal + cláusula(s) estática(s) do Google Drive.
   *    - Cláusula estática vem 100% do Google Drive / catálogo compartilhado (0 chamadas Azure).
   *    - Cláusula pessoal vem do cache privado persistente do aluno (IndexedDB) ou, se o nome for genérico/offline,
   *      usa a cláusula neutra pública pré-gerada no Google Drive!
   * 3. Retorna array de { base64Audio, mimeType, source } pronto para decodificação e concatenação em AudioBuffer.
   */
  async resolveStudentMessageAudioSegments({
    text,
    rawTemplate = null,
    category = 'geral',
    studentName = 'Aluno',
    songTitle = 'Magic English',
    userId = 'guest',
    settings = DEFAULT_AVATAR_SETTINGS,
    explicitLang = null,
    customTtsFn = null
  }) {
    const normSpoken = normalizeAvatarSpokenText(text);
    if (!normSpoken) return { segments: [], source: 'empty', azureCallsTriggered: 0 };

    const activeTeacher = resolveActiveTeacherPreset(settings);
    const speechLang = detectAvatarSpeechLanguage(normSpoken, explicitLang);
    const activeVoice = speechLang === 'pt' ? activeTeacher.voicePt : activeTeacher.voiceEn;
    const catalog = await this.getAvatarAudioCatalog();
    const azureBefore = avatarAudioTelemetry.azureCallsCount;

    // PASSO 1: Verifica se a frase inteira já existe no Catálogo Compartilhado (mensagens estáticas, encorajamentos, neutras)
    const fullHash = computeAvatarAudioHash({ text: normSpoken, lang: speechLang, voice: activeVoice });
    const fullEntry = catalog?.items?.[fullHash] || null;
    const sharedFull = await this.getSharedAudioBase64ByHash(fullHash, fullEntry);

    if (sharedFull?.base64Audio) {
      avatarAudioTelemetry.driveSharedHitsCount += 1;
      avatarAudioTelemetry.lastResolutionSource = sharedFull.source;
      // Se o áudio já estava no IndexedDB local mas ainda não tinha driveUrl registrada no catálogo, promove para a pasta oficial do Drive sem chamar Azure
      if (!fullEntry?.driveUrl && !customTtsFn) {
        this.syncPublicSegmentToDriveInBackground({
          hash: fullHash,
          category,
          voice: activeVoice,
          lang: speechLang,
          text: normSpoken,
          segmentKind: 'full_static',
          base64Audio: sharedFull.base64Audio
        });
      }
      return {
        segments: [{ base64Audio: sharedFull.base64Audio, mimeType: 'audio/wav', source: sharedFull.source, hash: fullHash }],
        source: sharedFull.source,
        azureCallsTriggered: 0
      };
    }

    // PASSO 2: Verifica se a frase inteira já está no Cache Privado do Aluno (para frases com {nome_aluno} no meio)
    const fullPrivateHash = computePrivateStudentAudioHash({
      userId,
      text: normSpoken,
      lang: speechLang,
      voice: activeVoice
    });
    const cachedFullPrivate = await getLocalCachedAudioBase64(fullPrivateHash);
    if (cachedFullPrivate) {
      avatarAudioTelemetry.privateCacheHitsCount += 1;
      avatarAudioTelemetry.lastResolutionSource = 'student_private_cache';
      return {
        segments: [{ base64Audio: cachedFullPrivate, mimeType: 'audio/wav', source: 'student_private_cache', hash: fullPrivateHash }],
        source: 'student_private_cache',
        azureCallsTriggered: 0
      };
    }

    // PASSO 3: Se temos um template com {nome_aluno}, verifica se o aluno usa nome genérico ("Aluno") ou se podemos compor cláusulas
    const effectiveTemplate = rawTemplate && /\{nome_aluno\}/i.test(rawTemplate) ? rawTemplate : null;
    const cleanStudentName = String(studentName || '').trim();
    const isGenericStudentName = !cleanStudentName || /^(aluno|aluna|student|visitante|guest)$/i.test(cleanStudentName);

    if (effectiveTemplate) {
      const templateWithSong = effectiveTemplate.replace(/\{titulo_musica\}/gi, songTitle || 'Magic English');

      // 3A. Se o aluno não tem nome personalizado definido ("Aluno"), usa a versão neutra completa do Google Drive (0 chamadas Azure!)
      if (isGenericStudentName) {
        const neutralFullText = buildNeutralAvatarText(templateWithSong);
        const neutralHash = computeAvatarAudioHash({ text: neutralFullText, lang: speechLang, voice: activeVoice });
        const neutralEntry = catalog?.items?.[neutralHash] || null;
        const neutralShared = await this.getSharedAudioBase64ByHash(neutralHash, neutralEntry);
        if (neutralShared?.base64Audio) {
          avatarAudioTelemetry.driveSharedHitsCount += 1;
          avatarAudioTelemetry.lastResolutionSource = neutralShared.source;
          if (!neutralEntry?.driveUrl && !customTtsFn) {
            this.syncPublicSegmentToDriveInBackground({
              hash: neutralHash,
              category,
              voice: activeVoice,
              lang: speechLang,
              text: neutralFullText,
              segmentKind: 'neutral_full',
              base64Audio: neutralShared.base64Audio
            });
          }
          return {
            segments: [{ base64Audio: neutralShared.base64Audio, mimeType: 'audio/wav', source: neutralShared.source, hash: neutralHash }],
            source: neutralShared.source,
            azureCallsTriggered: 0
          };
        }
      }

      // 3B. Composição de Cláusulas: [Trecho Pessoal em Cache Privado] + [Trecho Estático do Google Drive]
      const clauses = splitAvatarMessageClauses(templateWithSong);
      if (clauses.length > 1 && clauses.some(c => c.isStaticPublic)) {
        const resolvedSegments = [];
        let allClausesResolved = true;

        for (const clause of clauses) {
          const clauseLang = detectAvatarSpeechLanguage(clause.template, explicitLang);
          const clauseVoice = clauseLang === 'pt' ? activeTeacher.voicePt : activeTeacher.voiceEn;

          if (clause.isStaticPublic) {
            const staticHash = computeAvatarAudioHash({ text: clause.template, lang: clauseLang, voice: clauseVoice });
            const staticEntry = catalog?.items?.[staticHash] || null;
            const staticShared = await this.getSharedAudioBase64ByHash(staticHash, staticEntry);
            if (staticShared?.base64Audio) {
              avatarAudioTelemetry.driveSharedHitsCount += 1;
              if (!staticEntry?.driveUrl && !customTtsFn) {
                this.syncPublicSegmentToDriveInBackground({
                  hash: staticHash,
                  category,
                  voice: clauseVoice,
                  lang: clauseLang,
                  text: clause.template,
                  segmentKind: 'static_clause',
                  base64Audio: staticShared.base64Audio
                });
              }
              resolvedSegments.push({
                base64Audio: staticShared.base64Audio,
                mimeType: 'audio/wav',
                source: staticShared.source,
                hash: staticHash
              });
            } else {
              // Se a cláusula estática ainda não estava no catálogo, sintetiza uma vez e salva no cache local/compartilhado + pasta oficial do Drive
              try {
                const ttsStatic = await synthesizeWithDeduplication(clause.template, clauseLang, clauseVoice, customTtsFn);
                await setLocalCachedAudioBase64(staticHash, ttsStatic.base64Audio);
                if (!customTtsFn) {
                  this.syncPublicSegmentToDriveInBackground({
                    hash: staticHash,
                    category,
                    voice: clauseVoice,
                    lang: clauseLang,
                    text: clause.template,
                    segmentKind: 'static_clause',
                    base64Audio: ttsStatic.base64Audio
                  });
                }
                resolvedSegments.push({
                  base64Audio: ttsStatic.base64Audio,
                  mimeType: ttsStatic.mimeType || 'audio/wav',
                  source: 'azure_static_clause_once',
                  hash: staticHash
                });
              } catch (_) {
                allClausesResolved = false;
                break;
              }
            }
          } else {
            // Cláusula com {nome_aluno}
            const personalText = normalizeAvatarSpokenText(clause.template.replace(/\{nome_aluno\}/gi, cleanStudentName));
            const privClauseHash = computePrivateStudentAudioHash({
              userId,
              text: personalText,
              lang: clauseLang,
              voice: clauseVoice
            });

            const cachedPrivClause = await getLocalCachedAudioBase64(privClauseHash);
            if (cachedPrivClause) {
              avatarAudioTelemetry.privateCacheHitsCount += 1;
              resolvedSegments.push({
                base64Audio: cachedPrivClause,
                mimeType: 'audio/wav',
                source: 'student_private_clause_cache',
                hash: privClauseHash
              });
            } else {
              try {
                const ttsPersonal = await synthesizeWithDeduplication(personalText, clauseLang, clauseVoice, customTtsFn);
                await setLocalCachedAudioBase64(privClauseHash, ttsPersonal.base64Audio);
                resolvedSegments.push({
                  base64Audio: ttsPersonal.base64Audio,
                  mimeType: ttsPersonal.mimeType || 'audio/wav',
                  source: 'azure_personal_clause_once',
                  hash: privClauseHash
                });
              } catch (_) {
                // Fallback seguro: se a Azure falhar na cláusula pessoal, usa a cláusula neutra do Google Drive!
                const neutralClauseText = buildNeutralAvatarText(clause.template);
                const neutralClauseHash = computeAvatarAudioHash({ text: neutralClauseText, lang: clauseLang, voice: clauseVoice });
                const neutralClauseShared = await this.getSharedAudioBase64ByHash(neutralClauseHash, catalog?.items?.[neutralClauseHash]);
                if (neutralClauseShared?.base64Audio) {
                  avatarAudioTelemetry.driveSharedHitsCount += 1;
                  resolvedSegments.push({
                    base64Audio: neutralClauseShared.base64Audio,
                    mimeType: 'audio/wav',
                    source: 'neutral_clause_drive_fallback',
                    hash: neutralClauseHash
                  });
                } else {
                  allClausesResolved = false;
                  break;
                }
              }
            }
          }
        }

        if (allClausesResolved && resolvedSegments.length > 0) {
          avatarAudioTelemetry.composedPlaybackCount += 1;
          avatarAudioTelemetry.lastResolutionSource = 'composed_clauses';
          return {
            segments: resolvedSegments,
            source: 'composed_clauses',
            azureCallsTriggered: avatarAudioTelemetry.azureCallsCount - azureBefore
          };
        }
      }

      // 3C. Fallback neutro completo se houver versão neutra no Drive antes de chamar Azure para frase inteira
      const neutralFullText = buildNeutralAvatarText(templateWithSong);
      const neutralFullHash = computeAvatarAudioHash({ text: neutralFullText, lang: speechLang, voice: activeVoice });
      const neutralFullShared = await this.getSharedAudioBase64ByHash(neutralFullHash, catalog?.items?.[neutralFullHash]);

      try {
        const ttsFullPersonal = await synthesizeWithDeduplication(normSpoken, speechLang, activeVoice, customTtsFn);
        await setLocalCachedAudioBase64(fullPrivateHash, ttsFullPersonal.base64Audio);
        avatarAudioTelemetry.lastResolutionSource = 'azure_private_full_once';
        return {
          segments: [{
            base64Audio: ttsFullPersonal.base64Audio,
            mimeType: ttsFullPersonal.mimeType || 'audio/wav',
            source: 'azure_private_full_once',
            hash: fullPrivateHash
          }],
          source: 'azure_private_full_once',
          azureCallsTriggered: avatarAudioTelemetry.azureCallsCount - azureBefore
        };
      } catch (err) {
        if (neutralFullShared?.base64Audio) {
          avatarAudioTelemetry.driveSharedHitsCount += 1;
          avatarAudioTelemetry.lastResolutionSource = 'neutral_full_drive_fallback';
          return {
            segments: [{
              base64Audio: neutralFullShared.base64Audio,
              mimeType: 'audio/wav',
              source: 'neutral_full_drive_fallback',
              hash: neutralFullHash
            }],
            source: 'neutral_full_drive_fallback',
            azureCallsTriggered: 0
          };
        }
        throw err;
      }
    }

    // PASSO 4: Frase pública/estática ainda não pré-gerada -> sintetiza uma única vez, armazena no cache local e promove para a pasta oficial do Google Drive
    const ttsStaticFull = await synthesizeWithDeduplication(normSpoken, speechLang, activeVoice, customTtsFn);
    await setLocalCachedAudioBase64(fullHash, ttsStaticFull.base64Audio);
    if (!customTtsFn) {
      this.syncPublicSegmentToDriveInBackground({
        hash: fullHash,
        category,
        voice: activeVoice,
        lang: speechLang,
        text: normSpoken,
        segmentKind: 'full_static',
        base64Audio: ttsStaticFull.base64Audio
      });
    }
    avatarAudioTelemetry.lastResolutionSource = 'azure_static_once';
    return {
      segments: [{
        base64Audio: ttsStaticFull.base64Audio,
        mimeType: ttsStaticFull.mimeType || 'audio/wav',
        source: 'azure_static_once',
        hash: fullHash
      }],
      source: 'azure_static_once',
      azureCallsTriggered: avatarAudioTelemetry.azureCallsCount - azureBefore
    };
  },

  /**
   * Verifica o status da sessão diária e se há cooldown ativo
   * REGRA DE OURO 1: Se cooldownEnabled for false (Desativada no Admin), NUNCA bloqueia!
   * REGRA DE OURO 2: Usa as horas configuradas no Admin (cooldownHours)
   */
  getDailySessionStatus(userId, settings = DEFAULT_AVATAR_SETTINGS) {
    const isCooldownEnabled = settings?.cooldownEnabled ?? true;
    const sessionDurationMinutes = Number(settings?.sessionDurationMinutes) || 15;
    const cooldownHours = Number(settings?.cooldownHours) || 24;

    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    let session = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) session = JSON.parse(stored);
    } catch (_) {}

    const now = Date.now();
    const durationMs = sessionDurationMinutes * 60 * 1000;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    // REGRA DE OURO 1: Trava desativada no Admin = LIBERA IMEDIATAMENTE O ALUNO!
    if (!isCooldownEnabled) {
      const activeRemaining = (session && typeof session.activeRemainingSeconds === 'number')
        ? session.activeRemainingSeconds
        : sessionDurationMinutes * 60;

      return {
        isLocked: false,
        timeRemainingSeconds: activeRemaining <= 0 ? sessionDurationMinutes * 60 : activeRemaining,
        completedToday: false,
        usedPhraseIds: session?.usedPhraseIds || [],
        cooldownRemainingSeconds: 0
      };
    }

    if (!session) {
      return {
        isLocked: false,
        timeRemainingSeconds: sessionDurationMinutes * 60,
        completedToday: false,
        usedPhraseIds: [],
        cooldownRemainingSeconds: 0
      };
    }

    // Se completou a sessão anterior e a trava ESTÁ ativada:
    if (session.completedAt) {
      const timeSinceCompletion = now - session.completedAt;
      if (timeSinceCompletion < cooldownMs) {
        const remainingCooldownSec = Math.ceil((cooldownMs - timeSinceCompletion) / 1000);
        return {
          isLocked: true,
          timeRemainingSeconds: 0,
          completedToday: true,
          usedPhraseIds: session.usedPhraseIds || [],
          cooldownRemainingSeconds: remainingCooldownSec
        };
      } else {
        // Cooldown expirou, reseta sessão para um novo ciclo
        this.resetDailySession(userId);
        return {
          isLocked: false,
          timeRemainingSeconds: sessionDurationMinutes * 60,
          completedToday: false,
          usedPhraseIds: [],
          cooldownRemainingSeconds: 0
        };
      }
    }

    // Sessão em andamento: tempo restante baseado em activeRemainingSeconds (tempo real de prática debitado)
    const initialDurationSec = sessionDurationMinutes * 60;
    const remainingSec = typeof session.activeRemainingSeconds === 'number'
      ? session.activeRemainingSeconds
      : initialDurationSec;
    const isLocked = remainingSec <= 0;

    return {
      isLocked,
      timeRemainingSeconds: Math.max(0, remainingSec),
      completedToday: isLocked,
      usedPhraseIds: session.usedPhraseIds || [],
      cooldownRemainingSeconds: isLocked ? Math.ceil(cooldownMs / 1000) : 0
    };
  },

  /**
   * Inicializa ou obtém a sessão diária sem correr solta, com persistência da frase atual
   */
  startDailySession(userId, sessionDurationMinutes = 15) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    const today = new Date().toDateString();
    let session = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        session = JSON.parse(stored);
        // Se a sessão for de outro dia, renova o tempo ativo mas PRESERVA o progresso das frases
        if (session.sessionDate && session.sessionDate !== today) {
          const preservedIndex = typeof session.currentPhraseIndex === 'number' ? session.currentPhraseIndex : 0;
          const preservedUsed = Array.isArray(session.usedPhraseIds) ? session.usedPhraseIds : [];
          session = {
            sessionDate: today,
            startedAt: Date.now(),
            activeRemainingSeconds: sessionDurationMinutes * 60,
            completedAt: null,
            currentPhraseIndex: preservedIndex,
            usedPhraseIds: preservedUsed
          };
          localStorage.setItem(key, JSON.stringify(session));
        }
      }
    } catch (_) {}

    if (!session) {
      const newSession = {
        sessionDate: today,
        startedAt: Date.now(),
        activeRemainingSeconds: sessionDurationMinutes * 60,
        completedAt: null,
        currentPhraseIndex: 0,
        usedPhraseIds: []
      };
      try {
        localStorage.setItem(key, JSON.stringify(newSession));
      } catch (_) {}
      return newSession;
    }
    return session;
  },

  /**
   * Salva o progresso específico da sessão (frase atual, frases concluídas e tempo restante)
   */
  saveSessionProgress(userId, progressData = {}) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    let session = {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) session = JSON.parse(stored);
    } catch (_) {}

    session.sessionDate = session.sessionDate || new Date().toDateString();
    if (typeof progressData.currentPhraseIndex === 'number') {
      session.currentPhraseIndex = progressData.currentPhraseIndex;
    }
    if (Array.isArray(progressData.usedPhraseIds)) {
      session.usedPhraseIds = progressData.usedPhraseIds;
    }
    if (typeof progressData.activeRemainingSeconds === 'number') {
      session.activeRemainingSeconds = progressData.activeRemainingSeconds;
    }

    try {
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_) {}
    return session;
  },

  /**
   * Obtém a sessão diária ativa gravada
   */
  getSavedSession(userId) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  },

  /**
   * Debita segundos de prática ativa (quando a avatar está falando ou microfone ligado)
   */
  decrementActiveSessionTime(userId, seconds = 1) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    let session = {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) session = JSON.parse(stored);
    } catch (_) {}

    const currentSec = typeof session.activeRemainingSeconds === 'number' ? session.activeRemainingSeconds : 900;
    const nextSec = Math.max(0, currentSec - seconds);
    session.activeRemainingSeconds = nextSec;

    try {
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_) {}

    return nextSec;
  },

  /**
   * Finaliza a sessão diária e ativa o cooldown
   */
  completeDailySession(userId) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    let session = {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) session = JSON.parse(stored);
    } catch (_) {}

    session.completedAt = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_) {}
    return session;
  },

  /**
   * Reseta a sessão diária de um aluno específico
   */
  resetDailySession(userId) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  },

  /**
   * Reseta o bloqueio de TODOS os alunos (útil para testes imediatos pelo Admin)
   */
  async resetAllDailySessions() {
    try {
      // 1. Limpa todas as chaves locais no navegador
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_SESSION_KEY_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // 2. Registra o timestamp global de reset no app_settings
      await communityService.updateAppSettings('avatar_cooldown_global_reset', {
        resetAt: Date.now()
      });

      return { success: true };
    } catch (err) {
      console.warn('Erro ao resetar todas as sessões:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Registra uma frase praticada com sucesso hoje
   */
  markPhraseUsedToday(userId, phraseId) {
    const key = `${LOCAL_SESSION_KEY_PREFIX}${userId || 'guest'}`;
    let session = {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) session = JSON.parse(stored);
    } catch (_) {}

    const used = new Set(session.usedPhraseIds || []);
    used.add(phraseId);
    session.usedPhraseIds = Array.from(used);

    try {
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_) {}
    return session.usedPhraseIds;
  },

  /**
   * REQUISITO PEDAGÓGICO ESTRITO:
   * Retorna APENAS as frases das músicas que o aluno já concluiu.
   * Se nenhuma concluída, retorna as frases da primeira música como degustação ou avisa o aluno.
   */
  async getStudentEligiblePhrases(userId) {
    try {
      // 1. Carrega todas as músicas
      const { data: allSongs } = await songsService.getSongs();
      if (!allSongs || allSongs.length === 0) {
        return { completedSongs: [], phrases: [], hasNoProgress: true };
      }

      // 2. Carrega o progresso do aluno (aulas e song_mastery)
      const [progRes, masteryRes] = await Promise.all([
        progressService.getUserProgress(userId),
        progressService.getSongMastery(userId)
      ]);

      const completedLessonIds = new Set(
        (progRes.data || [])
          .filter((p) => p.completed === true || p.progress_percent === 100)
          .map((p) => p.lesson_id)
      );

      const masteredSongIds = new Set(
        (masteryRes.data || [])
          .filter((m) => m.step_final_challenge === true || m.challenge_index >= 5)
          .map((m) => m.song_id)
      );

      // 3. Filtra as músicas elegíveis concluídas
      const eligibleSongs = allSongs.filter((song) => {
        const isMastered = masteredSongIds.has(song.id);
        const isLessonDone = song.lesson_id && completedLessonIds.has(song.lesson_id);
        return isMastered || isLessonDone;
      });

      // 4. Caso o aluno ainda não tenha completado nenhuma música:
      // Usamos a primeira música disponível como introdução guiada
      const effectiveSongs = eligibleSongs.length > 0 ? eligibleSongs : [allSongs[0]];
      const isIntroductory = eligibleSongs.length === 0;

      // 5. Extrai as frases de todas as músicas elegíveis
      let allPhrases = [];
      effectiveSongs.forEach((song) => {
        const phrases = extractPhrasesFromSong(song);
        allPhrases = allPhrases.concat(phrases);
      });

      // 6. Anti-decoreba: Shuffle aleatório não-linear
      const shuffled = [...allPhrases].sort(() => Math.random() - 0.5);

      return {
        completedSongs: effectiveSongs,
        phrases: shuffled,
        isIntroductory,
        totalEligibleSongs: eligibleSongs.length
      };
    } catch (err) {
      console.error('Erro ao buscar frases elegíveis do aluno:', err);
      return { completedSongs: [], phrases: [], isIntroductory: false, error: err.message };
    }
  }
};
