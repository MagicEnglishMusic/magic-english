# MAGIC ENGLISH — RELATÓRIO TÉCNICO DE AUDITORIA E PLANEJAMENTO (ETAPA 2.7)
## AUDITORIA COMPLETA E PLANEJAMENTO DE BLINDAGEM DO GEMINI TTS

**Data da Auditoria:** 11 de Outubro de 2026  
**Status do Azure TTS Proxy:** ✅ Operacional com verificação JWT (East US / Supabase `wrrtiewjritbhcfqzjhy`)  
**Status da Auditoria Gemini:** ✅ Mapeamento concluído (Nenhuma alteração de código realizada)  

---

## 1. SITUAÇÃO ATUAL E LOCALIZAÇÃO DA EXPOSIÇÃO

A integração com o **Google Gemini TTS** foi criada originalmente como contingência direta no navegador para o treino fonético dos avatares 3D e geração de áudios de versos musicais no painel administrativo.

### 1.1. Localização da Chave de API no Código-Fonte
A chave de API Gemini encontra-se codificada em texto claro no arquivo:
- **`src/services/avatarPracticeService.js`**
  - **Linha 78:** constante `DEFAULT_AVATAR_SETTINGS.geminiApiKey = 'AQ.Ab8RN...'`
  - **Linhas 436–442:** função `getSettings()`, lê fallback da chave de `localStorage.getItem('magic_avatar_gemini_api_key')` ou do padrão hardcoded.

### 1.2. Chamadas Diretas ao Endpoint da Google no Frontend
Requisições HTTP `POST` diretas a `https://generativelanguage.googleapis.com` são realizadas a partir de dois pontos do frontend:

1. **`src/components/avatar/AvatarPracticeView.jsx`**
   - **Linhas 53–151:** função local `requestGeminiTTS(text, apiKey, voiceName)`
   - **Linha 57:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`
   - **Linha 72:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=${apiKey}`
   - **Linha 87:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`
   - **Linhas 698–701:** invocação no bloco `catch (azureErr)`:
     ```javascript
     const apiKey = settings.geminiApiKey || DEFAULT_AVATAR_SETTINGS.geminiApiKey;
     ttsResult = await requestGeminiTTS(fullSpokenText, apiKey, settings.ttsVoice || 'Kore');
     ```

2. **`src/services/avatarPracticeService.js`**
   - **Linhas 126–225:** função exportada `requestGeminiTTS(text, apiKey, voiceName)`
   - **Linhas 130, 145, 160:** endpoints idênticos passando a chave na query string `?key=${apiKey}`.

3. **`src/components/admin/SongManager.jsx`**
   - **Linhas 484–531:** função `handleGenerateAudios()`, utiliza `requestAzureTTS()` com fallback para `requestGeminiTTS(verseText, apiKey, voice)` na linha 530.

4. **`src/components/admin/AvatarSettingsView.jsx`**
   - **Linhas 77–89:** persiste `settings.geminiApiKey` no `localStorage` sob a chave `'magic_avatar_gemini_api_key'`.

---

## 2. AUDITORIA DE SEGURANÇA E VAZAMENTO NO BUNDLE

1. **Vazamento no Bundle de Produção:**
   - Foi verificado o diretório de build `dist/assets/`.
   - A chave do Gemini e a URL `generativelanguage.googleapis.com` constam no bundle final em:
     - `dist/assets/AvatarPracticeView-6BvjbwFC.js`
     - `dist/assets/AvatarSettingsView-B-4qDlzW.js`
2. **Facilidade de Extração:**
   - Qualquer usuário inspecionando a aba **Network** (Rede) das Ferramentas de Desenvolvedor (F12) ou abrindo o arquivo `.js` no navegador consegue extrair a credencial Gemini e usá-la externamente contra a cota do proprietário.
3. **Outras Chaves Google Encontradas:**
   - Não foram encontradas outras chaves Google expostas. As menções a `googleapis.com` em `src/data/adminData.js` são apenas URLs públicas de vídeos MP4 de demonstração (`commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`), sem credenciais associadas.

---

## 3. MAPEAMENTO DO FLUXO ATUAL DE ÁUDIO

### Hierarquia Real em Execução (`AvatarPracticeView.jsx`):

```text
[1] Google Drive / Áudio Pré-gravado
        │
        ├─► Existe URL e Fetch OK? ──► [Áudio Local decodificado com AudioContext] (Custo R$ 0)
        │
        └─► Ausente ou Falhou
                 │
                 ▼
[2] Azure TTS Proxy (Supabase Edge Function protegida)
        │
        ├─► Sucesso HTTP 200 ────────► [Áudio WAV decodificado para TalkingHead]
        │
        └─► Erro (Cai no bloco catch)
                 │
                 ▼
[3] Gemini TTS (Chamada direta do Navegador - Vulnerável)
        │
        ├─► Sucesso HTTP 200 ────────► [Áudio PCM decodificado para TalkingHead]
        │
        └─► Erro (Cai no bloco catch externo)
                 │
                 ▼
[4] Web Speech API (Navegador local via window.speechSynthesis)
```

### Análise de Disparo do Gemini:
- O Gemini é acionado **única e exclusivamente** se o áudio não existir no Google Drive **E** a requisição ao Azure falhar (timeout, cota mensal de 500k caracteres excedida ou indisponibilidade temporária de rede).
- Não há substituição do Azure pelo Gemini em condições normais de operação.

---

## 4. NOVA ARQUITETURA PROPOSTA (BLINDAGEM SERVERLESS)

Assim como foi implementado com sucesso para o Azure (`azure-tts-proxy`), o Gemini será transferido para uma Edge Function própria no Supabase:

```text
Aluno / Admin (Frontend)
        │
        ▼
