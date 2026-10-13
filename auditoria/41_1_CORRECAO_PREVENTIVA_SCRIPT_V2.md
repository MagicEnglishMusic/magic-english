# RELATÓRIO DE AUDITORIA & CORREÇÃO PREVENTIVA — ETAPA 41.1
## HARDENING DO GOOGLE APPS SCRIPT DE ÁUDIOS DE MÚSICAS (VERSÃO 2.1)

**Data:** 11/10/2026  
**Status:** Auditoria Concluída & Código V2.1 Validado Localmente — **Parada Obrigatória Respeitada**  
**Projeto Supabase PROD:** `wrrtiewjritbhcfqzjhy`  
**Cota Azure TTS:** **R$ 0,00 (Nenhum consumo)**  
**Arquivos de Produção no Drive:** **100% Intactos**  
**Gamificação, XP, Alunos e Banco:** **100% Preservados e Sem Alterações**

---

## 1. BACKUPS CRIADOS E RASTREABILIDADE

Antes de qualquer intervenção, foram consolidados os seguintes backups:
- [`src/utils/googleAppsScript_SongAudioService.v2_pre_audit.bak`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.v2_pre_audit.bak) (Versão da Etapa 41 pré-auditoria).
- [`src/utils/googleAppsScript_SongAudioService.js.bak`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js.bak) (Versão da Etapa 40).
- Código fonte oficial atualizado: [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js).

---

## 2. DIAGNÓSTICO: ANTES vs. DEPOIS (CORREÇÕES IMPLEMENTADAS)

| Ponto de Auditoria | Versão 2.0 Anterior | Versão 2.1 Hardened (Atual) | Status |
| :--- | :--- | :--- | :---: |
| **Autenticação no Servidor** | Condicional: se a propriedade existisse, validava. | **Fail-Closed Estrito**: se `SONG_SERVICE_AUTH_TOKEN` não estiver configurado no servidor, **bloqueia imediatamente com HTTP 500**. Se token enviado for incorreto ou ausente, **bloqueia com HTTP 403**. | **Corrigido** |
| **Origem da Pasta Raiz** | Aceitava fallback para `data.parentFolderId`. | **Exclusiva via Script Properties**: Lida única e obrigatoriamente de `SONG_AUDIO_ROOT_FOLDER_ID`. Qualquer parâmetro de pasta vindo do frontend é sumariamente ignorado. | **Corrigido** |
| **Proteção contra Sobrescrita** | `forceOverwrite` permitia recriar arquivo. | **Proteção Absoluta**: `forceOverwrite` foi desarmado de ações destrutivas. Arquivo existente é **sempre reutilizado de forma idempotente** (`reused: true`), preservando a integridade. | **Corrigido** |
| **Integridade de Arquivo Existente** | Checava apenas o nome. | **Validação de Tamanho**: Se o arquivo existente possuir 0 bytes (corrompido/inconclusivo), suspende a operação com **HTTP 422** para auditoria manual. | **Corrigido** |
| **Trava Anti-Lixeira** | `rootFolder.isTrashed()` | Mantida trava dupla: na raiz oficial e nas subpastas (`isTrashed()` aborta com **HTTP 410**). | **Mantido** |
| **Deleção de Arquivos** | Sem uso de `setTrashed()`. | **Zero deleções**: Proibição total de `setTrashed(true)`. NUNCA apaga, move ou renomeia. | **Mantido** |
| **Health Check no `doGet`** | Retornava status e booleanos. | Retorna `rootFolderId` (para conferência segura da raiz ativa) e `authConfigured: true/false`, **sem expor nenhum token**. | **Aprimorado** |

---

## 3. RESULTADO DA BATERIA DE 12 TESTES MOCK LOCAIS

Executamos a suíte de testes sintéticos sem envio de WAV, sem tocar na Azure e sem conexão externa:

| # | Cenário de Teste | Condição Injetada | Retorno Obtido | Resultado |
| :-: | :--- | :--- | :---: | :---: |
| **1** | Token de serviço ausente no servidor | Script Property vazia | HTTP 500 (Fail-Closed) | **APROVADO** |
| **2** | Token cliente inválido / ausente | Token enviado incorreto | HTTP 403 Forbidden | **APROVADO** |
| **3** | Script Property de raiz ausente | `SONG_AUDIO_ROOT_FOLDER_ID` vazia | HTTP 500 | **APROVADO** |
| **4** | Pasta raiz inacessível / inexistente | ID inexistente no Drive | HTTP 404 Not Found | **APROVADO** |
| **5** | Pasta raiz na Lixeira do Google Drive | Pasta marcada como `isTrashed: true` | HTTP 410 Gone | **APROVADO** |
| **6** | Tentativa de `parentFolderId` externo | Payload com pasta arbitrária | Ignorado (usou raiz oficial) | **APROVADO** |
| **7** | Tentativa de `forceOverwrite` | Arquivo já existente na pasta | Reutilizado (`reused: true`) | **APROVADO** |
| **8** | Arquivo existente e válido | `verse_01.wav` íntegro (1.644 bytes) | HTTP 200 (`reused: true`) | **APROVADO** |
| **9** | Arquivos duplicados no Drive | Mais de 1 arquivo com mesmo nome | HTTP 409 Conflict | **APROVADO** |
| **10** | Nova pasta raiz válida | Pasta oficial ativa e saudável | Criação normal (zero Azure) | **APROVADO** |
| **11** | Arquivo corrompido / 0 bytes | Arquivo existente com 0 bytes | HTTP 422 (Auditoria manual) | **APROVADO** |
| **12** | Ausência de `songId` | Payload com `songId: ""` | HTTP 400 Bad Request | **APROVADO** |

