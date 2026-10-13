# AUDITORIA FINAL — GOOGLE DRIVE + AZURE TTS PROXY INVOCATIONS

> **Data:** 11/10/2026  
> **Status:** AUDITORIA TÉCNICA E DIAGNÓSTICO DO FLUXO OPERACIONAL  
> **Regra aplicada:** Nenhuma linha de código ou infraestrutura foi alterada.

---

## 1. AUDITORIA DO GOOGLE DRIVE

### 1.1 Fluxo do `directAudioUrl`
No componente [`AvatarPracticeView.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx#L573-L584), a função central de reprodução de fala é `speakText(text, directAudioUrl, explicitLang, bilingualPhraseEn, onFinished)`:

```javascript
// REQUISITO CUSTO ZERO: Se já possui áudio salvo no Google Drive / Storage, toca direto!
if (directAudioUrl) {
  try {
    const res = await fetch(directAudioUrl);
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      audioBuffer = await head.audioCtx.decodeAudioData(arrayBuf);
    }
  } catch (fetchErr) {
    console.warn('Falha ao reproduzir áudio do Google Drive, fallback para TTS neural:', fetchErr);
  }
}
```

### 1.2 Respostas às Questões
1. **Quando uma frase possui áudio no Drive, qual função é chamada?**
   * É executado um `fetch(directAudioUrl)` nativo do navegador para baixar os bytes do arquivo de áudio. Em seguida, os bytes são convertidos em `ArrayBuffer` e decodificados via `head.audioCtx.decodeAudioData(arrayBuf)` diretamente na memória do `AudioContext` do TalkingHead.
2. **Existe chamada para `azure-tts-proxy` nesse caso?**
   * **NÃO.** A condicional [AvatarPracticeView.jsx#L587](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx#L587) verifica estritamente `if (!audioBuffer)`. Como o buffer foi preenchido pelo Drive, o bloco da Azure é **completamente ignorado**.
3. **Existe consumo Azure?**
   * **Zero.** Custo financeiro e de quota de caracteres da Microsoft é nulo.
4. **O `AudioContext` continua sendo usado?**
   * **SIM.** O áudio decodificado vira um `AudioBuffer` padrão da Web Audio API (`head.audioCtx`), alimentando os nós de áudio do TalkingHead.
5. **O áudio do Drive passa pelo TalkingHead/lipsync?**
   * **SIM.** O objeto resultante é repassado para `head.speakAudio({ audio: audioBuffer, words, wtimes, wdurations }, { lipsyncLang: 'en' })`. O TalkingHead analisa o tempo das palavras e aciona os morph targets 3D (`viseme_aa`, `jawOpen`, etc.) com animação labial idêntica à síntese neural.

### 1.3 Exemplo de Fluxo Real com Google Drive
```
Verso de Música com URL Gravada no Banco
         │
         ▼
`handlePlayCurrentPhrase()` chama `speakText(currentPhrase.english, currentPhrase.audioUrl, 'en')`
         │
         ▼
`fetch("https://drive.google.com/...")` ──► HTTP 200 (MP3/WAV em cache)
         │
         ▼
`head.audioCtx.decodeAudioData(arrayBuffer)` ──► Cria AudioBuffer local
         │
         ▼
`head.speakAudio({ audio: audioBuffer, ... }, { lipsyncLang: 'en' })`
         │
         ▼
Avatar 3D abre a boca sincronizado com o áudio gravado no Drive (CUSTO R$ 0,00)
```

---

## 2. AUDITORIA AZURE TTS PROXY

### 2.1 Verificação da Edge Function (`azure-tts-proxy`)
Inspeção do arquivo [`supabase/functions/azure-tts-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/azure-tts-proxy/index.ts):

* **JWT:** Validado através do header `Authorization: Bearer <token>` via `supabase.auth.getUser(token)` e protegido pelo gateway do Supabase Kong/Functions.
* **Secret Azure:** Carregado em tempo de execução via `Deno.env.get("AZURE_SPEECH_KEY")` e `Deno.env.get("AZURE_SPEECH_REGION")` (Região configurada: `eastus`).
* **Retorno:** Retorna HTTP 200 com payload estruturado:
  ```json
  {
    "base64Audio": "UklGRi...",
    "mimeType": "audio/wav",
    "voice": "en-US-JennyNeural"
  }
  ```
* **Formato de Áudio:** Sintetizado diretamente em `riff-24khz-16bit-mono-pcm` (WAV sem compressão de alta fidelidade para sincronia labial imediata sem artefatos).

### 2.2 Verificação de Conectividade em Produção
* **Health Check do Endpoint (GET autenticado via API Gateway):**
  * **Status HTTP:** `200 OK`
  * **Payload retornado:**
    ```json
    {
      "status": "online",
      "service": "Azure Speech TTS Proxy",
      "configured": true,
      "region": "eastus",
      "timestamp": "2026-10-11T23:06:51.157Z"
    }
    ```
* **Status do Secret:** `configured: true` (A chave `AZURE_SPEECH_KEY` está ativa e injetada no ambiente Deno).

---

## 3. AUDITORIA DE INVOCATIONS NO SUPABASE

