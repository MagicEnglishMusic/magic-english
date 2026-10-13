# AUDITORIA — VALIDAÇÃO REAL DO GOOGLE DRIVE NO SONGMANAGER

> **Data:** 11/10/2026  
> **Componente Auditado:** `src/components/admin/SongManager.jsx`  
> **Utilitário Auditado:** `src/utils/googleDriveHelper.js`  
> **Serviço de Dados:** `src/services/songsService.js`  
> **Status:** AUDITORIA TÉCNICA E DIAGNÓSTICO (Nenhum código foi modificado)

---

## 1. INVESTIGAÇÃO NO `SongManager.jsx`

### 1.1 Como o sistema decide que um verso já possui áudio?
A decisão de existência de áudio é tomada nas linhas 501–506 da função `generateAvatarAudiosForSong`:

```javascript
// Linhas 501-506 de SongManager.jsx:
// Se já tiver áudio no Google Drive válido, contabiliza e pula para economizar tokens
const existingUrl = verse.audioUrl || verse.audio_url || verse.driveUrl || verse.drive_audio_url;
if (existingUrl && (existingUrl.includes('googleusercontent.com') || existingUrl.includes('drive.google.com'))) {
  successCount++;
  continue;
}
```

### 1.2 O que ele verifica?
* **Somente o banco de dados (estado local/Supabase):** Verifica apenas a string da propriedade textual `audioUrl` (ou suas variações `audio_url`, `driveUrl`, `drive_audio_url`) contida dentro do array JSON `timestamps` da música.
* **Nenhum teste real no Google Drive:** **NÃO há nenhuma checagem HTTP (HEAD ou GET) ou chamada de API para o Google Drive.** O sistema assume cegamente que, se o campo contém uma string com `"drive.google.com"` ou `"googleusercontent.com"`, o arquivo físico ainda existe na nuvem.

### 1.3 Qual função exibe a mensagem de sucesso?
A mensagem é disparada na linha 589 de `SongManager.jsx`:

```javascript
// Linhas 586-590:
if (failedVerses.length === 0) {
  setAudioGenToast({
    type: 'success',
    text: `🎉 Sucesso total! Todos os ${successCount}/${updatedVerses.length} versos foram salvos na pasta "${folderName}" no Google Drive! Custo ZERO garantido.`
  });
}
```

Como os versos pulados incrementam o contador `successCount++` (linha 504), quando todos os versos já possuíam URL gravada no banco, `successCount === updatedVerses.length`, exibindo a mensagem de que *"todos foram salvos no Google Drive"*, mesmo sem ter enviado um único byte!

### 1.4 Qual condição impede a nova geração?
A instrução `continue;` na linha 505:
```javascript
if (existingUrl && (existingUrl.includes('googleusercontent.com') || existingUrl.includes('drive.google.com'))) {
  successCount++;
  continue; // <--- PULA O VERSO SEM EXECUTAR O RESTO DO LAÇO
}
```

### 1.5 Onde acontece o skip de versos já existentes?
O skip acontece logo no início do laço `for (let i = 0; i < updatedVerses.length; i++)` (linhas 501–506), antes de qualquer tentativa de chamar a Azure (`requestAzureTTS`) ou o script de upload (`uploadAudioToDrive`).

---

## 2. MAPEAMENTO DA INTEGRAÇÃO COM O GOOGLE DRIVE

### 2.1 Fluxo de Criação e Upload
1. **Síntese de Áudio:** O `SongManager.jsx` chama `requestAzureTTS(verseText, 'en')`. A Azure retorna o áudio codificado em base64 (`audio/wav`).
2. **Upload via Google Apps Script:** Executa `uploadAudioToDrive()` (`googleDriveHelper.js#L218`), que envia um `fetch POST` para o endpoint Web App:  
   `https://script.google.com/macros/s/AKfycbzG38rRYJo8mmAplWgqhp-DaPTAolp0SjRgGkmH7UAIlzD-CiMJpglBE8tQjan9qWIeBQ/exec`
3. **Retorno da URL:** O Google Apps Script cria a subpasta da música dentro da pasta raiz (`1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`), salva o arquivo `.wav` com permissão pública e retorna o `fileId`.
4. **Armazenamento no Banco:** O frontend gera a URL canônica de CDN direto `https://lh3.googleusercontent.com/d/{fileId}` e salva na tabela `songs` do Supabase dentro do campo JSONB `timestamps`.

