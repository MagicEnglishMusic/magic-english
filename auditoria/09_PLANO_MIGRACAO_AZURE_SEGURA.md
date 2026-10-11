# PLANO DE IMPLEMENTAÇÃO SEGURA — PROTEÇÃO AZURE SPEECH
**Documento 09: Arquitetura de Migração, Especificação da Edge Function `azure-tts-proxy` e Blindagem de Custos**  
**Data do Planejamento:** 11 de Outubro de 2026  
**Status:** Etapa 2.1 — Planejamento Exclusivo (Nenhum arquivo de código ou banco foi alterado)  
**Classificação:** Confidencial / Arquitetura de Segurança e Infraestrutura  

---

## 1. RESUMO EXECUTIVO E DIRETRIZES FUNDAMENTAIS

O objetivo central deste plano é desenhar a migração definitiva da integração **Microsoft Azure Speech Services** do frontend cliente para o backend serverless do **Supabase**, eliminando 100% da exposição de credenciais no navegador dos alunos e visitantes, sem alterar em absolutamente nada:
1. A prioridade máxima do **Google Drive** como biblioteca oficial de áudios a custo zero.
2. O funcionamento do **TalkingHead 1.7** e o pipeline de Web Audio API (`AudioContext`).
3. O cálculo matemático de visemas labiais e a expressividade facial dos 5 professores 3D.
4. A rotina administrativa de enriquecimento de canções no `SongManager.jsx`.
5. A franquia contratual de 500.000 caracteres mensais da conta Azure.

> [!IMPORTANT]
> **REGRA DE OURO OPERACIONAL:**  
> A Azure **NÃO** deve e **NÃO** irá substituir o Google Drive. A infraestrutura segura no Supabase será acionada estritamente quando:
> - O áudio do Google Drive não existir ou estiver inacessível;
> - Uma nova geração de lote for expressamente solicitada pelo Administrador;
> - Houver necessidade pedagógica real de síntese dinâmica em tempo de execução.

---

## 2. MAPEAMENTO DA ARQUITETURA ATUAL (AS-IS)

### 2.1 Onde a Azure é Chamada e Onde a Chave Está Sendo Utilizada
- **Declaração da Chave:** `src/services/avatarPracticeService.js` (linhas 226 a 232), dentro do objeto `AZURE_SPEECH_CONFIG`.
- **Métodos Consumidores:**
  - `requestAzureTTS(text, lang, customKey, voiceOverride)`: Monta SSML mono-voz e faz POST direto para `eastus.tts.speech.microsoft.com`.
  - `requestAzureBilingualTTS(instructionPt, phraseEn, customKey, voices)`: Monta SSML bi-voz (`<voice>` PT + `<break>` + `<voice>` EN) e faz POST direto para a Azure.
- **Telas e Componentes Afetados:**
  1. `src/components/avatar/AvatarPracticeView.jsx`: Executa `speakText`, chamando a Azure para saudações, mensagens de acolhimento e frases de músicas que não possuem link do Drive.
  2. `src/components/admin/SongManager.jsx`: Executa `generateAllVersesAudio`, chamando `requestAzureTTS` verso a verso antes de enviar para o Drive via Google Apps Script.
  3. `src/components/admin/AvatarSettingsView.jsx`: Referencia as vozes e configurações globais.

### 2.2 Análise das Chamadas: Aluno vs. Administrador

