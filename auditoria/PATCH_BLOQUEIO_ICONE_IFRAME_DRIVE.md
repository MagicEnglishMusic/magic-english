# PATCH CIRÚRGICO — BLOQUEIO DO ÍCONE EXTERNO DO IFRAME DO GOOGLE DRIVE
## Bloqueio Visual e Funcional do Pop-Out sem Interferir nos Controles do Player

**Data de Aplicação:** 13/10/2026  
**Projeto:** Magic English (`C:\Google Antigravity\Curso de ingles`)  
**Supabase PROD:** `wrrtiewjritbhcfqzjhy`  
**Escopo do Patch:** Estritamente [`src/components/classroom/VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx).  
**Preservação Total:** Zero alterações em banco, lessons, progresso, XP, autenticação, músicas, avatar, Azure, Google Drive helper, lógica de conclusão aos 85%, botão manual de conclusão e fallback proxy.

---

## 1. IMPLEMENTADO

### 1.1. Diagnóstico do Problema Cross-Origin
O player oficial do Google Drive em modo direto (`https://drive.google.com/file/d/.../preview`) inclui nativamente em seu cabeçalho interno um ícone no canto superior direito ("Pop-out / Abrir em nova janela").
Como o iframe é servido em domínio cruzado (`drive.google.com`), navegadores modernos bloqueiam qualquer manipulação direta via JavaScript no DOM interno do iframe (política de Same-Origin).

### 1.2. Solução por Overlay / Máscara no Container Externo
Em [`src/components/classroom/VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx#L325-L345), foi implementada uma camada de bloqueio cirúrgica posicionada sobre o canto superior direito do container relativo 16:9:

- **Posicionamento Absoluto:** `absolute top-0 right-0 z-20` (camada superior ao iframe, que opera em `z-10`).
- **Dimensão Precisa:** `w-16 sm:w-20 h-14 sm:h-16` (64px em mobile e 80px em desktop na largura; 56px em mobile e 64px em desktop na altura), cobrindo integralmente a área do botão pop-out do Google Drive sem invadir o centro do vídeo nem a barra de controles inferior.
- **Interceptação Funcional de Eventos:**
  - `onClick`, `onMouseDown` e `onTouchStart` configurados com `e.stopPropagation()` e `e.preventDefault()`.
  - Atributo `pointer-events-auto` e classe `video-control-interactive` impedem qualquer clique de atravessar para o iframe ou disparar o play/pause global do container.
- **Harmonia Visual:**
  - Gradiente escuro fosco (`bg-gradient-to-bl from-black via-black/95 to-transparent rounded-tr-3xl`) que oculta completamente o ícone branco do Drive e se integra à moldura preta 16:9 com borda roxa da plataforma.
- **Zero Impacto nos Controles do Player:**
  - A barra inferior com scrubber, play/pause, volume, velocidade, tempo e tela cheia permanece 100% desobstruída.
  - O centro do vídeo permanece livre para interação.

---

## 2. TESTADO

### 2.1. Testes Automatizados de Contrato e Eventos (`test_iframe_blocker.mjs`)
- ✅ **Abertura da aula em modo Drive:** Iframe renderizado com `isUsingDriveMode && hasStarted` ativo.
- ✅ **Máscara Ativa no Topo Direito:** Localizada em `top-0 right-0 z-20` cobrindo o ícone pop-out.
- ✅ **Cancelamento de Cliques e Toques:** Validada a interceptação em `onClick`, `onMouseDown` e `onTouchStart` com `stopPropagation` e `preventDefault`.
- ✅ **Desobstrução dos Controles:** Controles centrais e inferiores mantidos livres.
- ✅ **Conclusão Automática e Manual:** Callback `onVideoComplete()` aos 85% de duração e botão `✅ Concluir Vídeo da Aula` mantidos 100% íntegros.
- ✅ **Alternância de Modos:** Fallback para o modo Proxy (`handleToggleStreamMode`) preservado e testado.

### 2.2. Build de Produção
- ✅ `npm run build` executado com sucesso:
  - 2059 módulos transformados.
  - Zero erros de sintaxe ou tipagem.
  - Bundle gerado em 2.83s.

---

## 3. EVIDÊNCIAS

1. **Código da Máscara em [`VideoPlayer.jsx`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/components/classroom/VideoPlayer.jsx#L325-L345):**
   ```jsx
   {/* Máscara de Bloqueio do Ícone Externo do Google Drive (Pop-out / Abrir em nova aba) */}
   <div 
     className="video-control-interactive absolute top-0 right-0 z-20 w-16 sm:w-20 h-14 sm:h-16 pointer-events-auto select-none cursor-default"
     onClick={(e) => {
       e.stopPropagation();
       e.preventDefault();
     }}
     onMouseDown={(e) => {
       e.stopPropagation();
       e.preventDefault();
     }}
     onTouchStart={(e) => {
       e.stopPropagation();
       e.preventDefault();
     }}
     title="Magic English Player"
     aria-label="Bloqueio de navegação externa"
   >
     {/* Overlay visual combinando com a moldura 16:9 para cobrir visualmente o ícone externo e impedir o clique */}
     <div className="w-full h-full bg-gradient-to-bl from-black via-black/95 to-transparent rounded-tr-3xl pointer-events-auto" />
   </div>
   ```
2. **Consumo de Egress Supabase no Modo Drive:** **0 bytes**. O vídeo é servido diretamente da CDN do Google para o navegador do aluno, sem qualquer requisição à Edge Function `video-proxy`.
3. **Persistência de Progresso:** Ao término ou ao clicar em `Concluir Vídeo da Aula`, dispara `handleUpdateStep('video')`, salvando `video: true` em `user_progress` e `song_mastery.step_video`.

---

## 4. PENDÊNCIAS

- **NENHUMA PENDÊNCIA TÉCNICA BLOQUEANTE.**
- O player funciona com segurança em desktop e mobile, impedindo a saída da plataforma pelo ícone do Google Drive e preservando o custo zero de Egress no Supabase.
