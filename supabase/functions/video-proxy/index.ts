// ==============================================================================
// Supabase Edge Function: video-proxy
// ==============================================================================
// 1. Proxies Google Drive video streams with full CORS, Range (HTTP 206) and 
//    large-file confirmation bypass for HTML5 <video> elements.
// 2. Deployed with --no-verify-jwt (public for HTML5 media elements)
// 3. SECURED: Validates that the requested Google Drive file ID is registered 
//    in the platform's lesson catalog (public.lessons.video_url).
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
  const fileId = url.searchParams.get("id") || url.searchParams.get("fileId");

  // 2. Validate input parameter format
  if (!fileId || !/^[a-zA-Z0-9_-]{20,60}$/.test(fileId)) {
    return new Response(JSON.stringify({ error: "Invalid or missing video file id parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // 3. Security Verification: Validate that the file belongs to lessons catalog
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check lessons table on video_url column
      const { data: lessonMatch, error: lessonErr } = await supabase
        .from("lessons")
        .select("id")
        .ilike("video_url", `%${fileId}%`)
        .limit(1);

      let isAllowed = Boolean(!lessonErr && lessonMatch && lessonMatch.length > 0);

      // If not in lessons, check songs table as fallback
      if (!isAllowed) {
        const { data: songMatch } = await supabase
          .from("songs")
          .select("id")
          .ilike("audio_url", `%${fileId}%`)
          .limit(1);

        if (songMatch && songMatch.length > 0) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        console.warn(`[video-proxy] Access Denied: File ID ${fileId} not registered in platform catalog.`);
        return new Response(JSON.stringify({ error: "Forbidden: Video file is not registered in the Magic English catalog." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (dbErr: any) {
      console.warn("[video-proxy] Database catalog validation warning:", dbErr.message);
      // In case of transient DB lookup error, allow stream to proceed
    }
  }

  // 4. Stream Fetching with Large-File Virus Scan Bypass
  const range = req.headers.get("range");
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const fetchHeaders: Record<string, string> = {
    "User-Agent": userAgent
  };

  if (range) {
    fetchHeaders["range"] = range;
  }

  try {
    // Attempt 1: Direct stream endpoint
    let streamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
    let driveResponse = await fetch(streamUrl, {
      headers: fetchHeaders,
      redirect: "follow"
    });

    const initialContentType = driveResponse.headers.get("content-type") || "";

    // If Google Drive returns an HTML warning page for large files (>25MB)
    if (initialContentType.includes("text/html")) {
      const htmlText = await driveResponse.text();

      // Extract confirmation token from URL or form
      const confirmMatch = htmlText.match(/confirm=([0-9A-Za-z_-]+)/) ||
                           htmlText.match(/name="confirm"\s+value="([0-9A-Za-z_-]+)"/) ||
                           htmlText.match(/download_warning_([0-9A-Za-z_-]+)/);

      const confirmToken = confirmMatch ? confirmMatch[1] : "t";

      // Also check Set-Cookie for download warning cookie
      const cookies = driveResponse.headers.get("set-cookie") || "";
      const cookieHeader = cookies ? { "Cookie": cookies } : {};

      const secondUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}`;

      driveResponse = await fetch(secondUrl, {
        headers: {
          ...fetchHeaders,
          ...cookieHeader
        },
        redirect: "follow"
      });
    }

    // 5. Check if the final response is HTML (e.g. quota limit or private file)
    const finalContentType = driveResponse.headers.get("content-type") || "";
    if (finalContentType.includes("text/html") || finalContentType.includes("text/plain")) {
      console.warn(`[video-proxy] Google Drive returned non-video content-type: ${finalContentType}`);
      return new Response(JSON.stringify({ error: "Google Drive returned non-video response (file may be private or quota exceeded)." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 6. Build Response with Range Headers and video/mp4 MIME type
    const responseHeaders = new Headers(corsHeaders);
    
    // Ensure video/mp4 for HTML5 video element decoders
    responseHeaders.set("Content-Type", finalContentType || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

    if (driveResponse.headers.has("content-length")) {
      responseHeaders.set("Content-Length", driveResponse.headers.get("content-length")!);
    }
    if (driveResponse.headers.has("content-range")) {
      responseHeaders.set("Content-Range", driveResponse.headers.get("content-range")!);
    }

    return new Response(driveResponse.body, {
      status: driveResponse.status, // Passes 206 Partial Content when Range is requested
      headers: responseHeaders
    });

  } catch (err: any) {
    console.error("[video-proxy] Stream error:", err.message);
    return new Response(JSON.stringify({ error: "Video streaming failed: " + err.message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
