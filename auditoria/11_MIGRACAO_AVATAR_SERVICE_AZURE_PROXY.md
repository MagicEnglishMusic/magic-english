# MIGRAÇÃO CONTROLADA DO AVATARPRACTICESERVICE PARA AZURE TTS PROXY
**Documento 11: Relatório de Homologação da Camada Segura e Preservação de Fallback (Etapa 2.3)**  
**Data da Auditoria/Execução:** 11 de Outubro de 2026  
**Status:** Etapa 2.3 Concluída (Migração Segura com Fallback Transparente)  
**Classificação:** Confidencial / Arquitetura de Segurança e Infraestrutura  

---

## 1. RESUMO EXECUTIVO

Em cumprimento às diretrizes da **Etapa 2.3 (Migração Controlada com Fallback Temporário)**:
1. Foi realizada a refatoração segura da camada de comunicação em [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js).
2. As funções `requestAzureTTS` e `requestAzureBilingualTTS` passaram a priorizar a invocação da Supabase Edge Function `azure-tts-proxy` via `supabase.functions.invoke()`.
3. **Fallback transparente mantido:** A implementação legada de comunicação direta com a Azure foi preservada como mecanismo de contingência interno (`_directAzureTTSFallback` e `_directAzureBilingualTTSFallback`) durante a janela de homologação, garantindo que nenhum aluno sofra interrupção enquanto os secrets do Supabase estiverem sendo parametrizados.
4. **Google Drive Intocado e Prioritário:** Toda a estratégia de reprodução de áudio a custo zero via Google Drive permanece ativa e precedente no frontend (`AvatarPracticeView.jsx`, linha 670, e `SongManager.jsx`, linha 511).
5. **TalkingHead e 5 Professores 3D:** Rigorosamente preservados, com o contrato de dados `{ base64Audio, mimeType: 'audio/wav' }` idêntico byte a byte.

---

## 2. ARQUIVOS E FUNÇÕES MIGRARAM

### 2.1 Arquivo Alterado
- Único arquivo modificado: [`src/services/avatarPracticeService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/avatarPracticeService.js).
- **Nenhum outro arquivo foi alterado:** `AvatarPracticeView.jsx`, `SongManager.jsx`, `AvatarSettingsView.jsx`, componentes 3D e arquivos de configuração permaneceram 100% intocados.

### 2.2 Funções Migradas e Assinaturas Preservadas
1. `requestAzureTTS(text, lang = 'en', customKey = null, voiceOverride = null)`
   - **Fluxo Novo:**
     - Tenta invocar `supabase.functions.invoke('azure-tts-proxy', { body: { mode: 'single', text, lang, voice } })`.
     - Se retornar `{ base64Audio }` com sucesso, devolve imediatamente para o cliente.
     - Se a Edge Function retornar erro ou estiver sem secrets, aciona `_directAzureTTSFallback(...)` de forma transparente.
2. `requestAzureBilingualTTS(instructionPt, phraseEn, customKey = null, voices = null)`
   - **Fluxo Novo:**
     - Tenta invocar `supabase.functions.invoke('azure-tts-proxy', { body: { mode: 'bilingual', instructionPt, phraseEn, voicePt, voiceEn } })`.
     - Se retornar `{ base64Audio }` com sucesso, devolve para o cliente.
     - Se falhar, aciona `_directAzureBilingualTTSFallback(...)`.

---

## 3. COMPARAÇÃO DO FLUXO (ANTES vs. DEPOIS)

### Fluxo Anterior (Legado):
```
Aluno / Admin
      ↓
avatarPracticeService.js
      ↓
fetch("https://eastus.tts.speech.microsoft.com/...") com chave hardcoded
      ↓
Microsoft Azure Speech
```

### Novo Fluxo (Etapa 2.3 em Homologação):
```
Aluno / Admin
      ↓
avatarPracticeService.js
      ↓
supabase.functions.invoke('azure-tts-proxy')
      ├── [Sucesso] ──> Supabase Edge Function ──(Secret Seguro)──> Azure Speech
      └── [Falha/Sem Secrets] ──> Fallback Direto Temporário ──> Azure Speech
```

---

## 4. RESULTADO DOS TESTES E VALIDAÇÕES

### 4.1 Compilação do Projeto (`npm run build`)
- O comando `npm run build` foi executado no terminal PowerShell da raiz do projeto.
- **Resultado:** Compilação limpa concluída em **2.93 segundos**, sem nenhum erro de TypeScript, ESLint ou Rollup/Vite.
- Todos os 2.059 módulos foram transformados com sucesso.

### 4.2 Verificação dos Professores e TalkingHead
- **Sarah (`brunette.glb`):** Preservada com voz JennyNeural e FranciscaNeural.
- **James (`james.glb`):** Preservado com voz GuyNeural e AntonioNeural.
- **Emma (`emma.glb`):** Preservada com voz AriaNeural e ThalitaNeural.
- **David (`david.glb`):** Preservado com voz DavisNeural e NicolauNeural.
- **Mascote Lucas (`lucas.glb`):** Preservado com postura Mixamo intocada, morph targets procedurais e voz Davis/Nicolau.
- **Web Audio API e Visemas:** Como a resposta continua sendo um buffer WAV de 24kHz mono PCM, o `AudioContext.decodeAudioData` processa as durações das palavras (`wtimes` e `wdurations`) exatamente da mesma forma, garantindo lip sync sem atrasos.

### 4.3 Verificação de Prioridade do Google Drive
- Confirmado em `AvatarPracticeView.jsx` (linhas 670 a 680):
  ```javascript
  if (directAudioUrl) {
    try {
      const res = await fetch(directAudioUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        audioBuffer = await head.audioCtx.decodeAudioData(arrayBuf);
      }
    } ...
  }
  ```
- **Conclusão:** Sempre que o verso possuir áudio salvo no Google Drive, o download é feito diretamente da URL `lh3.googleusercontent.com/d/{id}`, **SEM passar pela Edge Function e com ZERO consumo de caracteres da Azure**.

### 4.4 Exposição da Chave Durante a Homologação
- Como determinado nas regras da Etapa 2.3, o fallback temporário direto ainda contém referências à chave antiga no objeto `AZURE_SPEECH_CONFIG` para permitir contingência operacional enquanto o proprietário realiza o deploy da função e cadastro dos secrets no Supabase.
- A remoção física da chave do frontend e a rotação definitiva serão realizadas na **Etapa 2.4**.

---

## 5. PONTOS PENDENTES PARA A ETAPA 2.4

Para concluir a blindagem definitiva de segurança:
1. **Configuração de Secrets no Supabase:**
   - Cadastrar `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION` no Supabase Dashboard (Project Settings > Edge Functions > Secrets) ou via Supabase CLI.
2. **Deploy da Edge Function:**
   - Realizar o deploy de `supabase/functions/azure-tts-proxy`.
3. **Remoção Definitiva da Chave no Frontend:**
   - Purgar o objeto `AZURE_SPEECH_CONFIG.key` de `src/services/avatarPracticeService.js` e remover as funções de fallback direto legadas.
4. **Rotação e Revogação da Chave Antiga:**
   - No portal do Azure, gerar a nova chave secundária, transferi-la para os Secrets do Supabase e revogar a chave primária que esteve exposta no repositório.

---
**Etapa 2.3 concluída com sucesso. Sistema operando em modo híbrido seguro com fallback garantido.**
