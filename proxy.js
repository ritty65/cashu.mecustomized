const http = require('http');
const https = require('https');
const { URL } = require('url');

const TARGET = 'https://mint.minibits.cash';

function onRequest(req, res) {
  const url = new URL(req.url, TARGET);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: req.method,
    headers: { ...req.headers, host: url.hostname }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' };
    res.writeHead(proxyRes.statusCode || 500, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500);
    res.end('Proxy error');
  });

  req.pipe(proxyReq, { end: true });
}

http.createServer(onRequest).listen(3001, () => {
  console.log('CORS proxy running on http://localhost:3001');
});
