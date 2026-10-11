# CRIAÇÃO ISOLADA DA EDGE FUNCTION AZURE TTS PROXY
**Documento 10: Relatório Técnico da Nova Camada Segura de Síntese de Voz (Etapa 2.2)**  
**Data:** 11 de Outubro de 2026  
**Status:** Etapa 2.2 Concluída (Edge Function Criada Isoladamente — Frontend Intocado)  
**Classificação:** Confidencial / Arquitetura de Segurança e Infraestrutura  

---

## 1. RESUMO DA ETAPA 2.2

Em conformidade rigorosa com as instruções da **Etapa 2.2**, foi criada de forma totalmente isolada a nova Supabase Edge Function:
👉 [`supabase/functions/azure-tts-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/azure-tts-proxy/index.ts)

### Princípios Rigorosamente Respeitados:
- **NENHUM arquivo de frontend foi alterado.** `src/services/avatarPracticeService.js`, `AvatarPracticeView.jsx`, `SongManager.jsx` e `AvatarSettingsView.jsx` permanecem 100% intocados.
- **NENHUM componente 3D, TalkingHead ou Three.js foi modificado.**
- **O Google Drive permanece como biblioteca prioritária oficial.**
- **NENHUM secret foi exposto ou gravado hardcoded.**
- **NENHUM caractere da franquia Azure foi consumido.**

---

## 2. ESTRUTURA CRIADA

### 2.1 Arquivos e Localização
- **Diretório:** `supabase/functions/azure-tts-proxy/`
- **Arquivo Principal:** [`supabase/functions/azure-tts-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/azure-tts-proxy/index.ts)

### 2.2 Dependências (Deno Runtime)
- `https://esm.sh/@supabase/supabase-js@2.39.8`: Para validação de sessão e autenticação de usuários via JWT.
- API nativa `fetch`, `Response`, `Uint8Array`, `ArrayBuffer` e `btoa`: Para a comunicação HTTP com a Azure e encoding de áudio sem dependências externas pesadas.

### 2.3 Funções Internas
1. `corsHeaders`: Cabeçalhos padrão para requisições cross-origin com suporte a preflight `OPTIONS`.
2. `escapeSSML(str)`: Sanitizador contra injeção de tags XML malformadas no payload SSML enviado à Microsoft.
3. `Deno.serve(handler)`: Servidor HTTP padrão de alto desempenho do Deno 1.x / 2.x.
4. Health-Check Handler (`GET`): Endpoint de verificação de status operacional e confirmação se a chave está configurada no ambiente.
5. Autenticador JWT: Valida o token `Bearer` recebido contra o Supabase Auth.
6. Gerador de SSML Mono-Voz e Bilíngue: Mapeia as vozes do professor ativo, idioma e pausas.
7. Conversor de Binário para Base64: Algoritmo por chunks de 8KB para alta velocidade e suporte a arquivos de áudio sem estouro de pilha.

---

## 3. SEGURANÇA E PROTEÇÃO DE CREDENCIAIS

### 3.1 Onde a Chave Será Armazenada
As credenciais da Microsoft Azure serão armazenadas exclusivamente nos **Secrets do Supabase** (variáveis de ambiente seguras do servidor):
- `AZURE_SPEECH_KEY`: Chave de subscrição do Azure Cognitive Services.
- `AZURE_SPEECH_REGION`: Região da instância (padrão: `eastus`).

### 3.2 Como Ela Será Protegida
- A chave é lida em tempo de execução via:
  ```typescript
  const azureKey = Deno.env.get("AZURE_SPEECH_KEY");
  const azureRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";
  ```
- **Zero Vazamento:** A chave nunca transita para o navegador do aluno, nunca entra no bundle compilado do Vite (`dist/assets/`), não é exibida em logs do console e não é retornada em nenhuma resposta JSON.
- **Validação de Autenticação Obrigatória:** A Edge Function bloqueia com `HTTP 401 Unauthorized` qualquer requisição que não contenha um token JWT válido de usuário autenticado no Supabase.

