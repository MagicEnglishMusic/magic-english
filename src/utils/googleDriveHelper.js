/**
 * Google Drive URL Parser and Media Stream Formatter
 * 
 * Supports transforming standard Google Drive shareable links:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * 
 * Into optimized streamable/viewable URLs for Videos, Audios, Images, and PDFs.
 */

export function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Format 1: /file/d/{id}
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Format 2: id={id} (handles /api/audio-proxy?id=..., /functions/v1/audio-proxy?id=..., uc?id=..., open?id=...)
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Format 3: googleusercontent.com/d/{id} or /download?id={id}
  const matchLh3 = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3 && matchLh3[1]) return matchLh3[1];

  // Format 4: /d/{id}
  const matchShort = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchShort && matchShort[1]) return matchShort[1];

  // Format 5: Pure File ID (20 to 60 alphanumeric/dash/underscore characters)
  if (/^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('/api/audio-proxy') ||
    trimmed.includes('/functions/v1/audio-proxy') ||
    /^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)
  );
}

/**
 * Modo oficial de streaming de vídeo:
 * - 'drive': Reprodução direta pelo Google Drive (Iframe/CDN Google) -> 0 bytes de saída Supabase!
 * - 'proxy': Tunelamento através da Edge Function video-proxy (Consome Supabase Egress)
 */
export const VIDEO_STREAM_MODE = 'drive';

export function getVideoStreamMode() {
  if (typeof window !== 'undefined') {
    try {
      const override = localStorage.getItem('magic_video_stream_mode');
      if (override === 'drive' || override === 'proxy') return override;
    } catch (_) {}
  }
  return VIDEO_STREAM_MODE;
}

/**
 * Get Video Embed URL (Iframe Preview Direto do Google Drive)
 */
export function getDriveVideoUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

/**
 * Get Video Proxy Stream URL (Supabase Edge Function video-proxy)
 */
export function getDriveVideoProxyUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
      ? import.meta.env.VITE_SUPABASE_URL
      : 'https://wrrtiewjritbhcfqzjhy.supabase.co';

    const baseUrl = (supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('seu-projeto'))
      ? supabaseUrl.replace(/\/$/, '')
      : 'https://wrrtiewjritbhcfqzjhy.supabase.co';

    return `${baseUrl}/functions/v1/video-proxy?id=${fileId}`;
  }
  return url;
}

/**
 * Get Video Stream URL (Direto pelo Google Drive no modo 'drive', ou via Edge Function no modo 'proxy')
 */
export function getDriveVideoStreamUrl(url, mode = null) {
  if (!url) return '';
  const effectiveMode = mode || getVideoStreamMode();
  if (effectiveMode === 'proxy') {
    return getDriveVideoProxyUrl(url);
  }
  return getDriveVideoUrl(url);
}

/**
 * Get Audio Direct Stream URL
 */
export function getDriveAudioUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
      ? import.meta.env.VITE_SUPABASE_URL
      : 'https://wrrtiewjritbhcfqzjhy.supabase.co';

    const baseUrl = (supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('seu-projeto'))
      ? supabaseUrl.replace(/\/$/, '')
      : 'https://wrrtiewjritbhcfqzjhy.supabase.co';

    return `${baseUrl}/functions/v1/audio-proxy?id=${fileId}`;
  }
  return url;
}

/**
 * Get Image/Thumbnail/Cover Direct URL
 */
export function getDriveImageUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }
  return url;
}

/**
 * Get PDF Material Download & View URLs
 */
export function getDriveMaterialUrls(url) {
  if (!url) return { viewUrl: '#', downloadUrl: '#' };
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return {
      viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }
  return {
    viewUrl: url,
    downloadUrl: url,
    embedUrl: url
  };
}

export const GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzG38rRYJo8mmAplWgqhp-DaPTAolp0SjRgGkmH7UAIlzD-CiMJpglBE8tQjan9qWIeBQ/exec';

/**
 * Upload Avatar to Google Drive via Google Apps Script Web App
 * Payload: { userId, fileName, mimeType, base64 }
 */
