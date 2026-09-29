import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function audioProxyMiddleware() {
  return async (req, res, next) => {
    if (req.url && req.url.startsWith('/api/audio-proxy')) {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const fileId = urlObj.searchParams.get('id');
        if (!fileId) {
          res.statusCode = 400;
          res.end('Missing id parameter');
          return;
        }

        const https = await import('https');
        const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

        const request = https.get(targetUrl, (gRes) => {
          // Handle redirect if needed
          if (gRes.statusCode >= 300 && gRes.statusCode < 400 && gRes.headers.location) {
            https.get(gRes.headers.location, (redirectRes) => {
              res.writeHead(redirectRes.statusCode || 200, {
                'Content-Type': redirectRes.headers['content-type'] || 'audio/mpeg',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600'
              });
              redirectRes.pipe(res);
            }).on('error', (e) => {
              res.statusCode = 500;
              res.end(e.message);
            });
            return;
          }

          res.writeHead(gRes.statusCode || 200, {
            'Content-Type': gRes.headers['content-type'] || 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
          });
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
  plugins: [
    react(),
    tailwindcss(),
    audioProxyPlugin()
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
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

