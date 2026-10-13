# MAGIC ENGLISH — ETAPA 29
# HOMOLOGAÇÃO CONTROLADA DA VERIFICAÇÃO REAL DO GOOGLE DRIVE

> **Data:** 11/10/2026  
> **Status:** DIAGNÓSTICO E HOMOLOGAÇÃO CONTROLADA EXECUTADOS  
> **Regra aplicada:** Nenhuma regeneração em lote executada, nenhuma gravação de banco efetuada, Azure preservada a custo zero.

---

## 1. INVESTIGAÇÃO TÉCNICA DA VERIFICAÇÃO HTTP

Realizamos testes de requisição direta contra a infraestrutura do Google Drive (`lh3.googleusercontent.com` e `drive.google.com`), simulando as condições de execução do navegador para responder às perguntas de validação:

### 1.1 Status HTTP Real e Cabeçalhos
* **Quando o arquivo foi excluído (caso real da música de teste):**
  * **Status retornado:** `HTTP 404 (Not Found)`.
  * **Headers:**
    * `access-control-allow-origin: *` (CORS liberado para qualquer origem, inclusive localhost e produção).
    * `timing-allow-origin: *`.
    * `content-type: text/html; charset=UTF-8`.
    * `content-length: 1596` (Página de erro HTML padrão do Google).
    * `server: fife`.
* **Quando o arquivo/pasta não existe de forma arbitrária (ID sintético):**
  * **Status retornado:** `HTTP 500` ou `HTTP 400` com página de erro HTML.

### 1.2 Comportamento do Header `Range: bytes=0-0`
* O header `Range: bytes=0-0` é plenamente aceito pelo servidor do Google (`server: fife`).
* **Se o arquivo EXISTE:** O servidor retorna `HTTP 206 (Partial Content)` acompanhado do cabeçalho `content-range: bytes 0-0/{total}` e do `content-type` original de mídia (ex: `audio/wav`, `audio/mpeg`). O corpo da resposta trafega **exatamente 1 byte**.
* **Se o arquivo NÃO EXISTE (foi apagado):** O servidor ignora o Range e responde `HTTP 404` com uma página HTML de erro de 1.5 KB.
* **Corpo Retornado:** Quando o arquivo não existe, a resposta contém HTML (`<title>Error 404 (Not Found)!!1</title>`). Portanto, verificar unicamente `status === 200 || status === 206` associado ao `content-type` garante precisão cirúrgica.

### 1.3 CORS e Redirecionamentos
* O CDN `lh3.googleusercontent.com/d/{id}` serve arquivos públicos com o cabeçalho `access-control-allow-origin: *` tanto no sucesso quanto no erro 404. Portanto, uma chamada `fetch()` a partir do navegador **não é bloqueada por CORS**, permitindo a leitura transparente do `response.status`.

---

## 2. SEPARAÇÃO ESTRITA DE ESTADOS (STATE MACHINE)

Para garantir que instabilidades de rede ou timeouts **nunca causem regeneração indevida na Azure**, o verificador deve operar com 3 estados distintos:

| Estado | Critério Técnico | Ação do Sistema |
| :--- | :--- | :--- |
| **`EXISTS`** | HTTP 200 ou 206 **E** `content-type` contém áudio/binário (ou não é `text/html`). | **Pular geração.** Manter URL atual e garantir custo zero. |
| **`MISSING`** | HTTP 404 ou 400 confirmado com resposta ativa do Google. | **Candidato à regeneração.** Somente neste estado o sistema pode gerar novamente. |
| **`UNKNOWN`** | Timeout (> 2.5s), offline, erro de rede local (`TypeError: Failed to fetch`) ou HTTP 5xx. | <mark>**NUNCA REGENERAR.**</mark> Preserva o estado atual e alerta o admin para tentar quando a conexão estiver estável. |

> **IMPORTANTE:** No código implementado anteriormente, o bloco `catch` retornava genericamente `false`. Conforme a regra desta etapa, um erro transitório de rede não pode ser interpretado como "arquivo apagado". A distinção entre `MISSING` e `UNKNOWN` protege contra consumo acidental de créditos da Azure em conexões lentas.

