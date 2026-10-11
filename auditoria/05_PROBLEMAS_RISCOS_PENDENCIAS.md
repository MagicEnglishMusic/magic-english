# PROBLEMAS, RISCOS E PENDÊNCIAS TÉCNICAS
**Documento 05: Matriz de Priorização de Riscos, Débitos Técnicos e Roadmap de Correção**
**Data da Auditoria:** 11 de Outubro de 2026  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. MATRIZ DE RISCOS E PRIORIDADES

| Item | Título | Severidade | Impacto | Componente Afetado |
| :---: | :--- | :---: | :--- | :--- |
| **01** | Exposição de Credencial Azure Speech no Código Cliente | **ALTO** | Custo financeiro em caso de abuso de API | `avatarPracticeService.js` |
| **02** | Dependência de Importação Dinâmica CDN do TalkingHead | **MÉDIO** | Risco de indisponibilidade se o jsDelivr falhar | `AvatarPracticeView.jsx` |
| **03** | Persistência Local da Trava de 24h sem Validação Server-Side | **MÉDIO** | Aluno experiente pode limpar localStorage para burlar o limite diário | `AvatarPracticeView.jsx`, `avatarPracticeService.js` |
| **04** | Discrepância de Contadores de Aulas/Músicas nos Cards | **BAIXO** | Interface pode exibir contagem ligeiramente diferente do DB | `MyModulesView.jsx`, `ModuleCard.jsx` |
| **05** | Suporte Restrito do SpeechRecognition no Firefox / Safari iOS | **BAIXO** | Alunos em navegadores sem Web Speech API nativa não conseguem gravar voz | `PronunciationLabView.jsx`, `AvatarPracticeView.jsx` |

---

## 2. DETALHAMENTO DOS PONTOS DE ATENÇÃO

### 2.1 Ponto 1: Proteção da Chave da API Azure Speech
- **Descrição:** A chave de API do Azure Cognitive Services está presente em texto puro no código de produção do frontend (`avatarPracticeService.js`).
- **Ação Recomendada para o Futuro:**
  - Criar a Edge Function `supabase/functions/azure-tts/index.ts` que executa a chamada ao Azure Speech usando chave armazenada no Supabase Vault / Secrets.
  - O frontend passa a requisitar o áudio diretamente pela Edge Function ou apenas obter um `authorizationToken` temporário (válido por 10 minutos).

### 2.2 Ponto 2: Isolamento da Biblioteca Three.js e TalkingHead
- **Descrição:** O script do TalkingHead é carregado sob demanda de `https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.7/modules/talkinghead.mjs`.
- **Ação Recomendada para o Futuro:**
  - Instalar o TalkingHead ou empacotar o arquivo `.mjs` dentro do diretório `/public/libs/` ou `vendor/` do projeto, eliminando qualquer dependência de DNS externo ou indisponibilidade de CDN de terceiros.

### 2.3 Ponto 3: Sincronização da Trava Diária de 24h no Banco de Dados
- **Descrição:** A verificação de término de prática e cooldown de 24 horas está gravada na chave `magic_avatar_practice_session_${userId}` do `localStorage`.
- **Ação Recomendada para o Futuro:**
  - Criar um campo `last_avatar_session_at` e `avatar_session_seconds_today` na tabela `user_progress` ou `profiles` para que a trava persista entre diferentes dispositivos (ex: se o aluno começar no celular e tentar acessar no notebook).

### 2.4 Ponto 4: Compatibilidade Multiplataforma de Reconhecimento de Voz (STT)
- **Descrição:** A Web Speech API possui suporte pleno no Google Chrome, Microsoft Edge e navegadores Chromium, mas possui limitações ou comportamentos intermitentes no Mozilla Firefox e no Safari (WebKit) móvel.
- **Ação Recomendada para o Futuro:**
  - Adicionar um aviso amigável na interface orientando o uso do Chrome/Edge para uma experiência ótima de gravação de voz, ou implementar fallback via gravação de áudio em blob com envio para transcrição no Whisper / Azure STT em versões futuras.
