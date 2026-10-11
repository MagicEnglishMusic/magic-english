# CONTEXTO ATUAL PARA CONTINUIDADE DO DESENVOLVIMENTO
**Documento 07: Guia de Passagem de Bastão, Orientações para Próximos Assistentes e Regras de Negócio**
**Data da Auditoria:** 11 de Outubro de 2026  
**Classificação:** Somente Leitura (Read-Only Audit)

---

## 1. MENSAGEM AOS PRÓXIMOS ENGENHEIROS E ASSISTENTES DE IA

Bem-vindo ao projeto **MAGIC ENGLISH**. Este documento consolida todo o conhecimento técnico, diretrizes arquiteturais e regras invioláveis de negócio necessárias para você dar continuidade às implementações com máxima segurança e sem regressões.

---

## 2. REGRAS DE OURO E DIRETRIZES INVIOLÁVEIS

1. **NÃO QUEBRE A SINGLE-PAGE APPLICATION (SPA):**
   - O projeto utiliza um roteador SPA nativo em [App.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/App.jsx) baseado na função `navigate(to, options)` e `window.history.pushState`. Não introduza `react-router-dom` sem aprovação explícita.
2. **MODELOS 3D DEVEM PERMANECER LOCAIS:**
   - Todos os modelos de avatares 3D estão armazenados localmente em [public/avatars/](file:///c:/Google%20Antigravity/Curso%20de%20ingles/public/avatars/). Jamais altere as URLs dos avatares para CDNs externos instáveis (como jsDelivr).
3. **PRESERVAÇÃO DO CICLO DE VIDA DO TALKINGHEAD:**
   - Ao manipular [AvatarPracticeView.jsx](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/avatar/AvatarPracticeView.jsx), garanta que qualquer `<canvas>` Three.js anterior seja estritamente removido do DOM e instâncias finalizadas (`headInstance.stopSpeaking()`) antes de recarregar um avatar para evitar sobreposição de múltiplos professores.
4. **GRANULARIDADE DE GAMIFICAÇÃO VIA RPC:**
   - Toda concessão de pontos de experiência (XP) deve passar pela Stored Procedure `grant_xp` do Supabase para garantir integridade contábil em `xp_events` e impedir duplicidades client-side.
5. **CONTROLE DE VISIBILIDADE DE MÓDULOS:**
   - A exibição de módulos respeita a flag `is_visible` e o status `published`. Ao alterar consultas no `modulesService.js`, mantenha a regra de que alunos regulares só visualizam itens visíveis.

---

## 3. CHECKLIST PARA EXECUÇÃO LOCAL E AMBIENTE

- **Node.js:** Versão 18+ ou 20+ recomendada.
- **Instalação:** `npm install`.
- **Execução em Desenvolvimento:** `npm run dev` (Vite roda em `http://localhost:5173`).
- **Build de Produção:** `npm run build`.

---

## 4. DIRETÓRIOS CRÍTICOS E CONTATOS DE CÓDIGO

- **Lógica 3D e Avatar:** `src/components/avatar/AvatarPracticeView.jsx` e `src/services/avatarPracticeService.js`.
- **Controle de Módulos & Alunos (Admin):** `src/components/admin/ModuleManager.jsx` e `StudentManager.jsx`.
- **Comunicação Supabase:** `src/services/supabaseClient.js` e migrações em `supabase/migrations/`.
- **Metodologia Musical & Karaokê:** `src/components/songs/MagicSongsSection.jsx` e `src/components/musical/MusicalPracticeView.jsx`.

---

## 5. ESTADO ATUAL DO REPOSITÓRIO GIT

- Branch ativa: `wip-antes-do-bug`.
- Commit base rastreado: `5e5f064 feat: magic conversation v4.1`.
- Todas as adições posteriores encontram-se documentadas detalhadamente nos documentos `01` a `06` desta pasta `auditoria/`.
