import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { publicPages } from '../src/views.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: { base: { type: 'string', default: '' }, out: { type: 'string', default: 'dist' } } });
const base = values.base.replace(/\/$/, '');
if (base && !/^(\/[A-Za-z0-9-][A-Za-z0-9._-]*)+$/.test(base)) throw new Error('Invalid site base path');
const dist = resolve(root, values.out);
await mkdir(join(dist, 'assets'), { recursive: true });
await cp(join(root, 'src/assets'), join(dist, 'assets'), { recursive: true });
for (const module of ['app.js', 'data.js', 'views.js']) {
  await cp(join(root, 'src', module), join(dist, 'assets', module));
}
const pages = Object.entries(publicPages());
for (const [path, html] of pages) {
  const dir = join(dist, path);
  await mkdir(dir, { recursive: true });
  const mounted = html.replace(/\b(href|src)="\/(?!\/)/g, '$1="' + base + '/');
  await writeFile(join(dir, 'index.html'), mounted);
}
await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nDisallow:\n');
console.log('Built ' + pages.length + ' static HTML pages for ' + (base || '/'));
