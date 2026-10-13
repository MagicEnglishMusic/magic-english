/**
 * MAGIC ENGLISH — GOOGLE APPS SCRIPT: INTEGRATED MEDIA STORAGE SERVICE (V5.0)
 * 
 * Este arquivo unifica de forma 100% retrocompatível:
 * 1. O serviço existente de upload de avatares dos alunos (sem quebrar nada).
 * 2. O novo serviço estruturado de áudios de músicas em pastas exclusivas.
 * 
 * PASTA RAIZ OFICIAL DO DRIVE:
 * ID: 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh (Magic English - Áudios do Avatar)
 * 
 * ESTRUTURA LÓGICA GERADA:
 * [Root ID: 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh]
 *   ├── Magic English - Avatares/
 *   │     └── Aluno - {userId}/
 *   │           └── avatar.jpg
 *   └── Musicas/
 *         └── {lessonName}/
 *               └── {songName} - {songId}/
 *                     ├── verse_01.wav
 *                     ├── verse_02.wav
 *                     └── ...
 */

function doGet(e) {
  return responseJSON({
    status: "online",
    service: "Magic English Integrated Media Storage Service",
    version: "5.0",
    features: ["student_avatars", "song_verses_audio", "idempotent_reissue"],
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Requisição vazia ou inválida." });
    }

    var data = JSON.parse(e.postData.contents);

    // =========================================================================
    // ROTA A: UPLOAD DE ÁUDIOS DE MÚSICA (NOVO FLUXO DEDICADO)
    // =========================================================================
    if (data.type === "song_audio" || data.songId) {
      return handleSongAudioUpload(data);
    }

    // =========================================================================
    // ROTA B: UPLOAD DE AVATAR DO ALUNO (FLUXO ORIGINAL PRESERVADO 100%)
    // =========================================================================
    return handleStudentAvatarUpload(data);

  } catch (err) {
    return responseJSON({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Handler Dedicado: Áudios de Músicas (Idempotente, Seguro e Não-Destrutivo)
 */
function handleSongAudioUpload(data) {
  var songId = data.songId;
  var base64 = data.base64;
  var verseIndex = data.verseIndex;
  var fileName = data.fileName;

  // Validação estrita
  if (!songId || String(songId).trim() === "") {
    return responseJSON({ success: false, error: "songId é estritamente obrigatório para upload de músicas." });
  }
  if (!base64 || String(base64).trim() === "") {
    return responseJSON({ success: false, error: "Conteúdo do áudio em Base64 ausente." });
  }

  // Pasta Raiz Oficial
  var rootFolderId = data.parentFolderId || "1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh";
  var rootFolder = DriveApp.getFolderById(rootFolderId);

  // 1. Subpasta "Musicas"
  var musicasFolder = getOrCreateSubfolder(rootFolder, "Musicas");

  // 2. Subpasta da Aula
  var lessonName = (data.lessonName || "Aula Geral").trim().replace(/[/\\?%*:|"<>]/g, "");
  var lessonFolder = getOrCreateSubfolder(musicasFolder, lessonName);

  // 3. Subpasta permanente da Música (Nome + UUID permanente)
  var songName = (data.songName || "Musica").trim().replace(/[/\\?%*:|"<>]/g, "");
  var songFolderCanonicalName = songName + " - " + songId;
  var songFolder = getOrCreateSubfolder(lessonFolder, songFolderCanonicalName);

  // 4. Nome padronizado do verso
  var finalFileName;
  if (verseIndex !== undefined && verseIndex !== null) {
    finalFileName = "verse_" + String(verseIndex).padStart(2, "0") + ".wav";
  } else {
    finalFileName = fileName || "verse_01.wav";
  }

  // 5. Política Não-Destrutiva: Reutilização sem apagar arquivos
  var existingFiles = songFolder.getFilesByName(finalFileName);
  var matchingFiles = [];
  while (existingFiles.hasNext()) {
    matchingFiles.push(existingFiles.next());
  }

  // Caso 1: Arquivo único já existente -> Reutiliza o fileId sem recriar
  if (matchingFiles.length === 1 && !data.forceOverwrite) {
    var existingFileId = matchingFiles[0].getId();
    return responseJSON({
      success: true,
      reused: true,
      fileId: existingFileId,
      url: "https://drive.google.com/uc?export=download&id=" + existingFileId,
      directUrl: "https://drive.usercontent.google.com/download?id=" + existingFileId + "&export=download",
      fileName: finalFileName,
      folderId: songFolder.getId(),
      folderPath: "Musicas / " + lessonName + " / " + songFolderCanonicalName,
      message: "Arquivo de áudio já existente confirmado e reutilizado."
    });
  }

  // Caso 2: Múltiplos arquivos com o mesmo nome -> Reporta conflito e bloqueia
  if (matchingFiles.length > 1 && !data.forceOverwrite) {
    return responseJSON({
      success: false,
      conflict: true,
      count: matchingFiles.length,
      fileName: finalFileName,
      error: "Conflito: múltiplos arquivos encontrados com o mesmo nome na pasta da música. Operação suspensa para segurança."
    });
  }

  // Caso 3: Arquivo ausente -> Cria novo arquivo WAV
  var decodedBytes = Utilities.base64Decode(base64.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, "").replace(/\s+/g, ""));
  var blob = Utilities.newBlob(decodedBytes, "audio/wav", finalFileName);
  var newFile = songFolder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = newFile.getId();
  return responseJSON({
    success: true,
    reused: false,
    fileId: fileId,
    url: "https://drive.google.com/uc?export=download&id=" + fileId,
    directUrl: "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download",
    fileName: finalFileName,
    folderId: songFolder.getId(),
    folderPath: "Musicas / " + lessonName + " / " + songFolderCanonicalName,
    message: "Áudio do verso salvo com sucesso na pasta oficial da música!"
  });
}

/**
 * Handler Original Preservado: Fotos dos Alunos
 */
function handleStudentAvatarUpload(data) {
  var userId = data.userId;
  var base64 = data.base64;
  var fileName = data.fileName;
  var mimeType = data.mimeType || "image/jpeg";

  if (!base64 || String(base64).trim() === "") {
    return responseJSON({ success: false, error: "Conteúdo da imagem em Base64 ausente." });
  }

  // Raiz oficial
  var rootFolderId = data.parentFolderId || "1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh";
  var rootFolder = DriveApp.getFolderById(rootFolderId);

  // Pasta de Avatares
  var avataresFolder = getOrCreateSubfolder(rootFolder, "Magic English - Avatares");
  var userFolder = getOrCreateSubfolder(avataresFolder, "Aluno - " + (userId || "aluno-sem-id"));

  var decodedBytes = Utilities.base64Decode(base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").replace(/\s+/g, ""));
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName || ("avatar_" + Date.now() + ".jpg"));
  var newFile = userFolder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = newFile.getId();
  return responseJSON({
    success: true,
    fileId: fileId,
    url: "https://lh3.googleusercontent.com/d/" + fileId + "=w1200",
    directUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=w1200",
    driveViewUrl: "https://drive.google.com/file/d/" + fileId + "/view",
    folder: "Aluno - " + (userId || "aluno-sem-id"),
    message: "Avatar salvo com sucesso no Google Drive!"
  });
}

function getOrCreateSubfolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
