# AUDITORIA GERAL COMPLETA — MAGIC ENGLISH
**Documento 01: Visão Executiva, Arquitetura de Sistemas, Dependências e Setup de Deploy**
**Data da Auditoria:** 11 de Outubro de 2026  
**Status do Projeto:** Ativo / Pré-Produção e Expansão Contínua  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. VISÃO EXECUTIVA E OBJETIVO DA PLATAFORMA

O **Magic English** é uma Single-Page Application (SPA) educacional de alta imersão, concebida para o ensino acelerado da língua inglesa através da metodologia musical, fonética interativa e mentoria virtual gamificada. A plataforma une aprendizagem mnemônica por letras de músicas sincronizadas (Magic Songs), exercícios de repetição espaçada, laboratório de pronúncia assistido por inteligência de voz (Web Speech Recognition e Azure Speech Services), e uma sala de prática 3D com avatares virtuais bilíngues renderizados diretamente no navegador via WebGL/Three.js.

### 1.1 Metodologia Pedagógica Central
- **Método Baseado em Música (Music-Driven Acquisition):** Absorção natural de vocabulário, estruturas frasais e ritmo/prosódia nativa por meio de canções decompostas em versos, vocabulário-chave e análises fonéticas.
- **Micro-práticas Espaçadas e Metas Diárias:** Rotina orientada a metas configuráveis pelo aluno (15 a 45 min/dia) com retenção e streaks diários.
- **Mentoria Virtual Guiada (TalkingHead 3D):** Professores virtuais (Sarah, James, Emma, David) e o mascote estilizado Lucas que conduzem práticas de conversação guiada, escuta e repetição com sincronização labial (visemas faciais) e síntese vocal de alta fidelidade via Azure Neural TTS.

---

## 2. PILHA TECNOLÓGICA (TECH STACK)

### 2.1 Frontend
- **Framework & Biblioteca Principal:** React 19.2.8 (`react`, `react-dom`).
- **Ferramenta de Build & Bundler:** Vite 8.3.0 (`@vitejs/plugin-react`).
- **Motor de Estilização:** Tailwind CSS v4.3.3 integrado via `@tailwindcss/vite` (utiliza tokens modernos e CSS Modules / classes utilitárias).
- **Ícones e Elementos Gráficos:** Lucide React (`lucide-react` 1.48.0) e Canvas-Confetti (`canvas-confetti` 1.9.4).
- **Áudio & Multimídia:** Howler.js (`howler` 2.2.4) para efeitos sonoros de gamificação e feedback auditivo.
- **Renderização 3D & Avatar:**
  - Dynamic Import ES Modules da biblioteca `talkinghead.mjs` (v1.7) carregada via CDN e modelos GLB locais em `/public/avatars/`.
  - Three.js runtime embutido na biblioteca TalkingHead com suporte a Blendshapes ARKit / OVR para lip sync.

### 2.2 Backend, Banco de Dados & Infraestrutura Serverless
- **BaaS (Backend as a Service):** Supabase (PostgreSQL 15+ gerenciado).
- **Cliente Supabase:** `@supabase/supabase-js` v2.117.2.
- **Autenticação:** Supabase Auth (Email/Password, Tokens JWT, Sessões locais via `localStorage`).
- **Armazenamento de Mídia & Caching:**
  - Supabase Storage (Buckets para avatars, assets de comunidade e PDFs).
  - Google Drive Integrado (ID extraction + CDN direct stream `lh3.googleusercontent.com/d/{id}` e `drive.google.com/uc?export=download&id={id}`).
- **Edge Functions (Deno Runtime no Supabase):**
  - `admin-manage-student`: Criação e alteração administrativa de alunos com bypass seguro via Service Role.
  - `audio-proxy`: Proxy de áudio streaming para evitar problemas de CORS e headers de streaming.
  - `video-proxy`: Proxy de vídeo para streaming seguro de mídias de aula.
  - `kiwify-webhook`: Webhook de integração de vendas para ativação e liberação automática de contas de alunos.

### 2.3 Serviços de Inteligência Artificial & Voz
- **Speech-to-Text (STT):** Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) nativo do navegador para transcrição em tempo real da pronúncia do aluno.
- **Text-to-Speech (TTS):** 
  - Microsoft Azure Cognitive Services Speech SDK / REST API (Region: East US, vozes neurais como `en-US-JennyNeural`, `en-US-DavisNeural`, `pt-BR-FranciscaNeural`, `pt-BR-NicolauNeural`).
  - Google Translate TTS Proxy / Drive Audio pre-generations como fallback de custo zero.

---

## 3. ARQUITETURA DE DIRETÓRIOS E COMPONENTIZAÇÃO