export async function uploadAvatarToDrive({ userId, file }) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');
  if (!userId) throw new Error('ID de usuário não identificado.');

  // Validate size (5MB max)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('A imagem deve ter no máximo 5MB.');
  }

  // Validate MIME type and block HEIC/HEIF
  const fileType = (file.type || '').toLowerCase();
  if (fileType.includes('heic') || fileType.includes('heif') || (file.name && /\.(heic|heif)$/i.test(file.name))) {
    throw new Error('Formato HEIC/HEIF não suportado. Por favor, envie sua foto em formato JPG, PNG ou WEBP.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const effectiveMimeType = allowedTypes.includes(fileType) ? fileType : 'image/jpeg';
  if (!allowedTypes.includes(fileType) && fileType !== '') {
    throw new Error('Formato não suportado. Por favor, envie uma imagem JPG, PNG ou WEBP.');
  }

  // Convert File to Clean Base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64Clean = result
          .replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
          .replace(/\s+/g, '');
        resolve(base64Clean);
      } else {
        reject(new Error('Erro ao processar imagem em Base64.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem.'));
    reader.readAsDataURL(file);
  });

  const fileExt = effectiveMimeType.split('/')[1] === 'jpeg' ? 'jpg' : (effectiveMimeType.split('/')[1] || 'jpg');
  const payload = {
    userId: String(userId).trim(),
    fileName: file.name || `avatar_${Date.now()}.${fileExt}`,
    mimeType: effectiveMimeType,
    base64: base64Data
  };

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data || data.success === false || (!data.url && !data.directUrl)) {
      throw new Error(data?.error || data?.message || 'Não foi possível enviar a imagem');
    }

    return data.url || data.directUrl;
  } catch (err) {
    console.error('Erro no upload de avatar para Google Drive:', err);
    throw new Error(err.message || 'Não foi possível enviar a imagem');
  }
}

export const GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID = '165Y0jB82ROZY74b1EgfG-xgMXzJ9RR7J';

// Endpoint dedicado direto para fallback administrativo opcional (sempre diferente do de avatares)
export const GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT) || '';

/**
 * Upload Audio de Música para Google Drive via Supabase Edge Function (song-audio-proxy)
 * 
 * Arquitetura de Segurança:
 * Admin Autenticado (JWT) -> Supabase Edge Function (song-audio-proxy) -> Google Apps Script Dedicado -> Google Drive
 * 
 * Regras:
 * - songId é estritamente obrigatório (bloqueia fallback incorreto para fotos de alunos).
 * - Gera nome canônico sequencial: verse_XX.wav baseado no índice real do verso.
 * - Idempotente: se já existir arquivo com o mesmo verseIndex, confirma e reutiliza com segurança.
 * - Zero secrets no frontend React.
 */
