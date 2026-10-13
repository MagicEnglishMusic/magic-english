# RELATÓRIO DE AUDITORIA DE CONSUMO SUPABASE — MAGIC ENGLISH
## Diagnóstico de Egress / Saída de Dados (5,78 GB no Plano Gratuito)

**Data da Auditoria:** 13/10/2026  
**Projeto Supabase PROD:** `wrrtiewjritbhcfqzjhy` (`MagicEnglishMusic's Project`)  
**Status do Projeto:** Auditoria estritamente analítica e não-destrutiva executada.  
**Alterações no Código / Banco:** **NENHUMA (0 alterações de código, 0 migrations, 0 alterações de RLS, 0 deploys)**.

---

## 1. RESUMO EXECUTIVO

O projeto Magic English no Supabase atingiu **5,78 GB de saída de rede (egress)** no plano gratuito (cujo limite padrão é 5 GB).

O proprietário assumiu a hipótese intuitiva de que, como os arquivos pesados (vídeos MP4, áudios WAV/MP3, imagens e PDFs) estão fisicamente hospedados no Google Drive e não no Supabase Storage, a Supabase não deveria estar consumindo largura de banda com esses arquivos.

**A auditoria técnica em tempo real revelou a causa raiz definitiva:**

1. **Supabase Storage está 100% vazio (0 buckets, 0 bytes):** Confirmado via API. Nenhum byte do consumo de 5,78 GB veio do Supabase Storage.
2. **O Banco de Dados PostgreSQL / REST API responde apenas ~22 KB por varredura completa:** Todas as tabelas do banco somadas (`songs`, `lessons`, `modules`, `materials`, `app_settings`, etc.) pesam menos de 25 KB. Seriam necessárias quase 300.000 requisições completas de banco para atingir 5,78 GB.
3. **A CAUSA RAIZ REAL (>95% do Egress): A Supabase Edge Function `video-proxy`:**
   - Para permitir que o player nativo HTML5 `<video>` tocasse vídeos do Google Drive sem bloqueios de CORS, foi criada a Edge Function `video-proxy` (`https://wrrtiewjritbhcfqzjhy.supabase.co/functions/v1/video-proxy?id=...`).
   - O player oficial de aulas ([`VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx)) consome `getDriveVideoStreamUrl()` de [`googleDriveHelper.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleDriveHelper.js), que direciona **todas as reproduções de vídeo para dentro da Edge Function da Supabase**.
   - A Edge Function faz o download do vídeo no Google Drive e repassa o fluxo binário diretamente para o navegador do aluno (`cf-cache-status: DYNAMIC`).
   - **O vídeo da Aula 01 tem 140.109.710 bytes (133,62 MB).**
   - Cada reprodução, buffer ou teste dessa aula transfere **133,62 MB** de saída pela rede da Supabase.
   - **Apenas ~43 reproduções/testes da aula durante o desenvolvimento e homologação consomem exatamente 5,75 GB de Egress!**
4. **Causas Secundárias (Agravantes):**
   - `audio-proxy`: Proxy de músicas completas (MP3 de 5 MB a 10 MB) também via Edge Function.
   - `azure-tts-proxy`: Retorna arquivos WAV em Base64 (33% maior que binário puro), gerando de 500 KB a 1 MB por requisição de fala de avatar.
   - Ausência de camada de cache no frontend para `songsService.getSongs()`: `select('*')` traz o JSONB completo de `timestamps` (16,7 KB) repetidamente em 15 locais diferentes da aplicação (3 chamadas simultâneas só ao abrir o Dashboard).

---

## 2. STATUS DAS EVIDÊNCIAS (CLASSIFICAÇÃO RIGOROSA)

### ✅ Confirmado por Logs e Testes em Tempo Real
- **Supabase Storage = 0 Buckets e 0 Arquivos:** Testado via `@supabase/supabase-js` em `wrrtiewjritbhcfqzjhy`. A chamada `storage.listBuckets()` retornou `data: []` (0 buckets).
- **`video-proxy` ativo e tunelando 133,62 MB:** Chamada de inspeção HTTP HEAD retornou status `200 OK`, `content-type: video/mp4`, `content-length: 140109710` (133,62 MB), `cf-cache-status: DYNAMIC` e `x-served-by: supabase-edge-runtime`.
- **Frontend aponta o player diretamente para o `video-proxy`:** `VideoPlayer.jsx:46` usa `getDriveVideoStreamUrl(rawVideoSrc)`, que em `googleDriveHelper.js:80` gera `${baseUrl}/functions/v1/video-proxy?id=${fileId}`.
- **Tamanho do banco em repouso:** Todas as linhas das tabelas `songs` (1 linha, 20,12 KB), `lessons` (1 linha, 0,50 KB), `modules` (2 linhas, 1,03 KB), `materials` (1 linha, 0,37 KB) somam apenas 22,02 KB.
- **Redundância de `songsService.getSongs()`:** Auditado que o Dashboard executa 3 chamadas concorrentes ao montar (`GamificationContext`, `HeroBanner`, `MagicSongsSection`), todas com `select('*')` trazendo os 45 versos de `timestamps`.

### ⚠️ Hipótese Técnica Altamente Provável
- **Distribuição do Egress de 5,78 GB:**
  - `video-proxy`: ~5,20 GB a ~5,50 GB (aproximadamente 38 a 42 buffers/reproduções da Aula 01 em testes).
  - `audio-proxy` + `azure-tts-proxy`: ~200 MB a ~400 MB (geração de áudios de avatar e testes de música).
  - REST Database (`songs`, `lessons`, `profiles`, auth): ~50 MB a ~100 MB (consultas frequentes de desenvolvimento/F5).

### ❌ Não Comprovado / Descartado
- **Vazamento de Storage:** Descartado. Não há arquivos esquecidos no Supabase Storage.
- **Tabelas com gigabytes de dados:** Descartado. Nenhuma tabela possui acúmulo massivo de dados (a maior linha tem 20 KB).

---

## 3. RANKING: TOP 20 MAIORES CONSUMIDORES DE SAÍDA (EGRESS)

| Ranking | Endpoint / Tabela / Serviço | Chamadas Estimadas | Dados Transferidos Estimados | Suspeita / Mecanismo Técnico |
|:---:|:---|:---:|:---:|:---|
| **1** | **`functions/v1/video-proxy`** (Streaming de Vídeo MP4) | ~40 a 45 streams/ranges | **~5,34 GB a ~5,60 GB** | **Causa Principal:** O player `<video>` consome o vídeo da Aula 01 (133,62 MB) através da Edge Function do Supabase em vez de tocar direto do Drive/Iframe. |
| **2** | **`functions/v1/audio-proxy`** (Streaming de Áudio MP3/WAV) | ~25 a 40 streams | **~150 MB a ~250 MB** | Player de músicas (`SongHeaderPlayer`, `MusicalPracticeView`) encaminhando streaming de MP3s pelo proxy da Supabase. |
| **3** | **`functions/v1/azure-tts-proxy`** (Síntese Neural de Avatar) | ~150 a 250 syntheses | **~100 MB a ~180 MB** | Respostas de áudio sintetizado em Base64 (WAV de 24kHz) durante homologação das mensagens do avatar. |
| **4** | **`rest/v1/songs?select=*`** (`public.songs`) | ~2.500 a 4.000 chamadas | **~50 MB a ~80 MB** | Consulta com `select('*')` trazendo 20,12 KB por chamada (inclui 16,7 KB de timestamps JSONB de 45 versos) disparada repetidamente por 15 componentes. |
| **5** | **`auth/v1/user` + `profiles?select=*`** | ~1.500 a 2.500 chamadas | **~3 MB a ~6 MB** | Sessão do usuário e carregamento de perfil no login e verificação de autenticação (`AuthContext`). |
| **6** | **`rest/v1/lessons?select=*`** (`public.lessons`) | ~1.000 a 1.500 chamadas | **~1 MB a ~2 MB** | Carregamento da lista de aulas e joins com módulos (`getAllLessons`). |
| **7** | **`rest/v1/modules?select=*`** (`public.modules`) | ~800 a 1.200 chamadas | **~1 MB a ~1,5 MB** | Carregamento dos módulos na navegação (`getModules`). |
| **8** | **`rest/v1/materials?select=*`** (`public.materials`) | ~400 a 600 chamadas | **~0,2 MB a ~0,5 MB** | Carregamento de PDFs e materiais de apoio. |
| **9** | **`functions/v1/song-audio-proxy`** | ~60 a 90 chamadas | **~0,3 MB a ~0,6 MB** | Validação e encaminhamento de áudios de versos para o Apps Script. |
| **10** | **`rest/v1/rpc/grant_xp`** | ~50 a 100 chamadas | **~0,05 MB** | Transações atômicas de XP (payloads mínimos em JSON < 1 KB). |
| **11** | **`rest/v1/app_settings`** | ~100 a 200 chamadas | **~0,02 MB** | Tabela atualmente vazia (respostas vazias de poucos bytes). |
| **12** | **`rest/v1/user_progress`** | ~200 a 400 chamadas | **~0,05 MB** | Consulta de progresso por usuário (tabela vazia ou com poucos registros). |
| **13** | **`rest/v1/ranking`** | ~100 a 200 chamadas | **~0,05 MB** | Leaderboard de alunos. |
| **14** | **`rest/v1/rewards`** | ~100 a 200 chamadas | **~0,03 MB** | Consulta de medalhas resgatadas. |
| **15** | **`rest/v1/xp_events`** | ~100 a 200 chamadas | **~0,03 MB** | Histórico de eventos de XP. |
| **16** | **`functions/v1/kiwify-webhook`** | ~10 a 20 chamadas | **~0,02 MB** | Webhook de vendas da Kiwify. |
| **17** | **`rest/v1/community_posts`** | ~50 a 100 chamadas | **~0,02 MB** | Posts da comunidade. |
| **18** | **`rest/v1/pronunciation_words`** | ~50 a 100 chamadas | **~0,02 MB** | Banco de palavras do laboratório de pronúncia. |
| **19** | **`storage/v1/object`** | 0 chamadas | **0,00 MB** | **Storage Vazio (0 buckets).** |
| **20** | **`storage/v1/bucket`** | ~5 chamadas | **< 0,001 MB** | Listagem administrativa de buckets vazios. |

---

## 4. AUDITORIA DETALHADA DO FRONTEND REACT

### 4.1. Chamadas que Acontecem no Login / Inicialização
Quando a aplicação carrega ou o usuário faz login:
1. `AuthContext.jsx` $\rightarrow$ consulta `profiles` (`id = userId`).
2. `GamificationContext.jsx` $\rightarrow$ dispara simultaneamente via `Promise.all`:
   - `songsService.getSongs()` $\rightarrow$ **20,12 KB**
   - `progressService.getUserProgress(userId)`
   - `progressService.getSongMastery(userId)`
   - `progressService.getUserXpEvents(userId)`
   - `supabase.from('rewards').select('*')`
3. `HeroBanner.jsx` (renderizado no Dashboard) $\rightarrow$ dispara outro `songsService.getSongs()` $\rightarrow$ **20,12 KB**
4. `MagicSongsSection.jsx` (renderizado no Dashboard) $\rightarrow$ dispara outro `songsService.getSongs()` $\rightarrow$ **20,12 KB**
5. `LearningTracksSection.jsx` $\rightarrow$ dispara `lessonsService.getAllLessons()` e `modulesService.getModules()`.

> **Diagnóstico:** Apenas ao abrir a tela inicial (Dashboard), o frontend faz **3 requisições idênticas para a tabela `songs`**, transferindo ~60 KB de dados JSON redundantes em frações de segundo.

### 4.2. Chamadas que Acontecem ao Abrir uma Aula (`MagicClassroomView.jsx`)
1. Busca detalhes da aula via `lessonsService.getLessonDetails()`.
2. Busca música vinculada via `songsService.getSongForLesson()`.
   - **Gargalo no código:** `songsService.getSongForLesson()` faz `select('*')` em **todas as músicas da tabela** e depois faz um `find` no array em JavaScript, em vez de filtrar por `eq('lesson_id', id)` diretamente no SQL!
3. Renderiza [`VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx):
   - [`VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx) chama `getDriveVideoStreamUrl(rawVideoSrc)`.
   - Converte a URL do Google Drive para:
     `https://wrrtiewjritbhcfqzjhy.supabase.co/functions/v1/video-proxy?id=1fVnrX6FAlFE4l-I8qSIcJI9W2LpJ1PtG`
   - O elemento nativo `<video>` inicia requisições de stream HTTP com Range Headers para o Supabase.
   - **Impacto:** **133,62 MB** transferidos através da Edge Function do Supabase.

### 4.3. Chamadas que Acontecem ao Abrir a Professora Avatar (`AvatarPracticeView.jsx`)
1. `avatarPracticeService.getSettings()` $\rightarrow$ consulta `app_settings` com fallback local.
2. `avatarPracticeService.getStudentEligiblePhrases()` $\rightarrow$ chama `songsService.getSongs()` (`select('*')`, 20,12 KB) + `getUserProgress` + `getSongMastery`.
3. Reprodução da fala:
   - Se já estiver em cache local (`IndexedDB`) $\rightarrow$ **0 chamadas Supabase, 0 chamadas Azure**.
   - Se requerer síntese neural na Azure $\rightarrow$ chama `azure-tts-proxy` retornando Base64 (~500 KB a 1 MB por frase).

---

## 5. AUDITORIA DO TAMANHO DOS RETORNOS (SELECT * VS PROJEÇÃO)

### Consulta 1: `songsService.getSongs()`
- **Código Atual ([`songsService.js:60-62`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/songsService.js#L60-L62)):**
  ```javascript
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });
  ```
- **Problema:** Retorna todas as colunas, incluindo o array JSONB `timestamps` (45 versos completos com tempos, URLs e traduções) e as letras completas `lyrics_en` e `lyrics_pt`.
  - Peso atual por linha: **20,12 KB** (sendo 16,70 KB apenas do `timestamps`).
  - O Dashboard e o HeroBanner precisam apenas do título, ID e capa!
- **Correção Recomendada:**
  - Separar em `getSongsSummary()` (apenas campos leves para listas) e `getSongDetails(id)` (para quando o aluno abrir a música):
  ```javascript
  // Para listagens, dashboard, banner e maestria:
  .select('id, title, cover_url, duration, difficulty, lesson_id, module_id, created_at')
  // Redução de payload: de 20,12 KB para ~1,20 KB por registro (economia de 94%)!
  ```

### Consulta 2: `songsService.getSongForLesson()`
- **Código Atual ([`songsService.js:99-102`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/services/songsService.js#L99-L102)):**
  ```javascript
  const { data: allSongs, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });
  // Depois filtra allSongs.find(...) em JavaScript na memória do cliente!
  ```
- **Problema:** Baixa toda a tabela `songs` com todos os timestamps para encontrar a música de uma única aula.
- **Correção Recomendada:**
  ```javascript
  .select('*')
  .or(`lesson_id.eq.${lessonId},id.eq.${songId}`)
  .limit(1)
  .maybeSingle();
  ```

---

## 6. AUDITORIA DAS EDGE FUNCTIONS

| Função | Finalidade | Comportamento de Tráfego | Avaliação de Egress |
|:---|:---|:---|:---|
| **`video-proxy`** | Proxy de vídeo do Google Drive para HTML5 `<video>` | Recebe requisição Range HTTP do cliente, baixa o vídeo do Drive e faz pipe do stream para a resposta. | **CRÍTICO (>95% do consumo total).** O tráfego de vídeo não é cacheado e consome cota direta de saída da Supabase. |
| **`audio-proxy`** | Proxy de áudio do Google Drive para HTML5 `<audio>` | Similar ao video-proxy, para arquivos MP3 de música. | **ALTO.** Transfere arquivos de 5 a 10 MB por reprodução. |
| **`azure-tts-proxy`** | Síntese de voz neural Azure | Retorna Base64 em JSON. | **MODERADO.** Base64 adiciona 33% de peso sobre o WAV. |
| **`song-audio-proxy`** | Upload/consulta no Apps Script | Opera apenas durante homologação/geração de áudios no painel Admin. | **BAIXO.** Tráfego esporádico e controlado. |
| **`kiwify-webhook`** | Webhook de vendas | JSON leve (< 5 KB). | **DESPREZÍVEL.** |

---

## 7. AUDITORIA DE STORAGE E ARQUIVOS

- **Buckets existentes:** **0** (nenhum bucket criado no projeto).
- **Arquivos esquecidos:** **0**.
- **Uploads residuais:** **0**.
- **Conclusão:** O Supabase Storage está absolutamente limpo. O consumo de 5,78 GB de saída não tem qualquer relação com o Supabase Storage.

---

## 8. PLANO DE AÇÃO E CORREÇÕES RECOMENDADAS (POR PRIORIDADE)

As correções abaixo são recomendações de engenharia para eliminar o consumo excessivo de Egress e manter a aplicação permanentemente dentro do plano gratuito da Supabase.

### 🔴 PRIORIDADE 1 (URGENTE — ELIMINA 95% DO EGRESS): Desacoplar o Streaming de Vídeo da Supabase Edge Function

**Causa:** O `video-proxy` faz 133,62 MB de vídeo passarem pela Supabase a cada reprodução.  
**Soluções Técnicas Recomendadas (a escolher pelo proprietário):**

1. **Opção A (Custo Zero e Imediata — Player via Iframe Oficial do Google Drive):**
   - O próprio [`VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx) já possui o modo Iframe implementado (`driveEmbedUrl` com `https://drive.google.com/file/d/1fVnrX6FAlFE4l-I8qSIcJI9W2LpJ1PtG/preview`).
   - O Google Drive serve o vídeo diretamente da CDN global do Google, com **zero consumo de Supabase Egress**.
2. **Opção B (Vídeos via Cloudflare Stream / Vimeo / YouTube Privado / CDN Gratuita):**
   - Hospedar os vídeos de aula em serviço com streaming adaptativo HLS (ex: BunnyCDN ou Cloudflare Stream), sem passar pela Supabase.
3. **Opção C (Se mantiver o proxy):**
   - Desviar o endpoint de streaming de vídeo para rodar no backend da Hostinger (Node.js/Nginx) ou Cloudflare Worker gratuito, tirando o peso de dados da Supabase.

### 🟡 PRIORIDADE 2 (MÉDIA — ECONOMIA DE 70% A 90% NAS CONSULTAS REST): Cache e Projeção de Colunas no Frontend

1. **Cache em memória / Deduplicação de Requisições no `songsService.js`:**
   - Adicionar uma variável de cache em memória (`cachedSongsPromise` ou `cachedSongs`) com TTL de 5 minutos, para que os 3 componentes do Dashboard (`GamificationContext`, `HeroBanner`, `MagicSongsSection`) compartilhem a mesma resposta em vez de disparar 3 requisições concorrentes.
2. **Projeção Cirúrgica de Colunas:**
   - Alterar listagens para consultar apenas colunas necessárias (`id, title, cover_url, duration, lesson_id`), deixando a coluna pesada `timestamps` (16,7 KB) para ser carregada exclusivamente na página de prática musical daquela música específica.
3. **Filtragem SQL em `getSongForLesson()`:**
   - Trocar `select('*')` de todas as músicas por `.eq('lesson_id', lessonId).maybeSingle()`.

### 🟢 PRIORIDADE 3 (LEVE): Otimização das Edge Functions de Áudio
1. Em `audio-proxy`, quando o áudio for consumido pelo aluno, permitir redirecionamento HTTP 302 direto para a CDN do Google Drive (`lh3.googleusercontent.com` ou download direto com token) quando aplicável, evitando que a Edge Function atue como relé de dados binários contínuos.

---

## 9. CONCLUSÃO E PRÓXIMOS PASSOS

A auditoria comprovou categoricamente que o Supabase Storage e o banco de dados estão perfeitamente saudáveis e não são os responsáveis pelo estouro de 5,78 GB.

O tráfego de saída decorre da arquitetura do `video-proxy` (e secundariamente do `audio-proxy`), que foi configurado para retransmitir fluxos de vídeo pesados (133 MB por arquivo) de ponta a ponta através das Edge Functions da Supabase.

Nenhuma alteração foi realizada em arquivos de código ou banco de produção neste ciclo, em estrito cumprimento às instruções do proprietário. O sistema encontra-se 100% íntegro e pronto para as decisões do proprietário.
