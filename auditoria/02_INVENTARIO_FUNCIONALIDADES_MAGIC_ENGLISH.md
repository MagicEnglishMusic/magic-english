# INVENTÁRIO COMPLETO DE FUNCIONALIDADES — MAGIC ENGLISH
**Documento 02: Mapeamento de Recursos do Aluno, Painel Administrativo e Camada Backend**
**Data da Auditoria:** 11 de Outubro de 2026  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. PAINEL DO ALUNO (STUDENT EXPERIENCE)

### 1.1 Dashboard & Home ([DashboardView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/dashboard/DashboardView.jsx))
- **Hero & Boas-Vindas:** Saudação dinâmica baseada no horário do dia e no nome do aluno registrado.
- **Cartão de Continuidade (`ContinueLearningCard.jsx`):** Identifica a última aula ou música interagida e exibe botão de retorno direto de 1 clique.
- **Cartões de Foco (`DashboardFocusCards.jsx`):** Atalhos visuais para as 3 modalidades principais: Sala de Aula Mágica, Magic Songs e Prática com Avatar 3D.
- **Métricas Rápidas:** Total de minutos praticados na semana, streak atual e progresso geral no curso.
- **Notificações e Avisos:** Feed de novidades e avisos institucionais cadastrados pelo administrador.

### 1.2 Sala de Aula Mágica ([MagicClassroomView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/MagicClassroomView.jsx))
- **Player de Vídeo Híbrido:** Suporte a vídeos nativos (HTML5), YouTube Embed responsivo e links diretos do Google Drive com proxy.
- **Navegação de Conteúdo Estruturado:**
  - Seletor de Módulos e Playlist lateral de aulas.
  - Abas da Aula:
    1. *Visão Geral & Transcrição:* Resumo didático e pontos-chave da lição.
    2. *Vocabulário & Chaves Fonéticas:* Lista de termos em destaque com pronúncia em áudio.
    3. *Exercícios de Fixação:* Quizzes de múltipla escolha e preenchimento de lacunas.
    4. *Materiais Complementares:* Download de apostilas em PDF associadas à aula.
- **Marcação de Conclusão & Concessão de XP:** Botão para marcar aula como concluída, acionando animação de confetes, som de vitória e crédito de XP via RPC `grant_xp`.

### 1.3 Prática Musical e Magic Songs ([MagicSongsSection.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/songs/MagicSongsSection.jsx) & [MusicalPracticeView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/musical/MusicalPracticeView.jsx))
- **Player de Áudio com Letra Sincronizada:** Destaque em tempo real verso a verso no estilo karaokê musical.
- **Tradução Ocultável:** Alterne entre visualização somente em inglês ou inglês + português linha a linha.
- **Dicionário de Expressões:** Clique em palavras destacadas para abrir modal fonético explicativo com pronúncia nativa e exemplos.
- **Controle de Velocidade de Reprodução:** Opções de 0.75x, 1.0x e 1.25x para treino de escuta gradual.

### 1.4 Laboratório de Pronúncia ([PronunciationLabView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/pronunciation/PronunciationLabView.jsx))
- **Interface Fonética Interativa:** Lista de cartões com palavras desafiadoras categorizadas por sons fonéticos (ex: sons de TH, R americano, vogais curtas vs longas).
- **Gravação de Voz & Reconhecimento de Fala:** Microfone integrado com a Web Speech API para capturar a tentativa do aluno.
- **Algoritmo de Similaridade Fonética:** Comparação de Levenshtein entre a transcrição do aluno e o termo alvo, gerando nota percentual de acurácia (0 a 100%), estrelas e feedback instantâneo.

### 1.5 Sala de Prática com Professores 3D ([AvatarPracticeView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx))
- **Ambiente 3D com Renderizador WebGL:** Canvas 3D interativo com controle suave de rotação e zoom.
- **Galeria Multigênero de 5 Professores:**
  - *Professora Sarah:* Modelo feminino formal e fluente (`brunette.glb`).
  - *Professor James:* Modelo masculino executivo nativo (`james.glb`).
  - *Professora Emma:* Modelo feminino dinâmico (`emma.glb`).
  - *Professor David:* Modelo masculino acadêmico (`david.glb`).
  - *Mascote Lucas:* Personagem 3D estilizado estilo Pixar (`lucas.glb`) com morfar facial dinâmico.
- **Ciclo de Prática de Conversação (Listen & Repeat):**
  1. O professor fala a frase em inglês com lip sync perfeito gerado pelo Azure Neural TTS.
  2. O professor fornece a tradução contextualizada em português.
  3. O aluno aciona o microfone e repete a frase em inglês.
  4. O sistema avalia a pronúncia e o professor reage com expressões faciais e voz de incentivo.
- **Trava de Prática Diária (24h Cooldown):** Temporizador diário de 15 minutos com bloqueio e contagem regressiva para incentivar a repetição espaçada sem estafa.
- **Repertório Acumulativo de Músicas:** Frases extraídas automaticamente das canções concluídas pelo aluno no curso.
- **Tela de Celebração de Conclusão:** Finalização de ciclo de frases com opção de continuar ou refazer.