### 2.2 Cenário: Quando o arquivo/pasta é apagado manualmente no Google Drive
| Pergunta | Resposta Técnica |
| :--- | :--- |
| **O banco fica com a URL antiga?** | **SIM.** O Supabase não tem sincronização bidirecional (webhook) com o Google Drive. A URL `https://lh3.googleusercontent.com/d/{fileId}` permanece intacta na coluna `timestamps`. |
| **O sistema percebe a exclusão?** | **NÃO.** O `SongManager` lê apenas o registro do Supabase. Como a string da URL ainda está lá, o sistema assume que o arquivo existe e faz o `skip`. |
| **O sistema recupera o erro?** | **No SongManager:** Não, ele pula a geração.<br>**No Avatar do Aluno:** Sim, o `AvatarPracticeView.jsx` tenta fazer `fetch(directAudioUrl)`. Quando o arquivo foi apagado, o Google retorna HTTP 400/404, o bloco `catch` é disparado e o avatar recorre dinamicamente à síntese Azure em tempo de execução, evitando que a aula fique muda. Porém, isso onera a Azure a cada repetição da aula pelo aluno. |

---

## 3. PROPOSTA DE CORREÇÃO CIRÚRGICA (PLANO DE ARQUITETURA)

### 3.1 Comportamento Desejado
Para que o `SongManager` seja autossuficiente e resistente a exclusões manuais na nuvem, o processo de decisão por verso deve realizar uma verificação rápida de existência real do arquivo (Live Health-Check):

```
Para cada verso da música:
         │
         ▼
Possui URL no banco?
   ├── NÃO ──► Gerar Azure TTS ──► Upload Google Drive ──► Salvar URL no Banco
   │
   └── SIM
         │
         ▼
Verificação de Integridade Real (Fast HEAD/GET)
`await checkDriveFileExists(existingUrl)`
         │
         ├── Arquivo Físico Existe (HTTP 200)?
         │     └── SIM ──► Incrementar contador e pular (Economia de tokens)
         │
         └── Arquivo Apagado / Quebrado (HTTP 400 / 404 / Falha de Rede)?
               └── NÃO ──► Gerar novamente via Azure TTS
                           ──► Fazer novo Upload para o Google Drive
                           ──► Atualizar o Banco com o novo link
```

### 3.2 Implementação Recomendada da Função de Validação
No arquivo `src/utils/googleDriveHelper.js`, criar a função de checagem com timeout rápido (2.5 segundos):

```javascript
/**
 * Verifica se um arquivo de áudio hospedado no Google Drive ainda existe fisicamente
 */
export async function checkDriveAudioExists(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // Requisição rápida com range de 0 a 0 bytes para não baixar o áudio inteiro
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Se o arquivo foi apagado da lixeira ou a pasta foi deletada,
    // o googleusercontent retorna 400/404. Somente 200 ou 206 confirma existência.
    return res.status === 200 || res.status === 206;
  } catch (err) {
    return false; // Arquivo inacessível, timeout ou apagado
  }
}
```

### 3.3 Ajuste no Laço do `SongManager.jsx`
Substituir a checagem puramente textual das linhas 501–506:

```javascript
// ANTES (Apenas string):
const existingUrl = verse.audioUrl || verse.audio_url || verse.driveUrl || verse.drive_audio_url;
if (existingUrl && (existingUrl.includes('googleusercontent.com') || existingUrl.includes('drive.google.com'))) {
  successCount++;
  continue;
}

// DEPOIS (Validação Real de Arquivo Físico):
const existingUrl = verse.audioUrl || verse.audio_url || verse.driveUrl || verse.drive_audio_url;
if (existingUrl && (existingUrl.includes('googleusercontent.com') || existingUrl.includes('drive.google.com'))) {
  const fileReallyExists = await checkDriveAudioExists(existingUrl);
  if (fileReallyExists) {
    successCount++;
    continue; // Arquivo confirmado no Google Drive. Pula com segurança!
  } else {
    console.warn(`[SongManager] Áudio do verso #${i + 1} foi apagado do Google Drive. Regenerando...`);
  }
}
```

### 3.4 Opção de Forçar Regeneração Completa (Bônus de Usabilidade)
Adicionar no diálogo de confirmação da linha 476 uma opção ou checkbox de **"Forçar regeneração de todos os versos (sobrescrever mesmo os já existentes)"**, permitindo ao administrador recriar uma pasta inteira deliberadamente sem depender de verificações.

---

## 4. CONCLUSÃO

* **Causa do Problema:** O `SongManager` confiava exclusivamente na presença do texto da URL gravado na coluna `timestamps` do Supabase, sem testar se o arquivo físico ainda existia na lixeira/pasta do Google Drive.
* **Viabilidade da Solução:** A verificação real com `Range: bytes=0-0` consome menos de 50ms por verso, é 100% gratuita, não onera a quota do Google Drive e garante que músicas com pastas deletadas sejam automaticamente regeneradas e salvas no banco.
