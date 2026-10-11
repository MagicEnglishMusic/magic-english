# MAGIC ENGLISH — RELATÓRIO TÉCNICO (ETAPA 2.9)
## CONFIGURAÇÃO E DEPLOY DO GEMINI TTS PROXY

**Data da Auditoria e Preparação:** 11 de Outubro de 2026  
**Projeto Supabase:** `wrrtiewjritbhcfqzjhy` (`https://wrrtiewjritbhcfqzjhy.supabase.co`)  
**Status do Azure TTS Proxy:** ✅ **Online e Operacional (Provedor Primário Ativo)**  
**Status do Gemini TTS Proxy:** ✅ Código-fonte pronto, blindado e aguardando publicação  

---

## 1. PREPARAÇÃO DO SECRET GEMINI

Para proteger a credencial da Google, foi definido o uso do Secret serverless:
- **Nome da Variável:** `GEMINI_API_KEY`
- **Onde Configurar:**  
  1. Acessar o **Supabase Dashboard**: [https://supabase.com/dashboard/project/wrrtiewjritbhcfqzjhy](https://supabase.com/dashboard/project/wrrtiewjritbhcfqzjhy)
  2. Ir em **Project Settings** $\rightarrow$ **Edge Functions** $\rightarrow$ **Secrets**
  3. Adicionar o novo segredo:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** `[Chave de API oficial da Google Gemini]`
- **Segurança Rigorosa:**  
  Nenhum valor foi gravado em código-fonte, bundles compilados ou arquivos de log. A função lê exclusivamente via runtime:
  ```typescript
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  ```

---

## 2. PROCEDIMENTO DE DEPLOY DA EDGE FUNCTION

A função `supabase/functions/gemini-tts-proxy/index.ts` está completamente implementada.

### Como realizar o Deploy:

#### Opção A (Via Terminal / CLI autenticada):
```bash
npx supabase functions deploy gemini-tts-proxy --project-ref wrrtiewjritbhcfqzjhy
```
*(Nota de Segurança: Manter verificação JWT ativa. Nunca utilizar a flag `--no-verify-jwt`)*.

#### Opção B (Via Supabase Dashboard):
1. No painel da Supabase, acessar **Edge Functions**.
2. Criar ou atualizar a função **`gemini-tts-proxy`**.
3. Fazer o upload do código contido em `supabase/functions/gemini-tts-proxy/index.ts`.

---

## 3. VALIDAÇÃO DE CONTRATO E COMPATIBILIDADE

A função foi projetada para atender perfeitamente aos dois casos de uso do Magic English:

### 3.1. Modo Aluno / Avatar (`AvatarPracticeView.jsx`)
- **Payload:**
  ```json
  {
    "text": "Good job! Let's practice the next sentence.",
    "voice": "Kore",
    "language": "en",
    "purpose": "avatar"
  }
  ```
- **Retorno Padronizado:**
  ```json
  {
    "base64Audio": "UklGRi...",
    "mimeType": "audio/wav"
  }
  ```
- **Compatibilidade:** O buffer recebido é alimentado diretamente no `head.audioCtx.decodeAudioData` e no `head.speakAudio` do `TalkingHead` para cálculo proporcional de visemas e lipsync natural.

### 3.2. Modo Administrativo (`SongManager.jsx`)
- **Payload:**
  ```json
  {
    "text": "The wheels on the bus go round and round",
    "voice": "Kore",
    "language": "en",
    "purpose": "content_generation"
  }
  ```
- **Retorno:** O `base64Audio` retornado é convertido em ArrayBuffer e enviado ao Google Drive via `uploadAudioToDrive`, garantindo custo zero para os alunos que ouvirem essa música futuramente.

---

## 4. CONFIRMAÇÃO ABSOLUTA DA PRIORIDADE DOS PROVEDORES

A cadeia hierárquica e a política de contenção de custos foram auditadas e permanecem 100% preservadas:

```text
[1] Google Drive (Prioridade 1 - Custo Zero)
         │
         ├─► Áudio existe no Drive? ──► Toca arquivo local (0 chamadas de API)
         │
         └─► Áudio ausente
                  │
                  ▼
[2] Azure TTS Proxy (Prioridade 2 - Provedor Oficial Protegido)
         │
         ├─► Resposta 200 OK ────────► Toca voz oficial do professor (Jenny, Guy, etc.)
         │
         └─► Falha de rede ou cota
                  │
                  ▼
[3] Gemini TTS Proxy (Prioridade 3 - Fallback de Contingência Protegido)
         │
         ├─► Resposta 200 OK ────────► Toca áudio sintetizado da Google
         │
         └─► Falha
                  │
                  ▼
[4] Web Speech API (Prioridade 4 - Emergência local nativa do navegador)
```

**Regra Absoluta:** O Gemini **nunca** é acionado antes do Azure. O Azure Speech continua sendo o provedor oficial primário e encontra-se ativo em produção respondendo com HTTP 200.

---

## 5. INTEGRIDADE DO PROJETO

- ✅ **Código Gemini Antigo Preservado:** A chave atual e o fallback antigo permanecem ativos no frontend durante esta fase transitória, impedindo qualquer quebra de experiência.
- ✅ **Google Drive Intacto:** Nenhuma URL ou pasta foi modificada.
- ✅ **TalkingHead & Modelos 3D:** Intactos.
- ✅ **Build de Produção:** Testado com sucesso (zero erros).

---

## 6. PRÓXIMOS PASSOS (ETAPA 2.10)

Após a confirmação do deploy e do Secret `GEMINI_API_KEY`:
1. Atualizar `src/services/avatarPracticeService.js` para direcionar as requisições de contingência ao `gemini-tts-proxy`.
2. Remover a string hardcoded da chave Gemini de `DEFAULT_AVATAR_SETTINGS`.
3. Executar auditoria de bundle para comprovar a eliminação definitiva de chaves expostas no frontend.