### 1.6 Sistema de Gamificação & Conquistas ([GamificationView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/gamification/GamificationView.jsx) & [RankingView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/ranking/RankingView.jsx))
- **Mecânica de XP e Níveis:** Sistema de progressão de níveis (Iniciante, Bronze, Prata, Ouro, Mestre Mágico) baseado em pontos de experiência acumulados.
- **Medidores de Ofensiva (Daily Streak):** Registro de dias consecutivos de estudo com alerta visual de perda iminente de streak.
- **Painel de Conquistas (Badges):** Medalhas desbloqueáveis por marcos alcançados (Primeira Lição, Músico Nível 1, Fonética de Ouro, etc.).
- **Ranking Semanal da Comunidade:** Classificação competitiva entre alunos inscritos calculada pelo volume de XP gerado nos últimos 7 dias.

### 1.7 Comunidade Social de Alunos ([CommunityView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/community/CommunityView.jsx))
- **Feed de Publicações:** Compartilhamento de dúvidas, gravações e vitórias pedagógicas.
- **Interações:** Curtidas, comentários e respostas entre estudantes e instrutores.

### 1.8 Central de Materiais ([MaterialsView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/materials/MaterialsView.jsx))
- Catálogo de e-books, resumos gramaticais, partituras e guias de áudio organizados por categoria com visualizador e link de download.

### 1.9 Perfil e Configurações ([ProfileView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/profile/ProfileView.jsx) & [StudentSettingsView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/settings/StudentSettingsView.jsx))
- **Meta e Rotina Diária (`GoalRoutineCard.jsx`):** Definição da intensidade diária de estudo (10 min Casual, 20 min Regular, 30 min Intenso).
- **Preferências Pessoais:** Troca de tema, volume padrão de sons e preferências de notificações.

---

## 2. PAINEL ADMINISTRATIVO (ADMIN SUITE)

O acesso administrativo é centralizado em [AdminView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/AdminView.jsx), protegido por validação de função (`role === 'admin'`) vinda do Supabase.

### 2.1 Visão Geral (Admin Overview)
- Cards de métricas: Total de alunos ativos, total de módulos publicados, total de aulas ativas, taxa média de conclusão de cursos e volume de acessos na semana.

### 2.2 Gerenciador de Módulos ([ModuleManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/ModuleManager.jsx))
- **CRUD Completo:** Criação, edição, exclusão e reordenação numérica de módulos do curso.
- **Controles de Visibilidade:**
  - Alternador `is_visible` (Ativo/Inativo na interface do aluno).
  - Status do Módulo (`published`, `coming_soon`, `draft`).
- **Upload de Capa:** Integração com bucket de storage ou links diretos de imagem.

### 2.3 Gerenciador de Aulas ([LessonManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/LessonManager.jsx))
- Associação de aulas a módulos específicos.
- Gerenciamento de links de vídeo (YouTube, Google Drive, URLs diretas).
- Cadastro de vocabulário da lição e perguntas do quiz interativo.

### 2.4 Gerenciador de Músicas ([SongManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/SongManager.jsx))
- Cadastro de canções com metadados (artista, álbum, nível de dificuldade).
- Upload ou inserção de URL de áudio (Google Drive, MP3 direto).
- Editor de letras sincronizadas verso a verso com marcação de timestamps (minutos:segundos) para sincronismo no karaokê.
- Gerador integrado de áudios TTS para versos individuais via Google Drive helper.

### 2.5 Gerenciador de Materiais ([MaterialManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/MaterialManager.jsx))
- Upload de arquivos PDF e documentações anexadas a módulos ou aulas avulsas.

### 2.6 Gerenciador de Pronúncia ([PronunciationManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/PronunciationManager.jsx))
- Cadastro de termos desafiadores, categorias fonéticas, símbolos IPA e links de áudio de referência nativa.

### 2.7 Gestão de Alunos ([StudentManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/StudentManager.jsx))
- Consulta de lista de alunos cadastrados com pesquisa e filtros.
- Visualização de dados de engajamento (XP total, streak, data de ingresso).
- Alteração de status da conta (ativo, suspenso) e papel de acesso (student vs admin).
- Criação manual de novos acessos de alunos via Edge Function `admin-manage-student`.

### 2.8 Configurações do Avatar 3D ([AvatarSettingsView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/AvatarSettingsView.jsx))
- Configuração do professor padrão da plataforma.
- Ajuste do tempo de prática diária recomendada (15 min, 20 min, etc.).
- Moderação do repertório de frases de prática ativa.

### 2.9 Configurações do Sistema ([SettingsManager.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/admin/SettingsManager.jsx))
- Parâmetros gerais da plataforma, regras de gamificação, links de suporte e integração com Kiwify.