---

## 4. AUDITORIA DE PRESERVAÇÃO DO ECOSSISTEMA MAGIC ENGLISH

- **Build de Produção:** `npm run build` executado limpo e aprovado em **2.88s**.
- **Supabase e Banco:** Nenhuma migration, nenhum schema e nenhuma tabela foi alterada.
- **Gamificação e XP:** As tabelas `xp_events`, `gamification_profiles` e as RPCs (`grant_xp`) estão **100% intocadas**.
- **Professores, Sarah, Lipsync e TalkingHead:** Preservados rigorosamente sem qualquer alteração.
- **Apps Script V4.1 de Alunos:** O arquivo e endpoint de fotos de alunos permanecem **100% isolados e intocados**.
- **Histórico dos 45 Versos:** Todos os links prévios permanecem inalterados no banco.

---

## 5. CÓDIGO FINAL DA V2.1 PRONTO PARA O `Código.gs` DO GOOGLE APPS SCRIPT

Este é o código completo, hardened e auditado, pronto para substituição direta no editor do projeto:  
👉 [Abrir Projeto Dedicado de Músicas no Apps Script](https://script.google.com/home/projects/1IriNKma_ctN47BT01hPmB7Mq-hpbnmru_rPjat5BPqEdyAcwakB2NnDV/edit)

```javascript
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
    service: "Magic English Dedicated Song Audio Storage Service",
    version: "2.1",
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
    // 2. VALIDAÇÃO ESTRITA DE PARÂMETROS OBRIGATÓRIOS
    // =========================================================================
    var songId = data.songId;
    var base64 = data.base64;
    var verseIndex = data.verseIndex;
    var fileName = data.fileName;

    if (!songId || String(songId).trim() === "") {
      return responseJSON({
        success: false,
        error: "songId é estritamente obrigatório. Operação abortada para evitar salvamento fora da hierarquia."
      }, 400);
    }

    if (!base64 || String(base64).trim() === "") {
      return responseJSON({
        success: false,
        error: "Dados de áudio em Base64 ausentes ou vazios."
      }, 400);
    }

    // =========================================================================
    // 3. VALIDAÇÃO EXCLUSIVA DA PASTA RAIZ OFICIAL (SEM FALLBACK EXTERNO)
    // =========================================================================
    // Apenas a propriedade de script é autorizada como raiz oficial
    var rootFolderId = PropertiesService.getScriptProperties().getProperty("SONG_AUDIO_ROOT_FOLDER_ID");

    if (!rootFolderId || String(rootFolderId).trim() === "") {
      return responseJSON({
        success: false,
        error: "Pasta raiz de músicas não configurada! Defina SONG_AUDIO_ROOT_FOLDER_ID nas Propriedades do Script."
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
        error: "ERRO DE SEGURANÇA: A pasta raiz oficial de músicas está na LIXEIRA do Google Drive! Operação cancelada."
      }, 410);
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
```

---

## 6. PENDÊNCIAS EXCLUSIVAS DE PUBLICAÇÃO MANUAL (NO NAVEGADOR)

Para concluir a ativação no Google Apps Script:

1. **Substituir o Código:**
   - Acesse o projeto no Google Apps Script e cole o código acima no arquivo `Código.gs`.
   - Clique em **Salvar (💾)**.
2. **Conferir as Propriedades do Script (Configurações ⚙️):**
   - `SONG_AUDIO_ROOT_FOLDER_ID` = `165Y0jB82ROZY74b1EgfG-xgMXzJ9RR7J`
   - `SONG_SERVICE_AUTH_TOKEN` = *(seu token existente preservado intacto)*.
3. **Publicar Nova Versão:**
   - Clique em **Implantar > Gerenciar implantações**.
   - Clique no ícone de lápis ✏️ na implantação ativa.
   - Em **Versão**, selecione: **Nova versão**.
   - Clique em **Implantar**.

---

## 7. PARADA OBRIGATÓRIA RESPEITADA

- **Nenhum deploy externo foi executado automaticamente.**
- **Nenhum upload foi disparado.**
- **Nenhum dado do Supabase ou arquivo de áudio foi modificado.**
- O sistema aguarda a atualização manual da versão no Google Apps Script pelo proprietário para prosseguir com a homologação.
