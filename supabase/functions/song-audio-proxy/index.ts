// ==============================================================================
// MAGIC ENGLISH — SUPABASE EDGE FUNCTION: SONG AUDIO DRIVE PROXY
// ==============================================================================
// 1. Ponto único e seguro de integração entre o frontend e o Google Apps Script.
// 2. Protegido por autenticação JWT (Supabase Auth) e autorização de administrador.
// 3. Impede uploads anônimos ou de usuários comuns (somente role = 'admin').
// 4. Injeta o segredo administrativo (SONG_SERVICE_AUTH_TOKEN) no lado do servidor.
// 5. Zero exposição de chaves privadas ou URLs administrativas no React.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const timestamp = new Date().toISOString();

  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Health check (GET)
  if (req.method === "GET") {
    const appsScriptUrl = Deno.env.get("SONG_AUDIO_APPS_SCRIPT_URL");
    const hasSecret = Boolean(Deno.env.get("SONG_SERVICE_AUTH_TOKEN"));

    return new Response(
      JSON.stringify({
        status: "online",
        service: "Song Audio Drive Proxy",
        configured: Boolean(appsScriptUrl),
        authenticated_backend: hasSecret,
        timestamp
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor Supabase incompleta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. Validação de Autenticação via JWT
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado: Token JWT de autenticação não fornecido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/Bearer /i, "").trim();
    const { data: { user: callerUser }, error: callerAuthError } = await supabaseAdmin.auth.getUser(token);

    if (callerAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada. Faça login novamente como Administrador." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Verificação de Autorização Administrativa Estrita (role = 'admin')
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, email")
      .eq("id", callerUser.id)
      .single();

    const isCallerAdmin = callerProfile?.role === "admin" || 
                          callerUser.user_metadata?.role === "admin" || 
                          callerUser.email === "magicenglishmusic@gmail.com";

    if (!isCallerAdmin) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: Somente administradores autorizados podem salvar áudios de músicas no Google Drive." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verificação das variáveis de ambiente do Apps Script Dedicado
    const appsScriptUrl = Deno.env.get("SONG_AUDIO_APPS_SCRIPT_URL");
    const serviceToken = Deno.env.get("SONG_SERVICE_AUTH_TOKEN") || "";

    if (!appsScriptUrl || !appsScriptUrl.trim()) {
      return new Response(
        JSON.stringify({
          error: "Serviço Google Apps Script de músicas ainda não configurado (SONG_AUDIO_APPS_SCRIPT_URL ausente no Supabase)."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Leitura e Validação do Payload
    let body: any = null;
    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Payload JSON inválido ou vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, songId, songName, lessonId, lessonName, verseIndex, fileName, base64, forceOverwrite, messageHash, category, voice, lang } = body;

    if (!base64 || String(base64).trim() === "") {
      return new Response(
        JSON.stringify({ error: "base64 do áudio é estritamente obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestType = String(type || "song_audio").trim();
    let upstreamPayload: Record<string, any>;

    if (requestType === "avatar_message") {
      if (!messageHash || String(messageHash).trim().length < 8) {
        return new Response(
          JSON.stringify({ error: "messageHash é estritamente obrigatório para type=avatar_message." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      upstreamPayload = {
        type: "avatar_message",
        messageHash: String(messageHash).trim(),
        category: String(category || "geral").trim().toLowerCase(),
        voice: String(voice || "pt-BR-FranciscaNeural").trim(),
        lang: String(lang || "pt").trim().toLowerCase(),
        fileName: fileName || `msg_${String(messageHash).trim()}.wav`,
        base64: String(base64).trim(),
        authToken: serviceToken
      };
    } else {
      if (!songId || String(songId).trim() === "") {
        return new Response(
          JSON.stringify({ error: "songId é estritamente obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 7. Chamada Protegida ao Google Apps Script Dedicado (Fluxo Original de Músicas)
      upstreamPayload = {
        type: "song_audio",
        songId: String(songId).trim(),
        songName: songName ? String(songName).trim() : "Musica",
        lessonId: lessonId ? String(lessonId).trim() : null,
        lessonName: lessonName ? String(lessonName).trim() : "Aula Geral",
        verseIndex: verseIndex !== undefined && verseIndex !== null ? Number(verseIndex) : null,
        fileName: fileName || null,
        base64: String(base64).trim(),
        forceOverwrite: Boolean(forceOverwrite),
        authToken: serviceToken // Injetado com segurança pelo servidor
      };
    }

    const googleResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(upstreamPayload)
    });

    const upstreamData = await googleResponse.json().catch(async () => {
      const text = await googleResponse.text();
      return { success: false, raw: text };
    });

    if (!upstreamData || upstreamData.success === false) {
      return new Response(
        JSON.stringify({
          error: upstreamData?.error || "Erro retornado pelo Google Apps Script de músicas.",
          upstream: upstreamData
        }),
        { status: upstreamData?.conflict ? 409 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(upstreamData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[song-audio-proxy] Erro interno:", err.message);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor de upload de músicas: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
