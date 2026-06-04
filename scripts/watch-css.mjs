import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { cssBundles } from './css-bundles.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tailwindBin = join(root, 'node_modules', '.bin', 'tailwindcss');
const tailwindWin = join(root, 'node_modules', '.bin', 'tailwindcss.cmd');
const cmd =
  process.platform === 'win32' && existsSync(tailwindWin) ? tailwindWin : tailwindBin;

const children = [];

for (const page of cssBundles) {
  const args = [
    '-i',
    join(root, 'css', 'source.css'),
    '-o',
    join(root, page.out),
    '--watch',
    ...page.content.flatMap((f) => ['--content', join(root, f)]),
  ];
  const child = spawn(cmd, args, { stdio: 'inherit', cwd: root, shell: false });
  children.push(child);
}

function shutdown() {
  for (const c of children) {
    if (c && !c.killed) c.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
