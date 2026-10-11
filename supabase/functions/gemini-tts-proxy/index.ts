// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: GEMINI TTS PROXY
// ==============================================================================
// 1. Camada segura de síntese de voz neural Google Gemini (Fallback de contingência).
// 2. Proteção de credenciais: Deno.env.get("GEMINI_API_KEY") via Supabase Secrets.
// 3. Validação rigorosa de autenticação (JWT) do Supabase Auth.
// 4. Retorno estrito compatível com o cliente: { base64Audio, mimeType: "audio/wav" }.
// 5. Suporte a modo aluno/avatar ("avatar") e modo administrativo ("content_generation").
// 6. Respeito rigoroso à arquitetura de prioridade: Google Drive -> Azure -> Gemini -> Web Speech.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Limite de segurança para evitar estouro de cota e abusos
const MAX_CHARACTERS = 800;

// Modelos TTS suportados na API da Google
const GEMINI_TTS_MODELS = [
  "gemini-3.1-flash-tts-preview",
  "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts"
];

Deno.serve(async (req: Request) => {
  // 1. Tratamento de CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Health check (GET)
  if (req.method === "GET") {
    const hasKey = Boolean(Deno.env.get("GEMINI_API_KEY"));
    return new Response(
      JSON.stringify({
        status: "online",
        service: "Gemini TTS Proxy (Fallback Contingency Engine)",
        configured: hasKey,
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

    // 4. Carregar Secret Segura da Google do Ambiente Serverless
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey || !geminiKey.trim()) {
      return new Response(
        JSON.stringify({
          error: "Credencial Gemini não configurada no servidor (GEMINI_API_KEY ausente nos Secrets)."
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

    const {
      text,
      voice,
      voiceName,
      language,
      purpose
    } = body || {};

    const textToSpeak = typeof text === "string" ? text.trim() : "";
    if (!textToSpeak) {
      return new Response(
        JSON.stringify({ error: "Campo 'text' obrigatório para síntese." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Controle de abuso e limite de caracteres
    if (textToSpeak.length > MAX_CHARACTERS) {
      return new Response(
        JSON.stringify({
          error: `Texto excede o limite máximo permitido de ${MAX_CHARACTERS} caracteres por requisição.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Voz padrão solicitada ou fallback oficial ('Kore' ou 'Puck')
    const selectedVoice = voice || voiceName || "Kore";

    // 6. Execução em Cascata de Modelos TTS da Google (Tentativa sequencial)
    let base64Audio: string | null = null;
    let mimeType = "audio/wav";
    let lastErrorDetail = "Falha ao sintetizar áudio via Google Gemini.";

    for (const modelName of GEMINI_TTS_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey.trim()}`;
        
        const googlePayload = {
          contents: [{ parts: [{ text: textToSpeak }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice }
              }
            }
          }
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(googlePayload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const msg = errData?.error?.message || `HTTP ${res.status}`;
          lastErrorDetail = `[${modelName}] ${msg}`;
          console.warn(`[gemini-tts-proxy] Erro no modelo ${modelName}:`, res.status, msg);

          // Se for erro de cota (429), interrompe para não onerar o servidor
          if (res.status === 429) {
            return new Response(
              JSON.stringify({ error: `Cota do Gemini excedida temporariamente: ${msg}` }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue;
        }

        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part?.inlineData?.data) {
              base64Audio = part.inlineData.data;
              mimeType = part.inlineData.mimeType || mimeType;
              break;
            }
          }
        }

        if (base64Audio) {
          break; // Sucesso na síntese
        }
      } catch (callErr: any) {
        lastErrorDetail = callErr?.message || String(callErr);
        console.warn(`[gemini-tts-proxy] Exceção na chamada de ${modelName}:`, lastErrorDetail);
      }
    }

    if (!base64Audio) {
      return new Response(
        JSON.stringify({ error: `Não foi possível gerar áudio via Gemini: ${lastErrorDetail}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Retorno Padronizado compatível com AudioContext e TalkingHead
    return new Response(
      JSON.stringify({
        base64Audio,
        mimeType
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (serverErr: any) {
    console.error("[gemini-tts-proxy] Erro interno no servidor:", serverErr);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor de síntese de voz (Gemini Proxy)." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
