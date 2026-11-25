import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist-pages');
const base = '/bileticket';
const stableVersion = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function build(source, destination, mountPath, date) {
  execFileSync('npm', ['run', 'build', '--', '--out', destination, '--base', mountPath], {
    cwd: source,
    stdio: 'inherit',
    env: { ...process.env, TUDASUDA_BUILD_DATE: date },
  });
}

function checkOutput() {
  const entry = lstatSync(output, { throwIfNoEntry: false });
  if (entry && !entry.isDirectory()) {
    throw new Error(`Pages output must be a directory: ${output}`);
  }
}

function versionsIndex(versions) {
  const links = versions.map((version) => `    <li><a href="./${version}/">${version}</a></li>`);
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Версии прототипа | Туда-сюда</title>
  <style>
    body { max-width: 36rem; margin: 3rem auto; padding: 0 1rem; font: 1rem/1.5 system-ui, sans-serif; }
  </style>
</head>
<body>
  <main>
    <h1>Версии прототипа «Туда-сюда»</h1>
    <p><a href="../">Текущая версия</a></p>
    <ul>
${links.join('\n')}
    </ul>
  </main>
</body>
</html>
`;
}

if (process.argv.length > 2) {
  throw new Error('Run without arguments: node scripts/build-pages.mjs');
}

checkOutput();
const versions = git('tag', '--list', '--sort=-version:refname')
  .split('\n')
  .filter((version) => stableVersion.test(version));
const staging = await mkdtemp(join(root, '.pages-build-'));

try {
  const site = join(staging, 'site');
  build(root, site, base, process.env.TUDASUDA_BUILD_DATE);

  const archive = join(staging, 'source.tar');
  const archiveRoot = join(site, 'versions');
  await mkdir(archiveRoot, { recursive: true });
  for (const version of versions) {
    const ref = `refs/tags/${version}`;
    const source = join(staging, version);
    await mkdir(source);
    git('archive', '--format=tar', '--output', archive, ref);
    execFileSync('tar', ['-xf', archive, '-C', source], { stdio: 'inherit' });
    const date = git('log', '-1', '--format=%cs', ref);
    build(source, join(archiveRoot, version), `${base}/versions/${version}`, date);
  }

  await writeFile(join(archiveRoot, 'index.html'), versionsIndex(versions));
  checkOutput();
  await rm(output, { recursive: true, force: true });
  await rename(site, output);
  console.log(`Built GitHub Pages in dist-pages/ with ${versions.length} archived version(s)`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