| Tipo de Usuário | Componente | Ação | Frequência | Prioriza Drive? | Gera Consumo Azure? |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Aluno** | `AvatarPracticeView.jsx` | Ouvir frase da música (`handlePlayCurrentPhrase`) | Alta | **SIM** (`audioUrl` do verso) | Apenas se faltar áudio no Drive |
| **Aluno** | `AvatarPracticeView.jsx` | Saudação inicial de acolhimento / Retomada | 1x por sessão | Não (frase dinâmica) | **SIM** (~80 a 120 caracteres) |
| **Aluno** | `AvatarPracticeView.jsx` | Elogio de acerto (`evaluatePronunciation`) | A cada acerto | Não (frase dinâmica) | **SIM** (~50 a 90 caracteres) |
| **Aluno** | `AvatarPracticeView.jsx` | Encorajamento de erro / retry | A cada erro | Parcial (PT dinâmico + EN Drive) | **SIM** (~60 a 90 caracteres) |
| **Aluno** | `AvatarPracticeView.jsx` | Despedida de fim de tempo diário | 1x ao dia | Não (frase dinâmica) | **SIM** (~100 caracteres) |
| **Admin** | `SongManager.jsx` | Gerar áudios em lote de canção nova | Manual | **SIM** (Pula versos com Drive) | **SIM** (Apenas versos inéditos) |

---

## 3. NOVA ARQUITETURA PROPOSTA (TO-BE)

### 3.1 Arquitetura Geral da Edge Function `azure-tts-proxy`

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR DO ALUNO / ADMIN                      │
│                                                                        │
│   1. Precisa de áudio?                                                 │
│      ├── Tem link do Google Drive? ──>[SIM]──> Toca Direto (Custo 0)   │
│      └── [NÃO]                                                         │
│           │                                                            │
│           ▼ (Requisita Síntese Segura)                                 │
│   supabase.functions.invoke('azure-tts-proxy', { body: payload })      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Requisição HTTPS Autenticada
                                    │ (JWT do Aluno ou Admin)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTION (Deno Runtime)                 │
│                      `functions/azure-tts-proxy`                       │
│                                                                        │
│   2. Validação de Segurança & Autenticação                             │
│      ├── Usuário logado? (Valida JWT via Supabase Auth)                │
│      └── Tamanho do texto aceitável? (< 500 caracteres)                │
│                                                                        │
│   3. Consulta de Cache (Opcional / Fase 2)                             │
│      └── Se já existe áudio para (hash_texto + voz), retorna do cache │
│                                                                        │
│   4. Chamada Segura à Microsoft Azure                                  │
│      ├── Lê Secrets: Deno.env.get("AZURE_SPEECH_KEY")                  │
│      ├── Lê Secrets: Deno.env.get("AZURE_SPEECH_REGION")               │
│      ├── Monta SSML (mono-voz ou bilíngue)                             │
│      └── Executa POST https://{region}.tts.speech.microsoft.com/...    │
│                                                                        │
│   5. Resposta Padronizada (Contrato Idêntico)                          │
│      └── Retorna { base64Audio, mimeType: "audio/wav" }                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        WEB AUDIO API & TALKINGHEAD                     │
│                                                                        │
│   6. Recebe { base64Audio, mimeType: "audio/wav" }                     │
│   7. head.audioCtx.decodeAudioData(...) decodifica os buffers          │
│   8. head.speakAudio(...) renderiza os visemas labiais perfeitos       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Especificação da API da Edge Function

#### Rota: `POST /functions/v1/azure-tts-proxy`
- **Cabeçalhos Requeridos:**
  - `Authorization: Bearer <SUPABASE_USER_TOKEN>`
  - `Content-Type: application/json`

#### Payloads de Entrada (Request Body):
1. **Modo Mono-Voz (Padrão):**
   ```json
   {
     "mode": "single",
     "text": "Hello, welcome to Magic English!",
     "lang": "en",
     "voice": "en-US-JennyNeural"
   }
   ```
2. **Modo Bilíngue (Saudações e Instruções de Prática):**
   ```json
   {
     "mode": "bilingual",
     "instructionPt": "Muito bem! Repita comigo:",
     "phraseEn": "I believe in my dreams",
     "voicePt": "pt-BR-FranciscaNeural",
     "voiceEn": "en-US-JennyNeural"
   }
   ```

#### Resposta de Sucesso (HTTP 200) — Contrato Idêntico ao Frontend Atual:
```json
{
  "base64Audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "mimeType": "audio/wav"
}
```

