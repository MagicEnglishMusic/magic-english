/**
 * MAGIC ENGLISH — GOOGLE APPS SCRIPT: SERVIÇO INDEPENDENTE DE ÁUDIO DE MÚSICAS (V2.1 - HARDENED)
 * 
 * Este script é TOTALMENTE DEDICADO e INDEPENDENTE do serviço de fotos/avatares dos alunos.
 * Deve ser implantado no projeto Google Apps Script dedicado a músicas:
 * https://script.google.com/home/projects/1IriNKma_ctN47BT01hPmB7Mq-hpbnmru_rPjat5BPqEdyAcwakB2NnDV/edit
 * 
 * CORREÇÕES PREVENTIVAS DE SEGURANÇA E INTEGRIDADE (ETAPA 41.1):
 * 1. AUTENTICAÇÃO FAIL-CLOSED (CRÍTICA):
 *    - Se SONG_SERVICE_AUTH_TOKEN não estiver configurado no script properties: BLOQUEIA IMEDIATAMENTE (HTTP 500).
 *    - Se o token recebido for ausente ou inválido: BLOQUEIA IMEDIATAMENTE (HTTP 403).
 *    - Zero exposição de tokens em respostas ou logs.
 * 2. RAIZ OFICIAL EXCLUSIVA E OBRIGATÓRIA:
 *    - Origem ÚNICA e EXCLUSIVA: PropertiesService.getScriptProperties().getProperty("SONG_AUDIO_ROOT_FOLDER_ID").
 *    - Eliminado qualquer fallback para data.parentFolderId ou IDs enviados externamente.
 *    - Se a raiz estiver ausente, vazia, inacessível ou na Lixeira (isTrashed): ABORTA sem criar pastas ou arquivos (HTTP 410 / 404 / 500).
 * 3. PROTEÇÃO ABSOLUTA CONTRA SOBRESCRITA E DESTRUIÇÃO:
 *    - forceOverwrite NÃO contorna as validações de segurança e integridade.
 *    - ZERO arquivos existentes: permite criação somente após todas as validações.
 *    - UM arquivo existente: reutiliza idempotentemente sem sobrescrever (reused: true).
 *    - MAIS DE UM arquivo com o mesmo nome: suspende imediatamente e reporta conflito (HTTP 409).
 *    - Arquivo com integridade inconclusiva (tamanho 0 ou corrompido): bloqueia e solicita auditoria manual.
 *    - NUNCA usa setTrashed(true). NUNCA apaga, substitui ou renomeia arquivos.
 * 4. HEALTH CHECK COMPLETO NO doGet(e):
 *    - Retorna service, version, rootConfigured, rootStatus, rootFolderId (sanitizado) e timestamp.
 */

