# MAGIC ENGLISH — BASELINE OFICIAL
# V4.2 AUDIO SECURITY STABLE

**Identificador da Versão:** `magic-english-v4.2-audio-security-stable`  
**Data de Criação:** 11 de Outubro de 2026  
**Commit Hash:** `9e942f5539592f135257fdc80ca2cbbf2784341a`  
**Git Tag:** `magic-english-v4.2-audio-security-stable`  
**Status do Sistema:** ✅ **HOMOLOGADO / ESTÁVEL / BLINDADO**  

---

## 1. ESTADO GERAL

Esta baseline congela o estado estável da arquitetura de áudio e síntese de voz neural do Magic English após a reestruturação e proteção de credenciais.

### Conquistas Consolidadas:
- ✅ **Proteção Total do Azure Speech Services:** Todas as chaves e chamadas diretas foram eliminadas do cliente.
- ✅ **Criação do Azure TTS Proxy:** Implementada e publicada a Supabase Edge Function `azure-tts-proxy`.
- ✅ **Autenticação JWT Estrita:** Requisições à Edge Function exigem token de autenticação do Supabase Auth (`Authorization: Bearer <token>`).
- ✅ **Remoção Completa do Gemini TTS:** Expurgadas todas as chamadas para `generativelanguage.googleapis.com` e a chave exposta no bundle.
- ✅ **Preservação Absoluta do Google Drive:** O Drive permanece como biblioteca oficial de áudios gravados, assegurando **Custo R$ 0** na reprodução.
- ✅ **Preservação do TalkingHead:** Sincronismo labial (lipsync), cálculo de visemas e reprodução via `AudioContext` operam com alta fidelidade.

---

## 2. ARQUITETURA FINAL DE ÁUDIO

O fluxo oficial segue uma hierarquia rigorosa de 3 camadas:

```text
[1] Google Drive (Prioridade Máxima — Custo Zero)
         │
         ├─► Áudio gravado existe no Drive?
         │         └── SIM ──► Reprodução direta decodificando arrayBuffer no AudioContext.
         │
         └─► NÃO (ou falha no carregamento)
                   │
                   ▼
[2] Azure TTS Proxy (Prioridade 2 — Síntese Neural Oficial)
         │
         ├─► Chamada segura: supabase.functions.invoke('azure-tts-proxy') com JWT
         │         └── SUCESSO 200 ──► Retorna { base64Audio, mimeType: "audio/wav" }
         │
         └─► FALHA (Timeout extremo ou erro de rede)
                   │
                   ▼
[3] Web Speech API (Prioridade 3 — Contingência Local de Emergência)
         └── Execução nativa no navegador (SpeechSynthesisUtterance) sem dependência externa
```

---

## 3. GOOGLE DRIVE (BIBLIOTECA OFICIAL)

- **Função:** Armazenamento central permanente de áudios de aulas, músicas (versos e karaokê) e falas estáticas.
- **Regras Arquiteturais:**
  1. **Prioridade Máxima:** Qualquer áudio existente no Drive deve ser tocado antes de cogitar síntese de voz.
  2. **Custo Zero:** Previne o consumo da franquia de 500.000 caracteres mensais da Azure.
  3. **Não Regeneração:** O sistema não deve sobrescrever nem regenerar versos já associados a URLs válidas do Drive (`googleusercontent.com` ou `drive.google.com`).

---

## 4. AZURE TTS PROXY (SUPABASE EDGE FUNCTION)

- **Localização:** `supabase/functions/azure-tts-proxy/index.ts`
- **Ambiente:** Supabase Edge Runtime (Deno TypeScript)
- **Secrets Utilizados (Serverless):**
  - `AZURE_SPEECH_KEY`: Chave privada da Microsoft Azure Speech.
  - `AZURE_SPEECH_REGION`: Região oficial configurada (`eastus`).
- **Segurança:** O frontend nunca recebe e nunca manipula a chave Azure.
- **Contrato de Retorno:**
  ```json
  {
    "base64Audio": "UklGRi...",
    "mimeType": "audio/wav"
  }
  ```

---

## 5. PROFESSORES 3D HOMOLOGADOS

A galeria de professores virtuais multigênero está homologada e respondendo com status HTTP 200:

