# MAGIC ENGLISH — RELATÓRIO TÉCNICO DE AUDITORIA (ETAPA 2.12)
## INVESTIGAÇÃO: VOZ DO PROFESSOR, PIPELINE TALKINGHEAD E INVOCATIONS

**Data da Auditoria:** 11 de Outubro de 2026  
**Status do Diagnóstico:** ✅ **Concluído sem alterações de código**  
**Escopo:** Diagnosticar os 3 comportamentos relatados pelo usuário:
1. Sarah visual com voz masculina;
2. Avatar sem lipsync enquanto o áudio toca;
3. Algumas falas/interações não geram invocation no Supabase.

---

## 1. MAPEAMENTO DE VOZES E DIAGNÓSTICO DO PROBLEMA "SARAH COM VOZ MASCULINA"

### 1.1. Tabela Oficial de Presets (`TEACHER_PRESETS`)

| Professor ID | Nome / Papel | Modelo 3D | Gênero | Voz EN (Azure) | Voz PT (Azure) |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **`sarah`** | Profª Sarah (Titular) | `/avatars/brunette.glb` | **F** | `en-US-JennyNeural` | `pt-BR-FranciscaNeural` |
| **`james`** | Prof. James (Executivo) | `/avatars/james.glb` | **M** | `en-US-GuyNeural` | `pt-BR-AntonioNeural` |
| **`emma`** | Profª Emma (Dinâmica) | `/avatars/emma.glb` | **F** | `en-US-AriaNeural` | `pt-BR-ThalitaNeural` |
| **`david`** | Prof. David (Casual) | `/avatars/david.glb` | **M** | `en-US-DavisNeural` | `pt-BR-NicolauNeural` |
| **`lucas`** | Mascote Lucas (Pixar) | `/avatars/lucas.glb` | **M** | `en-US-DavisNeural` | `pt-BR-NicolauNeural` |

---

### 1.2. Como o Código Resolve a Voz no Frontend?

No arquivo `src/components/avatar/AvatarPracticeView.jsx` (linhas 584–594):
```javascript
const activeTeacher = TEACHER_PRESETS.find(t => t.id === settings.teacherPresetId) || TEACHER_PRESETS[0];

if (bilingualPhraseEn) {
  ttsResult = await requestAzureBilingualTTS(text, bilingualPhraseEn, null, {
    voicePt: activeTeacher.voicePt,
    voiceEn: activeTeacher.voiceEn
  });
} else {
  const voiceOverride = speechLang === 'pt' ? activeTeacher.voicePt : activeTeacher.voiceEn;
  ttsResult = await requestAzureTTS(text, speechLang, null, voiceOverride);
}
```

### 1.3. Causa Raiz: Por que a Sarah pode ter saído com voz masculina?

Foram identificadas **duas causas principais no código**:

1. **Dessincronização entre `settings.modelUrl` e `settings.teacherPresetId` no Painel Admin ou LocalStorage:**
   - Em `src/components/admin/AvatarSettingsView.jsx` (linhas 500–505), existe um campo de input de texto onde o Administrador pode colar livremente a URL de um modelo (`settings.modelUrl`).
   - Se o Admin selecionar o preset `james` ou `david` (salvando `teacherPresetId: "david"` com voz masculina), mas alterar a URL do modelo manualmente ou no banco para `/avatars/brunette.glb` (ou se o banco salvar `modelUrl: "/avatars/brunette.glb"` enquanto `teacherPresetId` permaneceu `"david"` ou `"james"`), o TalkingHead renderiza o **corpo feminino da Sarah**, mas o `speakText` lê `settings.teacherPresetId` e dispara a voz masculina de **David (`DavisNeural`)** ou **James (`GuyNeural`)** para a Azure.

2. **Detecção Incorreta de Idioma em Falas Curtas / Expressões:**
   - Na linha 550 de `AvatarPracticeView.jsx`:
     ```javascript
     const isPortuguese = explicitLang ? explicitLang === 'pt' : (
       /[áàâãéèêíïóôõöúçñ]/i.test(text) ||
       /\b(olá|vamos|muito|bem|treino|tempo|continuar|parabéns|praticar|você|hoje|quase|escutem|repita|frase|inteira|aluno|novamente)\b/i.test(text)
     );
     ```
   - Frases em português sem acentos e sem as palavras reservadas (ex: *"Bom trabalho!", "Show de bola!", "Legal, gostei!"*) caem em `speechLang = 'en'`. Para a Sarah, isso faz ela falar português com sotaque americano usando `en-US-JennyNeural` (que pronuncia português com tom robótico/grave, parecendo voz masculina/estranha).
   - Além disso, se o Admin estava configurado como `james`, em português ele usa `pt-BR-AntonioNeural` (voz masculina).

---

## 2. PIPELINE DE ÁUDIO DO TALKINGHEAD E DIAGNÓSTICO DO LIPSYNC

### 2.1. O Áudio passa pelo TalkingHead ou apenas pelo Player?

**O áudio passa 100% pelo TalkingHead.** Ele não toca em uma tag `<audio>` separada.  
O fluxo no código é:
1. `Azure TTS Proxy` retorna `{ base64Audio, mimeType: "audio/wav" }`.
2. `base64ToArrayBuffer` converte a string base64 para `ArrayBuffer`.
3. `processAudioToBuffer` chama `head.audioCtx.decodeAudioData(arrayBytes)` gerando um objeto `AudioBuffer` nativo do navegador.
4. `head.speakAudio({ audio: audioBuffer, words, wtimes, wdurations }, { lipsyncLang })` é chamado diretamente no TalkingHead.

---

### 2.2. Causa Raiz: Por que o Avatar fica com a boca parada enquanto o áudio toca?