#### Resposta de Erro (HTTP 400 / 401 / 429 / 500):
```json
{
  "error": "Descrição clara do erro sem expor segredos internos"
}
```

---

## 4. AVALIAÇÃO DE IMPACTO E RISCOS

### 4.1 Respostas às Questões Cruciais de Impacto (Seção "Avaliar Impacto")

1. **Quais arquivos React serão alterados?**
   - **Apenas 1 arquivo de serviço principal:** [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js).
   - Os componentes visuais (`AvatarPracticeView.jsx`, `SongManager.jsx`, `AvatarSettingsView.jsx`) **NÃO sofrem nenhuma alteração estrutural**, pois continuam chamando as mesmas funções de serviço `requestAzureTTS` e `requestAzureBilingualTTS`.
2. **Quais funções serão substituídas?**
   - O interior das funções `requestAzureTTS` e `requestAzureBilingualTTS` em `avatarPracticeService.js` deixará de fazer `fetch(AZURE_SPEECH_CONFIG.endpoint)` direto e passará a chamar `supabase.functions.invoke('azure-tts-proxy', { body: ... })`.
3. **O contrato atual será preservado?**
   - **Sim, rigorosamente 100%.** A assinatura `return { base64Audio, mimeType: 'audio/wav' }` será mantida idêntica byte a byte.
4. **O TalkingHead receberá exatamente o mesmo áudio?**
   - **Sim.** O formato de saída da Azure continua sendo `riff-24khz-16bit-mono-pcm` (WAV padrão sem perdas de 24kHz), que é o formato nativo com menor custo de decodificação para o Three.js.
5. **O AudioContext continuará funcionando?**
   - **Sim.** O `base64ToArrayBuffer` e o `processAudioToBuffer(headCtx, ...)` em `AvatarPracticeView.jsx` operam exatamente sobre os mesmos bytes WAV decodificados por `decodeAudioData`.
6. **Os visemas continuarão funcionando?**
   - **Sim.** Como o TalkingHead calcula os visemas a partir dos picos de amplitude e duração do buffer de áudio decodificado (`audioBuffer.duration`), o lip sync e as expressões dos 5 professores permanecerão 100% inalterados.
7. **O Google Drive continuará prioritário?**
   - **Sim, intocado.** A linha 670 de `AvatarPracticeView.jsx` (`if (directAudioUrl)`) e a linha 511 de `SongManager.jsx` continuarão sendo executadas antes de qualquer requisição de síntese.
8. **Existe risco de regressão?**
   - O risco é **mínimo**, restrito a latência adicional de rede (da ordem de 40ms a 100ms referente ao salto no Deno Deploy do Supabase). Esse risco é totalmente anulado por testes isolados prévios da Edge Function antes da troca no cliente.

---

## 5. DESIGN DO CACHE FUTURO (`avatar_audio_cache`)

Para maximizar a economia da franquia mensal de 500.000 caracteres, foi modelada a estrutura de uma tabela opcional no Supabase para deduplicação automática de áudios repetidos:

### 5.1 Estrutura Sugerida da Tabela (Fase Futura)
- `id`: UUID (Primary Key)
- `content_hash`: TEXT UNIQUE (Hash SHA-256 de `lower(trim(texto)) + '_' + voice_name`)
- `text_content`: TEXT (Frase original)
- `language`: VARCHAR(10) (`en-US`, `pt-BR`, `bilingual`)
- `voice_name`: VARCHAR(50) (ex: `en-US-JennyNeural`, `en-US-GuyNeural`)
- `character_count`: INT (Quantidade de caracteres debitados na época)
- `storage_path`: TEXT (Caminho no Supabase Storage ou URL do Drive)
- `created_at`: TIMESTAMPTZ

### 5.2 Benefício Direto para a Franquia:
Com esse cache, frases recorrentes de sistema (ex: saudações como *"Olá, {nome}! Tudo bem?..."* ou elogios como *"Boa! Gostei muito. Vamos para a próxima frase!"*) serão geradas apenas uma única vez na história da plataforma. Todos os alunos subsequentes ouvirão o áudio em cache com **consumo ZERO de caracteres**.

