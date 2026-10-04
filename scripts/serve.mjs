// Tiny static server for dist/ (local previews, screenshots, PDFs, OG images and tests).
// Serves /path/ as /path/index.html and falls back to /404.html like GitHub Pages.
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ico': 'image/x-icon',
};

export function serve(dir, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
      let file = join(dir, path);
      let info = await stat(file).catch(() => null);
      if (info?.isDirectory()) {
        file = join(file, 'index.html');
        info = await stat(file).catch(() => null);
      }
      if (!info) {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        res.end(await readFile(join(dir, '404.html')).catch(() => 'Not found'));
        return;
      }
      // Like GitHub Pages: gzip text responses and a 10-minute cache lifetime.
      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      const body = await readFile(file);
      const headers = { 'Content-Type': type, 'Cache-Control': 'max-age=600' };
      if (/^(text\/|application\/(json|xml)|image\/svg)/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
        res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
        res.end(gzipSync(body));
        return;
      }
      res.writeHead(200, headers);
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await serve(process.argv[2] ?? 'dist', Number(process.argv[3] ?? 4321));
  console.log(`Serving at ${url}`);
}