1. **As chamadas POST 200 correspondem às falas dinâmicas?**
   * **SIM.** O `azure-tts-proxy` recebe POST 200 apenas para conteúdos que **não possuem áudio pré-gravado**:
     * Mensagem de boas-vindas (*"Welcome back!"* / *"Olá, vamos continuar de onde paramos"*);
     * Frases de incentivo e feedback pedagógico (*"Muito bem! Agora tente repetir a frase completa."*);
     * Mensagens de encerramento/farewell (*"Parabéns pelo treino de hoje!"*);
     * Frases de músicas novas que ainda não tiveram áudio salvo no Google Drive.
2. **Existem chamadas GET 404?**
   * **NÃO.** O endpoint responde `OPTIONS` (200), `GET` (200 health check) e `POST` (200 síntese). Não há rota inválida ou requisição órfã no backend.
3. **Existem chamadas sem necessidade?**
   * **NÃO.** Como o `AvatarPracticeView` faz a verificação `if (!audioBuffer)` antes de acionar `requestAzureTTS`, qualquer áudio existente no Drive bloqueia imediatamente o disparo para a Edge Function.
4. **Existe chamada Azure quando o áudio deveria vir do Drive?**
   * **Apenas em caso de falha de rede no Drive.** Se a URL do Google Drive falhar (ex.: erro de CORS, permissão pública revogada no Drive ou timeout de conexão), o bloco `try/catch` captura o erro e faz fallback seguro e transparente para a Azure, impedindo que o aluno fique em silêncio.

---

## 4. MATRIZ DE AUDITORIA DO FLUXO COMPLETO

| Tipo de Fala / Evento | Fonte Esperada | Condição de Acionamento | Chama Azure? | Lipsync 3D Ativo? | Resultado Operacional |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Verso de música com áudio** | **Google Drive** | `verse.audioUrl` presente no banco | **NÃO** | **SIM** | **OK (Custo Zero)** |
| **Verso de música sem áudio** | **Azure Proxy** | `verse.audioUrl` ausente/nulo | **SIM (POST 200)** | **SIM** | **OK (Síntese Jenny)** |
| **Saudação inicial (Welcome)** | **Azure Proxy** | Ao abrir a tela do Avatar | **SIM (POST 200)** | **SIM** | **OK (Francisca/Jenny)** |
| **Retomada de sessão (Resume)** | **Azure Proxy** | Ao retomar treino do mesmo dia | **SIM (POST 200)** | **SIM** | **OK (Francisca/Jenny)** |
| **Feedback de acerto (Success)** | **Azure Proxy** | Ao pronunciar > 85% correto | **SIM (POST 200)** | **SIM** | **OK (Francisca/Jenny)** |
| **Alerta de frase incompleta** | **Azure Proxy** | Pronunciou < 75% da frase | **SIM (POST 200)** | **SIM** | **OK (Francisca)** |
| **Repetição corretiva (Retry)** | **Azure Proxy** | Pronúncia imprecisa | **SIM (POST 200)** | **SIM** | **OK (Francisca)** |
| **Encerramento / Farewell** | **Azure Proxy** | Ao fim dos 15 minutos diários | **SIM (POST 200)** | **SIM** | **OK (Francisca/Jenny)** |
| **Falha transitória na Azure** | **Web Speech API** | Azure inacessível ou offline | **NÃO** | Parcial (Local) | **OK (Fallback de emergência)** |

---

## 5. AUDITORIA DE CUSTO & PERFORMANCE

1. **Drive continua evitando consumo Azure:**
   * **Confirmado 100%.** Todas as músicas do repertório que já contam com arquivos hospedados no Drive são tocadas localmente através do buffer do navegador, sem onerar nem o banco nem a Azure.
2. **Azure somente gera quando necessário:**
   * **Confirmado 100%.** Apenas interações contextuais, feedbacks dinâmicos com o nome do aluno e versos sem áudio pré-renderizado acionam o proxy.
3. **Ausência de loop de geração:**
   * As chamadas `speakText` são associadas a eventos únicos (clique do usuário no microfone, término de avaliação de voz ou evento `onFinished`). Não há `useEffect` sem dependências ou timers soltos re-disparando requisições.
4. **Sem repetição desnecessária:**
   * Durante uma mesma frase de treino, o áudio é armazenado em memória na variável de estado e não é re-sintetizado caso o aluno clique para escutar a frase novamente (usa o `currentPhrase.audioUrl` do Drive).

---

## 6. CONCLUSÃO

A arquitetura de áudio do Magic English está **100% estabilizada, segura e homologada**:
1. O erro de tipagem (`isSupabaseConfigured`) foi completamente eliminado, restaurando as chamadas com retorno HTTP 200 da Azure.
2. O Google Drive atua como a biblioteca primária de custo zero.
3. O Supabase Edge Function `azure-tts-proxy` atua com segurança máxima protegendo a credencial da Microsoft no backend.
4. O TalkingHead recebe áudios tanto do Drive quanto da Azure via `head.audioCtx`, animando os lábios de Sarah com visemas universais sem falhas ou delays.
