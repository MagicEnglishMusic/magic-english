import { extractGoogleDriveId, isGoogleDriveUrl, getDriveVideoUrl, getDriveAudioUrl, getDriveImageUrl, getDriveMaterialUrls } from '../utils/googleDriveHelper';

export const storageService = {
  // Google Drive recommended structure guide
  driveStructureGuide: {
    rootFolder: 'Magic English',
    subfolders: [
      {
        path: 'Magic English/Módulos/Módulo 01 - Inglês para Viagens/Aulas/Aula 01',
        description: 'Vídeos (video.mp4), Thumbnails (thumb.jpg), PDFs (material.pdf)'
      },
      {
        path: 'Magic English/Módulos/Módulo 01 - Inglês para Viagens/Músicas',
        description: 'Faixas de áudio das Magic Songs (audio.mp3), Capas (cover.jpg)'
      }
    ]
  },

  // Validate and format Google Drive Link
  processMediaLink(url, type = 'video') {
    if (!url) return '';
    const isDrive = isGoogleDriveUrl(url);

    if (type === 'video') {
      return getDriveVideoUrl(url);
    }
    if (type === 'audio') {
      return getDriveAudioUrl(url);
    }
    if (type === 'image') {
      return getDriveImageUrl(url);
    }
    if (type === 'material' || type === 'pdf') {
      return getDriveMaterialUrls(url);
    }

    return url;
  }
};
