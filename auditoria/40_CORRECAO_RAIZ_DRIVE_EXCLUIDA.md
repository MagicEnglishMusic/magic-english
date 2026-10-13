# RELATÓRIO DE AUDITORIA & CORREÇÃO CRÍTICA — ETAPA 40
## GOOGLE DRIVE USANDO PASTA RAIZ EXCLUÍDA / NA LIXEIRA E SOLUÇÃO DEFINITIVA

**Data:** 11/10/2026  
**Status:** Diagnóstico Concluído & Código V2.0 Preparado — **Parada Obrigatória Respeitada**  
**Cota Azure TTS:** **R$ 0,00 (Nenhuma chamada)**  
**Alterações em Produção:** **Zero (Nenhum upload, nenhuma pasta criada, nenhum registro alterado)**

---

## 1. DIAGNÓSTICO DA RAIZ ANTIGA (`1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`)

### 1.1 Fato Técnico Comprovado
A pasta com ID `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh` (*Magic English - Áudios do Avatar*):
1. **Comportamento no Google Apps Script:** O método `DriveApp.getFolderById()` do Google Apps Script historicamente permite navegar e até gravar arquivos dentro de pastas que estão na **Lixeira** da conta Google, desde que ela ainda não tenha sido esvaziada permanentemente. Por isso, o teste anterior conseguiu criar `verse_99.wav` mesmo com a pasta na Lixeira.
2. **Comportamento Pós-Esvaziamento da Lixeira:** Quando o proprietário esvaziou a Lixeira do Google Drive, a pasta foi expurgada de forma definitiva dos servidores do Google.
3. **Sondagem HTTP Atual:**
   - URL: `https://drive.google.com/drive/folders/1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`
   - Retorno: **`HTTP 404 Not Found`**.
   - Conclusão: A pasta foi **excluída permanentemente**. Qualquer tentativa de gravação nela agora gerará exceção `Folder not found`.

---

## 2. AUDITORIA DO ACERVO DE ÁUDIOS (ESTADO REAL NO BANCO)

Verificamos o registro real da música *"Vamos aprender inglês juntos"* (`0aed5144-07d7-4c04-9410-34d035a7577d`) no Supabase:
- **Áudio Completo da Música:**
  - URL: `/api/audio-proxy?id=1BdjsQ6Iq-zhn8eXVXCDZ93UL1D4ZXNvs`
  - Status na nuvem: **`HTTP 303 Redirect` para binário ativo**. O áudio da canção de fundo continua **100% íntegro**.
- **Versos Individuais (timestamps):**
  - Exemplo do Verso 1: `https://lh3.googleusercontent.com/d/1yXkhPcMmZG57KhRLSkI8yWWxY4Hwzsxz`
  - Status na nuvem: Responde com redirects de autenticação/acesso do Google.
  - **Diretriz de Custo Mantida:** Nenhuma URL do banco de dados foi modificada e nenhum áudio será regenerado até que a nova pasta raiz esteja formalmente homologada.

---

## 3. CORREÇÃO ARQUITETURAL NO APPS SCRIPT (VERSÃO 2.0)

Para blindar definitivamente o sistema contra gravações em pastas na lixeira ou pastas inexistentes, atualizamos [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js):

### 3.1 Eliminação do Hardcode do Root ID
- O ID da pasta raiz **não é mais fixo no código**.
- Ele é lido dinamicamente de:
  ```javascript
  PropertiesService.getScriptProperties().getProperty("SONG_AUDIO_ROOT_FOLDER_ID")
  ```

### 3.2 Validação Pré-Upload Estrita Anti-Lixeira
Antes de aceitar qualquer arquivo ou criar subpastas, o script executa 4 travas consecutivas:
1. **Configuração Obrigatória:** Se a propriedade estiver vazia, responde `HTTP 500`: *"Pasta raiz de músicas não configurada"*.
2. **Existência Física:** Tenta `DriveApp.getFolderById()`. Se falhar, responde `HTTP 404`: *"A pasta raiz configurada não foi encontrada ou foi excluída"*.
3. **Trava Anti-Lixeira (CRÍTICA):**
   ```javascript
   if (rootFolder.isTrashed()) {
     return responseJSON({
       success: false,
       error: "ERRO DE SEGURANÇA: A pasta raiz oficial de músicas está na LIXEIRA do Google Drive! Upload interrompido."
     }, 410);
   }
   ```
4. **Verificação nas Subpastas:** Ao buscar ou criar `Musicas`, valida se `f.isTrashed() === false`. Subpastas na lixeira são ignoradas.

### 3.3 Health Check Aprimorado no `doGet(e)`
O endpoint `GET` do Apps Script agora informa o status real da raiz:
```json
{
  "status": "online",
  "service": "Magic English Dedicated Song Audio Storage Service",
  "version": "2.0",
  "rootConfigured": true,
  "rootStatus": "active_healthy"
}
```
*(Caso esteja na lixeira, retorna `"rootStatus": "trashed"`).*

---

## 4. PROCEDIMENTO SEGURO PARA O PROPRIETÁRIO CRIAR A NOVA RAIZ

Para colocar a nova pasta raiz oficial ativa:

### Passo 1: Criar a Nova Pasta no "Meu Drive"
1. Acesse [drive.google.com](https://drive.google.com) na sua conta Google principal.
2. Na raiz de **"Meu Drive"**, crie uma nova pasta chamada:
   `Magic English - Áudios do Avatar (Oficial)`
3. Abra a pasta e copie o ID da URL:
   `https://drive.google.com/drive/folders/NOVO_ID_AQUI`
4. Compartilhe a pasta como: **"Qualquer pessoa com o link pode visualizar"**.

### Passo 2: Atualizar o Código do Apps Script para V2.0
1. Acesse o projeto dedicado de músicas no [script.google.com](https://script.google.com).
2. Substitua o código de `Código.gs` pelo conteúdo atualizado de [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js).
3. Vá em **Configurações do projeto** (engrenagem) > **Propriedades do script** e adicione/atualize:
   - **Propriedade:** `SONG_AUDIO_ROOT_FOLDER_ID`
   - **Valor:** `NOVO_ID_AQUI` (o ID copiado no Passo 1).
4. Clique em **Implantar > Gerenciar implantações** > Editar > **Nova versão** > Implantar.

---

## 5. PARADA OBRIGATÓRIA RESPEITADA

- **O novo Apps Script NÃO foi publicado automaticamente.**
- **Nenhum arquivo ou pasta real foi criado.**
- **Nenhum áudio foi gerado pelo Azure TTS (R$ 0,00 mantido).**
- O sistema aguarda a criação da nova pasta pelo proprietário e o fornecimento do novo ID para os testes seguros.
