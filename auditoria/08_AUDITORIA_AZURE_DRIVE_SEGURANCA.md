# AUDITORIA CIRÚRGICA DA SEGURANÇA AZURE SPEECH E PRESERVAÇÃO DO GOOGLE DRIVE
**Documento 08: Auditoria Técnica de Segurança, Catálogo de Áudio Google Drive e Proteção da Franquia de 500.000 Caracteres**  
**Data da Auditoria:** 11 de Outubro de 2026  
**Status da Auditoria:** Concluída (Etapa 1 — Diagnóstico Exclusivo, Somente Leitura)  
**Classificação:** Confidencial / Engenharia de Segurança e Infraestrutura  

---

## 1. RESUMO EXECUTIVO

Esta auditoria realizou uma varredura cirúrgica e estritamente de leitura no código-fonte do **Magic English** para mapear a exposição da chave da API do Microsoft Azure Speech Services, a arquitetura de armazenamento e reutilização de áudios no Google Drive, o consumo da franquia mensal de 500.000 caracteres e os impactos nos 5 professores virtuais 3D (`sarah`, `james`, `emma`, `david`, `lucas`).

### Fatos Críticos Confirmados:
1. **Exposição Real e Imediata da Credencial Azure no Frontend:**
   - A chave de subscrição do Azure Cognitive Services (`key`) e o endpoint estão declarados em texto puro no arquivo `src/services/avatarPracticeService.js` (linhas 226–232).
   - O bundler Vite compila e inclui essa chave no pacote JavaScript distribuído aos navegadores (`dist/assets/AvatarSettingsView-*.js` e chunks dependentes). Qualquer usuário pode inspecionar o código no DevTools do navegador e extrair a chave.
2. **Prioridade Absoluta e Estratégica do Google Drive:**
   - No componente de conversação (`AvatarPracticeView.jsx`, linha 670), o sistema **sempre verifica primeiro** se a frase possui `directAudioUrl` (link direto do Google Drive ou Storage). Se existir e for acessível, o arquivo é baixado e decodificado localmente pelo `AudioContext` do navegador, com **ZERO consumo de caracteres da Azure**.
   - No gerador administrativo de áudios das músicas (`SongManager.jsx`, linha 511), o sistema **pula imediatamente versos que já tenham URLs válidas do Google Drive**, garantindo prevenção contra regeração duplicada.
3. **Ponto Crítico de Vazamento de Caracteres em Produção:**
   - Durante a prática do aluno, frases dinâmicas de interface (como **Saudações de Acolhimento**, **Retomada de Sessão**, **Elogios de Sucesso**, **Avisos de Repetição** e **Despedida**) **NÃO possuem URLs pré-gravadas no Google Drive**. Elas acionam `requestAzureTTS` ou `requestAzureBilingualTTS` diretamente em tempo de execução via navegador, consumindo caracteres a cada login, sucesso ou erro do aluno.
4. **Preservação de Todas as Metodologias e Recursos:**
   - A substituição da exposição por uma arquitetura segura no Supabase (Edge Function) é 100% viável e não altera a renderização dos 5 avatares, o modelo de visemas do TalkingHead, as vozes neurais ou o catálogo existente de áudios do Google Drive.

---

## 2. DIAGNÓSTICO DETALHADO DA EXPOSIÇÃO DA CHAVE AZURE

### 2.1 Localização no Código-Fonte
- **Arquivo:** `src/services/avatarPracticeService.js`
- **Linhas:** 226 a 232
- **Estrutura Declarada:**
  ```javascript
  export const AZURE_SPEECH_CONFIG = {
    key: 'REDACTED_AZURE_SPEECH_KEY', // [CONFIDENCIAL]
    region: 'eastus',
    endpoint: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
    defaultVoiceEn: 'en-US-JennyNeural',
    defaultVoicePt: 'pt-BR-FranciscaNeural'
  };
  ```

### 2.2 Análise das 10 Perguntas de Exposição (Seção 3)
1. **Onde a credencial está armazenada?**  
   Diretamente no objeto JavaScript exportado `AZURE_SPEECH_CONFIG` no arquivo `src/services/avatarPracticeService.js`.
2. **Se existe uma chave hardcoded?**  
   **Sim.** A chave é uma string literal hardcoded no repositório.
