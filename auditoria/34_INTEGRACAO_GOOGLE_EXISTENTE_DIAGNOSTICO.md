# RELATÓRIO DE AUDITORIA & DIAGNÓSTICO — ETAPA 34
## REUTILIZAÇÃO DA INTEGRAÇÃO GOOGLE DRIVE EXISTENTE E ANÁLISE DE MENOR RISCO

**Data:** 11/10/2026  
**Status:** Diagnóstico Concluído — **Nenhum arquivo ou dado de produção foi alterado**  
**Contexto:** Investigação da integração Google Apps Script e da pasta informada pelo proprietário (`1Pi4uE1SW0xv32rQbh_gXtl6Qn3fVobDQ`).

---

## 1. IDENTIFICAÇÃO DA PASTA FORNECIDA (`1Pi4uE1SW0xv32rQbh_gXtl6Qn3fVobDQ`)

O proprietário indicou a seguinte URL para análise:
`https://drive.google.com/drive/u/0/folders/1Pi4uE1SW0xv32rQbh_gXtl6Qn3fVobDQ`

### Descoberta Crítica
Realizamos uma sondagem HTTP direta e anônima no identificador dessa pasta:
- **Status:** HTTP 200 (Acessível publicamente)
- **Título Real da Pasta no Google Drive:**  
  `<title>Aluno - aluno-sem-id - Google Drive</title>`

> **Conclusão:**  
> A pasta `1Pi4uE1SW0xv32rQbh_gXtl6Qn3fVobDQ` **NÃO é a pasta raiz oficial do Magic English**.  
> Ela é exatamente a **subpasta órfã gerada durante o teste anterior**, quando o serviço de avatares de alunos foi acionado sem `userId`. É nela que foram encontrados os arquivos `verse_01.wav` duplicados gerados erroneamente na Etapa 31.
>
> A **Pasta Raiz Oficial e Legítima** de mídia do projeto continua sendo:  
> **ID:** `1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh`  
> **Nome:** *Magic English - Áudios do Avatar*

---

## 2. AUDITORIA DO ENDPOINT GOOGLE APPS SCRIPT ATUAL

O endpoint ativo configurado em `src/services/avatarUploadService.js` é:  
`https://script.google.com/macros/s/AKfycbzG38rRYJo8mmAplWgqhp-DaPTAolp0SjRgGkmH7UAIlzD-CiMJpglBE8tQjan9qWIeBQ/exec`

### Teste de Sonda 1: `doGet(e)`
```json
{
  "status": "online",
  "service": "Magic English Avatar Upload Service",
  "version": "4.1",
  "timestamp": "2026-10-12T00:19:15.820Z"
}
```

### Teste de Sonda 2: `doPost(e)`
- Ao enviar requisição sem imagem em Base64:
```json
{
  "success": false,
  "error": "Conteúdo da imagem em Base64 ausente."
}
```

### Diagnóstico do Código Atual em Produção:
1. O Apps Script publicado está rodando a versão **v4.1 dedicada estritamente a Avatares**.
2. Ele não possui tratamento para `songId`, `lessonName` ou pastas de músicas.
3. Se qualquer upload for enviado para essa versão sem parâmetros de avatar, ele ou falha com erro de Base64 ou cria pastas `Aluno - ...`.
4. Ele não oferece risco aos alunos no estado atual, mas não é capaz de armazenar músicas organizadas sem uma atualização.

---

## 3. COMPARATIVO DAS ALTERNATIVAS DE ARQUITETURA

| Critério | Alternativa 1: Script Dedicado Novo | Alternativa 2: Atualização Unificada V5.0 (Recomendada) |
| :--- | :--- | :--- |
| **Complexidade** | 2 Web Apps, 2 URLs no `.env`, 2 projetos Google independentes | 1 único Web App, 1 URL unificada, 1 projeto Google |
| **Risco ao Upload de Alunos** | Risco Zero (isolamento total) | Risco Quase Zero (handler de avatar preservado linha por linha) |
| **Manutenção Futura** | Média/Alta (renovação de permissões Google em dois lugares) | Baixa (centralizada e transparente) |
| **Retrocompatibilidade** | Nenhuma alteração no script antigo | 100% retrocompatível com chamadas existentes |
| **Segurança** | Sem segredos no frontend | Sem segredos no frontend |
| **Prevenção de Duplicidades** | Reutilização não-destrutiva sem `setTrashed` | Reutilização não-destrutiva sem `setTrashed` |

### Escolha de Menor Risco:
A **Alternativa 2 (Atualização Unificada V5.0)** é a mais elegante e segura a longo prazo, desde que o código do handler de avatares seja mantido intocado. O arquivo modelo já está pronto e validado em:
[googleAppsScript_IntegratedMediaService_v5.js](file:///c:/Google%20Antigravity/Curso%20de%20ingles/src/utils/googleAppsScript_IntegratedMediaService_v5.js)

---

## 4. STATUS ATUAL DAS MÚSICAS NO SISTEMA (BOA NOTÍCIA)

Verificamos o status real dos 45 versos da música *"Vamos aprender inglês juntos"* (`0aed5144-07d7-4c04-9410-34d035a7577d`):
- **Total de versos no Supabase:** 45
- **Versos com links ativos no Google Drive:** **45 (100%)**
- **Versos que precisam de regeneração:** **ZERO (0)**
- **Consumo de cota Azure TTS:** **R$ 0,00**

> [!IMPORTANT]
> **NÃO É NECESSÁRIO REGENERAR NENHUM ÁUDIO NO MOMENTO.** Todos os 45 áudios continuam ativos e tocando perfeitamente pelo Drive.

---

## 5. ESTRUTURA HIERÁRQUICA PROJETADA (V5.0)

Quando o serviço V5.0 for implantado, a hierarquia no Google Drive será rigorosamente organizada:

```
[Raiz Oficial: 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh]
  │
  ├── Magic English - Avatares/          <-- Fluxo dos Alunos (PRESERVADO)
  │     ├── Aluno - {uuid-aluno-1}/
  │     │     └── avatar.jpg
  │     └── Aluno - {uuid-aluno-2}/
  │           └── avatar.jpg
  │
  └── Musicas/                           <-- Fluxo das Músicas (NOVO)
        └── Unit 1 - Greetings/
              └── Vamos aprender ingles juntos - 0aed5144.../
                    ├── verse_01.wav
                    ├── verse_02.wav
                    └── ...
```

---

## 6. PRÓXIMOS PASSOS & DECISÃO NECESSÁRIA

Nenhuma ação destrutiva ou deploy foi executado. Aguardamos sua orientação:

1. **Opção A (Recomendada):** Atualizar o Google Apps Script atual para a versão V5.0 usando o código de `src/utils/googleAppsScript_IntegratedMediaService_v5.js`.
2. **Opção B:** Criar uma nova implantação do Apps Script separada apenas para músicas com `src/utils/googleAppsScript_SongAudioService.js`.
3. **Opção C:** Manter como está, visto que os 45 áudios atuais já estão 100% íntegros e funcionando.
