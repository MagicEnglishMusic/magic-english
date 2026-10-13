# RELATÓRIO TÉCNICO — ETAPA 35
## PREPARAÇÃO DO SERVIÇO INDEPENDENTE DE MÚSICAS NO GOOGLE APPS SCRIPT E SUPABASE

**Data:** 11/10/2026  
**Status:** Preparado e Validado — **Deploy real em espera para autorização**  
**Cota Azure TTS:** **R$ 0,00 (Nenhum áudio gerado, zero consumo)**  
**Arquivos de Produção no Drive:** **100% Intactos**

---

## 1. DECISÃO OFICIAL E ISOLAMENTO DE RESPONSABILIDADES

Conforme decisão oficial do proprietário, foi adotada a **arquitetura de menor risco**:
1. **Google Apps Script de Avatares V4.1 (`1Xamxng5lNEFxguqvRPDzIj7jADEjgSBqgenPUUu2xAd8ikOTkrEb26dV`):**
   - **INTOCADO**. Permanece estritamente dedicado a fotos e avatares dos alunos.
   - O template V5 unificado **não** foi aplicado sobre ele.
2. **Novo Google Apps Script de Músicas V1.0:**
   - Criado como projeto 100% independente, isolado e dedicado.
   - Código fonte oficial preparado em:  
     [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js)
3. **Pasta Raiz Oficial e Legítima do Google Drive:**  
   - ID: `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh` (*Magic English - Áudios do Avatar*)
   - A pasta órfã de testes `1Pi4uE1SW0xv32rQbh_gXtl6Qn3fVobDQ` (*Aluno - aluno-sem-id*) foi desvinculada de qualquer lógica de músicas.

---

## 2. ARQUITETURA DE SEGURANÇA E PROTEÇÃO CONTRA UPLOADS ANÔNIMOS

Para evitar que qualquer pessoa chame o Web App do Google Apps Script diretamente ou envie arquivos indevidos, implementamos uma barreira em 3 níveis com intermediação obrigatória por Edge Function:

```
┌────────────────────────┐
│  Admin Autenticado     │ (Painel SongManager no React)
└───────────┬────────────┘
            │  1. Request com Header "Authorization: Bearer <JWT>"
            ▼
┌────────────────────────┐
│ Supabase Edge Function │ (supabase/functions/song-audio-proxy/index.ts)
│   (song-audio-proxy)   │ - Valida JWT com auth.getUser()
└───────────┬────────────┘ - Valida role = 'admin' em public.profiles
            │              - Bloqueia anônimos e alunos comuns (HTTP 401/403)
            │              - Injeta segredo SONG_SERVICE_AUTH_TOKEN
            ▼
┌────────────────────────┐
│ Google Apps Script     │ (Projeto Independente de Músicas)
│ (Dedicado de Músicas)  │ - Valida token via PropertiesService.getScriptProperties()
└───────────┬────────────┘ - Valida parâmetros (songId, base64 obrigatórios)
            │              - Bloqueia exclusões automáticas (sem setTrashed)
            ▼
┌────────────────────────┐
│   Google Drive         │ Root / Musicas / {Aula} / {Música - UUID} / verse_XX.wav
└────────────────────────┘
```

### Garantias de Segurança:
- **Zero Secrets no Frontend:** Nenhuma chave secreta ou token administrativo transita ou fica exposto no código React.
- **Bloqueio de Anônimos e Alunos:** Se um aluno ou visitante tentar chamar o endpoint, a Edge Function rejeita com HTTP 403.
- **Proteção do Apps Script:** Se alguém tentar chamar o Web App do Google diretamente pelo navegador sem o `authToken` injetado pela Edge Function, o Apps Script rejeita com HTTP 403.

---

## 3. ESPECIFICAÇÃO DOS ARQUIVOS PREPARADOS

### 3.1 Google Apps Script Dedicado
- **Arquivo:** [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js)
- **Estrutura gerada:**
  ```
  Magic English - Áudios do Avatar (1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh)/
    └── Musicas/
          └── {lessonName}/
                └── {songName} - {songId}/
                      ├── verse_01.wav
                      ├── verse_02.wav
                      └── ...
  ```
- **Política Não-Destrutiva de Arquivos:**
  - `setTrashed(true)`: **Eliminado 100%**. O script nunca move nada para a lixeira.
  - Arquivo já existente: se `verse_XX.wav` já existir na pasta, confirma e retorna a URL sem recriar (`reused: true`).
  - Múltiplos arquivos com o mesmo nome: suspende a gravação e retorna `conflict: true` (HTTP 409) para proteger integridade histórica.

