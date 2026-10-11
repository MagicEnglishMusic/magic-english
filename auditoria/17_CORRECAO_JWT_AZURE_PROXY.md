# MAGIC ENGLISH — RELATÓRIO TÉCNICO DE CORREÇÃO JWT (ETAPA 2.6)
## DIAGNÓSTICO E CORREÇÃO DO HTTP 401 NO AZURE TTS PROXY

**Data da Auditoria e Validação:** 11 de Outubro de 2026  
**Ambiente:** Supabase Cloud (`wrrtiewjritbhcfqzjhy`)  
**Região Azure:** `eastus`  
**Status do Azure TTS Proxy:** ✅ **Operacional (HTTP 200)**  

---

## 1. CAUSA RAIZ DO HTTP 401 IDENTIFICADA

A auditoria e os testes de invocação identificaram o motivo exato pelo qual a Edge Function retornava HTTP 401:

1. **Proteção JWT Ativa na Edge Function:**  
   Em `supabase/functions/azure-tts-proxy/index.ts`, a função valida estritamente a autenticidade do token JWT chamador:
   ```typescript
   const token = authHeader.replace(/Bearer /i, "").trim();
   const { data: { user }, error: authError } = await authClient.auth.getUser(token);
   if (authError || !user) {
     return new Response(JSON.stringify({ error: "Sessão inválida ou expirada..." }), { status: 401 });
   }
   ```
2. **Comportamento do `supabase.functions.invoke()`:**  
   Quando o cliente chama `supabase.functions.invoke()` sem passar cabeçalhos explícitos antes de uma sessão estar pronta ou persistida em memória no ciclo de renderização inicial do navegador, o cliente envia apenas o header `apikey` (`sb_publishable_...`). Como a chave anônima não é um Bearer JWT de usuário, `authClient.auth.getUser(token)` falha com:
   `"This endpoint requires a valid Bearer token" (HTTP 401)`.
3. **Disparo do Fallback:**  
   No componente `AvatarPracticeView.jsx`, o erro 401 disparava o bloco `catch (azureErr)`, caindo silenciosamente para a síntese do Gemini TTS.

---

## 2. ARQUIVOS ANALISADOS E AJUSTADOS

### 2.1. Arquivo Ajustado: `src/services/avatarPracticeService.js`
- **Funções:** `requestAzureTTS` e `requestAzureBilingualTTS`
- **Ajuste Realizado:**  
  Antes de cada disparo de síntese, o serviço agora resolve ativamente a sessão autenticada com `await supabase.auth.getSession()` e injeta o header explícito:
  ```javascript
  let authHeaders = {};
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      authHeaders = { Authorization: `Bearer ${token}` };
    }
  } catch (tokenErr) {
    console.warn('[azure-tts-proxy] Aviso ao resolver token da sessão:', tokenErr);
  }

  const { data, error } = await supabase.functions.invoke('azure-tts-proxy', {
    headers: authHeaders,
    body: { ... }
  });
  ```
- **Resultado:** Garante que o Bearer token seja propagado sem depender de sincronização assíncrona oculta de headers globais do SDK.

---

## 3. VALIDAÇÃO REAL DE SÍNTESE COM USUÁRIO AUTENTICADO

Foi executada uma bateria de testes contra o endpoint de produção Supabase (`https://wrrtiewjritbhcfqzjhy.supabase.co/functions/v1/azure-tts-proxy`) com uma sessão JWT real do Supabase Auth.

### Resultados dos Testes de Síntese Neural:

| Professor / Modo | Voz Azure | Idioma | Status HTTP | Tamanho Áudio (Bytes) | Resultado |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Profª Sarah** | `en-US-JennyNeural` | EN | **200 OK** | 170.460 | ✅ Sucesso (WAV) |
| **Profª Sarah** | `pt-BR-FranciscaNeural` | PT | **200 OK** | 180.060 | ✅ Sucesso (WAV) |
| **Prof. James** | `en-US-GuyNeural` | EN | **200 OK** | 184.860 | ✅ Sucesso (WAV) |
| **Profª Emma** | `en-US-AriaNeural` | EN | **200 OK** | 173.660 | ✅ Sucesso (WAV) |
| **Prof. David** | `en-US-DavisNeural` | EN | **200 OK** | 170.460 | ✅ Sucesso (WAV) |
| **Modo Bilíngue** | `pt-BR-FranciscaNeural` + `en-US-JennyNeural` | PT + EN | **200 OK** | 351.260 | ✅ Sucesso (WAV) |

---

## 4. CONFIRMAÇÃO DE PRESERVAÇÃO INTEGRAL

- ✅ **Google Drive Preservado:** Nenhum áudio gravado no Google Drive ou URLs estáticas foram tocados. O cache e custo zero continuam como prioridade absoluta (prioridade 1 antes de qualquer TTS).
- ✅ **TalkingHead Preservado:** Sincronização labial e lipsync recebem o áudio WAV PCM idêntico para cálculo de visemas.
- ✅ **Segurança Mantida:** Nenhuma credencial Azure é exposta no frontend. As chamadas à Edge Function continuam protegidas por JWT.
- ✅ **Código Gemini Preservado:** Nenhum arquivo do Gemini foi alterado nesta etapa, aguardando a próxima fase.
- ✅ **Build de Produção:** Testado com sucesso via `npm run build` (0 erros).
