import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'sitemap.xml');
const siteUrl = 'https://intermtnroofing.com';

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'admin' || name === 'admni') continue;
    const fullPath = path.join(dir, name);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }

    if (!name.endsWith('.html')) continue;

    const relPath = path.relative(root, fullPath).split(path.sep).join('/');
    if (relPath.startsWith('admin/')) continue;
    yield { relPath, stats };
  }
}

const urls = [...walk(root)]
  .sort((a, b) => a.relPath.localeCompare(b.relPath))
  .map(({ relPath, stats }) => {
    const loc = relPath === 'index.html' ? `${siteUrl}/` : `${siteUrl}/${relPath}`;
    const lastmod = stats.mtime.toISOString().slice(0, 10);
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  });

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(outPath, xml, 'utf8');
console.log('Wrote sitemap.xml');
