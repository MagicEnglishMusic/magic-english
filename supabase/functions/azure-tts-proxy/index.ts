// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: AZURE TTS PROXY
// ==============================================================================
// 1. Camada segura de síntese de voz neural da Microsoft Azure Speech Services.
// 2. Acesso protegido a credenciais via Deno.env.get("AZURE_SPEECH_KEY").
// 3. Validação rigorosa de autenticação (JWT) do Supabase Auth.
// 4. Retorno estrito compatível com o cliente: { base64Audio, mimeType: "audio/wav" }.
// 5. Suporte a modo mono-voz ("single") e bilíngue ("bilingual") com visemas e pausas.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Escapar caracteres especiais para SSML seguro
function escapeSSML(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Health check (GET)
  if (req.method === "GET") {
    const hasKey = Boolean(Deno.env.get("AZURE_SPEECH_KEY"));
    const region = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";
    return new Response(
      JSON.stringify({
        status: "online",
        service: "Azure Speech TTS Proxy",
        configured: hasKey,
        region,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 3. Validação de Autenticação via JWT do Supabase Auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado: Token JWT de autenticação não fornecido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      const authClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const token = authHeader.replace(/Bearer /i, "").trim();
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Sessão inválida ou expirada. Faça login para utilizar a síntese de voz." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Carregar Secrets Seguros da Azure do Ambiente Serverless
    const azureKey = Deno.env.get("AZURE_SPEECH_KEY");
    const azureRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";

    if (!azureKey || !azureKey.trim()) {
      return new Response(
        JSON.stringify({
          error: "Credenciais do Azure Speech não configuradas no servidor (AZURE_SPEECH_KEY ausente)."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Leitura e Validação do Payload da Requisição
    let body: any = null;
    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Payload JSON inválido ou vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mode = body?.mode || "single"; // "single" | "bilingual"
    const MAX_CHAR_LIMIT = 500; // Limite de segurança contra abuso por requisição

    let ssml = "";

    if (mode === "bilingual") {
      // Modo Bilíngue: instrução em PT-BR + frase em EN-US
      const instructionPt = (body?.instructionPt || body?.textPt || "").trim();
      const phraseEn = (body?.phraseEn || body?.textEn || "").trim();

      if (!instructionPt && !phraseEn) {
        return new Response(
          JSON.stringify({ error: "Campos de texto para modo bilíngue não podem ser vazios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if ((instructionPt.length + phraseEn.length) > MAX_CHAR_LIMIT) {
        return new Response(
          JSON.stringify({ error: `Texto excede o limite máximo permitido de ${MAX_CHAR_LIMIT} caracteres.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const voicePt = body?.voicePt || "pt-BR-FranciscaNeural";
      const voiceEn = body?.voiceEn || "en-US-JennyNeural";
      const cleanPt = escapeSSML(instructionPt);
      const cleanEn = escapeSSML(phraseEn);

      ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voicePt}'>${cleanPt} <break time='350ms'/></voice><voice name='${voiceEn}'>${cleanEn}</voice></speak>`;

    } else {
      // Modo Mono-Voz (Padrão)
      const text = (body?.text || "").trim();
      if (!text) {
        return new Response(
          JSON.stringify({ error: "O campo 'text' não pode ser vazio." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (text.length > MAX_CHAR_LIMIT) {
        return new Response(
          JSON.stringify({ error: `Texto excede o limite máximo permitido de ${MAX_CHAR_LIMIT} caracteres.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lang = (body?.lang || body?.language || "en").toLowerCase();
      const isPt = lang === "pt" || lang === "pt-br";
      const voice = body?.voice || (isPt ? "pt-BR-FranciscaNeural" : "en-US-JennyNeural");
      const escapedText = escapeSSML(text);

      ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${isPt ? "pt-BR" : "en-US"}'><voice name='${voice}'>${escapedText}</voice></speak>`;
    }

    // 6. Chamada à Microsoft Azure Speech Services REST API
    const azureEndpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const azureResponse = await fetch(azureEndpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey.trim(),
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
        "User-Agent": "MagicEnglish-Proxy"
      },
      body: ssml
    });

    if (!azureResponse.ok) {
      const errText = await azureResponse.text().catch(() => "");
      console.error(`[azure-tts-proxy] Erro na Azure (${azureResponse.status}):`, errText);

      return new Response(
        JSON.stringify({
          error: `Falha na síntese de voz (Azure HTTP ${azureResponse.status}).`,
          details: errText || azureResponse.statusText
        }),
        { status: azureResponse.status >= 500 ? 502 : azureResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Conversão do Binário de Áudio (WAV) para Base64 compatível com o cliente
    const arrayBuffer = await azureResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    const chunkSize = 8192;
    let binary = "";
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    const base64Audio = btoa(binary);

    // 8. Resposta no Contrato Exato do Frontend: { base64Audio, mimeType: "audio/wav" }
    return new Response(
      JSON.stringify({
        base64Audio,
        mimeType: "audio/wav"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (err: any) {
    console.error("[azure-tts-proxy] Erro interno:", err.message);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor de síntese de voz: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