3. **Se variáveis VITE_ expõem credenciais?**  
   Não foi encontrada nenhuma variável `VITE_AZURE_*` nos arquivos `.env*`. O `.env.example` e `.env` contêm apenas variáveis Supabase (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). A chave está hardcoded diretamente no `.js`.
4. **Se há uso de environment variables?**  
   Não há uso de `import.meta.env` para a credencial do Azure Speech.
5. **Se a chave aparece nos arquivos de produção compilados?**  
   **Sim.** Confirmado por busca direta no diretório `dist/assets/`. O arquivo `dist/assets/AvatarSettingsView-B_gIWQSy.js` contém a string exata da chave e o endpoint da Azure.
6. **Se a chave pode ser recuperada pelo navegador?**  
   **Sim.** Qualquer pessoa com a ferramenta de desenvolvedor (F12 > Sources/Network) pode visualizar o bundle ou interceptar o cabeçalho `Ocp-Apim-Subscription-Key` nas requisições diretas feitas para `eastus.tts.speech.microsoft.com`.
7. **Se existe algum mecanismo de autenticação para solicitar TTS?**  
   Não existe no nível de aplicação: qualquer visitante anônimo ou aluno com o frontend carregado tem o segredo em memória e dispara requisições diretas para a Microsoft.
8. **Se outros componentes utilizam a mesma credencial?**  
   - `src/components/avatar/AvatarPracticeView.jsx`: importa `requestAzureTTS` e `requestAzureBilingualTTS`.
   - `src/components/admin/SongManager.jsx`: importa `requestAzureTTS` para a geração administrativa em lote dos versos das músicas.
   - `src/components/admin/AvatarSettingsView.jsx`: referencia os nomes das vozes da configuração e importa indiretamente o serviço.
9. **Se a aplicação utiliza Azure REST API ou SDK?**  
   A aplicação utiliza a **REST API direta** (`fetch` para `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`) com payloads em formato XML/SSML (`application/ssml+xml`) e cabeçalho `X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm`. Não há dependência do SDK pesado `@microsoft/cognitiveservices-speech-sdk`.
10. **Se existem chamadas diretas do navegador para a Azure?**  
    **Sim.** As chamadas HTTP POST partem diretamente do navegador do usuário final para os servidores da Microsoft Azure.

---

## 3. AUDITORIA GOOGLE DRIVE (CATÁLOGO DE ÁUDIO E CUSTO ZERO)

### 3.1 Como o Avatar Procura e Identifica um Áudio Existente?
- **Arquivo:** `src/components/avatar/AvatarPracticeView.jsx` (funções `handlePlayCurrentPhrase` na linha 802 e `speakText` na linha 670).
- **Mecanismo:** A lista de frases elegíveis do aluno é obtida via `avatarPracticeService.getStudentEligiblePhrases(userId)`.
- **Identificação:** O serviço lê as músicas da tabela `songs` no Supabase. Cada canção possui o campo JSON `timestamps` (ou `lyrics`). Cada item desse array possui o atributo `audioUrl` (ou `audio_url`, `driveUrl`, `drive_audio_url`).
- **Formato da URL:** Quando gerado pelo sistema administrativo, a URL possui a estrutura:
  `https://lh3.googleusercontent.com/d/{FILE_ID}`
- **Consulta:** Ao reproduzir uma frase (`handlePlayCurrentPhrase`), o componente passa `currentPhrase.audioUrl` como parâmetro `directAudioUrl` para a função `speakText`.

### 3.2 Como o Sistema Trata o Áudio do Google Drive?
1. Se `directAudioUrl` estiver preenchido:
   ```javascript
   const res = await fetch(directAudioUrl);
   if (res.ok) {
     const arrayBuf = await res.arrayBuffer();
     audioBuffer = await head.audioCtx.decodeAudioData(arrayBuf);
   }
   ```
2. O áudio retornado é decodificado diretamente na memória do Web Audio API (`head.audioCtx.decodeAudioData`).
3. O TalkingHead recebe o `audioBuffer` via `head.speakAudio({...})`, e analisa os picos sonoros sincronizando os visemas labiais em tempo real.
4. **Resultado:** Nenhum caractere da Azure é consumido quando o áudio do Drive é encontrado e carregado com sucesso.

