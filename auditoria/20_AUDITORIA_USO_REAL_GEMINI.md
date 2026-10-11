# MAGIC ENGLISH — RELATÓRIO TÉCNICO DE AUDITORIA FINAL
## AUDITORIA DO USO REAL DO GOOGLE GEMINI NO PROJETO

**Data da Auditoria:** 11 de Outubro de 2026  
**Escopo:** Mapeamento integral e classificação de todas as referências ao Gemini no Magic English  
**Diretiva:** Auditoria diagnóstica — nenhuma linha de código foi alterada  

---

## 1. TODAS AS OCORRÊNCIAS MAPEADAS NO PROJETO

Foi realizada uma varredura profunda no código-fonte (`src/`). Foram encontradas ocorrências do Gemini em **4 arquivos**:

| # | Arquivo | Linhas | Função / Bloco | Descrição da Ocorrência |
| :-: | :--- | :-: | :--- | :--- |
| **1** | `src/services/avatarPracticeService.js` | 78 | `DEFAULT_AVATAR_SETTINGS` | Chave de API Gemini exposta em string clara (`geminiApiKey: 'AQ.Ab8RN...'`) |
| **2** | `src/services/avatarPracticeService.js` | 126–225 | `requestGeminiTTS` | Função de síntese que dispara chamadas HTTP diretas para `generativelanguage.googleapis.com` |
| **3** | `src/services/avatarPracticeService.js` | 436–442 | `getSettings` | Leitura de chave Gemini customizada do `localStorage.getItem('magic_avatar_gemini_api_key')` |
| **4** | `src/components/avatar/AvatarPracticeView.jsx` | 53–151 | `requestGeminiTTS` | Cópia idêntica da função de síntese com chamadas diretas para `generativelanguage.googleapis.com` |
| **5** | `src/components/avatar/AvatarPracticeView.jsx` | 698–701 | `speakText` | Invocação no bloco `catch (azureErr)` quando o Azure TTS falha |
| **6** | `src/components/admin/SongManager.jsx` | 486–491 | `handleGenerateAudios` | Resolução da chave de API `apiKey` e voz padrão para geração de áudios |
| **7** | `src/components/admin/SongManager.jsx` | 527–531 | `handleGenerateAudios` | Invocação no bloco `catch (azureErr)` quando o Azure TTS falha durante geração em lote |
| **8** | `src/components/admin/AvatarSettingsView.jsx` | 77–89 | `handleSave` | Salvamento da chave `settings.geminiApiKey` no `localStorage` |

---

## 2. ANÁLISE ESPECÍFICA POR COMPONENTE

### 2.1. Avatar (`AvatarPracticeView.jsx`)
- **Como funciona hoje?**
  1. O componente tenta tocar o áudio pré-gravado do Google Drive (`directAudioUrl`).
  2. Se não existir, chama o **Azure TTS Proxy** (`requestAzureTTS` ou `requestAzureBilingualTTS`).
  3. Com a correção recente de autenticação JWT (Etapa 2.6), o Azure TTS Proxy responde com **HTTP 200** com sucesso absoluto para todos os professores (Sarah, James, Emma, David, Lucas).
  4. O bloco `catch (azureErr)` do Gemini **não é mais atingido em condições normais**.
- **Diagnóstico:** O Gemini no Avatar é puramente um **fallback de contingência inativo na operação padrão**. Não é o provedor principal e existe equivalente oficial completo e superior na Azure.

### 2.2. Admin — Geração de Áudios de Músicas (`SongManager.jsx`)
- **Como funciona hoje?**
  1. Ao clicar em "Gerar Áudios Faltantes", o sistema verifica se o verso já possui URL do Google Drive.
  2. Se não possuir, tenta sintetizar primeiramente via **`requestAzureTTS(verseText, 'en')`** (linha 526).
  3. Apenas se o Azure falhar, ele cai na linha 530 chamando `requestGeminiTTS(verseText, apiKey, voice)`.
  4. O áudio resultante é enviado para a pasta oficial do Google Drive via `uploadAudioToDrive`.
