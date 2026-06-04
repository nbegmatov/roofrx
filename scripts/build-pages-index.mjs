/**
 * Генерирует content/pages-index.json для статической админки (список разделов и страниц).
 * Запуск: node scripts/build-pages-index.mjs (входит в npm run build:css)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'content', 'pages-index.json');

const TITLE_RU = {
  'index.html': 'Главная',
  'about.html': 'О нас',
  'contacts.html': 'Контакты',
  'service-areas.html': 'Зона обслуживания',
  'portfolio.html': 'Портфолио',
  'services.html': 'Услуги (обзор)',
  'Privacy.html': 'Политика конфиденциальности',
  'termofservice.html': 'Условия использования',
  'terms.html': 'Редирект на условия (terms)',
  'services/residential.html': 'Услуга: жилые кровли',
  'services/commercial.html': 'Услуга: коммерция',
  'services/metal.html': 'Услуга: металл',
  'services/flat.html': 'Услуга: плоская кровля',
  'services/repair.html': 'Услуга: ремонт',
  'services/emergency.html': 'Услуга: аварийные работы',
};

function readTitle(rel) {
  try {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    const m = raw.match(/<title[^>]*>([^<]*)<\/title>/i);
    return TITLE_RU[rel] || (m ? m[1].trim() : rel);
  } catch {
    return rel;
  }
}

function row(file) {
  return {
    file,
    title: readTitle(file),
    url: '/' + file.replace(/\\/g, '/'),
  };
}

const pagesFiles = [
  'index.html',
  'about.html',
  'contacts.html',
  'service-areas.html',
  'portfolio.html',
  'services.html',
  'Privacy.html',
  'termofservice.html',
  'terms.html',
].filter((f) => fs.existsSync(path.join(root, f)));

const projectsRows = [];
if (fs.existsSync(path.join(root, 'portfolio.html'))) projectsRows.push(row('portfolio.html'));
const pdir = path.join(root, 'projects');
if (fs.existsSync(pdir)) {
  fs.readdirSync(pdir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .forEach((f) => projectsRows.push(row(`projects/${f}`)));
}
if (fs.existsSync(path.join(root, 'services.html'))) projectsRows.push(row('services.html'));

const servicesRows = [];
if (fs.existsSync(path.join(root, 'services.html'))) servicesRows.push(row('services.html'));
const sdir = path.join(root, 'services');
if (fs.existsSync(sdir)) {
  fs.readdirSync(sdir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .forEach((f) => servicesRows.push(row(`services/${f}`)));
}

const payload = {
  sections: [
    { id: 'pages', label: 'Страницы', rows: pagesFiles.map((f) => row(f)) },
    { id: 'projects', label: 'Проекты', rows: projectsRows },
    { id: 'services', label: 'Услуги', rows: servicesRows },
  ],
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('Wrote content/pages-index.json');