### 3.3 Controles de Abuso Implementados
- **Limite Máximo de Caracteres (`MAX_CHAR_LIMIT = 500`):** Rejeita requisições com textos abusivamente longos com `HTTP 400 Bad Request`, protegendo a franquia de 500.000 caracteres.
- **Rejeição de Payloads Vazios:** Valida se os campos `text` ou `instructionPt`/`phraseEn` estão preenchidos antes de chamar a Azure.

---

## 4. COMPATIBILIDADE GARANTIDA

### 4.1 Contrato da API e Retorno Idêntico
A Edge Function foi programada para entregar a mesma estrutura JSON atualmente gerada pelo cliente:
```json
{
  "base64Audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "mimeType": "audio/wav"
}
```

### 4.2 Compatibilidade com o TalkingHead e Áudio
- **Formato:** `riff-24khz-16bit-mono-pcm` (WAV 24kHz padrão sem perdas).
- **Web Audio API:** Compatível diretamente com `head.audioCtx.decodeAudioData()`.
- **Visemas Labiais:** Como a taxa de amostragem e os bytes de áudio são idênticos aos gerados anteriormente, o cálculo de durações de palavras (`wtimes` e `wdurations`) e o lip sync dos 5 professores (`sarah`, `james`, `emma`, `david`, `lucas`) permanecem perfeitamente sincronizados.

### 4.3 Google Drive Preservado
Como o componente `AvatarPracticeView.jsx` (linha 670) e `SongManager.jsx` (linha 511) sempre checam `directAudioUrl` e a presença de links do Drive antes de qualquer síntese, **o Google Drive continua sendo a fonte primária absoluta**. A Edge Function só será acionada quando o arquivo não existir no Drive.

---

## 5. TESTES E VALIDAÇÕES REALIZADOS

| Item | Status | Observação |
| :--- | :---: | :--- |
| **Criação do Arquivo TypeScript** | **CONFIRMADO** | `supabase/functions/azure-tts-proxy/index.ts` gravado com sucesso. |
| **Sintaxe Deno e Tipagem TS** | **CONFIRMADO** | Estrutura compatível com o Deno Deploy e Supabase Functions. |
| **Compilação do Frontend Existente** | **CONFIRMADO** | `npm run build` executado com sucesso (3.19s, zero erros). |
| **Sem Secrets Hardcoded** | **CONFIRMADO** | Apenas `Deno.env.get()` utilizado; nenhum valor literal presente. |
| **Teste de Requisição em Produção** | **NÃO TESTADO** | Aguarda cadastro dos secrets no Supabase e autorização da Etapa 2.3. |

---

## 6. PRÓXIMOS PASSOS (ETAPA 2.3)

Para realizar a migração controlada do frontend sem qualquer risco de interrupção:

1. **Configurar os Secrets no Supabase:**
   - No Dashboard do Supabase (Project Settings > Edge Functions > Secrets) ou via Supabase CLI, cadastrar:
     - `AZURE_SPEECH_KEY`: `<chave_azure>`
     - `AZURE_SPEECH_REGION`: `eastus`
2. **Implantar a Função:**
   - Fazer o deploy de `azure-tts-proxy` via Supabase CLI ou Git Integration.
3. **Migração Controlada do Frontend (`avatarPracticeService.js`):**
   - Atualizar `requestAzureTTS` e `requestAzureBilingualTTS` para invocar a Edge Function mantendo o fallback local.
4. **Validação Final:**
   - Testar a fala dos 5 professores e a geração de músicas no Admin.
   - Gerar nova chave no portal Azure e revogar a chave exposta anteriormente.

---
**Etapa 2.2 concluída com sucesso. Nenhuma alteração foi realizada no frontend ou no banco de dados. Aguardando autorização para a Etapa 2.3.**
