import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const settingsPath = join(root, 'content', 'site-settings.json');

const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
const phone = settings.contact?.phone;
const email = settings.contact?.email;

if (!phone?.href || !phone?.display || !email?.href || !email?.display) {
  console.error('Missing contact settings in content/site-settings.json');
  process.exit(1);
}

const phoneUri = phone.href.replace(/^tel:/, '');
const emailUri = email.href.replace(/^mailto:/, '');

const replacements = [
  ['href="tel:+78001234567"', `href="${phone.href}"`],
  ['href="tel:+13030000000"', `href="${phone.href}"`],
  ['tel:+78001234567', `tel:${phoneUri}`],
  ['tel:+13030000000', `tel:${phoneUri}`],
  ['Call +1 (303) 000-0000', `Call ${phone.display}`],
  ['+1 (303) 000-0000', phone.display],
  ['8 800 123 45 67', phone.display],
  ['href="mailto:info@roofing.com"', `href="${email.href}"`],
  ['href="mailto:info@colorado-roofing.com"', `href="${email.href}"`],
  ['mailto:info@roofing.com', `mailto:${emailUri}`],
  ['mailto:info@colorado-roofing.com', `mailto:${emailUri}`],
  ['info@colorado-roofing.com', email.display],
  ['info@roofing.com', email.display],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const fullPath = join(dir, name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (name === 'admin' || name === 'admni') continue;
      yield* walk(fullPath);
      continue;
    }

    const relPath = relative(root, fullPath).split('\\').join('/');
    if (relPath === 'js/site-modals.js' || relPath.endsWith('.html')) {
      yield relPath;
    }
  }
}

function updateFile(relPath) {
  const filePath = join(root, relPath);
  const raw = readFileSync(filePath, 'utf8');
  let out = raw;

  for (const [from, to] of replacements) {
    out = out.replaceAll(from, to);
  }

  if (out === raw) return;

  writeFileSync(filePath, out, 'utf8');
  console.log(`Updated ${relPath}`);
}

for (const relPath of walk(root)) {
  if (relPath.endsWith('.html') || relPath === 'js/site-modals.js') {
    updateFile(relPath);
  }
}