### 3.3 Respostas às Questões Cruciais do Google Drive (Seção 4)
1. **Como o avatar procura um áudio existente?** Através da propriedade `audioUrl` injetada em cada verso no array `phrasesQueue`.
2. **Qual função consulta o Google Drive?** O `fetch` nativo no cliente em `AvatarPracticeView.jsx` (linha 672) e o parser `extractGoogleDriveId` / `getDriveAudioUrl` em `src/utils/googleDriveHelper.js`.
3. **Como o sistema identifica o áudio correto?** Pelo vínculo pré-armazenado no banco: cada verso de música no Supabase armazena sua URL direta correspondente.
4. **Utiliza ID de arquivo, nome, URL, índice ou banco?** Utiliza a URL persistida no campo `timestamps` JSON da tabela `songs` no banco Supabase. O ID do Drive está embutido na própria URL.
5. **Existe cache local?** Apenas em memória durante a sessão ativa (se o arquivo for tocado novamente na mesma página, ele se apoia no cache HTTP do navegador). Não há IndexedDB para persistir os blobs de áudio.
6. **Existe cache no Supabase?** Sim, o catálogo com as URLs está gravado permanentemente em `public.songs.timestamps`.
7. **Existe um catálogo de áudios?** Sim, o catálogo reside nas tabelas `songs` e na pasta raiz do Google Drive (ID: `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`).
8. **O áudio é reproduzido diretamente ou por audio-proxy?** 
   - No Avatar (`AvatarPracticeView.jsx`): O fetch é feito **diretamente na URL do Google Drive** (`https://lh3.googleusercontent.com/d/{id}`).
   - Nas aulas convencionais (`VideoPlayer.jsx` / `SongHeaderPlayer.jsx`): Utiliza a Edge Function `audio-proxy?id={id}` para suportar Byte-Range (HTTP 206) e streaming progressivo.
9. **Como acontece a reprodução bilíngue?**
   - Para frases compostas dinâmicas, `requestAzureBilingualTTS` monta um SSML contendo duas tags `<voice>`: uma em PT-BR (`voicePt`) com pausa `<break time='350ms'/>` e outra em EN-US (`voiceEn`).
   - Para frases de repetição de erros/tentativas: o sistema fala a instrução em português via TTS e encadeia um callback para tocar o áudio em inglês direto do Google Drive.
10. **Como o sistema escolhe a voz do professor?**
    - Pelo preset ativo em `settings.teacherPresetId` mapeado em `TEACHER_PRESETS` (`sarah`, `james`, `emma`, `david`, `lucas`).
11. **O áudio é associado à frase, ao professor ou aos dois?**
    - **Atenção:** Os áudios gerados no Google Drive na pasta da música estão associados aos versos da canção, mas foram gerados com a voz padrão (`JennyNeural` da Sarah). Quando o aluno troca para outro professor (ex: James ou Lucas), o áudio do Drive ainda toca a gravação de origem, ou se o sistema gerar dinamicamente, usa a voz do preset selecionado.
12. **Como funciona a sincronização labial a partir de áudio do Drive?**
    - Em `AvatarPracticeView.jsx` (linhas 717–748), o sistema calcula matematicamente as durações e timestamps relativos de cada palavra da frase (`wtimes` e `wdurations`) proporcionais à duração total do buffer de áudio decodificado (`audioBuffer.duration * 1000`). Ele entrega esses dados ao método nativo `head.speakAudio(...)` do TalkingHead.
13. **Quando o arquivo está ausente, o que realmente acontece?**
    - Se `directAudioUrl` for nulo ou se o `fetch(directAudioUrl)` falhar (ex: erro de rede ou 404), o código entra imediatamente no bloco `if (!audioBuffer)` (linha 683) e **dispara a síntese da Azure em tempo real**.
14. **Uma falha temporária do Drive pode disparar uma chamada desnecessária à Azure?**
    - **SIM.** Se o Google Drive tiver uma instabilidade ou bloqueio de taxa e a requisição falhar no catch da linha 677, o sistema cai imediatamente no fallback e aciona a Azure TTS para falar a frase.
