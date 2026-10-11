# MAGIC ENGLISH — RELATÓRIO TÉCNICO (ETAPA 2.8)
## CRIAÇÃO ISOLADA DO GEMINI TTS PROXY

**Data da Implementação:** 11 de Outubro de 2026  
**Status da Criação:** ✅ Edge Function criada de forma isolada  
**Arquivo Criado:** `supabase/functions/gemini-tts-proxy/index.ts`  
**Impacto no Frontend:** Zero (nenhum arquivo React, serviço ou componente modificado)  

---

## 1. ESTRUTURA CRIADA

Foi criada a nova Supabase Edge Function:
- **Caminho:** `supabase/functions/gemini-tts-proxy/index.ts`
- **Runtime:** Deno (TypeScript padrão Supabase Edge Runtime)
- **Estrutura de Rotas:**
  - `OPTIONS`: CORS preflight com headers oficiais (`authorization, x-client-info, apikey, content-type`).
  - `GET`: Health check seguro informando `status: "online"`, `service: "Gemini TTS Proxy (Fallback Contingency Engine)"` e se o secret está configurado.
  - `POST`: Síntese de áudio neural de contingência.

---

## 2. SEGURANÇA E PROTEÇÃO DE CREDENCIAIS

1. **Secret Serverless:**
   - A função busca a chave de API exclusivamente através de:
     ```typescript
     const geminiKey = Deno.env.get("GEMINI_API_KEY");
     ```
   - Nenhuma chave foi colocada em hardcode, arquivos de log, frontend ou documentação.
2. **Controle de Acesso (JWT Obrigatório):**
   - A função exige o header `Authorization: Bearer <token>` e valida a sessão ativa via `authClient.auth.getUser(token)`.
   - Chamadas públicas anônimas ou sem token válido são rejeitadas com **HTTP 401 Unauthorized**.
3. **Controle de Abuso:**
   - Limite máximo de segurança estabelecido em **800 caracteres** por requisição (`MAX_CHARACTERS = 800`).
   - Validação de payload JSON e bloqueio em caso de texto vazio.
   - Tratamento de status 429 da Google (cota excedida) para interromper loops desnecessários.

---

## 3. CONTRATO DA API

### Payload de Entrada (compatível com os modos Aluno e Admin):
```json
{
  "text": "Good job! Let's practice the next sentence.",
  "voice": "Kore",
  "language": "en",
  "purpose": "avatar"
}
```

### Resposta de Retorno:
```json
{
  "base64Audio": "UklGRi...",
  "mimeType": "audio/wav"
}
```
*Este contrato é 100% idêntico ao esperado pelo `AudioContext`, `TalkingHead`, cálculo de visemas e lipsync do Magic English.*

---

## 4. ARQUITETURA DE PRIORIDADE PRESERVADA

A regra estrita de prioridade de voz continua inalterada:

1. **Google Drive (Prioridade 1):** Custo Zero — Áudios pré-gravados de versos e aulas continuam sendo tocados direto do armazenamento.
2. **Azure TTS Proxy (Prioridade 2):** Provedor Oficial — Vozes oficiais dos professores (`JennyNeural`, `FranciscaNeural`, `GuyNeural`, `AriaNeural`, `DavisNeural`).
3. **Gemini TTS Proxy (Prioridade 3):** Fallback de Contingência — Acionado apenas quando o Azure falhar por cota ou indisponibilidade.
4. **Web Speech API (Prioridade 4):** Emergência local nativa do navegador.

---

## 5. TESTES E VALIDAÇÕES REALIZADOS

1. **Estrutura TypeScript Deno:** Sintaxe e tipagens validadas conforme o padrão Supabase.
2. **Ausência de Secrets Expostos:** Verificação automatizada comprovou que nenhuma chave de API foi inserida no código.
3. **Integridade do Frontend:** Executado `npm run build` com sucesso absoluto (zero erros, tempo de build 3.20s).
4. **Zero Modificações no Frontend:**
   - `src/services/avatarPracticeService.js` mantido intacto.
   - `src/components/avatar/AvatarPracticeView.jsx` mantido intacto.
   - `src/components/admin/SongManager.jsx` mantido intacto.
   - `src/components/admin/AvatarSettingsView.jsx` mantido intacto.
   - Google Drive, TalkingHead e dados pedagógicos 100% preservados.

---

## 6. PRÓXIMA ETAPA (ETAPA 2.9)

Aguardar autorização do proprietário para:
- Configurar o secret `GEMINI_API_KEY` no Supabase Dashboard (`wrrtiewjritbhcfqzjhy`).
- Fazer deploy da Edge Function `gemini-tts-proxy`.
- Migrar com segurança as chamadas do frontend para invocar a nova função e expurgar a chave hardcoded.
