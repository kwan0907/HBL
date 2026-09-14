import fs from 'node:fs';

const required = [
  'index.html',
  'app.js',
  'styles.css',
  'manifest.json',
  'service-worker.js',
  'logo.svg',
  'src/app.js',
  'src/styles/app.css',
  'config/countries.js',
  'config/comparison-map.js',
  'data/hong-kong.js',
  'data/taiwan.js',
  'data/japan.js',
  'data/thailand.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon-32.png'
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

const missing = required.filter(path => !fs.existsSync(path));
const duplicates = forbidden.filter(path => fs.existsSync(path));

let failed = false;
if (missing.length) {
  failed = true;
  console.error('Missing required runtime files:');
  missing.forEach(path => console.error('  - ' + path));
}
if (duplicates.length) {
  failed = true;
  console.error('Duplicate/stale paths detected:');
  duplicates.forEach(path => console.error('  - ' + path));
}

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
const missingRefs = expectedRefs.filter(ref => !index.includes(ref));
if (missingRefs.length) {
  failed = true;
  console.error('index.html is missing expected runtime references:');
  missingRefs.forEach(ref => console.error('  - ' + ref));
}

const appBootstrap = fs.readFileSync('app.js', 'utf8');
if (!appBootstrap.includes('./src/app.js')) {
  failed = true;
  console.error('app.js bootstrap must load ./src/app.js');
}

const styleBootstrap = fs.readFileSync('styles.css', 'utf8');
if (!styleBootstrap.includes('./src/styles/app.css')) {
  failed = true;
  console.error('styles.css bootstrap must import ./src/styles/app.css');
}

if (failed) process.exit(1);
console.log('HBL repository structure check passed.');