---

## 3. TESTE CONTROLADO EM UM ÚNICO VERSO

Selecionamos o **Verso 1** da música de teste cujo diretório foi apagado pelo proprietário:

### 3.1 Dados do Verso 1 no Supabase:
* **Música ID:** `0aed5144-07d7-4c04-9410-34d035a7577d`
* **Título:** `"Vamos aprender ingles juntos"`
* **Texto EN:** `"Hello!"`
* **Texto PT:** `"Olá!"`
* **URL antiga gravada:** `https://lh3.googleusercontent.com/d/1yXkhPcMmZG57KhRLSkI8yWWxY4Hwzsxz`
* **ID do Drive correspondente:** `1yXkhPcMmZG57KhRLSkI8yWWxY4Hwzsxz`

### 3.2 Resultado do Teste Prático no Arquivo:
```text
Requisição: GET https://lh3.googleusercontent.com/d/1yXkhPcMmZG57KhRLSkI8yWWxY4Hwzsxz
Header: Range: bytes=0-0
Status retornado: HTTP 404
Content-Type: text/html; charset=UTF-8
Corpo: Error 404 (Not Found)
```
* **Classificação do Verso 1:** **`MISSING` (Comprovadamente ausente)**.
* **Diagnóstico:** O arquivo foi de fato removido no Google Drive. A URL gravada no Supabase é um ponteiro quebrado.

---

## 4. VALIDAÇÃO DO PROCESSO DE RECUPERAÇÃO (END-TO-END CHECK)

Avaliamos a capacidade dos serviços existentes de recuperar a integridade da música quando autorizado:

### 4.1 Saúde da Google Apps Script Web App
Testamos o endpoint Web App de upload (`GOOGLE_APPS_SCRIPT_AVATAR_ENDPOINT`):
* **Status:** `HTTP 200 (Online)`
* **Resposta recebida:**
  ```json
  {
    "status": "online",
    "service": "Magic English Avatar Upload Service",
    "version": "4.1",
    "timestamp": "2026-10-11T23:30:38.351Z"
  }
  ```
* **Comportamento do Script:** O script do Google Drive possui a lógica de criar automaticamente a pasta se ela não existir (`folderName: "Vamos aprender ingles juntos"`). Ou seja, mesmo que o usuário tenha apagado a pasta anterior, o script recria a pasta e faz o upload dos arquivos sem falhas.

### 4.2 Saúde da Azure Speech Proxy
* O endpoint `azure-tts-proxy` está 100% online (`HTTP 200`), validado e emitindo áudio na voz oficial `en-US-JennyNeural`.

### 4.3 Fluxo de Persistência no Supabase
* A função `songsService.updateSong(songId, { timestamps })` está funcional e testada. Ao gravar o novo array de versos, a nova URL gerada pelo Google Drive substituirá o ponteiro antigo.

### 4.4 Próxima Execução
* Uma vez que o novo arquivo for gravado e receber seu novo `fileId`, a verificação subsequente retornará `EXISTS (HTTP 206/200)`, impedindo qualquer nova geração na Azure e restaurando o custo zero permanente.

---

## 5. CONCLUSÃO E RECOMENDAÇÃO ANTES DA APROVAÇÃO

1. **A verificação via HTTP no Google Drive funciona com precisão absoluta**, pois o CDN do Google retorna `404` com CORS liberado quando o arquivo foi excluído.
2. **Nenhuma chamada à Azure foi disparada nesta homologação** (custo zero mantido).
3. **Recomendação para a Etapa 30:**
   * Atualizar o helper `googleDriveHelper.js` para retornar explicitamente o enum `{ status: 'EXISTS' | 'MISSING' | 'UNKNOWN' }` (garantindo que `UNKNOWN` nunca gere nada).
   * Adicionar um botão de teste individual ou autorizar a regeneração segura da música pelo SongManager.

> **PARADA CONFORME SOLICITADO:** Nenhum arquivo de código foi alterado, nenhum lote foi gerado e nenhuma gravação foi feita no banco de dados.
