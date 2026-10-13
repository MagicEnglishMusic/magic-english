# RELATÓRIO DE HOMOLOGAÇÃO & ATIVAÇÃO — ETAPA 36
## ATIVAÇÃO CONTROLADA DO SERVIÇO DE UPLOAD DE MÚSICAS NO GOOGLE DRIVE

**Data:** 11/10/2026  
**Status Operacional:** **Fase de Preparação Concluída com Sucesso / Parada de Segurança Acionada**  
**Projeto Supabase:** `wrrtiewjritbhcfqzjhy`  
**Pasta Raiz Oficial Google Drive:** `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`  
**Apps Script de Alunos V4.1 (`1Xamxng5...`):** **100% Intacto e Preservado**  
**Consumo Azure TTS:** **R$ 0,00 (Zero chamadas)**

---

## 1. RESUMO EXECUTIVO DA VERIFICAÇÃO PRÉ-DEPLOY

Todas as regras e restrições foram validadas:
1. **Preservação de Alunos:** O fluxo de fotos e avatares continua apontando exclusivamente para o script v4.1 existente.
2. **Preservação das Músicas:** Os 45 áudios da música *"Vamos aprender inglês juntos"* permanecem intocados, funcionais e sem necessidade de regravação.
3. **Isolamento de Segredos:** Nenhum token ou secret transita no frontend React. O bundle de produção (`npm run build`) foi auditado e está limpo de qualquer credencial.
4. **Proteção da Edge Function:** A função [`supabase/functions/song-audio-proxy/index.ts`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/supabase/functions/song-audio-proxy/index.ts) exige cabeçalho `Authorization: Bearer <JWT>` e valida se o usuário possui `role = 'admin'`.

---

## 2. STATUS DOS COMPONENTES E PONTO DE PARADA

| Componente | Localização | Status Atual | Detalhes |
| :--- | :--- | :--- | :--- |
| **Apps Script de Músicas (V1.0)** | `src/utils/googleAppsScript_SongAudioService.js` | **Código Pronto** | Aguarda publicação manual no [script.google.com](https://script.google.com) pelo proprietário da conta Google. |
| **Edge Function (`song-audio-proxy`)** | `supabase/functions/song-audio-proxy/index.ts` | **Código Pronto** | Status na nuvem: `HTTP 404` (Ainda não implantada devido a permissão de CLI). |
| **Frontend Integration** | `src/utils/googleDriveHelper.js` | **Atualizado & Compilado** | Roteia exclusivamente via `song-audio-proxy`, sem fallback para fotos de alunos. |
| **Arquivo WAV de Teste** | `public/sounds/test-silence-sample.wav` | **Preparado Localmente** | Arquivo estático sintético de 1.6 KB para teste sem consumo da Azure. |

---

## 3. DIAGNÓSTICO DO SUPABASE CLI E POR QUE A PARADA É NECESSÁRIA

Ao tentar publicar a Edge Function automaticamente via comando CLI:
```bash
npx supabase functions deploy song-audio-proxy --project-ref wrrtiewjritbhcfqzjhy
```
A API do Supabase retornou:
```json
{
  "code": "FunctionsApiStatusError",
  "message": "unexpected list functions status 403: {\"message\":\"Your account does not have the necessary privileges to access this endpoint.\"}"
}
```

> **Motivo Técnico:**  
> O token de acesso pessoal do Supabase atualmente configurado na máquina local não pertence à organização proprietária do projeto `wrrtiewjritbhcfqzjhy` (ou não possui perfil de *Owner/Admin* nessa organização específica).  
> **Ação Necessária:** O proprietário precisa publicar a Edge Function e configurar os Secrets através da sua conta autorizada.

---

## 4. GUIA EXATO PARA O PROPRIETÁRIO CONCLUIR A ATIVAÇÃO

### Passo 1: Publicar o Novo Google Apps Script Dedicado
1. Acesse: [script.google.com](https://script.google.com) com a conta dona do Google Drive.
2. Crie um **Novo projeto** com o nome: `Magic English - Song Audio Storage Service`.
3. Cole o código exato do arquivo:
   [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js).
4. No menu esquerdo, vá em **Configurações do projeto** (engrenagem) > **Propriedades do script** e adicione:
   - **Nome da Propriedade:** `SONG_SERVICE_AUTH_TOKEN`
   - **Valor:** *(Crie uma senha forte, ex: `magic_song_secret_2026_x89q`)*.
5. Clique em **Implantar > Nova implantação**:
   - Tipo: **App da Web**.
   - Executar como: **Eu** (sua conta Google).
   - Quem pode acessar: **Qualquer pessoa**.
6. Copie a **URL do App da Web** gerada (ex: `https://script.google.com/macros/s/AKfy.../exec`).

---

### Passo 2: Configurar os Secrets no Supabase
Acesse o painel do Supabase em:  
[supabase.com/dashboard/project/wrrtiewjritbhcfqzjhy/settings/vault](https://supabase.com/dashboard/project/wrrtiewjritbhcfqzjhy/settings/vault)  
*(Ou via Secrets na aba Edge Functions)*:

Adicione os 2 secrets:
- `SONG_AUDIO_APPS_SCRIPT_URL` = *(A URL do Web App gerada no Passo 1)*
- `SONG_SERVICE_AUTH_TOKEN` = *(O mesmo token definido nas Propriedades do Script)*

---

### Passo 3: Publicar a Edge Function `song-audio-proxy`

No seu terminal com a conta proprietária logada:
```bash
# Se necessário fazer login na conta correta:
npx supabase login

# Publicar a função com verificação de JWT do servidor:
npx supabase functions deploy song-audio-proxy --project-ref wrrtiewjritbhcfqzjhy
```
*(Alternativamente, você pode colar o código de `supabase/functions/song-audio-proxy/index.ts` diretamente pelo dashboard web caso sua interface permita criação direta de Edge Functions).*

---

## 5. PLANO DO TESTE CONTROLADO COM 1 ÚNICO ARQUIVO

Assim que a publicação for concluída, realizaremos o teste controlado seguro:
- **Origem do áudio:** Arquivo local sintético [`public/sounds/test-silence-sample.wav`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/public/sounds/test-silence-sample.wav) (1.6 KB, 0.1s).
- **Música alvo do teste:** Uma pasta temporária de teste isolada:
  - `songId`: `test-isolated-validation-uuid`
  - `songName`: `Teste Isolado Homologacao`
  - `lessonName`: `Homologacao Segura`
  - `verseIndex`: `99`
- **Destino no Google Drive:**
  `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh / Musicas / Homologacao Segura / Teste Isolado Homologacao - test-isolated-validation-uuid / verse_99.wav`
- **Verificações:**
  1. A pasta de alunos `Aluno - ...` NÃO é criada.
  2. A pasta correta é gerada sob `Musicas`.
  3. O arquivo `verse_99.wav` fica acessível publicamente via stream.
  4. Nenhuma música de produção tem seus versos alterados.

---

## 6. PARADA OBRIGATÓRIA RESPEITADA

- Nenhuma modificação no banco de dados.
- Nenhuma modificação no Drive de produção.
- Zero consumo de cotas de áudio.
- Aguardando a publicação do Apps Script e da Edge Function pelo proprietário.
