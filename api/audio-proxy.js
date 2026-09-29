// Serverless Function for Vercel / Node Hosting: /api/audio-proxy
const https = require('https');

module.exports = async (req, res) => {
  const fileId = req.query?.id || new URL(req.url, 'http://localhost').searchParams.get('id');

  if (!fileId) {
    res.status(400).json({ error: 'Missing id parameter' });
    return;
  }

  const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  https.get(targetUrl, (gRes) => {
    if (gRes.statusCode >= 300 && gRes.statusCode < 400 && gRes.headers.location) {
      https.get(gRes.headers.location, (redirectRes) => {
        res.writeHead(redirectRes.statusCode || 200, {
          'Content-Type': redirectRes.headers['content-type'] || 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400'
        });
        redirectRes.pipe(res);
      }).on('error', (e) => {
        res.status(500).json({ error: e.message });
      });
      return;
    }

    res.writeHead(gRes.statusCode || 200, {
      'Content-Type': gRes.headers['content-type'] || 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400'
    });
    gRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
};
