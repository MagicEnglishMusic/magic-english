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

  // Format 1: /file/d/{id}
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Format 2: id={id}
  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Format 3: /d/{id}
  const matchShort = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchShort && matchShort[1]) return matchShort[1];

  return null;
}

export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Get Video Embed or Stream URL
 */
export function getDriveVideoUrl(url) {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    // Google Drive Video Preview Player (Iframe Embed Compatible)
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
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
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