- **Diagnóstico:** O Azure Speech já é o **gerador primário oficial** de áudios no Admin. O Gemini só atua caso a cota do Azure se esgote ou a rede falhe.

### 2.3. Painel de Configurações (`AvatarSettingsView.jsx`)
- **Existe tela de configuração para o Gemini?**
  - **Não há campo visível no formulário**: A tela administrativa do Avatar possui campos para:
    - Duração da sessão e Tolerância fonética;
    - Tema de fundo e Cooldown (24h / meia-noite);
    - Galeria de Professores 3D (Sarah, James, Emma, David, Lucas);
    - Velocidade de fala (0.85x a 1.50x);
    - Textos dinâmicos (Saudações, Elogios, Encorajamentos, Despedidas).
  - O código em `handleSave` apenas verifica silenciosamente `if (settings.geminiApiKey)` para salvar no `localStorage`. Não existe UI ativa para o administrador digitar ou gerenciar chaves Gemini.

---

## 3. TABELA DE CLASSIFICAÇÃO DAS OCORRÊNCIAS

| Ocorrência | Localização | Status Funcional | Equivalente Azure Existente? | Classificação Final |
| :--- | :--- | :---: | :---: | :--- |
| Chave exposta em `DEFAULT_AVATAR_SETTINGS` | `avatarPracticeService.js:78` | Risco de segurança | Sim (Azure opera sem chave no front) | **PODE SER REMOVIDO** |
| Função duplicada `requestGeminiTTS` | `AvatarPracticeView.jsx:53` | Código duplicado | Sim (`requestAzureTTS`) | **PODE SER REMOVIDO** |
| Fallback `catch (azureErr)` no Avatar | `AvatarPracticeView.jsx:700` | Contingência | Sim (Web Speech API supre emergência) | **LEGADO / PODE SER REMOVIDO** |
| Função `requestGeminiTTS` de serviço | `avatarPracticeService.js:126` | Contingência | Sim (`requestAzureTTS`) | **PODE SER REMOVIDO** |
| Leitura/Gravação em `localStorage` | `avatarPracticeService.js:438` e `AvatarSettingsView.jsx:78` | Inútil (sem UI) | Sim | **PODE SER REMOVIDO** |
| Fallback `catch (azureErr)` no SongManager | `SongManager.jsx:530` | Contingência | Sim (`requestAzureTTS`) | **LEGADO / PODE SER REMOVIDO** |

---

## 4. CONCLUSÃO TÉCNICA E RECOMENDAÇÃO ESTRATÉGICA

### O Gemini é usado ativamente em produção?
**NÃO.** O Gemini no Magic English é **100% código legado de contingência**.
- No passado, antes da implementação das vozes Microsoft Azure, o Gemini foi utilizado para testes iniciais de voz.
- Hoje, com o Google Drive (prioridade 1) e o Azure Speech Services via Edge Function (prioridade 2 com status 200), **o Gemini não é executado em nenhuma circunstância normal**.
- Manter o Gemini exige cadastrar uma chave extra da Google, pagar/monitorar duas APIs de IA em paralelo e criar uma segunda Edge Function de proxy apenas para um fallback de raríssima utilização. Caso a Azure falhe, a **Web Speech API nativa já existe no código e funciona sem custo algum**.

### Recomendação:
Em vez de gastar recursos criando a infraestrutura do Gemini Proxy:
1. **Expurgar completamente as referências e a chave exposta do Gemini do frontend**.
2. Deixar a arquitetura limpa, profissional e econômica:
   - **Prioridade 1:** Google Drive (Custo zero).
   - **Prioridade 2:** Azure Speech Services (Protegido via Edge Function).
   - **Prioridade 3 (Emergência):** Web Speech API nativa do navegador.
3. Eliminar a função duplicada em `AvatarPracticeView.jsx`, reduzindo o peso do bundle e eliminando 100% do risco de vazamento de credenciais.