```
C:\Google Antigravity\Curso de ingles\
├── public/                     # Arquivos estáticos servidos diretamente
│   ├── avatars/                # Modelos 3D locais (brunette.glb, james.glb, emma.glb, david.glb, lucas.glb)
│   ├── favicon.svg             # Favicon oficial
│   └── sounds/                 # Efeitos de gamificação (click, complete, correct, error, level-up)
├── src/
│   ├── components/             # Componentes modulares por domínio funcional
│   │   ├── admin/              # Painel administrativo completo (10 gerenciadores)
│   │   ├── avatar/             # Sistema do Professor 3D (AvatarPracticeView.jsx)
│   │   ├── classroom/          # Sala de aula mágica (player de vídeo, abas de estudo)
│   │   ├── common/             # Modais globais, Navbar, Badges, Botões compartilhados
│   │   ├── community/          # Feed social de alunos, postagens e curtidas
│   │   ├── dashboard/          # Home do aluno, cartões de foco diário, métricas
│   │   ├── gamification/       # Tela de conquistas, badges, recompensas e XP
│   │   ├── layout/             # Estrutura base da aplicação (Sidebar, RightPanel)
│   │   ├── materials/          # Biblioteca de materiais de apoio (PDFs, guias)
│   │   ├── modules/            # Catálogo de módulos do curso (MyModulesView.jsx)
│   │   ├── musical/            # Modo de prática musical estendida (karaokê)
│   │   ├── profile/            # Perfil do aluno, avatar, metas diárias (GoalRoutineCard)
│   │   ├── pronunciation/      # PronunciationLabView (análise fonética e gravação)
│   │   ├── ranking/            # Leaderboard semanal/geral de alunos
│   │   ├── settings/           # Configurações do aluno (StudentSettingsView.jsx)
│   │   ├── songs/              # Magic Songs player e catálogo de canções
│   │   └── tracks/             # Trilhas de aprendizagem e jornada de fluência
│   ├── context/                # Estados globais em React Context API
│   │   ├── AuthContext.jsx     # Autenticação, sessão Supabase, perfil e papel do usuário
│   │   └── GamificationContext.jsx # XP, Streak, Níveis, Áudios e Notificações de conquista
│   ├── data/                   # Dados estáticos, bases mock de segurança e configurações
│   ├── services/               # Camada de comunicação com APIs externas e Supabase
│   ├── utils/                  # Utilitários de áudio, validação, Google Drive e datas
│   ├── App.jsx                 # Roteador central SPA e orquestrador de visões
│   └── main.jsx                # Ponto de entrada do React 19
├── supabase/                   # Migrações SQL e Edge Functions
└── package.json                # Declaração de scripts e dependências do projeto
```

---

## 4. ESTRUTURA DE ROTEAMENTO (SPA ROUTER NATIVO)

A aplicação não utiliza a dependência pesada `react-router-dom`; em vez disso, implementa um sistema de roteamento SPA nativo de alta performance no arquivo [App.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/App.jsx):
- **Tratamento de URL:** Função `parseRoute(pathname, search)` que mapeia paths `/` e querystrings (`?view=`, `?module=`, `?lesson=`, `?song=`) para estados do React.
- **Histórico e Navegação:** Função `navigate(to, options)` sincronizada com a API `window.history.pushState` e evento `window.addEventListener('popstate')`.
- **Rotas Públicas vs Autenticadas:**
  - Rotas Abertas: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin-login`.
  - Rotas Protegidas do Aluno: `dashboard`, `classroom`, `musical-practice`, `my-lessons`, `magic-songs`, `materials`, `pronunciation-lab`, `avatar-practice`, `tracks`, `community`, `gamification`, `ranking`, `profile`, `settings`.
  - Rotas de Acesso Restrito (Admin): `admin` com sub-views (`overview`, `modules`, `lessons`, `songs`, `materials`, `pronunciation`, `students`, `avatar-settings`, `settings`).

---

## 5. INTEGRAÇÕES EXTERNAS E DEPENDÊNCIAS DE AMBIENTE

1. **Supabase Cloud:**
   - Variáveis de ambiente no `.env`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
   - Conexão autenticada mantida em `src/services/supabaseClient.js`.
2. **Microsoft Azure Speech Services:**
   - Utilizado pelo serviço `avatarPracticeService.js` para geração de áudio neural dinâmico com sincronização fonética.
3. **Google Drive Video/Audio Stream:**
   - Rotinas de extração de ID implementadas em `googleDriveHelper.js` para exibição de vídeo sem custo de bandwidth de CDN próprio.
4. **Kiwify Webhook:**
   - Edge Function `kiwify-webhook` para automação de matrícula de novos compradores.

---

## 6. PIPELINE DE BUILD E DEPLOY

- **Script de Desenvolvimento Local:** `npm run dev` (Vite dev server rodando na porta padrão 5173).
- **Script de Compilação de Produção:** `npm run build` (`vite build`).
- **Hospedagem e Servidor Web:** Configurado para deploy em ambiente Apache/Nginx ou Hostinger com arquivo `.htaccess` garantindo reescrita para `index.html` em todas as rotas profundas da SPA.