export async function uploadAudioToDrive({ 
  songId, 
  lessonId = null,
  lessonName = 'Aula Geral',
  songName = 'Música',
  verseIndex = null,
  fileName = null, 
  base64, 
  mimeType = 'audio/wav',
  forceOverwrite = false,
  parentFolderId = GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
}) {
  if (!songId || String(songId).trim() === '') {
    throw new Error('songId é estritamente obrigatório para upload de áudio de música.');
  }
  if (!base64) {
    throw new Error('Dados de áudio binários ausentes para upload.');
  }

  // 1. Nome canônico do arquivo: verse_01.wav, verse_02.wav... baseado no índice real
  let canonicalFileName = fileName;
  if (verseIndex !== null && verseIndex !== undefined) {
    canonicalFileName = `verse_${String(verseIndex).padStart(2, '0')}.wav`;
  } else if (!canonicalFileName) {
    canonicalFileName = `verse_${Date.now()}.wav`;
  }

  // 2. Nome canônico da pasta: "Nome da Música - UUID"
  const cleanSongName = String(songName || 'Musica').trim().replace(/[/\\?%*:|"<>]/g, '');
  const cleanBase64 = base64.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');

  const payload = {
    songId: String(songId).trim(),
    songName: cleanSongName,
    lessonId: lessonId ? String(lessonId).trim() : null,
    lessonName: String(lessonName || 'Aula Geral').trim(),
    verseIndex: verseIndex !== null && verseIndex !== undefined ? Number(verseIndex) : null,
    fileName: canonicalFileName,
    mimeType: mimeType || 'audio/wav',
    forceOverwrite: Boolean(forceOverwrite),
    parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID,
    base64: cleanBase64
  };

  // 3. FLUXO PREFERENCIAL E SEGURO: Supabase Edge Function song-audio-proxy (Proteção por JWT de Admin)
  try {
    const { supabase } = await import('../lib/supabaseClient');
    if (supabase?.functions?.invoke) {
      let authHeaders = {};
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          authHeaders = { Authorization: `Bearer ${token}` };
        }
      } catch (_) {}

      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('song-audio-proxy', {
        headers: authHeaders,
        body: payload
      });

      if (!proxyError && proxyData && (proxyData.url || proxyData.directUrl)) {
        const rawUrl = proxyData.url || proxyData.directUrl;
        const fileId = extractGoogleDriveId(rawUrl);
        if (fileId) {
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return rawUrl;
      }

      if (proxyError) {
        console.warn('[googleDriveHelper] Aviso na Edge Function song-audio-proxy:', proxyError.message || proxyError);
      }
    }
  } catch (proxyInvokeErr) {
    console.warn('[googleDriveHelper] song-audio-proxy indisponível, tentando fallback dedicado:', proxyInvokeErr.message);
  }

  // 4. FLUXO DE FALLBACK: Apenas se houver endpoint dedicado explícito configurado (NUNCA usa o de avatares)
  if (GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT && GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT !== GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT) {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          type: 'song_audio',
          ...payload
        })
      });

      const data = await response.json();
      if (!data || data.success === false || (!data.url && !data.directUrl)) {
        throw new Error(data?.error || data?.message || 'Falha ao salvar áudio no Google Drive via Apps Script');
      }

      const rawUrl = data.url || data.directUrl;
      const fileId = extractGoogleDriveId(rawUrl);
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      return rawUrl;
    } catch (fallbackErr) {
      console.error('[googleDriveHelper] Erro no fallback dedicado de músicas:', fallbackErr);
      throw fallbackErr;
    }
  }

  throw new Error('Serviço de upload de áudios de músicas não configurado ou indisponível. Verifique a Edge Function song-audio-proxy.');
}

/**
 * Consulta segura prévia se um verso já existe na pasta canônica do Google Drive.
 * Se o arquivo já existir na pasta oficial, retorna o link direto com custo ZERO na Azure.
 */
export async function checkExistingDriveVerseAudio({
  songId,
  lessonId = null,
  lessonName = 'Aula Geral',
  songName = 'Música',
  verseIndex = 1,
  parentFolderId = GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
}) {
  if (!songId || !verseIndex) return null;

  try {
    const { supabase } = await import('../lib/supabaseClient');
    if (!supabase?.functions?.invoke) return null;

    let authHeaders = {};
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) authHeaders = { Authorization: `Bearer ${token}` };
    } catch (_) {}

    // Envia payload de checagem para a Edge Function usando silent check
    // Passando base64 dummy de checagem (1 byte) apenas para consulta idempotente no Apps Script
    // O Apps Script verifica existingFiles ANTES de criar arquivo
    const { data: proxyData, error: proxyError } = await supabase.functions.invoke('song-audio-proxy', {
      headers: authHeaders,
      body: {
        songId: String(songId).trim(),
        songName: String(songName || 'Musica').trim(),
        lessonId: lessonId ? String(lessonId).trim() : null,
        lessonName: String(lessonName || 'Aula Geral').trim(),
        verseIndex: Number(verseIndex),
        fileName: `verse_${String(verseIndex).padStart(2, '0')}.wav`,
        base64: 'UklGRg==', // Dummy para checagem se o arquivo já existe na pasta
        parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID,
        forceOverwrite: false
      }
    });

    if (!proxyError && proxyData && proxyData.reused && (proxyData.url || proxyData.directUrl)) {
      const rawUrl = proxyData.url || proxyData.directUrl;
      const fileId = extractGoogleDriveId(rawUrl);
      return {
        exists: true,
        fileId: fileId || proxyData.fileId,
        url: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
        directUrl: proxyData.directUrl || rawUrl,
        fileSize: proxyData.fileSize
      };
    }
  } catch (err) {
    console.warn('[googleDriveHelper] Consulta de reaproveitamento de áudio prévio ignorada:', err.message);
  }

  return null;
}