15. **Existe algum risco de gerar novamente áudio já existente?**
    - No modo do aluno: Não gera arquivo no Drive; consome a Azure sob demanda para tocar uma única vez em memória.
    - No modo administrativo (`SongManager.jsx`): O loop verifica `if (existingUrl && (existingUrl.includes('googleusercontent.com') || ...))` e **pula** o verso. O risco só existe se o administrador apagar a URL ou limpar os versos manualmente.

---

## 4. AUDITORIA DA GERAÇÃO ADMINISTRATIVA DE ÁUDIOS

### 4.1 Onde e Como o Administrador Gera os Áudios
- **Componente:** `src/components/admin/SongManager.jsx`
- **Função:** `generateAllVersesAudio(song)` (linhas 450 a 620)
- **Fluxo Operacional:**
  1. O administrador clica no botão "Gerar Áudios Avatar" na tabela de músicas.
  2. Um modal de confirmação exibe o total de versos da canção.
  3. Para cada verso:
     - **Verificação Prévia:** Se o verso já tiver uma URL do Google Drive válida, ele é contabilizado como sucesso e o loop **pula imediatamente** para o próximo, preservando 100% da franquia.
     - **Síntese:** Se não houver áudio, executa `await requestAzureTTS(verseText, 'en')` (voz JennyNeural, 24kHz WAV).
     - **Fallback:** Se a Azure falhar, tenta fallback no Gemini TTS.
     - **Upload para o Google Drive:** Envia o Base64 gerado para o endpoint do Google Apps Script (`uploadAudioToDrive` em `googleDriveHelper.js`).
     - **Organização no Drive:** Salva na pasta raiz `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`, dentro de uma subpasta nomeada com o título da música.
     - **Salvamento no Banco:** Obtém a URL pública direta (`https://lh3.googleusercontent.com/d/{id}`) e atualiza o campo `timestamps` da música no Supabase a cada 5 versos e ao final do lote.
     - **Pausa de Segurança:** Aguarda 1200ms entre requisições para evitar rate-limits.

### 4.2 Respostas às Perguntas de Geração Administrativa (Seção 5)
- **Processo em lote?** Sim, sequencial verso a verso com indicador de progresso percentual.
- **Prevenção contra áudio duplicado?** **Sim.** Versos com `audioUrl` contendo `drive.google.com` ou `googleusercontent.com` são ignorados no processo de síntese.
- **Existe Google Apps Script?** **Sim.** O endpoint `https://script.google.com/macros/s/AKfycbzG38rRYJo8mmAplWgqhp-DaPTAolp0SjRgGkmH7UAIlzD-CiMJpglBE8tQjan9qWIeBQ/exec` recebe os dados via POST em Base64 e cria os arquivos no Drive da conta do proprietário.
- **Controle ou monitoramento da franquia de 500k caracteres?** **Não existe atualmente.** O sistema não possui um contador cumulativo de caracteres enviados à Azure nem no frontend nem no banco de dados.

---

## 5. MAPA DE DEPENDÊNCIA DE FUNÇÕES AZURE E GOOGLE DRIVE

| Arquivo | Função / Método | Quem Chama | Momento de Execução | Tipo (Aluno / Admin) | Consulta Drive 1º? | Consome Azure? | Crítico para o 3D? |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `avatarPracticeService.js` | `requestAzureTTS(text, lang, key, voice)` | `AvatarPracticeView.jsx`, `SongManager.jsx` | Ao falar saudações/mensagens ou gerar versos | Ambos | **Não** (função pura de síntese) | **Sim** | Sim (voz e visemas) |
| `avatarPracticeService.js` | `requestAzureBilingualTTS(pt, en, key, voices)` | `AvatarPracticeView.jsx` | Quando a frase exige instrução bilíngue combinada | Aluno | **Não** | **Sim** | Sim |
| `AvatarPracticeView.jsx` | `speakText(text, directUrl, ...)` | Eventos de tela do aluno (`handlePlayCurrentPhrase`, boas-vindas, feedback) | Início da aula, clique em "Ouvir", acerto ou erro | Aluno | **SIM** (linha 670) | **Apenas se faltar Drive** | Sim |
| `SongManager.jsx` | `generateAllVersesAudio(song)` | Administrador (botão na tabela de músicas) | Ação manual do admin para enriquecer músicas | Admin | **SIM** (linha 511 pula existentes) | **Sim** (apenas novos versos) | Sim |
| `googleDriveHelper.js` | `uploadAudioToDrive(params)` | `SongManager.jsx` | Após sintetizar áudio de verso novo | Admin | N/A (Upload) | Não | Sim |
| `googleDriveHelper.js` | `extractGoogleDriveId(url)` | Toda a aplicação | Renderização de links e mídias | Ambos | N/A (Parser) | Não | Sim |

