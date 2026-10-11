import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { progressService } from './progressService';
import { songsService } from './songsService';
import { communityService } from './communityService';

const LOCAL_SESSION_KEY_PREFIX = 'magic_avatar_practice_session_';

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

  if (!isSupabaseConfigured() || !supabase?.functions) {
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

  if (!isSupabaseConfigured() || !supabase?.functions) {
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
