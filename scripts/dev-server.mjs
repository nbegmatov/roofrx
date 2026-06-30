import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, watch, readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = process.env.BRAND;
const port = parseInt(process.env.PORT || '5173');

if (!brand) {
  console.error('Error: BRAND environment variable is required.');
  process.exit(1);
}

const brandImagesDir = join(root, 'brands', brand, 'images');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
};

const LIVE_RELOAD_SNIPPET = `<script>
  (function(){const e=new EventSource('/__lr');e.onmessage=()=>location.reload();})();
</script>`;

const clients = new Set();

let reloadTimer;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const res of clients) res.write('data: reload\n\n');
  }, 80);
}

watch(root, { recursive: true }, (_, filename) => {
  if (!filename) return;
  if (filename.includes('node_modules') || filename.startsWith('.git')) return;
  scheduleReload();
});

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/__lr') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(':\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const rel = url === '/' ? 'index.html' : url.slice(1);

  // Brand image override: serve from brands/<brand>/images/ if available
  let filePath;
  if (rel.startsWith('images/')) {
    const brandFile = join(brandImagesDir, rel.slice('images/'.length));
    if (existsSync(brandFile)) filePath = brandFile;
  }
  if (!filePath) filePath = join(root, rel);

  // Directory → index.html
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });

  if (ext === '.html') {
    let html = readFileSync(filePath, 'utf-8');
    html = html.replace('</body>', LIVE_RELOAD_SNIPPET + '</body>');
    res.end(html);
  } else {
    createReadStream(filePath).pipe(res);
  }
});

server.listen(port, () => {
  console.log(`\n  [${brand}]  http://localhost:${port}\n`);
});