| Professor | Voz Oficial Azure | Idioma / Especialidade | Lipsync & Expressões |
| :--- | :--- | :---: | :---: |
| **Profª Sarah** | `en-US-JennyNeural` | Inglês (Voz cristalina) | Sincronizado |
| **Profª Sarah** | `pt-BR-FranciscaNeural` | Português (Acolhedora) | Sincronizado |
| **Profª Sarah** | `pt-BR` + `en-US` | Bilíngue Nativo | Pausas perfeitas |
| **Prof. James** | `en-US-GuyNeural` | Inglês (Madura e firme) | Sincronizado |
| **Profª Emma** | `en-US-AriaNeural` | Inglês (Dinâmica e expressiva) | Sincronizado |
| **Prof. David** | `en-US-DavisNeural` | Inglês (Casual e descontraído) | Sincronizado |
| **Mascote Lucas** | `en-US-DavisNeural` / `pt-BR-NicolauNeural` | Pixar 3D (Mixamo) | Sincronizado |

---

## 6. GEMINI TTS (STATUS: REMOVIDO)

- **Status:** **REMOVIDO / EXPURGADO**.
- **Motivo:** Código legado de contingência que expunha uma credencial em texto claro no frontend e duplicava a lógica de síntese.
- **Auditoria de Código:** 0 ocorrências de `gemini`, `generativelanguage` ou chaves da Google em `src/` e `dist/`.
- **Nenhuma dependência ativa restante.**

---

## 7. SEGURANÇA E AUDITORIA DO BUNDLE

- **Antes:**
  - Chave Gemini exposta em `DEFAULT_AVATAR_SETTINGS`.
  - Chave transitada no bundle `dist/assets/*.js`.
  - Chamadas diretas do navegador para APIs de terceiros.
- **Depois:**
  - 100% das credenciais de terceiros mantidas exclusivamente em Deno Secrets no backend.
  - Comunicação cliente-servidor autenticada via Supabase JWT.
  - Bundle compilado limpo, auditado e sem qualquer vazamento de segredos.

---

## 8. ARQUIVOS CRÍTICOS DO SISTEMA DE ÁUDIO

### Frontend:
- `src/services/avatarPracticeService.js`: Gerenciador central de presets, configurações e clientes de síntese Azure.
- `src/components/avatar/AvatarPracticeView.jsx`: Controlador do professor 3D, reprodução de áudio, cálculo de visemas e lipsync.
- `src/components/admin/SongManager.jsx`: Painel administrativo com geração e upload automático de áudios neurais para o Google Drive.

### Backend (Edge Functions):
- `supabase/functions/azure-tts-proxy/index.ts`: Proxy serverless oficial para a Microsoft Azure Speech API.

---

## 9. TESTES HOMOLOGADOS DESTA BASELINE

1. **Build de Produção:** `npm run build` aprovado em **3.08s com zero erros**.
2. **Azure Speech Proxy:** Testes automatizados executados com retorno **HTTP 200 OK** para todos os professores (Sarah EN/PT/Bilíngue, James, Emma e David).
3. **Google Drive:** Preservação comprovada do catálogo de músicas com URLs oficiais (`lh3.googleusercontent.com/d/...`).
4. **TalkingHead:** Animação labial, visemas e áudio via Web Audio API funcionando continuamente.

---

## 10. REGRAS PARA FUTURAS ALTERAÇÕES

Qualquer modificação que envolva áudio, avatares ou professores deve seguir estritamente este protocolo:
1. **Nunca colocar chaves no frontend.**
2. **Nunca realizar chamadas diretas do cliente para APIs de TTS externas.**
3. **Preservar o Google Drive como prioridade 1 (custo zero).**
4. **Executar `npm run build` e validar ausência de regressões antes de qualquer homologação.**
5. **Auditar o bundle em `dist/assets/` para assegurar que nenhum segredo vazou.**
6. **Registrar o log da alteração em documento na pasta `auditoria/`.**

---

## 11. ROADMAP E PENDÊNCIAS FUTURAS

- [ ] Implementação de cache de frases dinâmicas recorrentes do avatar no Supabase Storage.
- [ ] Dashboard administrativo de acompanhamento do consumo de caracteres da cota Azure.
- [ ] Novas expressões faciais contextuais para os avatares baseadas na precisão fonética do aluno.
