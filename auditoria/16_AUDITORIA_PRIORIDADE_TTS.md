# RELATÓRIO DE AUDITORIA: PRIORIDADE DOS PROVEDORES TTS MAGIC ENGLISH
**Documento 16: Diagnóstico de Fluxo de Síntese Vocal, Desvio para Gemini TTS e Vulnerabilidade de Chave**  
**Data da Auditoria:** 11 de Outubro de 2026  
**Status:** Concluída (Somente Diagnóstico — Nenhuma Linha de Código Foi Alterada)  
**Classificação:** Confidencial / Engenharia de Software e Infraestrutura  

---

## 1. FLUXO REAL ATUAL DE TTS (ORDEM EXATA NO CÓDIGO)

A auditoria cirúrgica identificou com precisão a sequência de execução implementada no método `speakText` de [`src/components/avatar/AvatarPracticeView.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx):

```
1. Google Drive (directAudioUrl)
         │
         ├── [Sucesso] ──> Toca arquivo pré-gravado direto no navegador (Custo Zero)
         │
         └── [Ausente ou Falha no fetch]
                 │
                 ▼
2. Azure TTS Proxy (requestAzureTTS / requestAzureBilingualTTS)
         │
         ├── [Sucesso] ──> Retorna áudio WAV 24kHz via Edge Function
         │
         └── [Falha ou Erro 401/404/500] ──> Dispara Bloco catch (azureErr)
                 │
                 ▼
3. Gemini TTS (requestGeminiTTS)
         │
         ├── [Sucesso] ──> Sintetiza via Google Generative Language API
         │
         └── [Falha de Quota/Rede] ──> Dispara Bloco catch Externo
                 │
                 ▼
4. Web Speech API (window.speechSynthesis)
         └── Fallback local nativo do navegador do aluno
```

### Por que o Gemini TTS está sendo ouvido na prática?
O código **já está programado** para chamar o Azure TTS Proxy **antes** do Gemini TTS (linha 686).  
No entanto, o **Gemini TTS está sendo acionado porque a chamada ao Azure TTS Proxy está falhando e caindo no bloco `catch (azureErr)` (linha 697)**.

#### A Causa Raiz da Falha no Azure Proxy:
1. A Edge Function `azure-tts-proxy` **está publicada e online no Supabase** (comprovado pelo health-check HTTP 200 via GET: `status: online, configured: true, region: eastus`).
2. Porém, no código da Edge Function ([`supabase/functions/azure-tts-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/azure-tts-proxy/index.ts), linha 77):
   ```typescript
   const { data: { user }, error: authError } = await authClient.auth.getUser(token);
   if (authError || !user) {
     return new Response(JSON.stringify({ error: "Sessão inválida ou expirada..." }), { status: 401 });
   }
   ```
   A função exige estritamente um **token JWT de usuário logado via Supabase Auth** (`auth.getUser(token)`).
3. **Cenário do Aluno/Visitante:**  
   Quando o usuário acessa a tela como visitante (`guest`), quando a sessão JWT do Supabase ainda não foi sincronizada, ou quando o cliente invoca a função com o token anônimo (`anon key`), a Edge Function retorna **HTTP 401 Unauthorized**.
4. O `supabase.functions.invoke('azure-tts-proxy')` em `avatarPracticeService.js` recebe esse erro e dispara:
   ```javascript
   throw new Error(`Erro na síntese de voz via backend: ${errorMsg}`);
   ```
5. O `AvatarPracticeView.jsx` intercepta esse erro na linha 697:
   ```javascript
   } catch (azureErr) {
     console.warn('Azure TTS temporariamente indisponível, tentando Gemini TTS...', azureErr);
     const apiKey = settings.geminiApiKey || DEFAULT_AVATAR_SETTINGS.geminiApiKey;
     ttsResult = await requestGeminiTTS(fullSpokenText, apiKey, settings.ttsVoice || 'Kore');
   }
   ```
   **Resultado:** O sistema desvia instantaneamente para o Gemini TTS, gerando a voz `Kore` do Google em vez da voz neural da Azure.

---

## 2. MAPEAMENTO: GEMINI TTS

