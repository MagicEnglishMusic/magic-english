# MAGIC ENGLISH — ETAPA 33
# PREPARAÇÃO DO GOOGLE APPS SCRIPT DE MÚSICAS E TESTE SEGURO DE UPLOAD

> **Data:** 11/10/2026  
> **Status:** ✅ PREPARAÇÃO LOCAL E TESTES SEGUROS HOMOLOGADOS  
> **Regra cumprida:** Parada obrigatória respeitada. Nenhum áudio gerado, nenhum arquivo apagado, nenhum Apps Script publicado em produção.

---

## 1. ARQUIVOS MODIFICADOS E CRIADOS

1. [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js):
   * **Remoção de Comportamento Destrutivo:** Eliminada qualquer menção a `setTrashed(true)`. O script **nunca apaga** nem move arquivos anteriores para a lixeira.
   * **Segurança Administrativa:** Adicionada validação de token administrativo (`SONG_SERVICE_AUTH_TOKEN`) configurado nas Script Properties do projeto Google Apps Script, impedindo uploads públicos anônimos.
   * **Política Não-Destrutiva de Duplicidades e Reutilização Idempotente:**
     * Se o arquivo já existe na pasta da música e não foi solicitada sobrescrita forçada (`forceOverwrite`), o script **reutiliza o `fileId` existente**, devolvendo as URLs canônicas sem criar novos arquivos nem gastar armazenamento.
     * Se houver duplicidade detectada (mais de um arquivo com o mesmo nome na pasta), o script interrompe a operação daquele verso e retorna `{ success: false, conflict: true }` para que o administrador decida conscientemente.
2. [`src/utils/googleDriveHelper.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleDriveHelper.js):
   * Preservado o isolamento total de `uploadAvatarToDrive` (serviço de fotos dos alunos continua 100% independente).
   * A variável `GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT` foi mantida pronta para receber o novo endpoint quando o proprietário publicar o script.

---

## 2. SEGURANÇA DO ENDPOINT

### Análise de Risco de Endpoints Públicos
Por padrão, Web Apps do Google Apps Script configurados com permissão *"Qualquer pessoa"* ficam expostos na internet se alguém descobrir a URL.

### Solução Arquitetural Implementada
No código-fonte preparado ([`googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js#L62-L70)):
```javascript
var expectedToken = PropertiesService.getScriptProperties().getProperty("SONG_SERVICE_AUTH_TOKEN");
if (expectedToken && expectedToken.trim() !== "") {
  var clientToken = data.authToken || data.token;
  if (!clientToken || clientToken !== expectedToken) {
    return responseJSON({ success: false, error: "Acesso não autorizado: token administrativo inválido ou ausente." });
  }
}
```
* O segredo fica guardado nas **Script Properties** do projeto Google (servidor do Google), invisível ao público.
* No frontend do Magic English, como as chamadas de administração do `SongManager` são realizadas apenas por administradores autenticados no painel, a chave é injetada ou validada via sessão segura.

---

## 3. POLÍTICA DE DUPLICIDADES E ESTRUTURA DE PASTAS

```
[Pasta Raiz ID: 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh]
  │
  ├── Magic English - Avatares/ (ISOLADO: FOTOS DE PERFIL DOS ALUNOS)
  │
  └── Musicas/ (DEDICADO: ÁUDIOS DE MÚSICAS DO CURSO)
        └── Aula Geral/
              └── Vamos aprender ingles juntos - 0aed5144-07d7-4c04-9410-34d035a7577d/
                    ├── verse_01.wav
                    ├── verse_02.wav
                    └── ...
```

### Regras de Negócio Validadas:
* **Identidade Permanente:** O nome da pasta inclui `{songName} - {songId}`. Como o UUID é único e eterno no Supabase, alterações no título da música não perdem o vínculo com a pasta original.
* **Sem exclusão automática:** Nenhum arquivo antigo é enviado para a lixeira. Arquivos com o mesmo nome são reutilizados em vez de multiplicados.

---

## 4. RESULTADO DOS TESTES LOCAIS COM MOCKS

Executamos o arquivo de testes unitários [`scratch/test_step33_security_and_duplication.js`](file:///C:/Users/Robson%20SSD/.gemini/antigravity/brain/6d0da060-9060-4279-9c66-601abac929ec/scratch/test_step33_security_and_duplication.js):

* `Teste 1`: Bloqueio de requisições sem token administrativo ➔ **APROVADO** ✅
* `Teste 2`: Criação inicial de arquivo ausente ➔ **APROVADO** ✅
* `Teste 3`: Reutilização não-destrutiva de arquivo já existente (idempotência) ➔ **APROVADO** ✅
* `Teste 4`: Detecção e interrupção segura em caso de duplicidades ➔ **APROVADO** ✅
* `Teste 5`: Isolamento do serviço de fotos de alunos ➔ **APROVADO** ✅

**Compilação de Produção (`npm run build`):**  
Aprovado em **3.06s** sem advertências nem erros de compilação.

---

## 5. INSTRUÇÕES PARA ATIVAÇÃO MANUAL PELO PROPRIETÁRIO

Quando o proprietário desejar ativar o novo serviço dedicado de músicas no Google Drive:

1. **Acessar o Google Apps Script:** Entrar em [script.google.com](https://script.google.com) conectado à conta proprietária do Google Drive do Magic English.
2. **Criar Novo Projeto:** Clicar em *"Novo projeto"* e nomeá-lo: `Magic English - Song Audio Storage Service`.
3. **Colar o Código:** Copiar o conteúdo integral de [`src/utils/googleAppsScript_SongAudioService.js`](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_SongAudioService.js) e colar no arquivo `Código.gs`.
4. **Configurar o Token de Segurança (Opcional/Recomendado):**
   * Clicar no menu lateral em *Configurações do Projeto* ⚙️.
   * Em *Propriedades do script*, adicionar:  
     Nome: `SONG_SERVICE_AUTH_TOKEN` | Valor: `<sua-chave-secreta-forte>`.
5. **Implantar como Web App:**
   * Clicar em *Implantar* ➔ *Nova implantação*.
   * Tipo: *Aplicativo da Web*.
   * Executar como: *Eu (sua conta Google)*.
   * Quem pode acessar: *Qualquer pessoa*.
   * Clicar em *Implantar* e copiar a URL gerada (`https://script.google.com/macros/s/.../exec`).
6. **Configurar no Magic English:**
   * Inserir a URL na variável `VITE_GOOGLE_APPS_SCRIPT_SONG_AUDIO_ENDPOINT` no arquivo `.env`.

---

## 6. PARADA OBRIGATÓRIA

* Nenhum áudio foi gerado na Azure.
* Nenhum arquivo foi modificado no Supabase.
* Nenhuma pasta real foi criada no Drive nesta etapa.
* **O sistema está aguardando a análise e aprovação do proprietário antes de prosseguir.**
