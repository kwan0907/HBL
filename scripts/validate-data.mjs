import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const failures = [];
const warnings = [];
const context = vm.createContext({ window: {} });

function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function run(rel) {
  if (!exists(rel)) { fail(`Missing file: ${rel}`); return; }
  try {
    vm.runInContext(read(rel), context, { filename: rel });
  } catch (error) {
    fail(`${rel} cannot be evaluated: ${error.message}`);
  }
}

run('config/countries.js');
run('config/comparison-map.js');

const countryConfigs = context.window.HBL_COUNTRY_CONFIGS || {};
const currencies = context.window.HBL_CURRENCY_META || {};
const groups = context.window.HBL_COMPARISON_GROUPS || [];

if (!Object.keys(countryConfigs).length) fail('No country configs found in config/countries.js');
if (!Object.keys(currencies).length) fail('No currency metadata found in config/countries.js');
if (!Array.isArray(groups)) fail('HBL_COMPARISON_GROUPS must be an array');

for (const [code, config] of Object.entries(countryConfigs)) {
  if (!config || typeof config !== 'object') { fail(`${code}: invalid country config`); continue; }
  if (!config.name) fail(`${code}: missing name`);
  if (!config.currencyCode || !currencies[config.currencyCode]) fail(`${code}: invalid currencyCode ${config.currencyCode || '(missing)'}`);
  if (!config.dataFile) { fail(`${code}: missing dataFile`); continue; }

  const rel = String(config.dataFile).replace(/^\.\//, '');
  if (!exists(rel)) { fail(`${code}: dataFile does not exist: ${rel}`); continue; }
  run(rel);

  const data = context.window.HBL_COUNTRY_DATA?.[code];
  if (!data || !Array.isArray(data.products)) { fail(`${code}: data file did not register window.HBL_COUNTRY_DATA.${code}.products`); continue; }
  if (!data.products.length) fail(`${code}: products array is empty`);

  const seen = new Set();
  for (const [index, product] of data.products.entries()) {
    const prefix = `${code} product #${index + 1}`;
    if (!product || typeof product !== 'object') { fail(`${prefix}: invalid product object`); continue; }
    const stockNo = String(product.stock_no ?? '').trim();
    if (!stockNo) fail(`${prefix}: missing stock_no`);
    else if (seen.has(stockNo)) fail(`${code}: duplicate stock_no ${stockNo}`);
    else seen.add(stockNo);
    if (!String(product.prod_name ?? '').trim()) fail(`${code} ${stockNo || `#${index + 1}`}: missing prod_name`);
    if (product.vp !== undefined && product.vp !== null && !Number.isFinite(Number(product.vp))) {
      fail(`${code} ${stockNo}: vp is not numeric`);
    }
  }

  if (!Array.isArray(config.tiers) || !config.tiers.length) fail(`${code}: tiers must be a non-empty array`);
  if (config.defaultTier && Array.isArray(config.tiers) && !config.tiers.some(item => Array.isArray(item) && item[0] === config.defaultTier)) {
    fail(`${code}: defaultTier ${config.defaultTier} is not listed in tiers`);
  }
}

const countryProducts = Object.fromEntries(Object.keys(countryConfigs).map(code => [
  code,
  new Set((context.window.HBL_COUNTRY_DATA?.[code]?.products || []).map(p => String(p.stock_no)))
]));

for (const [index, group] of groups.entries()) {
  if (!group || typeof group !== 'object') { fail(`Comparison group #${index + 1}: invalid object`); continue; }
  if (!group.id) fail(`Comparison group #${index + 1}: missing id`);
  if (!group.label) fail(`Comparison group ${group.id || `#${index + 1}`}: missing label`);
  let mapped = 0;
  for (const code of Object.keys(countryConfigs)) {
    const stockNo = group[code];
    if (!stockNo) continue;
    mapped += 1;
    if (!countryProducts[code]?.has(String(stockNo))) {
      fail(`Comparison group ${group.id || group.label}: ${code} stock_no ${stockNo} does not exist in active data`);
    }
  }
  if (mapped === 0) warn(`Comparison group ${group.id || group.label || `#${index + 1}`} has no active country mapping`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (failures.length) {
  console.error('\nHBL data validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const productTotal = Object.keys(countryConfigs).reduce((sum, code) => sum + (context.window.HBL_COUNTRY_DATA?.[code]?.products?.length || 0), 0);
console.log(`HBL data validation passed: ${Object.keys(countryConfigs).length} regions, ${productTotal} products, ${groups.length} comparison groups.`);