---

## 6. AUDITORIA DOS 5 PROFESSORES VIRTUAIS 3D

| Professor | Modelo 3D Local | Voz Azure (EN) | Voz Azure (PT) | Dependência Google Drive | Dependência Azure em Tempo Real | Sincronia Labial (Lip Sync) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sarah** | `/avatars/brunette.glb` | `en-US-JennyNeural` | `pt-BR-FranciscaNeural` | Utiliza versos pré-gravados prioritariamente | Dispara para saudações e frases sem Drive | Perfeita (Blendshapes ARKit/OVR nativos) |
| **James** | `/avatars/james.glb` | `en-US-GuyNeural` | `pt-BR-AntonioNeural` | Utiliza versos pré-gravados prioritariamente | Dispara com voz masculina Guy/Antonio se faltar Drive | Perfeita (Esqueleto e visemas nativos) |
| **Emma** | `/avatars/emma.glb` | `en-US-AriaNeural` | `pt-BR-ThalitaNeural` | Utiliza versos pré-gravados prioritariamente | Dispara com voz feminina Aria/Thalita se faltar Drive | Perfeita (com baseline de rotação) |
| **David** | `/avatars/david.glb` | `en-US-DavisNeural` | `pt-BR-NicolauNeural` | Utiliza versos pré-gravados prioritariamente | Dispara com voz jovem Davis/Nicolau se faltar Drive | Perfeita (Esqueleto padrão) |
| **Lucas** | `/avatars/lucas.glb` | `en-US-DavisNeural` | `pt-BR-NicolauNeural` | Utiliza versos pré-gravados prioritariamente | Dispara com voz carismática Davis/Nicolau se faltar Drive | Perfeita (Morph targets procedurais e ossos preservados) |

---

## 7. AVALIAÇÃO COMPARATIVA DAS SOLUÇÕES DE SEGURANÇA

### Opção A: Edge Function com Token Temporário (Azure STS Token)
- **Como funciona:** O frontend chama a Edge Function autenticada `azure-token`. A Edge Function usa a chave privada da Azure no servidor e chama o endpoint de emissão de tokens da Microsoft (`https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken`). Ela retorna um token JWT efêmero (válido por 10 minutos). O frontend faz as requisições TTS à Azure usando `Authorization: Bearer <token>` em vez da chave fixa.
- **Vantagens:** 
  - A chave principal nunca é exposta.
  - O fluxo de áudio binário WAV continua trafegando diretamente entre a Microsoft e o navegador (zero custo de tráfego de saída no Supabase).
  - Latência idêntica à atual para o aluno.
- **Desvantagens:**
  - O token, durante seus 10 minutos de vida, ainda pode ser reutilizado por um usuário mal-intencionado para sintetizar textos fora da plataforma.
  - Não permite auditar ou barrar palavras arbitrárias no servidor antes da síntese.

### Opção B: Edge Function como Proxy TTS Inteligente (Recomendada)
- **Como funciona:** O frontend nunca se comunica diretamente com a Azure. Quando precisa de síntese (e apenas quando não há áudio no Drive), faz POST para a Edge Function `audio-synthesize` passando o texto, a voz e o idioma. A Edge Function:
  1. Valida o usuário autenticado via Supabase Auth.
  2. Verifica se o texto solicitado pertence ao repertório do curso (ou saudações cadastradas).
  3. Checa o limite mensal e registra o consumo de caracteres na tabela `azure_usage_logs`.
  4. Chama a Azure internamente com a chave protegida no `Deno.env.get("AZURE_SPEECH_KEY")`.
  5. Retorna o binário ou Base64 para o frontend.
