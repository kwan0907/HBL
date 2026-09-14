import fs from 'node:fs';
import path from 'node:path';

const required = [
  'index.html',
  'app.js',
  'styles.css',
  'manifest.json',
  'service-worker.js',
  'logo.svg',
  'package.json',
  'README.md',
  'src/app.js',
  'src/README.md',
  'src/styles/app.css',
  'config/countries.js',
  'config/comparison-map.js',
  'config/README.md',
  'data/hong-kong.js',
  'data/taiwan.js',
  'data/japan.js',
  'data/thailand.js',
  'data/README.md',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon-32.png',
  'scripts/validate-repo.mjs',
  'scripts/validate-data.mjs',
  'docs/ARCHITECTURE.md',
  'docs/MAINTENANCE.md'
];

const forbidden = [
  'countries.js',
  'comparison-map.js',
  'hong-kong.js',
  'taiwan.js',
  'japan.js',
  'thailand.js',
  'icon-192.png',
  'icon-512.png',
  'favicon-32.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-180.png',
  'data/app.js',
  'data/index.html',
  'data/styles.css',
  'data/manifest.json',
  'data/service-worker.js',
  'data/config',
  'data/data',
  'data/icons'
];

let failed = false;
function report(title, items) {
  if (!items.length) return;
  failed = true;
  console.error(title + ':');
  items.forEach(item => console.error('  - ' + item));
}

report('Missing required repository files', required.filter(file => !fs.existsSync(file)));
report('Duplicate/stale paths detected', forbidden.filter(file => fs.existsSync(file)));

const nestedDataDirs = [];
function walk(dir, depth = 0) {
  if (!fs.existsSync(dir) || depth > 6) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    const normalized = full.replaceAll('\\', '/');
    if (/\/data\/data(?:\/|$)/.test('/' + normalized)) nestedDataDirs.push(normalized);
    walk(full, depth + 1);
  }
}
walk('.');
report('Nested data/data directories detected', [...new Set(nestedDataDirs)]);

if (fs.existsSync('index.html')) {
  const index = fs.readFileSync('index.html', 'utf8');
  const expectedRefs = [
    './config/countries.js',
    './config/comparison-map.js',
    './data/hong-kong.js',
    './data/taiwan.js',
    './data/japan.js',
    './data/thailand.js',
    './app.js',
    './styles.css',
    './manifest.json'
  ];
  report('index.html is missing expected runtime references', expectedRefs.filter(ref => !index.includes(ref)));
}

if (fs.existsSync('app.js')) {
  const appBootstrap = fs.readFileSync('app.js', 'utf8');
  if (!appBootstrap.includes('./src/app.js')) {
    failed = true;
    console.error('app.js bootstrap must load ./src/app.js');
  }
  if (appBootstrap.length > 4096) {
    failed = true;
    console.error('app.js should remain a small compatibility bootstrap; move feature logic to src/app.js');
  }
}

if (fs.existsSync('styles.css')) {
  const styleBootstrap = fs.readFileSync('styles.css', 'utf8');
  if (!styleBootstrap.includes('./src/styles/app.css')) {
    failed = true;
    console.error('styles.css bootstrap must import ./src/styles/app.css');
  }
  if (styleBootstrap.length > 4096) {
    failed = true;
    console.error('styles.css should remain a small compatibility entry point; move CSS to src/styles/app.css');
  }
}

if (failed) process.exit(1);
console.log('HBL repository structure check passed.');
