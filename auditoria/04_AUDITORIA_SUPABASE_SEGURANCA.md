# AUDITORIA DO SUPABASE, BANCO DE DADOS E SEGURANÇA
**Documento 04: Estrutura Relacional, RLS Policies, RPCs, Edge Functions e Auditoria de Segurança**
**Data da Auditoria:** 11 de Outubro de 2026  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. TABELAS E ESQUEMA DO BANCO DE DADOS (POSTGRESQL)

O banco de dados do Magic English possui uma arquitetura relacional baseada nas seguintes tabelas primárias:

| Tabela | Descrição | Chave Primária | Relações Principais |
| :--- | :--- | :--- | :--- |
| `profiles` | Perfil do aluno/admin vinculado ao Supabase Auth | `id` (UUID) | `auth.users(id)` |
| `modules` | Módulos temáticos do curso de inglês | `id` (UUID) | - |
| `lessons` | Aulas de vídeo e conteúdo teórico | `id` (UUID) | `module_id` -> `modules(id)` |
| `songs` | Canções com letras e áudio para prática | `id` (UUID) | `module_id` -> `modules(id)` |
| `materials` | Apostilas, PDFs e arquivos para download | `id` (UUID) | `module_id` -> `modules(id)` |
| `pronunciation_items` | Vocabulário e desafios fonéticos | `id` (UUID) | - |
| `user_progress` | Registro de aulas e canções concluídas pelo aluno | `id` (UUID) | `user_id` -> `profiles(id)` |
| `gamification_profiles` | Saldo de XP, nível atual e streak de ofensiva | `id` (UUID) | `user_id` -> `profiles(id)` |
| `xp_events` | Ledger imutável de transações de concessão de XP | `id` (UUID) | `user_id` -> `profiles(id)` |
| `user_badges` | Conquistas desbloqueadas por cada estudante | `id` (UUID) | `user_id` -> `profiles(id)` |
| `community_posts` | Postagens criadas pelos alunos no feed | `id` (UUID) | `user_id` -> `profiles(id)` |
| `community_likes` | Curtidas em postagens da comunidade | `id` (UUID) | `post_id`, `user_id` |
| `avatar_settings` | Preferências globais do sistema de avatar 3D | `id` (UUID) | - |

---

## 2. PROCEDIMENTOS ARMAZENADOS (STORED PROCEDURES / RPCs)

### 2.1 RPC `grant_xp(p_user_id, p_activity_type, p_xp_amount, p_reference_id)`
- **Função:** Centraliza a concessão de pontos de experiência no banco de dados com proteção contra manipulação client-side e duplicação.
- **Funcionamento:**
  1. Valida se a referência (`p_reference_id`) já concedeu XP para a mesma atividade (`p_activity_type`) para aquele aluno na tabela `xp_events`.
  2. Insere um novo registro de auditoria em `xp_events`.
  3. Atualiza atomicamente o saldo de XP e recalcula o nível em `gamification_profiles`.
  4. Retorna o saldo de XP atualizado e status booleano de concessão.

---

## 3. ROW LEVEL SECURITY (RLS) POLICIES

A segurança por linha (RLS) está ativada nas tabelas críticas:
- **`profiles`:**
  - `SELECT`: Permitido para usuários autenticados (ou perfil público para ranking).
  - `UPDATE`: Apenas o próprio usuário autenticado pode alterar seu perfil (`auth.uid() = id`), exceto o campo `role` que é protegido por verificação de admin.
- **`user_progress` & `gamification_profiles`:**
  - `SELECT / INSERT / UPDATE`: Restrito ao próprio aluno autenticado (`auth.uid() = user_id`) ou a administradores.
- **`modules`, `lessons`, `songs`, `materials`:**
  - `SELECT`: Liberado para usuários autenticados onde `is_visible = true` (ou qualquer registro caso o usuário seja admin).
  - `INSERT / UPDATE / DELETE`: Exclusivo para usuários com função de administrador (`profiles.role = 'admin'`).
- **`community_posts`:**
  - `SELECT`: Liberado para todos os autenticados.
  - `INSERT`: Liberado para o autor autenticado.
  - `DELETE`: Permitido para o autor ou administradores.

---

## 4. EDGE FUNCTIONS (SUPABASE SERVERLESS RUNTIME)

1. **`admin-manage-student`:**
   - Permite ao administrador criar novos usuários via `auth.admin.createUser` e atualizar credenciais sem expor a Service Role Key no frontend.
2. **`audio-proxy`:**
   - Recebe requisições de áudio, aplica cabeçalhos seguros de CORS e faz o repasse de streams remotos evitando bloqueios de origem.
3. **`video-proxy`:**
   - Faz o encapsulamento de links de vídeo do Google Drive e serviços externos para permitir visualização contínua.
4. **`kiwify-webhook`:**
   - Endpoint público protegido por token de webhook da Kiwify. Recebe eventos de compra aprovada (`order_approved`) e provisiona a conta do aluno automaticamente.

---

## 5. AUDITORIA DE SEGURANÇA E VULNERABILIDADES IDENTIFICADAS

### 5.1 Chave de API do Azure Speech Services no Frontend (Risco Alto)
- **Localização:** `src/services/avatarPracticeService.js`.
- **Diagnóstico:** A chave de API do Azure Cognitive Services (`AZURE_SPEECH_KEY`) e a região (`AZURE_SPEECH_REGION`) estão declaradas diretamente no código-fonte do cliente React.
- **Impacto:** Qualquer usuário experiente pode inspecionar o bundle JS e utilizar a chave de API para sintetizar áudios fora da plataforma, gerando consumo não autorizado na conta Azure do cliente.
- **Recomendação Futura:** Migrar a geração de áudio TTS ou a obtenção de token temporário para uma Edge Function do Supabase (`azure-tts-token`), retornando apenas tokens de curta duração (10 minutos) ou o próprio áudio binário em cache.

### 5.2 Validação de Roles Client-Side vs RLS Backend (Risco Médio)
- **Diagnóstico:** O frontend verifica `user?.role === 'admin'` para exibir o painel administrativo.
- **Mitigação em vigor:** As rotas do banco de dados e APIs possuem políticas RLS no Postgres que barram mutações caso o usuário tente forçar requisições diretas via console.
- **Recomendação Futura:** Manter a proteção estrita em todas as tabelas novas criadas futuramente.

### 5.3 Fallbacks Locais de Módulos e Músicas (Risco Baixo / Usabilidade)
- **Diagnóstico:** Quando o Supabase retorna conjunto vazio ou apresenta falha temporária de rede, alguns serviços possuem listas de fallback estáticas para evitar tela branca.
- **Impacto:** Pode gerar confusão momentânea no painel administrativo se o banco estiver vazio e os cards de demonstração continuarem visíveis.
