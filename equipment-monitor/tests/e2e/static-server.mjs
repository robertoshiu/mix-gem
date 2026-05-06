import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';

const args = process.argv.slice(2);
let dir = 'out';
let basePath = '/mix-gem';
let port = 3000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dir' && i + 1 < args.length) dir = args[++i];
  else if (args[i] === '--basePath' && i + 1 < args.length) basePath = args[++i];
  else if (args[i] === '--port' && i + 1 < args.length) port = Number(args[++i]);
}

if (!basePath.endsWith('/')) basePath += '/';
basePath = basePath.replace(/\/+$/, '/');
if (!basePath.startsWith('/')) basePath = '/' + basePath;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.map': 'application/json',
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, status = 200, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(status, { 'Content-Type': contentType || getMime(filePath) });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let url = req.url;

  if (url.startsWith(basePath)) {
    url = url.slice(basePath.length);
  }
  if (!url.startsWith('/')) url = '/' + url;

  let filePath;
  let is404 = false;

  if (url.startsWith('/_next/')) {
    filePath = path.join(dir, url);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(dir, '_next', path.basename(url));
    }
  } else {
    filePath = path.join(dir, url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      const indexPath = path.join(dir, url === '/' ? 'index.html' : url.replace(/\/$/, '') + '/index.html');
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      } else {
        is404 = true;
      }
    }
  }

  if (is404) {
    const notFoundFile = path.join(dir, '404.html');
    if (fs.existsSync(notFoundFile)) {
      serveFile(res, notFoundFile, 200, 'text/html');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
    return;
  }

  serveFile(res, filePath, 200, getMime(filePath));
});

server.listen(port, () => {
  process.stderr.write(`Static server listening on http://127.0.0.1:${port}${basePath}/\n`);
});
