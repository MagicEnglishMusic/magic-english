import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function audioProxyMiddleware() {
  return async (req, res, next) => {
    if (req.url && (req.url.startsWith('/api/audio-proxy') || req.url.startsWith('/api/video-proxy'))) {
      try {
        const isVideo = req.url.startsWith('/api/video-proxy');
        const urlObj = new URL(req.url, 'http://localhost');
        const fileId = urlObj.searchParams.get('id');
        if (!fileId) {
          res.statusCode = 400;
          res.end('Missing id parameter');
          return;
        }

        const https = await import('https');
        const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

        const requestOptions = {
          headers: {}
        };
        if (req.headers.range) {
          requestOptions.headers['range'] = req.headers.range;
        }

        const request = https.get(targetUrl, requestOptions, (gRes) => {
          // Handle redirect if needed
          if (gRes.statusCode >= 300 && gRes.statusCode < 400 && gRes.headers.location) {
            https.get(gRes.headers.location, requestOptions, (redirectRes) => {
              const defaultType = isVideo ? 'video/mp4' : 'audio/mpeg';
              const contentType = redirectRes.headers['content-type'];
              const finalType = (contentType && !contentType.includes('text/html')) ? contentType : defaultType;

              const responseHeaders = {
                'Content-Type': finalType,
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600'
              };

              if (redirectRes.headers['content-length']) {
                responseHeaders['Content-Length'] = redirectRes.headers['content-length'];
              }
              if (redirectRes.headers['content-range']) {
                responseHeaders['Content-Range'] = redirectRes.headers['content-range'];
              }

              res.writeHead(redirectRes.statusCode || 200, responseHeaders);
              redirectRes.pipe(res);
            }).on('error', (e) => {
              res.statusCode = 500;
              res.end(e.message);
            });
            return;
          }

          const defaultType = isVideo ? 'video/mp4' : 'audio/mpeg';
          const contentType = gRes.headers['content-type'];
          const finalType = (contentType && !contentType.includes('text/html')) ? contentType : defaultType;

          const responseHeaders = {
            'Content-Type': finalType,
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
          };

          if (gRes.headers['content-length']) {
            responseHeaders['Content-Length'] = gRes.headers['content-length'];
          }
          if (gRes.headers['content-range']) {
            responseHeaders['Content-Range'] = gRes.headers['content-range'];
          }

          res.writeHead(gRes.statusCode || 200, responseHeaders);
          gRes.pipe(res);
        });

        request.on('error', (err) => {
          res.statusCode = 500;
          res.end(err.message);
        });
        return;
      } catch (e) {
        res.statusCode = 500;
        res.end(e.message);
        return;
      }
    }
    next();
  };
}

function audioProxyPlugin() {
  const middleware = audioProxyMiddleware();
  return {
    name: 'audio-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    audioProxyPlugin()
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: ['talkinghead', 'three', /^three\/.*/],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
        }
      }
    }
  }
})