supabase.functions.invoke('gemini-tts-proxy')
[Header: Authorization: Bearer <JWT Aluno>]
        │
        ▼
Supabase Edge Function: gemini-tts-proxy
(wrrtiewjritbhcfqzjhy)
   ├── 1. Validação estrita de JWT (authClient.auth.getUser)
   ├── 2. Leitura de Secret segura: GEMINI_API_KEY (Deno Secrets)
   ├── 3. Chamada backend -> generativelanguage.googleapis.com
   └── 4. Retorno padronizado
        │
        ▼
Contrato Idêntico:
{
  "base64Audio": "...",
  "mimeType": "audio/wav"
}
```

### Vantagens Estratégicas:
1. **Zero chaves no frontend**: Remoção da string hardcoded em `avatarPracticeService.js`.
2. **Mesmo contrato de retorno**: O componente `AvatarPracticeView.jsx` e o `SongManager.jsx` não alteram a forma como processam o áudio (`base64ToArrayBuffer` e `processAudioToBuffer`).
3. **Controle de Cota e Rate-Limit**: O backend pode aplicar limites por IP e tamanho de texto para evitar abusos.

---

## 5. PRESERVAÇÃO DA PRIORIDADE AZURE E CUSTO ZERO

A política estrita de prioridades estabelecida no Magic English será mantida:

1. **Google Drive (Prioridade 1):** Sempre verificado primeiro. Se o áudio do verso ou da frase já foi gerado e salvo na nuvem, o player toca o buffer diretamente, resultando em consumo zero de API.
2. **Azure Speech Services (Prioridade 2):** Utilizado para todas as falas dinâmicas do professor, boas-vindas, elogios e síntese bilíngue oficial.
3. **Gemini TTS Proxy (Prioridade 3 - Fallback Protegido):** Acionado somente se o Azure falhar ou atingir cota.
4. **Web Speech API (Prioridade 4 - Emergência):** Caso todas as redes e APIs estejam indisponíveis, a voz do navegador fala a instrução sem quebrar a aula.

---

## 6. IMPACTO E ARQUIVOS ENVOLVIDOS NA ETAPA FUTURA (2.8)

| Arquivo | Ação Futura | Impacto no Funcionamento |
| :--- | :--- | :--- |
| `supabase/functions/gemini-tts-proxy/index.ts` | **Criar nova Edge Function** | Nova função serverless protegida por JWT e Secret `GEMINI_API_KEY`. |
| `src/services/avatarPracticeService.js` | **Atualizar** | Remover a chave hardcoded de `DEFAULT_AVATAR_SETTINGS`. Atualizar `requestGeminiTTS` para chamar `supabase.functions.invoke('gemini-tts-proxy')`. |
| `src/components/avatar/AvatarPracticeView.jsx` | **Ajustar chamada local** | Importar `requestGeminiTTS` do serviço em vez de duplicar a função com `fetch` direto. |
| `src/components/admin/AvatarSettingsView.jsx` | **Preservar** | Ocultar ou transformar o campo da chave em gerenciamento seguro de backend. |
| `src/components/admin/SongManager.jsx` | **Preservar** | Continua chamando `requestAzureTTS` com fallback transparente para `requestGeminiTTS`. |

### Confirmações de Preservação:
- ✅ **TalkingHead & Lipsync:** 100% preservados. O formato do áudio recebido continuará sendo decodificado pelo `AudioContext` com os mesmos arrays de visemas (`wtimes`, `wdurations`).
- ✅ **Professores 3D (Sarah, James, Emma, David, Lucas):** 100% preservados.
- ✅ **Google Drive:** 100% preservado.
- ✅ **XP, Progresso e Banco Pedagógico:** Nenhuma alteração.

---

## 7. PLANO DE MIGRAÇÃO E ESTRATÉGIA DE ROLLBACK

### Passo a Passo da Migração (Etapa 2.8):
1. **Configuração do Secret:** Cadastrar `GEMINI_API_KEY` nos Secrets do Supabase (`wrrtiewjritbhcfqzjhy`).
2. **Deploy Isolado:** Criar e publicar `supabase/functions/gemini-tts-proxy` sem alterar o frontend.
3. **Homologação da Função:** Testar invocação com JWT autenticado via script de validação.
4. **Migração do Frontend:** Alterar `avatarPracticeService.js` para invocar a nova função e remover a chave hardcoded.
5. **Auditoria de Bundle:** Recompilar o projeto (`npm run build`) e comprovar que nenhuma chave Gemini aparece nos arquivos gerados em `dist/`.

### Estratégia de Rollback:
- Se a Edge Function do Gemini apresentar instabilidade, a prioridade principal permanece sendo o Azure TTS Proxy (que já está homologado e respondendo com status 200).
- Em último caso, o Web Speech nativo garante que o avatar continue funcionando localmente.

---

## 8. CONCLUSÃO

A auditoria confirma que o Azure Speech é atualmente o provedor primário e funciona com 100% de sucesso. A blindagem da chave Gemini completará o ciclo de segurança do Magic English, eliminando qualquer credencial de inteligência artificial ou síntese de voz exposta no lado do cliente.

*Relatório pronto. Aguardando autorização para a Etapa 2.8.*