/**
 * Validação Real no Google Drive: Verifica se o arquivo de áudio existe fisicamente na nuvem
 * Regras:
 * - Timeout estrito de 2500ms para resposta rápida.
 * Validação Segura no Google Drive com 3 Estados Estruturados:
 * - EXISTS: arquivo acessível, status 200/206 e content-type compatível com áudio (não é HTML/erro).
 * - MISSING: arquivo comprovadamente inexistente (status 404 confirmado).
 * - UNKNOWN: timeout, CORS, erro de rede, 403, 429, 5xx ou HTML genérico. UNKNOWN NUNCA gera regravação!
 */
export async function checkDriveAudioStatus(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { status: 'MISSING', reason: 'URL inválida ou vazia', httpStatus: null };
  }

  const driveId = extractGoogleDriveId(url);
  const testUrl = driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : url;

  // 1. TENTATIVA DIRETA COM FETCH RANGE (Excelente para Node, proxies ou origens com CORS)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const httpStatus = response.status;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // 1.1. Arquivo Comprovadamente Ausente (404)
    if (httpStatus === 404) {
      try { controller.abort(); } catch (_) {}
      return { status: 'MISSING', reason: 'Arquivo não encontrado (404)', httpStatus };
    }

    // 1.2. Arquivo Acessível (200 ou 206)
    if (httpStatus === 200 || httpStatus === 206) {
      if (contentType.includes('text/html')) {
        try { controller.abort(); } catch (_) {}
        return { status: 'UNKNOWN', reason: 'Resposta retornou HTML em vez de áudio', httpStatus };
      }

      try {
        if (response.body && typeof response.body.cancel === 'function') {
          response.body.cancel();
        } else {
          controller.abort();
        }
      } catch (_) {}

      return { status: 'EXISTS', reason: 'Arquivo de áudio confirmado via HTTP', httpStatus, contentType };
    }

    // 1.3. Outros status HTTP explícitos
    try { controller.abort(); } catch (_) {}
    return { status: 'UNKNOWN', reason: `Status inconclusivo (${httpStatus})`, httpStatus };

  } catch (err) {
    clearTimeout(timeoutId);

    // 2. SONDA AUDIO NO NAVEGADOR (Bypass CORS para distinguir EXISTS de MISSING)
    // No navegador, fetch('drive.google.com/uc?...') sofre bloqueio de CORS no redirect.
    // O elemento HTMLAudioElement não sofre bloqueio de CORS para metadados de mídia:
    // Se o arquivo for 404, dispara onerror (MEDIA_ERR_SRC_NOT_SUPPORTED).
    // Se o arquivo existir, dispara onloadedmetadata/oncanplay.
    if (typeof window !== 'undefined' && typeof window.Audio === 'function' && driveId) {
      try {
        const audioProbeResult = await new Promise((resolve) => {
          const audio = new Audio();
          let settled = false;

          const probeTimer = setTimeout(() => {
            if (!settled) {
              settled = true;
              audio.src = '';
              resolve({ status: 'UNKNOWN', reason: 'Timeout na sonda de áudio (>3s)', httpStatus: null });
            }
          }, 3000);

          audio.onloadedmetadata = () => {
            if (!settled) {
              settled = true;
              clearTimeout(probeTimer);
              audio.src = '';
              resolve({ status: 'EXISTS', reason: 'Arquivo de áudio validado no navegador', httpStatus: 200 });
            }
          };

          audio.oncanplay = () => {
            if (!settled) {
              settled = true;
              clearTimeout(probeTimer);
              audio.src = '';
              resolve({ status: 'EXISTS', reason: 'Arquivo de áudio validado no navegador', httpStatus: 200 });
            }
          };

          audio.onerror = () => {
            if (!settled) {
              settled = true;
              clearTimeout(probeTimer);
              const errCode = audio.error?.code;
              audio.src = '';
              // REGRA DE SEGURANÇA E CUSTO:
              // Erros no elemento de áudio (código 4 = SRC_NOT_SUPPORTED, código 2 = NETWORK) podem ocorrer por
              // formato não suportado ou instabilidade de rede. Para evitar falsos positivos na ausência,
              // tratamos como UNKNOWN para proteger o sistema contra regenerações indevidas.
              // A classificação MISSING exige comprovação explícita (como HTTP 404 em backend/proxy).
              resolve({ 
                status: 'UNKNOWN', 
                reason: `Elemento de áudio não conseguiu decodificar mídia (código ${errCode || 'desconhecido'})`, 
                httpStatus: null 
              });
            }
          };

          // Usa o stream proxy do Magic English ou endpoint canônico
          audio.src = `https://drive.google.com/uc?export=download&id=${driveId}`;
          audio.load();
        });

        return audioProbeResult;
      } catch (_) {
        // Fallback silencioso para o erro original caso o DOM falhe
      }
    }

    const isTimeout = err?.name === 'AbortError';
    return { 
      status: 'UNKNOWN', 
      reason: isTimeout ? 'Timeout na verificação (>2.5s)' : (err?.message || 'Erro de rede/CORS'), 
      httpStatus: null 
    };
  }
}

