import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cssBundles } from './css-bundles.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const minify = process.argv.includes('--no-minify') ? '' : '--minify';

for (const page of cssBundles) {
  const contentFiles = page.content;
  const parts = [
    'npx',
    'tailwindcss',
    '-i',
    join(root, 'css', 'source.css'),
    '-o',
    join(root, page.out),
    ...contentFiles.flatMap((f) => ['--content', join(root, f)]),
    minify,
  ].filter(Boolean);
  const cmd = parts.join(' ');
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

spawnSync(process.execPath, [join(root, 'scripts', 'build-pages-index.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

spawnSync(process.execPath, [join(root, 'scripts', 'build-sitemap.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
