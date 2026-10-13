# MAGIC ENGLISH — GUIA OPERACIONAL DEFINITIVO
## SINCRONIZAÇÃO E RECUPERAÇÃO DOS ÁUDIOS NO GOOGLE DRIVE VIA PAINEL ADMIN

**Música:** *"Vamos aprender inglês juntos"* (`0aed5144-07d7-4c04-9410-34d035a7577d`)  
**Pasta Oficial do Google Drive:** `165Y0jB82ROZY74b1EgfG-xgMXzJ9RR7J`  
**Apps Script:** V2.1 Hardened (`AKfycbyHUzd8cGDbsp-2TYF0zNqTkKqWsGU_BO0gWYyjcA3yV5XhPf4X0oDfBqsRaBzMwk4K`)  
**Build do Frontend:** ✓ Concluído com sucesso (3.09s, zero erros).

---

### 1. O QUE FOI IMPLEMENTADO NO CÓDIGO
1. **Reutilização Obrigatória do Verso 01:**
   - O Verso 01 (`verse_01.wav`, "Hello!", 87.404 bytes) é reconhecido e reutilizado imediatamente, com **custo zero de tokens na Azure**.
2. **Consulta Prévia Anti-Duplicação:**
   - Antes de qualquer geração via Azure Speech, o sistema consulta a pasta oficial para confirmar se o arquivo do verso já existe.
3. **Resiliência e Journal Local:**
   - Cada verso gerado e salvo é registrado em `localStorage` (`magic_song_recovery_journal_0aed5144...`).
   - Se a aba for recarregada ou a conexão oscilar, o processo recomeça de onde parou sem refazer versos concluídos.
4. **Controle de Pausa / Cancelamento na UI:**
   - O banner de progresso possui um botão **"Pausar"**, permitindo interromper com segurança após o verso corrente sem perda de dados.
5. **Persistência Incremental e Final:**
   - Salva checkpoints no Supabase a cada 5 versos e ao término, atualizando `timestamps` de forma atômica e segura.
6. **Métricas em Tempo Real:**
   - O banner exibe contadores ao vivo: **Reutilizados (Custo 0)**, **Gerados na nuvem** e **Falhas**.

---

### 2. PASSO A PASSO PARA ACIONAR (UM ÚNICO CLIQUE)

1. Abra a aplicação Magic English no navegador (onde você estiver logado como **Administrador**).
2. Acesse o **Painel Administrativo** no menu lateral e clique em **Magic Songs** (`SongManager`).
3. Na lista à esquerda, selecione a música **"Vamos aprender inglês juntos"**.
4. No card central superior ("Distribuição Conectada"), clique no botão verde/ciano:  
   👉 **`🎙️ Gerar Áudios da Avatar (Google Drive)`**
5. Na caixa de confirmação do navegador, clique em **OK**.
6. Acompanhe a barra de progresso em tempo real na tela até a mensagem de sucesso final:  
   `🎉 Concluído com sucesso!`