### 3.2 Supabase Edge Function `song-audio-proxy`
- **Arquivo:** [`supabase/functions/song-audio-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/song-audio-proxy/index.ts)
- **Responsabilidades:**
  - Health check via GET.
  - Validação estrita do JWT do administrador.
  - Proxy seguro para o Web App do Google Apps Script com injeção do secret.

### 3.3 Integração no Cliente Frontend
- **Arquivo:** [`src/utils/googleDriveHelper.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleDriveHelper.js)
- **Função `uploadAudioToDrive()`:**
  - Roteia preferencialmente via `supabase.functions.invoke('song-audio-proxy')`.
  - Impede qualquer fallback acidental para o endpoint de fotos de alunos (`GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT`).
  - Validação estrita de `songId` antes de qualquer envio.

---

## 4. MATRIZ DE TESTES PREPARADA

| Caso de Teste | Condição | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- |
| **1. Falta de Autenticação** | Chamada sem JWT no header | Rejeição HTTP 401 pela Edge Function | Testável após deploy |
| **2. Usuário Aluno Comum** | JWT de aluno (`role: student`) | Rejeição HTTP 403 pela Edge Function | Testável após deploy |
| **3. Falta de `songId`** | Payload sem `songId` | Erro imediato HTTP 400 antes de tocar no Drive | Validado no código |
| **4. Invocação direta sem Token** | POST no Apps Script sem token | Rejeição HTTP 403 pelo Apps Script | Validado no código |
| **5. Arquivo Já Existente** | `verse_01.wav` já presente na pasta | Reutilização segura (`reused: true`), HTTP 200 | Validado no código |
| **6. Detecção de Duplicidade** | 2 arquivos `verse_01.wav` na pasta | Conflito preventivo (`conflict: true`), HTTP 409 | Validado no código |
| **7. Criação Nova** | Verso inexistente em pasta nova | Cria pasta `Musicas/{Aula}/{Música-UUID}/verse_XX.wav` | Validado no código |
| **8. Preservação de Avatares** | Upload de foto de aluno | Roteado exclusivamente para Apps Script V4.1 antigo | Preservado 100% |

---

## 5. GUIA DE IMPLANTAÇÃO PASSO A PASSO (QUANDO AUTORIZADO)

Para colocar o serviço em produção sem risco:

### Passo 1: Criar o Novo Projeto no Google Apps Script
1. Acesse: [script.google.com](https://script.google.com).
2. Clique em **"Novo projeto"** e dê o nome: `Magic English - Song Audio Service`.
3. Cole o código de [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js).
4. No menu lateral esquerdo, clique em **Configurações do projeto** (ícone de engrenagem) e em **Propriedades do script** adicione:
   - **Propriedade:** `SONG_SERVICE_AUTH_TOKEN`
   - **Valor:** `magic_song_secret_2026_x89q` *(ou outro segredo à sua escolha)*.
5. Clique em **Implantar > Nova implantação**:
   - Tipo: **App da Web**.
   - Executar como: **Eu** (sua conta Google).
   - Quem pode acessar: **Qualquer pessoa** *(a proteção será feita pelo token interno e pela Edge Function)*.
6. Copie a **URL do App da Web** gerada (ex: `https://script.google.com/macros/s/AKfy.../exec`).

### Passo 2: Configurar Secrets e Deploy no Supabase
1. Configurar os segredos no Supabase via CLI:
   ```bash
   npx supabase secrets set SONG_AUDIO_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfy.../exec"
   npx supabase secrets set SONG_SERVICE_AUTH_TOKEN="magic_song_secret_2026_x89q"
   ```
2. Realizar deploy da Edge Function:
   ```bash
   npx supabase functions deploy song-audio-proxy --no-verify-jwt
   ```

### Passo 3: Teste Controlado com 1 Único Arquivo
1. Executar teste com o verso de teste da música sem consumir lote.
2. Confirmar a criação da pasta estruturada `Musicas / Unit 1 / Música - UUID / verse_01.wav`.
3. Confirmar que a pasta de avatares dos alunos não foi alterada.

---

## 6. STATUS E CONFIRMAÇÃO DE PARADA OBRIGATÓRIA

> [!IMPORTANT]
> **PARADA DE SEGURANÇA RESPEITADA:**  
> - **Nenhum arquivo real foi criado ou modificado no Google Drive.**  
> - **O Apps Script V4.1 de avatares não foi alterado.**  
> - **Nenhum áudio foi gerado pelo Azure TTS (consumo R$ 0,00).**  
> - **Build do frontend validado com sucesso (`npm run build` concluído em 2.96s).**  
>
> Aguardando autorização do proprietário para os passos de deploy e teste controlado.
