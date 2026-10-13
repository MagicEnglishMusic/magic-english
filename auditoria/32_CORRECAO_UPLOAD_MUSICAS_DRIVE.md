# MAGIC ENGLISH — ETAPA 32
# CORREÇÃO CIRÚRGICA DO UPLOAD DE ÁUDIOS E ORGANIZAÇÃO DAS PASTAS GOOGLE DRIVE

> **Data:** 11/10/2026  
> **Status:** ✅ IMPLEMENTAÇÃO LOCAL E TESTES SEGUROS HOMOLOGADOS  
> **Regra cumprida:** Parada obrigatória respeitada. Nenhuma pasta real criada no Drive, nenhum lote de 45 versos gerado, custo Azure = R$ 0,00.

---

## 1. ARQUIVOS MODIFICADOS E CRIADOS

1. [`src/utils/googleDriveHelper.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleDriveHelper.js):
   * Blindagem de `uploadAudioToDrive()`:
     * `songId` agora é **estritamente obrigatório**. Se não for fornecido, lança exceção imediata antes de qualquer chamada HTTP, eliminando completamente o fallback indevido para `"aluno-sem-id"`.
     * Recebe metadados canônicos estruturados: `lessonName`, `songName`, `verseIndex` e `songId`.
     * Gera nomes sequenciais matemáticos baseados no índice real do verso: `verse_01.wav`, `verse_02.wav`...
     * Define a variável `GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT` para permitir desacoplamento do script de alunos sem quebrar a retrocompatibilidade.
2. [`src/components/admin/SongManager.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/SongManager.jsx):
   * Atualizada a invocação de `uploadAudioToDrive()`:
     * Identifica a aula associada à música a partir de `lessonsList`.
     * Passa explicitamente `songId`, `songName`, `lessonName`, `verseIndex: i + 1`.
3. [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js) *(Novo arquivo local)*:
   * Código-fonte pronto e documentado para publicação do novo Google Apps Script dedicado exclusivamente ao catálogo de músicas.
   * Contém a lógica de subpastas hierárquicas (`Musicas / {lessonName} / {songName} - {songId}`) e idempotência com remoção de duplicatas antigas.

---

## 2. ARQUITETURA DE PASTAS E SEPARAÇÃO DE SERVIÇOS

```
[Google Drive Raiz: 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh]
  │
  ├── Magic English - Avatares/ (SERVIÇO 1: FOTOS DOS ALUNOS)
  │     ├── Aluno - {user_id_1}/
  │     │     └── avatar.jpg
  │     └── Aluno - {user_id_2}/
  │           └── avatar.jpg
  │
  └── Musicas/ (SERVIÇO 2: ÁUDIOS DAS MÚSICAS)
        └── Aula Geral/
              └── Vamos aprender ingles juntos - 0aed5144-07d7-4c04-9410-34d035a7577d/
                    ├── verse_01.wav
                    ├── verse_02.wav
                    ├── ...
                    └── verse_45.wav
```

### Regras de Blindagem:
* O serviço de upload de avatar dos alunos (`uploadAvatarToDrive`) continua **100% intocado e isolado**.
* O serviço de músicas rejeita qualquer chamada sem `songId`.
* O vínculo com a pasta da música utiliza o identificador canônico permanente: `{cleanSongName} - {songId}`, garantindo que mesmo se o título for editado, o UUID permanente evita a criação de pastas duplicadas órfãs.

---

## 3. IDEMPOTÊNCIA E PREVENÇÃO DE DUPLICIDADES (`verse_01.wav`)

No template preparado do Apps Script ([`googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js)):
```javascript
// Tratamento de Idempotência: Se o arquivo já existir com o mesmo nome na pasta, 
// move duplicatas antigas para a lixeira antes de salvar o novo arquivo
var existingFiles = songFolder.getFilesByName(finalFileName);
while (existingFiles.hasNext()) {
  var oldFile = existingFiles.next();
  oldFile.setTrashed(true);
}
```
Isso garante que um retry manual ou reinicialização do laço nunca gere arquivos com o mesmo nome na mesma pasta do Google Drive.

---

## 4. PRESERVAÇÃO DOS 45 VERSOS ATUAIS

Conforme homologado na Etapa 31:
* Os 45 versos da música `"Vamos aprender ingles juntos"` continuam **100% ativos e acessíveis (`EXISTS: 45 de 45`)** no catálogo atual.
* **Nenhum arquivo precisa ser movido, regenerado ou apagado agora.**
* As URLs cadastradas no Supabase continuam tocando normalmente no Avatar 3D e nos módulos dos alunos a **custo R$ 0,00**.

---

## 5. RESULTADO DOS TESTES COM MOCKS E BUILD

Executamos o script de testes unitários locais com asserções estritas (`scratch/test_song_upload_mocks.js`):
* `Teste 1`: Bloqueio de upload quando `songId` está ausente ➔ **APROVADO** ✅
* `Teste 2`: Criação canônica de pasta com UUID e arquivo `verse_01.wav` ➔ **APROVADO** ✅
* `Teste 3`: Sequenciamento correto de múltiplos versos distintos (`verse_02.wav`) ➔ **APROVADO** ✅
* `Teste 4`: Retry do mesmo verso reutiliza slot sem criar duplicata ➔ **APROVADO** ✅
* `Teste 5`: Independência do fluxo de alunos comprovada ➔ **APROVADO** ✅

**Compilação do Vite (`npm run build`):**  
Aprovado em **3.03s** com **zero erros**.

---

## 6. AÇÕES QUE DEPENDEM DE AUTORIZAÇÃO DO PROPRIETÁRIO

Para colocar o novo serviço de upload em produção no futuro:
1. **Publicar o novo Google Apps Script:** O proprietário pode criar um novo projeto no Google Apps Script copiando o código de [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js) e implantá-lo como Web App (Acesso: Qualquer pessoa).
2. **Adicionar a variável de ambiente:** Adicionar `VITE_GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT` no arquivo `.env` com a nova URL do Web App gerada.
3. **Até lá:** O `SongManager` continua operando com segurança total, pois a verificação de 3 estados já identifica que os 45 versos existem (`EXISTS: 45`), não executando nenhum upload e protegendo a quota da Azure.