- **Arquivo:** [`src/components/avatar/AvatarPracticeView.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx)
- **Função:** `requestGeminiTTS(text, apiKey, voiceName)`
- **Linha:** Linhas 52 a 155
- **Condição que dispara:** É disparada exclusivamente dentro do bloco `catch (azureErr)` (linhas 697–701), sempre que `requestAzureTTS` ou `requestAzureBilingualTTS` lançam exceção ou falham.
- **Como recebe a chave/API:**  
  Lê de `settings.geminiApiKey || DEFAULT_AVATAR_SETTINGS.geminiApiKey`.  
  O valor padrão está **hardcoded** em `DEFAULT_AVATAR_SETTINGS.geminiApiKey` no arquivo [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js) (linha 78):
  `'REDACTED_GCP_GEMINI_KEY'`

---

## 3. MAPEAMENTO: AZURE PROXY

- **Arquivo:** [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js)
- **Funções:**
  - `requestAzureTTS(text, lang, customKey, voiceOverride)`: linhas 238 a 265
  - `requestAzureBilingualTTS(instructionPt, phraseEn, customKey, voices)`: linhas 271 a 300
- **Chamada no Componente:** [`AvatarPracticeView.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx), linhas 689 e 695 (dentro do bloco `try`).
- **Condição que dispara:** Sempre que uma frase não tem `directAudioUrl` (ou se o download do Drive falhar).
- **Por que não está completando e caindo no Gemini?**  
  A função `supabase.functions.invoke('azure-tts-proxy')` é chamada, mas é rejeitada pela Edge Function com **HTTP 401** porque a Edge Function exige um token de usuário logado em `auth.getUser()`, e o chamador atual no momento da execução está enviando o token anônimo ou sessão não logada.

---

## 4. REGRA DESEJADA vs. REALIDADE NO CÓDIGO

| Prioridade | Provedor | Comportamento Desejado | Comportamento Real Diagnosticado |
| :---: | :--- | :--- | :--- |
| **1ª** | **Google Drive** | Se existir áudio → toca do Drive com Custo ZERO. | ✅ **Funciona perfeitamente** (linha 670). Se há URL no Drive, toca sem tocar em nenhuma API. |
| **2ª** | **Azure TTS Proxy** | Se faltar áudio no Drive → tenta a Edge Function Azure. | ⚠️ **É chamado primeiro**, mas falha com 401 por restrição de sessão JWT estrita. |
| **3ª** | **Gemini TTS** | Fallback secundário se a Azure falhar. | ⚠️ **Está assumindo a fala** porque a Azure falhou no passo 2. |
| **4ª** | **Web Speech API** | Fallback terciário se tudo falhar. | ✅ Ativo e funcional na linha 762. |

---

## 5. AUDITORIA DE SEGURANÇA: EXPOSIÇÃO DO GEMINI

### 1. Existe chave Gemini exposta no frontend?
**SIM.**
- **Arquivo:** [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js), linha 78:
  ```javascript
  geminiApiKey: 'REDACTED_GCP_GEMINI_KEY',
  ```
- **Confirmação no Bundle Compilado:**  
  Foi realizada a busca no diretório de produção `dist/assets/*.js`. A string exata da chave Gemini foi confirmada em:  
  `dist/assets/AvatarSettingsView-DUWdEhgT.js` (linha 1).

### 2. Existe endpoint Gemini direto no navegador?
**SIM.**
- **Arquivo:** [`src/components/avatar/AvatarPracticeView.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx), linhas 57, 72 e 87:
  ```javascript
  endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`
  ```
  O navegador realiza requisições `fetch` diretas para a API do Google Generative Language expondo a chave de API nos parâmetros de URL.

---

## 6. CONCLUSÃO E AÇÕES RECOMENDADAS PARA A CORREÇÃO

1. **Ajuste na Edge Function `azure-tts-proxy`:**
   - Permitir que a Edge Function aceite o token público anônimo do Supabase (`SUPABASE_ANON_KEY`) ou usuários visitantes/alunos em onboarding sem bloquear com 401, mantendo a proteção contra abuso através do limitador de 500 caracteres e rate-limit.
   - Assim que o 401 for eliminado, o **Azure TTS Proxy responderá com HTTP 200 e áudio WAV**, e o fluxo **NUNCA MAIS desviará para o Gemini TTS**.
2. **Blindagem Futura da Chave Gemini:**
   - Transferir o fallback do Gemini para dentro da Edge Function ou remover a chave hardcoded do `DEFAULT_AVATAR_SETTINGS`.

---
**Auditoria de Prioridade TTS concluída e registrada em `auditoria/16_AUDITORIA_PRIORIDADE_TTS.md`. Nenhuma alteração foi realizada.**