/**
 * Wrapper booleano mantido para compatibilidade retroativa
 */
export async function checkDriveAudioExists(url) {
  const result = await checkDriveAudioStatus(url);
  return result.status === 'EXISTS';
}

export const OFFICIAL_SONG_AUDIO_APPS_SCRIPT_HEALTH_URL =
  'https://script.google.com/macros/s/AKfycbyHUzd8cGDbsp-2TYF0zNqTkKqWsGU_BO0gWYyjcA3yV5XhPf4X0oDfBqsRaBzMwk4K/exec';

let cachedAppsScriptV22Ready = null;
let cachedAppsScriptV22CheckedAt = 0;

/**
 * Verifica via GET se o Google Apps Script remoto já foi atualizado para a versão 2.2
 * (que suporta a pasta oficial independente "Mensagens Avatar / <Voz> / <Idioma> / <Categoria> / msg_<Hash>.wav").
 * Isso impede qualquer envio de envelope enquanto o Apps Script remoto estiver na V2.1,
 * garantindo que nenhum arquivo de mensagem seja criado dentro de "Musicas/".
 */
export async function checkAppsScriptAvatarMessageV22Support() {
  const now = Date.now();
  if (cachedAppsScriptV22Ready !== null && now - cachedAppsScriptV22CheckedAt < 30000) {
    return cachedAppsScriptV22Ready;
  }

  const endpoint = GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT || OFFICIAL_SONG_AUDIO_APPS_SCRIPT_HEALTH_URL;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(endpoint, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const isV22 =
        String(data?.version || '') === '2.2' ||
        (Array.isArray(data?.supportedTypes) && data.supportedTypes.includes('avatar_message'));
      cachedAppsScriptV22Ready = isV22;
      cachedAppsScriptV22CheckedAt = now;
      return isV22;
    }
  } catch (_) {}

  return false;
}

/**
 * Consulta segura prévia se o áudio de uma mensagem da Professora Avatar
 * já existe na pasta canônica do Google Drive:
 * Mensagens Avatar / <voice> / <lang> / <category> / msg_<messageHash>.wav
 */
