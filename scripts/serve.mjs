import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { publicPages, resultsView } from '../src/views.js';
import { routesByPath, today, validDate } from '../src/data.js';

const args = process.argv.slice(2);
const argument = (key, fallback) => {
  const position = args.indexOf(key);
  return position >= 0 ? args[position + 1] : fallback;
};
const host = argument('--host', '0.0.0.0');
const port = Number(argument('--port', process.env.PORT || '4173'));
const root = fileURLToPath(new URL('../src/', import.meta.url));
const mime = { css: 'text/css', js: 'text/javascript', webp: 'image/webp', svg: 'image/svg+xml', ttf: 'font/ttf', txt: 'text/plain' };
const modules = new Set(['app.js', 'data.js', 'views.js']);

createServer(async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const url = new URL(req.url, 'http://prototype.local');
  const path = url.pathname;
  if (path === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('User-agent: *\nDisallow:\n');
  }
  if (path.startsWith('/assets/')) {
    const name = path.slice('/assets/'.length);
    const assets = resolve(root, 'assets');
    const file = modules.has(name) ? resolve(root, name) : resolve(assets, name);
    try {
      if (!modules.has(name) && !file.startsWith(assets + sep)) throw new Error('Outside assets');
      const contents = await readFile(file);
      res.setHeader('Content-Type', mime[name.split('.').at(-1)] || 'application/octet-stream');
      return res.end(contents);
    } catch {
      res.writeHead(404);
      return res.end('Not found');
    }
  }
  const pages = publicPages();
  if (path !== '/' && !path.endsWith('/') && Object.hasOwn(pages, path + '/')) {
    res.writeHead(308, { Location: path + '/' + url.search });
    return res.end();
  }
  if (Object.hasOwn(pages, path)) {
    const route = routesByPath[path];
    const date = url.searchParams.get('date');
    const html = route && validDate(date) && date >= today() ? resultsView(route, date) : pages[path];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(html);
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><html lang="ru"><meta charset="utf-8"><title>Страница не найдена</title><h1>Страница не найдена</h1><a href="/">На главную</a></html>');
}).listen(port, host, () => {
  console.log('Prototype running at http://localhost:' + port + '/');
});
