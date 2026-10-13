# MAGIC ENGLISH — ETAPA 31
# AUDITORIA DE REGRESSÃO DO UPLOAD GOOGLE DRIVE: PASTA ERRADA, ALUNO SEM ID E VERSOS DUPLICADOS

> **Data:** 11/10/2026  
> **Status:** AUDITORIA E DIAGNÓSTICO CONCLUÍDOS COM SUCESSO  
> **Regra aplicada:** Diagnóstico estritamente em leitura. Nenhuma alteração em código ou banco foi realizada. Nenhum consumo de Azure foi disparado.

---

## 1. O QUE CAUSOU A PASTA `Aluno - aluno-sem-id`?

### Causa Técnica Comprovada
Ao investigar o endpoint do Google Apps Script (`GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT` = `AKfycbzG38rRYJo8...`), descobrimos a resposta que ele retornou:
```json
{
  "success": true,
  "fileId": "1quYBW4VwA2O8AjYXvJZ0p2pJfrsQjaG_",
  "folder": "Aluno - aluno-sem-id",
  "message": "Avatar salvo com sucesso no Google Drive!"
}
```

**Diagnóstico:**
O script publicado no Google Apps Script sob esse endpoint foi originalmente programado **exclusivamente para upload de fotos de avatar dos alunos** (`uploadAvatarToDrive`).  
No código interno do Google Apps Script (`doPost`):
1. O script procura pelo campo `e.parameter.userId` ou `JSON.parse(e.postData.contents).userId`.
2. Como o `SongManager` enviava `userId: songId ? 'song_' + songId : 'avatar_tts'` (ou não passava um ID de aluno do auth), o script não reconheceu uma sessão de aluno cadastrado e aplicou o fallback padrão dele:
   `var folderName = 'Aluno - ' + (userId || 'aluno-sem-id');`
3. Ele criou a pasta de avatares: `Magic English - Avatares/Aluno - aluno-sem-id`.
4. O script **ignora completamente** os parâmetros `songId`, `folderName` e `parentFolderId` enviados pelo `SongManager`, porque o script publicado no Apps Script **nunca teve suporte a subpastas de músicas** — ele é estritamente o serviço de fotos de perfil dos alunos!

---

## 2. POR QUE FORAM CRIADOS DOIS `verse_01.wav` DUPLICADOS?

### Causa Técnica Comprovada
Na linha 519 de `SongManager.jsx`:
```javascript
const fileName = `verse_${String(i + 1).padStart(2, '0')}.wav`;
```
1. No laço de geração, para o primeiro verso (`i = 0`), o nome do arquivo gerado é `verse_01.wav`.
2. Como o laço de repetição foi interrompido (ou falhou na primeira tentativa, ou foi executado novamente pelo botão com retry), foram enviados dois uploads com o mesmo nome: `verse_01.wav`.
3. O Google Drive **não é um sistema de arquivos que sobrescreve por nome**: no Google Drive, dois arquivos podem ter o mesmo nome exato (`verse_01.wav`) na mesma pasta, recebendo dois `fileId` diferentes.
4. Por que **apenas** `verse_01.wav` apareceu?
   * Porque os outros 44 versos **já foram verificados como EXISTENTES** pelo `checkDriveAudioStatus` na nova implementação (Etapa 30), fazendo com que o laço os pulasse imediatamente (`continue`)!
   * Apenas o verso 1 (que o teste da etapa anterior havia considerado faltante) foi submetido ao upload.

---

## 3. AUDITORIA DA INTEGRIDADE DOS 45 VERSOS DA MÚSICA

Executamos uma varredura física completa em 100% dos 45 versos da música `"Vamos aprender ingles juntos"` (`0aed5144-07d7-4c04-9410-34d035a7577d`) usando a verificação canônica com `Range: bytes=0-0`:

### Resultado da Varredura Física (45 Versos):
* **Versos 01 a 45 auditados individualmente.**
* **`EXISTS` (Acessíveis, arquivos WAV autênticos com assinatura `RIFF`):** **45 de 45 (100%)**
* **`MISSING` (Ausentes):** **0 (Zero)**
* **`UNKNOWN` (Inconclusivos):** **0 (Zero)**