- **Vantagens:**
  - **Segurança Máxima:** A chave jamais sai do servidor do Supabase.
  - **Proteção Absoluta da Franquia de 500k Caracteres:** A Edge Function pode rejeitar qualquer texto que ultrapasse a cota diária ou que não pertença ao vocabulário educacional.
  - **Controle Centralizado:** O painel administrativo pode exibir um velocímetro exato de quantos caracteres restam no mês.
- **Impacto no TalkingHead:** **Nenhum.** O TalkingHead só consome o `AudioBuffer` pronto decodificado. Pouco importa para ele se o áudio veio da Azure direta ou da Edge Function.

---

## 8. ESTRATÉGIA DE PROTEÇÃO DA FRANQUIA (500.000 CARACTERES)

Para garantir que a franquia de 500.000 caracteres mensais nunca seja extrapolada:

1. **Pré-Gravação das Frases Institucionais no Google Drive (Eliminação de Consumo em Tempo Real):**
   - Atualmente, as frases de **Boas-Vindas**, **Elogios** e **Encorajamento** consomem caracteres a cada interação do aluno porque não estão no Drive.
   - **Estratégia:** Criar no Admin uma rotina para sintetizar essas mensagens fixas uma única vez para cada professor e armazená-las no Google Drive. Quando o avatar for saudar o aluno, ele tocará o arquivo já gravado. Isso reduz o consumo de tempo real dos alunos para praticamente **ZERO**.
2. **Tabela de Cache de Áudios no Supabase (`tts_cache`):**
   - Antes de qualquer chamada à Azure, a Edge Function consulta `tts_cache(hash_texto_voz)`. Se já foi sintetizado anteriormente por qualquer outro aluno ou pelo admin, devolve a URL pública sem gerar cobrança na Azure.
3. **Monitoramento e Teto Mensal Automático:**
   - Implementação de trava no servidor: caso o somatório do mês atinja 480.000 caracteres (96% da franquia), a Edge Function entra em modo de segurança, usando vozes locais do Web Speech API ou avisando o administrador, sem gerar custos adicionais.

---

## 9. PLANO DE MIGRAÇÃO INCREMENTAL SEM REGRESSÕES (ETAPAS FUTURAS)

> [!IMPORTANT]
> Conforme as regras da Etapa 1, nenhuma alteração de código ou banco foi realizada nesta auditoria. O plano abaixo descreve o roteiro a ser executado apenas após aprovação explícita do proprietário.

1. **Fase 1 — Criação da Edge Function no Supabase (Isolada):**
   - Desenvolver `supabase/functions/azure-tts-proxy/index.ts`.
   - Adicionar o segredo `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION` nas variáveis de ambiente do Supabase CLI / Dashboard.
2. **Fase 2 — Tabela de Auditoria e Cache:**
   - Criar tabela leve no Supabase para registrar a contagem de caracteres por chamada.
3. **Fase 3 — Adaptação dos Serviços Frontend:**
   - Em `avatarPracticeService.js`, substituir a chamada `fetch(AZURE_SPEECH_CONFIG.endpoint)` pelo endpoint da Edge Function `supabase.functions.invoke('azure-tts-proxy')`.
   - Manter idêntico o contrato de retorno (`{ base64Audio, mimeType: 'audio/wav' }`), preservando 100% da lógica de visemas e sincronia do TalkingHead.
4. **Fase 4 — Testes e Validação:**
   - Validar reprodução com áudio vindo do Drive (consumo zero).
   - Validar reprodução com síntese nova nos 5 professores.
   - Validar geração em lote no `SongManager.jsx`.
5. **Fase 5 — Revogação Segura no Portal Azure:**
   - Confirmar que nenhum arquivo do bundle cliente contém a chave.
   - Gerar uma nova chave secundária no portal do Azure, substituir no Supabase Secrets e revogar a chave antiga que vazou historicamente.

---

## 10. PENDÊNCIAS E CONSIDERAÇÕES FINAIS

- **Script Google Apps Script:** O endpoint do Apps Script é público (`AKfycbzG38rRYJo8.../exec`). Ele não consome créditos da Azure, mas é o elo que permite o upload direto e sem custos dos áudios para as pastas do Drive. Deve permanecer intocado.
- **Gemini TTS:** Permanece como fallback secundário caso a Azure retorne erro 429 ou indisponibilidade temporária.

---
**Auditoria concluída com sucesso. Nenhuma linha de código ou credencial foi alterada.**
