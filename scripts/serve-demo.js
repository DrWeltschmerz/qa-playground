#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 18181;
const ROOT = path.resolve(__dirname, '..', 'api-gateway', 'static', 'demo');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);
  if (pathname === '/demo') {
    res.statusCode = 301;
    res.setHeader('Location', '/demo/');
    return res.end();
  }
  if (!pathname.startsWith('/demo')) {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.end('Demo server. Visit /demo/');
  }

  const rel = pathname === '/demo/' ? '/index.html' : pathname.replace(/^\/demo/, '');
  const filePath = path.join(ROOT, rel);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('content-type', mime[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Demo server listening on http://localhost:${PORT}/demo/ (root: ${ROOT})`);
});