function doGet(e) {
  var rootConfigured = false;
  var rootFolderId = PropertiesService.getScriptProperties().getProperty("SONG_AUDIO_ROOT_FOLDER_ID");
  var rootStatus = "not_configured";
  var sanitizedRootId = null;

  if (rootFolderId && rootFolderId.trim() !== "") {
    sanitizedRootId = rootFolderId.trim();
    try {
      var folder = DriveApp.getFolderById(sanitizedRootId);
      if (folder.isTrashed()) {
        rootStatus = "trashed";
      } else {
        rootStatus = "active_healthy";
        rootConfigured = true;
      }
    } catch (err) {
      rootStatus = "inaccessible_or_deleted: " + err.toString();
    }
  }

  var tokenConfigured = Boolean(
    PropertiesService.getScriptProperties().getProperty("SONG_SERVICE_AUTH_TOKEN")
  );

  return responseJSON({
    status: "online",
    service: "Magic English Dedicated Song & Avatar Audio Storage Service",
    version: "2.2",
    supportedTypes: ["song_audio", "avatar_message"],
    rootConfigured: rootConfigured,
    rootStatus: rootStatus,
    rootFolderId: sanitizedRootId,
    authConfigured: tokenConfigured,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Requisição vazia ou formato inválido." }, 400);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return responseJSON({ success: false, error: "Falha ao decodificar payload JSON." }, 400);
    }

    // =========================================================================
    // 1. AUTENTICAÇÃO FAIL-CLOSED (OBRIGATÓRIA E ESTRITA)
    // =========================================================================
    var expectedToken = PropertiesService.getScriptProperties().getProperty("SONG_SERVICE_AUTH_TOKEN");
    
    // Trava Fail-Closed: se o script não possui o token configurado, recusa imediatamente
    if (!expectedToken || String(expectedToken).trim() === "") {
      return responseJSON({
        success: false,
        error: "Configuração do servidor de músicas incompleta: SONG_SERVICE_AUTH_TOKEN não configurado no Apps Script."
      }, 500);
    }

    var clientToken = data.authToken || data.token;
    if (!clientToken || String(clientToken).trim() !== String(expectedToken).trim()) {
      return responseJSON({
        success: false,
        error: "Acesso não autorizado: token de serviço do Apps Script inválido ou ausente."
      }, 403);
    }

    // =========================================================================
    // 2. VALIDAÇÃO EXCLUSIVA DA PASTA RAIZ OFICIAL (SEM FALLBACK EXTERNO)
    // =========================================================================
    var rootFolderId = PropertiesService.getScriptProperties().getProperty("SONG_AUDIO_ROOT_FOLDER_ID");

    if (!rootFolderId || String(rootFolderId).trim() === "") {
      return responseJSON({
        success: false,
        error: "Pasta raiz oficial não configurada! Defina SONG_AUDIO_ROOT_FOLDER_ID nas Propriedades do Script."
      }, 500);
    }

    var cleanRootFolderId = String(rootFolderId).trim();
    var rootFolder;

    try {
      rootFolder = DriveApp.getFolderById(cleanRootFolderId);
    } catch (folderFetchErr) {
      return responseJSON({
        success: false,
        error: "A pasta raiz oficial configurada não foi encontrada ou foi excluída do Google Drive."
      }, 404);
    }

    // VERIFICAÇÃO CRÍTICA ANTI-LIXEIRA
    if (rootFolder.isTrashed()) {
      return responseJSON({
        success: false,
        error: "ERRO DE SEGURANÇA: A pasta raiz oficial está na LIXEIRA do Google Drive! Operação cancelada."
      }, 410);
    }

    var requestType = String(data.type || "song_audio").trim();
    var base64 = data.base64;

    if (!base64 || String(base64).trim() === "") {
      return responseJSON({
        success: false,
        error: "Dados de áudio em Base64 ausentes ou vazios."
      }, 400);
    }

    // =========================================================================
    // 3A. FLUXO DEDICADO: MENSAGENS DINÂMICAS DA PROFESSORA AVATAR (V2.2)
    // Hierarquia: Raiz Oficial / Mensagens Avatar / <Voz> / <Idioma> / <Categoria> / msg_<Hash>.wav
    // Suporta tanto payload direto (type === "avatar_message") quanto envelope compatível
    // com song-audio-proxy V2.1 (lessonId === "AVATAR_MSG_V22")
    // =========================================================================
    var isAvatarEnvelope = String(data.lessonId || "").trim() === "AVATAR_MSG_V22";
    if (requestType === "avatar_message" || isAvatarEnvelope) {
      var rawHash = data.messageHash || String(data.songId || "").replace(/^AVATAR_MSG_V22_/, "");
      var messageHash = String(rawHash || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");

      var rawVoiceLang = String(data.songName || "").split("|");
      var rawVoice = data.voice || rawVoiceLang[0] || "pt-BR-FranciscaNeural";
      var rawLang = data.lang || rawVoiceLang[1] || "pt";
      var rawCategory = data.category || (isAvatarEnvelope ? data.lessonName : "geral") || "geral";

      var category = String(rawCategory).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      var voice = String(rawVoice).trim().replace(/[/\\?%*:|"<>]/g, "");
      var lang = String(rawLang).trim().toLowerCase().replace(/[^a-z-]/g, "");

      if (!messageHash || messageHash.length < 8) {
        return responseJSON({
          success: false,
          error: "messageHash determinístico é estritamente obrigatório para mensagens da Avatar."
        }, 400);
      }

      var allowedCategories = ["saudacoes", "elogios", "encorajamentos", "despedidas", "retomadas", "geral"];
      if (allowedCategories.indexOf(category) === -1) {
        category = "geral";
      }

      var avatarRootFolder = getOrCreateSubfolder(rootFolder, "Mensagens Avatar");
      if (avatarRootFolder.isTrashed()) {
        return responseJSON({ success: false, error: "A pasta 'Mensagens Avatar' está na lixeira." }, 410);
      }

      var voiceFolder = getOrCreateSubfolder(avatarRootFolder, voice);
      if (voiceFolder.isTrashed()) {
        return responseJSON({ success: false, error: "A pasta da voz está na lixeira." }, 410);
      }

      var langFolder = getOrCreateSubfolder(voiceFolder, lang);
      if (langFolder.isTrashed()) {
        return responseJSON({ success: false, error: "A pasta do idioma está na lixeira." }, 410);
      }

      var categoryFolder = getOrCreateSubfolder(langFolder, category);
      if (categoryFolder.isTrashed()) {
        return responseJSON({ success: false, error: "A pasta da categoria está na lixeira." }, 410);
      }

      var msgFileName = "msg_" + messageHash + ".wav";
      var existingMsgFiles = categoryFolder.getFilesByName(msgFileName);
      var matchingMsgFiles = [];
      while (existingMsgFiles.hasNext()) {
        var mf = existingMsgFiles.next();
        if (!mf.isTrashed()) {
          matchingMsgFiles.push(mf);
        }
      }

      if (matchingMsgFiles.length === 1) {
        var existingMsgFile = matchingMsgFiles[0];
        var existingMsgId = existingMsgFile.getId();
        var existingMsgSize = existingMsgFile.getSize();

        if (existingMsgSize === 0) {
          return responseJSON({
            success: false,
            error: "Arquivo de mensagem existente '" + msgFileName + "' possui tamanho 0 bytes.",
            fileId: existingMsgId,
            folderId: categoryFolder.getId()
          }, 422);
        }

        return responseJSON({
          success: true,
          reused: true,
          type: "avatar_message",
          fileId: existingMsgId,
          url: "https://drive.google.com/uc?export=download&id=" + existingMsgId,
          directUrl: "https://drive.usercontent.google.com/download?id=" + existingMsgId + "&export=download",
          fileName: msgFileName,
          fileSize: existingMsgSize,
          folderId: categoryFolder.getId(),
          folderPath: "Mensagens Avatar / " + voice + " / " + lang + " / " + category,
          message: "Áudio da mensagem da Avatar já existente confirmado no Google Drive e reutilizado com custo zero."
        });
      }

      if (matchingMsgFiles.length > 1) {
        return responseJSON({
          success: false,
          conflict: true,
          count: matchingMsgFiles.length,
          fileName: msgFileName,
          folderId: categoryFolder.getId(),
          error: "Conflito detectado: múltiplos arquivos com o nome '" + msgFileName + "'."
        }, 409);
      }

      var cleanMsgBase64 = String(base64).replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, "").replace(/\s+/g, "");
      if (cleanMsgBase64 === "UklGRg==") {
        return responseJSON({
          success: false,
          reused: false,
          exists: false,
          message: "Sonda de verificação concluída: arquivo ainda não existe na pasta."
        }, 200);
      }

      var decodedMsgBytes = Utilities.base64Decode(cleanMsgBase64);
      if (!decodedMsgBytes || decodedMsgBytes.length === 0) {
        return responseJSON({ success: false, error: "Falha na decodificação do áudio em Base64 (buffer vazio)." }, 400);
      }

      var msgBlob = Utilities.newBlob(decodedMsgBytes, "audio/wav", msgFileName);
      var newMsgFile = categoryFolder.createFile(msgBlob);
      newMsgFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var newMsgFileId = newMsgFile.getId();
      return responseJSON({
        success: true,
        reused: false,
        type: "avatar_message",
        fileId: newMsgFileId,
        url: "https://drive.google.com/uc?export=download&id=" + newMsgFileId,
        directUrl: "https://drive.usercontent.google.com/download?id=" + newMsgFileId + "&export=download",
        fileName: msgFileName,
        fileSize: newMsgFile.getSize(),
        folderId: categoryFolder.getId(),
        folderPath: "Mensagens Avatar / " + voice + " / " + lang + " / " + category,
        message: "Áudio da mensagem da Avatar salvo com sucesso no Google Drive!"
      });
    }

    // =========================================================================
    // 3B. FLUXO ORIGINAL DE MÚSICAS (V2.1 INTACTO)
    // =========================================================================
    var songId = data.songId;
    var verseIndex = data.verseIndex;
    var fileName = data.fileName;

    if (!songId || String(songId).trim() === "") {
      return responseJSON({
        success: false,
        error: "songId é estritamente obrigatório. Operação abortada para evitar salvamento fora da hierarquia."
      }, 400);
    }

    // =========================================================================
    // 4. NAVEGAÇÃO E CRIAÇÃO ESTRUTURADA DE PASTAS NA RAIZ OFICIAL
    // =========================================================================
    // 4.1 Pasta intermediária "Musicas"
    var musicasFolder = getOrCreateSubfolder(rootFolder, "Musicas");
    if (musicasFolder.isTrashed()) {
      return responseJSON({ success: false, error: "A pasta 'Musicas' está na lixeira." }, 410);
    }

    // 4.2 Pasta da Aula
    var lessonName = (data.lessonName || "Geral").trim().replace(/[/\\?%*:|"<>]/g, "");
    var lessonFolder = getOrCreateSubfolder(musicasFolder, lessonName);
    if (lessonFolder.isTrashed()) {
      return responseJSON({ success: false, error: "A pasta da aula está na lixeira." }, 410);
    }

    // 4.3 Pasta canônica permanente da Música: "Nome da Música - UUID"
    var songName = (data.songName || "Musica").trim().replace(/[/\\?%*:|"<>]/g, "");
    var songFolderCanonicalName = songName + " - " + songId;
    var songFolder = getOrCreateSubfolder(lessonFolder, songFolderCanonicalName);
    if (songFolder.isTrashed()) {
      return responseJSON({ success: false, error: "A pasta da música está na lixeira." }, 410);
    }

    // =========================================================================
    // 5. PADRONIZAÇÃO DO NOME DO ARQUIVO DO VERSO (verse_01.wav...)
    // =========================================================================
    var finalFileName;
    if (verseIndex !== undefined && verseIndex !== null) {
      finalFileName = "verse_" + String(verseIndex).padStart(2, "0") + ".wav";
    } else {
      finalFileName = fileName || "verse_01.wav";
    }

    // =========================================================================
    // 6. POLÍTICA NÃO-DESTRUTIVA DE ARQUIVOS (SEM setTrashed E SEM SOBRESCRITA)
    // =========================================================================
    var existingFiles = songFolder.getFilesByName(finalFileName);
    var matchingFiles = [];
    while (existingFiles.hasNext()) {
      var f = existingFiles.next();
      if (!f.isTrashed()) {
        matchingFiles.push(f);
      }
    }

    // Caso A: Arquivo único já existente -> Reutiliza idempotentemente sem sobrescrever
    if (matchingFiles.length === 1) {
      var existingFile = matchingFiles[0];
      var existingFileId = existingFile.getId();
      var existingFileSize = existingFile.getSize();

      // Checagem de integridade: se o arquivo existente estiver vazio (0 bytes), suspende para auditoria
      if (existingFileSize === 0) {
        return responseJSON({
          success: false,
          error: "Arquivo existente '" + finalFileName + "' possui tamanho 0 bytes (inconclusivo). Operação suspensa para auditoria manual.",
          fileId: existingFileId,
          folderId: songFolder.getId()
        }, 422);
      }

      return responseJSON({
        success: true,
        reused: true,
        fileId: existingFileId,
        url: "https://drive.google.com/uc?export=download&id=" + existingFileId,
        directUrl: "https://drive.usercontent.google.com/download?id=" + existingFileId + "&export=download",
        fileName: finalFileName,
        fileSize: existingFileSize,
        folderId: songFolder.getId(),
        folderPath: "Musicas / " + lessonName + " / " + songFolderCanonicalName,
        message: "Arquivo de áudio já existente confirmado no Google Drive e reutilizado com segurança sem sobrescrita."
      });
    }

    // Caso B: Múltiplos arquivos com o mesmo nome detectados (conflito preventivo)
    if (matchingFiles.length > 1) {
      return responseJSON({
        success: false,
        conflict: true,
        count: matchingFiles.length,
        fileName: finalFileName,
        folderId: songFolder.getId(),
        error: "Conflito detectado: existem múltiplos arquivos com o nome '" + finalFileName + "' na pasta da música. Operação suspensa para auditoria manual."
      }, 409);
    }

    // Caso C: Arquivo inexistente (zero correspondências) -> Criação segura de novo WAV
    var cleanBase64 = base64.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, "").replace(/\s+/g, "");
    var decodedBytes = Utilities.base64Decode(cleanBase64);
    
    if (!decodedBytes || decodedBytes.length === 0) {
      return responseJSON({ success: false, error: "Falha na decodificação do áudio em Base64 (buffer vazio)." }, 400);
    }

    var blob = Utilities.newBlob(decodedBytes, "audio/wav", finalFileName);
    var newFile = songFolder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = newFile.getId();
    var canonicalUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
    var directUrl = "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download";

    return responseJSON({
      success: true,
      reused: false,
      fileId: fileId,
      url: canonicalUrl,
      directUrl: directUrl,
      fileName: finalFileName,
      fileSize: newFile.getSize(),
      folderId: songFolder.getId(),
      folderPath: "Musicas / " + lessonName + " / " + songFolderCanonicalName,
      message: "Áudio do verso salvo com sucesso na pasta oficial da música!"
    });

  } catch (err) {
    return responseJSON({
      success: false,
      error: "Erro interno no Apps Script: " + err.toString()
    }, 500);
  }
}

function getOrCreateSubfolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  while (folders.hasNext()) {
    var f = folders.next();
    if (!f.isTrashed()) {
      return f;
    }
  }
  return parent.createFolder(name);
}

function responseJSON(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
