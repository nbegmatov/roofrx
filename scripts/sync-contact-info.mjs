import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const settingsPath = join(root, 'content', 'site-settings.json');

const modalScriptName = 'site-modals-ga4.js';

const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
const site = settings.site;
const phone = settings.contact?.phone;
const email = settings.contact?.email;

if (!site?.name || !site?.legalName || !site?.domain || !site?.url || !phone?.href || !phone?.display || !email?.href || !email?.display) {
  console.error('Missing site/contact settings in content/site-settings.json');
  process.exit(1);
}

const phoneUri = phone.href.replace(/^tel:/, '');
const emailUri = email.href.replace(/^mailto:/, '');

const replacements = [
  ['href="tel:+78001234567"', `href="${phone.href}"`],
  ['href="tel:+13030000000"', `href="${phone.href}"`],
  ['href="tel:+12676167534"', `href="${phone.href}"`],
  ['href="tel:+13034766379"', `href="${phone.href}"`],
  ['href="tel:+17200766379"', `href="${phone.href}"`],
  ['tel:+78001234567', `tel:${phoneUri}`],
  ['tel:+13030000000', `tel:${phoneUri}`],
  ['tel:+12676167534', `tel:${phoneUri}`],
  ['tel:+13034766379', `tel:${phoneUri}`],
  ['tel:+17200766379', `tel:${phoneUri}`],
  ['(303) 555-0100', phone.display],
  ['Call (267) 616-7534', `Call ${phone.display}`],
  ['Call +1 (303) 000-0000', `Call ${phone.display}`],
  ['Call 303 iroofrx', `Call ${phone.display}`],
  ['Call 720 0roofrx', `Call ${phone.display}`],
  ['(267) 616-7534', phone.display],
  ['303 iroofrx', phone.display],
  ['720 0roofrx', phone.display],
  ['+1 (303) 000-0000', phone.display],
  ['8 800 123 45 67', phone.display],
  ['href="mailto:info@roofing.com"', `href="${email.href}"`],
  ['href="mailto:info@colorado-roofing.com"', `href="${email.href}"`],
  ['mailto:info@roofing.com', `mailto:${emailUri}`],
  ['mailto:info@colorado-roofing.com', `mailto:${emailUri}`],
  ['info@colorado-roofing.com', email.display],
  ['info@roofing.com', email.display],
  ['href="mailto:intermtnroofing@gmail.com"', `href="${email.href}"`],
  ['mailto:intermtnroofing@gmail.com', `mailto:${emailUri}`],
  ['intermtnroofing@gmail.com', email.display],
  ['https://intermtnroofing.com', site.url],
  ['intermtnroofing.com', site.domain],
  ['Intermountain Roofing &amp; Construction', site.legalName],
  ['Intermountain Roofing', site.name],
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
    if (relPath === 'js/site-modals.js' || relPath === `js/${modalScriptName}` || relPath.endsWith('.html')) {
      yield relPath;
    }
  }
}

function updateFile(relPath, regexReplacements = []) {
  const filePath = join(root, relPath);
  const raw = readFileSync(filePath, 'utf8');
  let out = raw;

  for (const [from, to] of replacements) {
    out = out.replaceAll(from, to);
  }

  for (const [pattern, to] of regexReplacements) {
    out = out.replace(pattern, to);
  }

  if (out === raw) return;

  writeFileSync(filePath, out, 'utf8');
  console.log(`Updated ${relPath}`);
}

const relPaths = [...walk(root)];

if (relPaths.includes('js/site-modals.js')) {
  updateFile('js/site-modals.js');
}

if (relPaths.includes(`js/${modalScriptName}`)) {
  updateFile(`js/${modalScriptName}`);
}

const modalScriptPath = join(root, 'js', modalScriptName);
const modalScriptVersion = createHash('sha1').update(readFileSync(modalScriptPath, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 10);
const htmlRegexReplacements = [
  [/src="js\/site-modals(?:-ga4)?\.js(?:\?v=[^"]+)?"/g, `src="js/${modalScriptName}?v=${modalScriptVersion}"`],
  [/src="\.\.\/js\/site-modals(?:-ga4)?\.js(?:\?v=[^"]+)?"/g, `src="../js/${modalScriptName}?v=${modalScriptVersion}"`],
];

for (const relPath of relPaths) {
  if (relPath.endsWith('.html')) {
    updateFile(relPath, htmlRegexReplacements);
  }
}
