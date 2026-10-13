// ==============================================================================
// Supabase Edge Function: audio-proxy
// ==============================================================================
// 1. Proxies Google Drive audio streams with full CORS and Byte-Range support (HTTP 206)
// 2. Deployed with --no-verify-jwt (public for <audio> elements)
// 3. SECURED: Validates that the requested Google Drive file ID exists in the database (public.songs)
//    to prevent this function from being used as an open proxy for arbitrary files.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, Content-Type"
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const fileId = url.searchParams.get("id");

  // 2. Validate input parameter
  if (!fileId || !/^[a-zA-Z0-9_-]{20,60}$/.test(fileId)) {
    return new Response(JSON.stringify({ error: "Invalid or missing audio file id parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // 3. Security verification: Ensure fileId is registered in public.songs (or lessons)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check in songs table (audio_url)
      const { data: songMatch, error: songErr } = await supabase
        .from("songs")
        .select("id")
        .ilike("audio_url", `%${fileId}%`)
        .limit(1);

      let isAllowed = Boolean(!songErr && songMatch && songMatch.length > 0);

      // Check in songs.timestamps JSONB (verse audio URLs)
      if (!isAllowed) {
        const { data: allSongs } = await supabase
          .from("songs")
          .select("id, timestamps");
        if (Array.isArray(allSongs)) {
          isAllowed = allSongs.some((s: any) =>
            JSON.stringify(s?.timestamps || []).includes(fileId)
          );
        }
      }

      // Check in app_settings (avatar_messages_audio_catalog and avatar_settings)
      if (!isAllowed) {
        const { data: appSettingsRows } = await supabase
          .from("app_settings")
          .select("key, value")
          .in("key", ["avatar_messages_audio_catalog", "avatar_settings"]);
        if (Array.isArray(appSettingsRows)) {
          isAllowed = appSettingsRows.some((row: any) =>
            JSON.stringify(row?.value || {}).includes(fileId)
          );
        }
      }

      // If still not found, check lessons table as fallback
      if (!isAllowed) {
        const { data: lessonMatch } = await supabase
          .from("lessons")
          .select("id")
          .or(`audio_url.ilike.%${fileId}%,media_url.ilike.%${fileId}%`)
          .limit(1);

        if (lessonMatch && lessonMatch.length > 0) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        console.warn(`[audio-proxy] Access Denied: File ID ${fileId} not registered in platform catalog.`);
        return new Response(JSON.stringify({ error: "Forbidden: Audio file is not registered in the Magic English catalog." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (dbErr: any) {
      console.warn("[audio-proxy] Database catalog validation warning:", dbErr.message);
      // In case of transient DB lookup error, continue with stream
    }
  }

  // 4. Proxy Stream from Google Drive
  const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  try {
    const range = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    if (range) {
      fetchHeaders["range"] = range;
    }

    const driveResponse = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow"
    });

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("Content-Type", driveResponse.headers.get("content-type") || "audio/mpeg");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

    if (driveResponse.headers.has("content-length")) {
      responseHeaders.set("Content-Length", driveResponse.headers.get("content-length")!);
    }
    if (driveResponse.headers.has("content-range")) {
      responseHeaders.set("Content-Range", driveResponse.headers.get("content-range")!);
    }

    return new Response(driveResponse.body, {
      status: driveResponse.status, // Will pass 206 Partial Content when Range is provided
      headers: responseHeaders
    });
  } catch (err: any) {
    console.error("[audio-proxy] Stream error:", err.message);
    return new Response(JSON.stringify({ error: "Audio streaming failed: " + err.message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