O diagnóstico identificou **duas causas diretas para a ausência de lipsync**:

1. **Incompatibilidade de Morph Targets / Visemas no Modelo 3D Carregado:**
   - O TalkingHead exige que a malha do avatar 3D possua blendshapes específicos do padrão Ready Player Me ou Oculus (ex: `viseme_aa`, `viseme_E`, `viseme_I`, `viseme_O`, `viseme_U`, `jawOpen`, `mouthOpen`).
   - Se o modelo carregado for um modelo customizado (Mixamo, Tripo3D ou GLB sem blendshapes faciais nomeados), o TalkingHead toca o som perfeitamente pelos nós de áudio do Web Audio API (`head.audioCtx`), mas **a boca não se move** porque a geometria não tem vértices deformáveis de visemas associados àqueles nomes.
   - Em `AvatarPracticeView.jsx` (linhas 351–398), há um patch experimental que tenta criar blendshapes sintéticos em runtime se `!hasMorphs`, mas ele apenas busca vértices em coordenadas fixas (`y > 0.60 && y < 0.78`). Se a escala ou a posição da cabeça do modelo for diferente, a boca sintética não é acionada.

2. **Divergência de Formato de Marcadores no `speakAudio` do TalkingHead 1.7:**
   - Nas linhas 619–636, o código gera arrays manuais de `words`, `wtimes` e `wdurations` baseados na contagem de caracteres:
     ```javascript
     head.speakAudio(
       {
         audio: audioBuffer,
         words: words,
         wtimes: wtimes,
         wdurations: wdurations
       },
       { lipsyncLang: speechLang },
       (sub) => setSubtitles(sub)
     );
     ```
   - O motor de lipsync interno do TalkingHead espera marcadores fonéticos ou texto simples para gerar visemas através dos seus próprios módulos (`lipsyncModules: ['en', 'pt']`). Quando recebe `wtimes` sintéticos calculados por proporção de caracteres sem dados fonéticos precisos (ou quando `lipsyncLang` não corresponde aos visemas do modelo), o áudio é reproduzido pelo AudioNode de destino, mas os pesos de `morphTargetInfluences` permanecem zerados no render loop.

3. **Fallback para Web Speech API:**
   - Se o Azure falhar ou for bloqueado por qualquer motivo e cair no bloco `catch (err)` (linhas 651–684), o áudio toca via `window.speechSynthesis.speak(utterance)`. **A Web Speech API roda no sistema operacional do navegador e não passa pelo canvas do TalkingHead**, tocando a voz com o avatar 100% estático.

---

## 3. INVESTIGAÇÃO: POR QUE ALGUMAS INTERAÇÕES NÃO GERAM INVOCATION NO SUPABASE?

O usuário observou que várias falas do avatar tocam sem registrar nenhuma invocação (`POST azure-tts-proxy`) no painel do Supabase.

### Causa Exata Mapeada no Código:

1. **Google Drive é Ativado Primeiro (Custo Zero / Prioridade 1):**
   - Na linha 569 de `AvatarPracticeView.jsx`:
     ```javascript
     if (directAudioUrl) {
       const res = await fetch(directAudioUrl);
       if (res.ok) {
         audioBuffer = await head.audioCtx.decodeAudioData(arrayBuf);
       }
     }
     ```
   - Durante a prática do aluno, **todas as frases musicais da aula já possuem URL gravada no banco apontando para o Google Drive** (`https://lh3.googleusercontent.com/d/...`).
   - Quando o avatar fala a frase de treino (`currentPhrase.english`), ele passa `directAudioUrl = currentPhrase.audioUrl`.
   - O navegador baixa o áudio diretamente do cache do Google Drive (CDN) e **NÃO chama o Supabase nem a Azure**. Isso é proposital e representa o funcionamento correto da contenção de custos (Custo R$ 0).

2. **Encorajamentos de Erro tocam Frase do Drive em Sequência:**
   - Nas linhas 800 e 818:
     ```javascript
     speakText(retrySpeech, null, 'pt', null, () => {
       setTimeout(() => {
         speakText(currentPhrase.english, currentPhrase.audioUrl, 'en'); // <- VEM DO DRIVE!
       }, 400);
     });
     ```
   - O encorajamento em português gera 1 invocação Azure, mas a frase seguinte em inglês vem do Google Drive e **não gera invocação**.

3. **Fallback da Web Speech API:**
   - Se uma fala falhar ou a sessão estiver em modo offline, toca no navegador localmente via Web Speech, sem qualquer requisição HTTP para a Edge Function.

---

## 4. QUADRO RESUMO DO DIAGNÓSTICO

| Comportamento Observado | Causa Técnica Mapeada | Arquivo / Linha |
| :--- | :--- | :--- |
| **Sarah com voz masculina** | `settings.teacherPresetId` salvo no banco/localStorage como `david` ou `james` enquanto o `modelUrl` está como Sarah (`brunette.glb`), OU frase em PT sem acentos classificada erroneamente como `en`. | `AvatarPracticeView.jsx:584` e `AvatarSettingsView.jsx:445` |
| **Boca parada (Sem Lipsync)** | Modelo 3D sem blendshapes faciais nativos (visemes Oculus/RPM) OU formato dos marcadores `wtimes` sintéticos no `speakAudio`, OU áudio sendo tocado pelo fallback da Web Speech API. | `AvatarPracticeView.jsx:358-398` e `AvatarPracticeView.jsx:630` |
| **Ausência de Invocations no Supabase** | **Comportamento normal esperado:** O áudio da frase já existe na biblioteca do Google Drive (`directAudioUrl`), sendo baixado diretamente com consumo zero de API. | `AvatarPracticeView.jsx:569` |

---

*Relatório de diagnóstico concluído. Nenhuma linha de código foi alterada.*
