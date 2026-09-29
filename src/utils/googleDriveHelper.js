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
 * Get Video Embed or Stream URL
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
 * Get Audio Direct Stream URL
 */
export function getDriveAudioUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    // 1. In local development mode with local Vite dev server, use Vite proxy
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return `/api/audio-proxy?id=${fileId}`;
    }

    // 2. In production (Hostinger/build), route directly to Supabase Edge Function
    const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
      ? import.meta.env.VITE_SUPABASE_URL
      : 'https://wrrtiewjritbhcfqzjhy.supabase.co';

    if (supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('seu-projeto') && !supabaseUrl.includes('magic-english.supabase.co')) {
      return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/audio-proxy?id=${fileId}`;
    }

    // 3. Fallback direct download stream if Supabase URL is not configured
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  }
  return url;
}

/**
 * Get Image/Thumbnail/Cover Direct URL
 */
export function getDriveImageUrl(url, size = 'w1200') {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
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

export default {
  extractGoogleDriveId,
  isGoogleDriveUrl,
  getDriveVideoUrl,
  getDriveAudioUrl,
  getDriveImageUrl,
  getDriveMaterialUrls
};
