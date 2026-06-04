/**
 * Merges keys found in HTML into content/editable.json.
 * Adds missing keys with current text from the file; keeps existing JSON values.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'content', 'editable.json');

function* walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'admin' || name === 'admni') continue;
      yield* walkHtml(p);
    } else if (name.endsWith('.html')) {
      const rel = relative(root, p).split('\\').join('/');
      if (rel.startsWith('admin/') || rel.startsWith('admni/')) continue;
      yield rel;
    }
  }
}

function extractFromHtml(raw) {
  const $ = cheerio.load(raw, { decodeEntities: false });
  const out = {};

  const t = $('title').first().text().trim();
  if (t) out['meta.title'] = t;

  const d = $('meta[name="description"]').attr('content');
  if (d !== undefined) out['meta.description'] = d;

  $('[data-editable]').each((_, el) => {
    const key = $(el).attr('data-editable');
    if (!key) return;
    out[key] = $(el).text().trim();
  });

  $('[data-editable-src]').each((_, el) => {
    const key = $(el).attr('data-editable-src');
    if (!key) return;
    out[key] = ($(el).attr('src') || '').trim();
  });

  return out;
}

let merged = {};
if (existsSync(jsonPath)) {
  try {
    merged = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    merged = {};
  }
}

for (const rel of walkHtml(root)) {
  const abs = join(root, rel);
  const raw = readFileSync(abs, 'utf8');
  if (!raw.includes('data-editable') && !raw.includes('data-editable-src')) continue;
  const found = extractFromHtml(raw);
  if (Object.keys(found).length === 0) continue;

  if (!merged[rel]) merged[rel] = {};
  for (const [k, v] of Object.entries(found)) {
    if (!(k in merged[rel])) merged[rel][k] = v;
  }
}

writeFileSync(jsonPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('Merged into content/editable.json');