---

## 6. ORDEM SEGURA DE IMPLEMENTAÇÃO (STEP-BY-STEP)

Quando autorizada a execução, o processo de migração deverá seguir rigorosamente esta ordem incremental:

```
Passo 1: Criar Edge Function em supabase/functions/azure-tts-proxy/
   │      (código serverless isolado, sem alterar o frontend)
   ▼
Passo 2: Configurar Secrets no Supabase CLI / Dashboard
   │      (AZURE_SPEECH_KEY e AZURE_SPEECH_REGION gravados com segurança)
   ▼
Passo 3: Testar e Validar a Edge Function via cURL / PowerShell
   │      (Confirmar retorno HTTP 200 com base64 WAV válido)
   ▼
Passo 4: Atualizar avatarPracticeService.js
   │      (Apontar requestAzureTTS e requestAzureBilingualTTS para a Edge Function)
   ▼
Passo 5: Validar Prática do Aluno e Geração Administrativa no Browser
   │      (Testar os 5 professores: Sarah, James, Emma, David e Mascote Lucas)
   ▼
Passo 6: Verificar Bundle Compilado de Produção (npm run build)
   │      (Confirmar que nenhuma string da chave Azure aparece em dist/assets/*.js)
   ▼
Passo 7: Revogação da Chave Antiga no Portal Microsoft Azure
   │      (Gerar chave nova, atualizar Secret no Supabase e revogar a chave exposta)
```

---

## 7. PLANO DE TESTES E VALIDAÇÃO

1. **Teste 1 — Prioridade Custo Zero do Drive:**
   - Tocar uma frase que possua `audioUrl` do Google Drive.
   - **Critério de Aceite:** O áudio toca imediatamente e o painel de rede (Network) registra apenas o GET para `lh3.googleusercontent.com`, com zero requisições para a Edge Function ou Azure.
2. **Teste 2 — Síntese Segura Mono-Voz:**
   - Forçar uma frase sem áudio no Drive para a Profª Sarah.
   - **Critério de Aceite:** A requisição vai para `/functions/v1/azure-tts-proxy`, retorna o WAV e a avatar articula os lábios perfeitamente com voz JennyNeural.
3. **Teste 3 — Síntese Segura Bilíngue:**
   - Disparar uma instrução com tradução.
   - **Critério de Aceite:** O professor pronuncia a introdução em português e a frase em inglês com troca nativa de sotaques.
4. **Teste 4 — Compatibilidade com os 5 Professores:**
   - Testar sucessivamente Sarah, James, Emma, David e Mascote Lucas.
   - **Critério de Aceite:** Vozes masculinas e femininas corretas, enquadramentos mantidos e Mascote Lucas sem torções de postura.
5. **Teste 5 — Geração Administrativa em Lote:**
   - Acessar `SongManager.jsx` e simular a geração de versos novos.
   - **Critério de Aceite:** Versos novos sintetizados via backend e enviados com sucesso para a pasta do Google Drive via Google Apps Script.

---

## 8. ESTRATÉGIA DE ROLLBACK

Caso ocorra qualquer instabilidade imprevista no ambiente serverless do Supabase:
1. **Plano de Contingência Imediato:**
   - O arquivo `avatarPracticeService.js` manterá documentada a assinatura anterior comentada. Se necessário, uma reversão git de 1 commit restaura o funcionamento cliente em menos de 60 segundos.
2. **Fallback Automático Integrado:**
   - O bloco `try/catch` em `AvatarPracticeView.jsx` (linha 697) e `SongManager.jsx` (linha 527) já possui fallback nativo para o Gemini TTS e síntese local (`speechSynthesis`), impedindo que o aluno fique travado em tela de erro caso a rede oscile.

---
**Documento de Planejamento concluído e registrado em `auditoria/09_PLANO_MIGRACAO_AZURE_SEGURA.md`. Nenhuma alteração foi realizada.**
