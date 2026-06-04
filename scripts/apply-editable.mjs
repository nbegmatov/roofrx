/**
 * Writes content/editable.json into HTML files.
 * - meta.title → <title>
 * - meta.description → <meta name="description" content>
 * - [data-editable-src="key"] → src attribute
 * - [data-editable="key"] → text content
 * Updates content/page-meta.json (last generation time per file).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'content', 'editable.json');
const metaPath = join(root, 'content', 'page-meta.json');

if (!existsSync(jsonPath)) {
  console.error('Missing content/editable.json');
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
let pageMeta = {};
if (existsSync(metaPath)) {
  try {
    pageMeta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    pageMeta = {};
  }
}

const now = new Date().toISOString();

for (const [relFile, fields] of Object.entries(data)) {
  if (!fields || typeof fields !== 'object') continue;
  const filePath = join(root, relFile);
  if (!existsSync(filePath)) {
    console.warn(`Skip missing file: ${relFile}`);
    continue;
  }

  let raw = readFileSync(filePath, 'utf8');
  const doctype = raw.match(/^<!DOCTYPE[^>]*>\s*/i)?.[0] ?? '';

  const $ = cheerio.load(raw, { decodeEntities: false });

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    const str = String(value);
    const safe = String(key).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    if (key === 'meta.title') {
      $('title').first().text(str);
    } else if (key === 'meta.description') {
      let meta = $('meta[name="description"]').first();
      if (!meta.length) {
        $('head').append(`<meta name="description" content="" />`);
        meta = $('meta[name="description"]').first();
      }
      meta.attr('content', str);
    } else {
      const srcEl = $(`[data-editable-src="${safe}"]`);
      if (srcEl.length) {
        srcEl.attr('src', str);
        continue;
      }
      const el = $(`[data-editable="${safe}"]`);
      if (!el.length) {
        console.warn(`  [${relFile}] no [data-editable-src/data-editable="${key}"]`);
        continue;
      }
      el.text(str);
    }
  }

  let out = $.html({ decodeEntities: false });
  if (doctype && !/^<!DOCTYPE/i.test(out.trimStart())) {
    out = doctype + out;
  }
  writeFileSync(filePath, out, 'utf8');
  pageMeta[relFile] = now;
  console.log(`Updated ${relFile}`);
}

mkdirSync(dirname(metaPath), { recursive: true });
writeFileSync(metaPath, JSON.stringify(pageMeta, null, 2) + '\n', 'utf8');
console.log('Wrote content/page-meta.json');
