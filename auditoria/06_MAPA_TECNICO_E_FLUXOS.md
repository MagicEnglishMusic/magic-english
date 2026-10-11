# MAPA TÉCNICO, FLUXOS E ÁRVORE DE COMPONENTES
**Documento 06: Diagramas de Arquitetura, Ciclo de Vida de Estados e Fluxos de Dados**
**Data da Auditoria:** 11 de Outubro de 2026  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. FLUXO GERAL DE INICIALIZAÇÃO E ROTEAMENTO

```mermaid
flowchart TD
    A["Início (index.html)"] --> B["main.jsx (Root Render)"]
    B --> C["AuthProvider (AuthContext.jsx)"]
    C --> D["GamificationProvider (GamificationContext.jsx)"]
    D --> E["App.jsx (Router SPA Nativo)"]
    
    E --> F{"Usuário Autenticado?"}
    F -- "Não" --> G["Rotas Públicas (Login / Register / Recuperação)"]
    F -- "Sim" --> H{"Rota Solicitada"}
    
    H -- "view=admin" --> I{"Role === 'admin'?"}
    I -- "Sim" --> J["AdminView.jsx (Painel de Gestão)"]
    I -- "Não" --> K["Redirecionamento para Dashboard"]
    
    H -- "Outras Views" --> L["DashboardView / Classroom / MagicSongs / AvatarPractice"]
```

---

## 2. FLUXO DO CICLO DE PRÁTICA 3D COM AVATAR (LISTEN & REPEAT)

```mermaid
sequenceDiagram
    autonumber
    actor Aluno
    participant UI as AvatarPracticeView.jsx
    participant Service as avatarPracticeService.js
    participant Three as TalkingHead / WebGL
    participant Azure as Azure Neural Speech
    participant Supabase as Supabase DB (Progresso)

    Aluno->>UI: Acessa Sala do Professor 3D
    UI->>Service: Carrega Sessão & Checa Trava de 24h
    alt Cooldown Ativo
        UI-->>Aluno: Exibe Tela de Bloqueio (Tempo Restante)
    else Sessão Liberada
        UI->>Three: Instancia TalkingHead e Carrega Modelo GLB Local
        UI->>Service: Busca Frases Acumuladas das Músicas Concluídas
        Service->>Azure: Requisita Áudio Neural Bilíngue (Frase EN + Explicação PT)
        Azure-->>Three: Retorna Áudio com Visemas Faciais
        Three-->>Aluno: Professor Fala e Gesticula com Lip Sync
        Aluno->>UI: Clica no Microfone e Repete Frase
        UI->>UI: Web Speech API Transcreve a Voz
        UI->>UI: Algoritmo Fonético Compara com o Alvo
        alt Acerto / Similaridade Alta
            UI->>Three: Animação de Sorriso e Elogio em Áudio
            UI->>Supabase: Registra Frase Concluída e Concede XP
        else Necessita Repetição
            UI->>Three: Expressão de Incentivo e Dica Fonética
        end
    end
```

---

## 3. ÁRVORE PRINCIPAL DE COMPONENTES E ESTADOS

```
App.jsx (Estado: currentView, currentModule, currentLesson, currentSong)
│
├── Layout Base
│   ├── Sidebar.jsx (Navegação principal, itens liberados conforme nível)
│   ├── Topbar.jsx (Avatar do usuário, notificações, saldo de XP)
│   └── RightPanel.jsx (Calendário semanal de estudos, ranking rápido)
│
├── Visões do Estudante
│   ├── DashboardView.jsx
│   │   ├── ContinueLearningCard.jsx (Retorno rápido à última aula)
│   │   ├── DashboardFocusCards.jsx (Atalhos principais)
│   │   └── QuickStats.jsx (Minutos estudados, streak)
│   ├── MagicClassroomView.jsx
│   │   ├── VideoPlayer.jsx (YouTube / Google Drive / HTML5)
│   │   ├── LessonTabs.jsx (Overview, Vocabulary, Quiz, Materials)
│   │   └── CompleteLessonButton.jsx (Dispara grant_xp)
│   ├── MagicSongsSection.jsx
│   │   ├── AudioPlayer.jsx (Play, pause, velocidade 0.75x a 1.25x)
│   │   └── SyncedLyrics.jsx (Karaokê linha a linha com tradução)
│   ├── AvatarPracticeView.jsx
│   │   ├── Canvas3DContainer (TalkingHead WebGL)
│   │   ├── TeacherSelector (Sarah, James, Emma, David, Lucas)
│   │   ├── PhraseCard (Texto em inglês, tradução e fonética)
│   │   └── SpeechRecognitionControls (Microfone, avaliação)
│   ├── PronunciationLabView.jsx
│   │   └── PhoneticCards (Gravação e pontuação fonética)
│   └── ProfileView.jsx
│       └── GoalRoutineCard.jsx (Meta diária personalizada)
│
└── Visão Administrativa (AdminView.jsx)
    ├── ModuleManager.jsx (Controle de visibilidade e CRUD de módulos)
    ├── LessonManager.jsx (Gerenciador de vídeos e exercícios)
    ├── SongManager.jsx (Sincronização de letras e áudios)
    ├── StudentManager.jsx (Gestão de acessos, status e suspensões)
    └── AvatarSettingsView.jsx (Parâmetros da mentoria virtual 3D)
```
