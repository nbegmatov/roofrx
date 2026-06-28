import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const command of [
  'npm run sync:contacts',
  'npm run build:css',
  'npm run content:scan',
  "git diff --exit-code -- '*.html' 'js/site-modals.js' 'content/pages-index.json' 'content/editable.json' 'content/site-settings.json'",
]) {
  console.log(command);
  execSync(command, { cwd: root, stdio: 'inherit' });
}