export async function checkExistingDriveAvatarMessageAudio({
  messageHash,
  category = 'geral',
  voice = 'pt-BR-FranciscaNeural',
  lang = 'pt',
  parentFolderId = GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
}) {
  if (!messageHash || String(messageHash).trim().length < 8) return null;

  try {
    const { supabase } = await import('../lib/supabaseClient');
    if (!supabase?.functions?.invoke) return null;

    let authHeaders = {};
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) authHeaders = { Authorization: `Bearer ${token}` };
    } catch (_) {}

    const cleanHash = String(messageHash).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCat = String(category || 'geral').trim().toLowerCase();
    const cleanVoice = String(voice || 'pt-BR-FranciscaNeural').trim();
    const cleanLang = String(lang || 'pt').trim().toLowerCase();

    const { data: proxyData, error: proxyError } = await supabase.functions.invoke('song-audio-proxy', {
      headers: authHeaders,
      body: {
        type: 'avatar_message',
        messageHash: cleanHash,
        category: cleanCat,
        voice: cleanVoice,
        lang: cleanLang,
        fileName: `msg_${cleanHash}.wav`,
        base64: 'UklGRg==', // Sonda idempotente sem criar arquivo
        parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
      }
    });

    if (!proxyError && proxyData && proxyData.reused && (proxyData.url || proxyData.directUrl)) {
      const rawUrl = proxyData.url || proxyData.directUrl;
      const fileId = extractGoogleDriveId(rawUrl);
      return {
        exists: true,
        reused: true,
        fileId: fileId || proxyData.fileId,
        url: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
        directUrl: proxyData.directUrl || rawUrl,
        fileSize: proxyData.fileSize,
        folderPath: proxyData.folderPath
      };
    }

    // Se song-audio-proxy remoto ainda for V2.1 mas o Apps Script remoto já for V2.2, usa envelope AVATAR_MSG_V22
    const errMsg = proxyError?.message || proxyData?.error || '';
    if (errMsg.includes('songId') || errMsg.includes('400') || errMsg.includes('non-2xx')) {
      const isV22Ready = await checkAppsScriptAvatarMessageV22Support();
      if (isV22Ready) {
        const { data: envData, error: envErr } = await supabase.functions.invoke('song-audio-proxy', {
          headers: authHeaders,
          body: {
            type: 'avatar_message',
            lessonId: 'AVATAR_MSG_V22',
            songId: `AVATAR_MSG_V22_${cleanHash}`,
            lessonName: cleanCat,
            songName: `${cleanVoice}|${cleanLang}`,
            fileName: `msg_${cleanHash}.wav`,
            base64: 'UklGRg==',
            parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
          }
        });
        if (!envErr && envData && envData.reused && (envData.url || envData.directUrl)) {
          const rawUrl = envData.url || envData.directUrl;
          const fileId = extractGoogleDriveId(rawUrl);
          return {
            exists: true,
            reused: true,
            fileId: fileId || envData.fileId,
            url: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
            directUrl: envData.directUrl || rawUrl,
            fileSize: envData.fileSize,
            folderPath: envData.folderPath
          };
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Upload de Áudio de Mensagem Dinâmica da Professora Avatar para o Google Drive
 * via Supabase Edge Function (song-audio-proxy com type='avatar_message').
 *
 * REGRAS DE CONTRATO E PRIVACIDADE:
 * - NUNCA mistura com pastas de músicas ("Musicas/").
 * - NUNCA inclui nome pessoal de aluno em fileName, pasta ou metadados.
 * - Hierarquia Oficial:
 *   Magic English - Áudios do Avatar (Oficial) [165Y0jB82ROZY74b1EgfG-xgMXzJ9RR7J]
 *   └── Mensagens Avatar / <Voz> / <Idioma> / <Categoria> / msg_<Hash>.wav
 */
export async function uploadAvatarMessageAudioToDrive({
  messageHash,
  category = 'geral',
  voice = 'pt-BR-FranciscaNeural',
  lang = 'pt',
  base64,
  parentFolderId = GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID
}) {
  const cleanHash = String(messageHash || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanHash || cleanHash.length < 8) {
    throw new Error('messageHash determinístico é obrigatório para upload de mensagem da Avatar.');
  }
  if (!base64) {
    throw new Error('Dados de áudio em Base64 ausentes para upload da mensagem da Avatar.');
  }

  const cleanBase64 = String(base64).replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');
  const canonicalFileName = `msg_${cleanHash}.wav`;
  const cleanCat = String(category || 'geral').trim().toLowerCase();
  const cleanVoice = String(voice || 'pt-BR-FranciscaNeural').trim();
  const cleanLang = String(lang || 'pt').trim().toLowerCase();
  const expectedFolderPath = `Mensagens Avatar / ${cleanVoice} / ${cleanLang} / ${cleanCat}`;

  const payload = {
    type: 'avatar_message',
    messageHash: cleanHash,
    category: cleanCat,
    voice: cleanVoice,
    lang: cleanLang,
    fileName: canonicalFileName,
    parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID,
    base64: cleanBase64
  };

  try {
    const { supabase } = await import('../lib/supabaseClient');
    if (supabase?.functions?.invoke) {
      let authHeaders = {};
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          authHeaders = { Authorization: `Bearer ${token}` };
        }
      } catch (_) {}

      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('song-audio-proxy', {
        headers: authHeaders,
        body: payload
      });

      if (!proxyError && proxyData && (proxyData.url || proxyData.directUrl)) {
        const rawUrl = proxyData.url || proxyData.directUrl;
        const fileId = extractGoogleDriveId(rawUrl);
        return {
          uploadedToDrive: true,
          reused: Boolean(proxyData.reused),
          fileId: fileId || proxyData.fileId || null,
          url: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
          directUrl: proxyData.directUrl || rawUrl,
          fileName: canonicalFileName,
          folderPath: proxyData.folderPath || expectedFolderPath
        };
      }

      const errMsg = proxyError?.message || proxyData?.error || '';
      if (errMsg.includes('songId') || errMsg.includes('400') || errMsg.includes('Edge Function returned a non-2xx')) {
        // Verifica se o Google Apps Script remoto já foi atualizado para V2.2
        const isV22Ready = await checkAppsScriptAvatarMessageV22Support();
        if (isV22Ready) {
          const { data: envData, error: envErr } = await supabase.functions.invoke('song-audio-proxy', {
            headers: authHeaders,
            body: {
              type: 'avatar_message',
              lessonId: 'AVATAR_MSG_V22',
              songId: `AVATAR_MSG_V22_${cleanHash}`,
              lessonName: cleanCat,
              songName: `${cleanVoice}|${cleanLang}`,
              fileName: canonicalFileName,
              parentFolderId: parentFolderId || GOOGLE_DRIVE_AUDIO_ROOT_FOLDER_ID,
              base64: cleanBase64
            }
          });

          if (!envErr && envData && (envData.url || envData.directUrl)) {
            const rawUrl = envData.url || envData.directUrl;
            const fileId = extractGoogleDriveId(rawUrl);
            return {
              uploadedToDrive: true,
              reused: Boolean(envData.reused),
              fileId: fileId || envData.fileId || null,
              url: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
              directUrl: envData.directUrl || rawUrl,
              fileName: canonicalFileName,
              folderPath: envData.folderPath || expectedFolderPath
            };
          }
        }

        return {
          uploadedToDrive: false,
          pendingBackendDeploy: true,
          fileName: canonicalFileName,
          folderPath: expectedFolderPath,
          reason: 'Apps Script remoto ainda na versão 2.1 (somente Musicas/). Atualize o código do Apps Script para V2.2 para habilitar a pasta Mensagens Avatar/.'
        };
      }
    }
  } catch (err) {
    return {
      uploadedToDrive: false,
      pendingBackendDeploy: true,
      fileName: canonicalFileName,
      folderPath: expectedFolderPath,
      reason: err?.message || 'Serviço de upload temporariamente indisponível.'
    };
  }

  return {
    uploadedToDrive: false,
    pendingBackendDeploy: true,
    fileName: canonicalFileName,
    folderPath: expectedFolderPath,
    reason: 'Upload aguardando sincronização com endpoint remoto V2.2.'
  };
}

/**
 * Busca segura de ArrayBuffer de áudio do Google Drive (com suporte a proxy CORS e fallback direto).
 * NUNCA lança exceção não tratada.
 */
export async function fetchDriveAudioArrayBuffer(url) {
  if (!url || typeof url !== 'string') {
    return { ok: false, arrayBuffer: null, status: null, reason: 'URL ausente' };
  }

  const fileId = extractGoogleDriveId(url);
  const candidateUrls = [];

  if (fileId) {
    candidateUrls.push(getDriveAudioUrl(url));
    candidateUrls.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
  } else {
    candidateUrls.push(url);
  }

  for (const candidate of candidateUrls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(candidate, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('text/html') && !ct.includes('application/json')) {
          const buf = await res.arrayBuffer();
          if (buf && buf.byteLength > 44) {
            return { ok: true, arrayBuffer: buf, status: res.status, sourceUrl: candidate };
          }
        }
      }
    } catch (_) {
      // Continua para o próximo candidato sem quebrar
    }
  }

  return { ok: false, arrayBuffer: null, status: null, reason: 'Bloqueio CORS ou arquivo indisponível para leitura binária direta' };
}

export default {
  extractGoogleDriveId,
  isGoogleDriveUrl,
  VIDEO_STREAM_MODE,
  getVideoStreamMode,
  getDriveVideoUrl,
  getDriveVideoStreamUrl,
  getDriveVideoProxyUrl,
  getDriveAudioUrl,
  getDriveImageUrl,
  getDriveMaterialUrls,
  uploadAvatarToDrive,
  uploadAudioToDrive,
  uploadAvatarMessageAudioToDrive,
  checkExistingDriveAvatarMessageAudio,
  fetchDriveAudioArrayBuffer,
  checkDriveAudioExists,
  checkDriveAudioStatus,
  GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT
};