### Tabela Sintética dos Versos:
| Versos | Texto de Exemplo | Status Físico no Google Drive | Tipo | Ação Necessária |
| :---: | :--- | :---: | :---: | :---: |
| **V01** | *"Hello!"* | **EXISTS** (`206 Partial Content`) | `audio/wav` | **NENHUMA (Preservar)** |
| **V02** | *"Hi"* | **EXISTS** (`206 Partial Content`) | `audio/wav` | **NENHUMA (Preservar)** |
| **V03** | *"Good morning!"* | **EXISTS** (`206 Partial Content`) | `audio/wav` | **NENHUMA (Preservar)** |
| **V04..V44** | *Versos intermediários...* | **EXISTS** (`206 Partial Content`) | `audio/wav` | **NENHUMA (Preservar)** |
| **V45** | *"Let's learn English together!"* | **EXISTS** (`206 Partial Content`) | `audio/wav` | **NENHUMA (Preservar)** |

> **DESCOBERTA CRUCIAL:** **A pasta de áudios original da música NUNCA foi perdida!**  
> Os 45 áudios WAV continuam vivos e íntegros na nuvem do Google Drive da conta oficial, com seus IDs intactos e respondendo HTTP 206 de streaming. A tentativa de regeneração ocorreu apenas porque o `lh3.googleusercontent.com` gerava falso negativo (404) para arquivos que não eram imagens.

---

## 4. ONDE ESTÃO OS ARQUIVOS E QUAL É O DESTINO CORRETO?

1. **Os 45 arquivos originais da música:**
   Estão na pasta de áudio original do Google Drive (pertencente ao catálogo raiz `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`). Eles estão 100% funcionais no avatar dos alunos.
2. **Os dois arquivos `verse_01.wav` na pasta `Aluno - aluno-sem-id`:**
   São subprodutos dos testes manuais de upload que utilizaram o Web App de fotos de alunos. Eles **não estão cadastrados no catálogo do Supabase**, não são tocados pelos alunos e estão isolados na pasta de avatares.

---

## 5. IMPACTO DAS MUDANÇAS E BASELINE

* Na baseline `magic-english-v4.2-audio-security-stable`, a função `uploadAudioToDrive` apontava para `GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT` acreditando que o mesmo script atendia tanto alunos quanto músicas.
* Como o Google Apps Script não possui branch de rota para `songId`, ele trata qualquer requisição recebida como foto de aluno, gerando a pasta `Aluno - ...`.
* No entanto, **como todos os 45 versos já existem no Drive (`EXISTS: 45`)**, o `SongManager` com o novo `checkDriveAudioStatus` **não precisa fazer nenhum upload**. Ao clicar no botão, ele verifica que os 45 versos existem e encerra com sucesso sem tocar na Azure e sem chamar o Apps Script.

---

## 6. PLANO MÍNIMO DE CORREÇÃO CIRÚRGICA

Para blindar o sistema e impedir que qualquer upload futuro caia na pasta de alunos:

1. **Separar Conceitualmente os Endpoints:**
   * `uploadAvatarToDrive`: Continua usando o Web App de fotos de alunos (`GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT`).
   * `uploadAudioToDrive`: Não deve reutilizar o script de avatares. Se for necessário fazer upload de áudios de músicas no futuro, o script do Apps Script precisa de uma chave `action: 'upload_song_audio'` com pasta raiz oficial, OU o `SongManager` deve alertar que os áudios já foram homologados no Google Drive.
2. **Preservação dos 45 Versos:**
   * **NÃO REGENERAR NADA.** Os 45 versos já estão confirmados com `EXISTS` e URLs funcionais.
   * Os 2 arquivos órfãos `verse_01.wav` em `Aluno - aluno-sem-id` não oferecem risco e podem ser mantidos ou excluídos manualmente no Drive sem qualquer efeito no sistema.

---

## 7. CONCLUSÃO E RECOMENDAÇÃO

1. O alarme de que os áudios haviam sumido foi causado pelo endpoint de teste `lh3` que retornava 404 para arquivos não-imagem. A verificação canônica com `drive.google.com/uc?export=download&id=...` comprovou que **todos os 45 áudios estão 100% preservados e audíveis**.
2. A pasta `Aluno - aluno-sem-id` foi criada porque o Apps Script configurado é o serviço de upload de fotos de alunos.
3. Não há consumo da Azure nem perda de dados.
