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
    // 中國大陸只可使用官方零售價；不可自行編造 VP 與折扣等級。
    if (code === 'CN') {
      const retail = Number(product['官方零售價']);
      if (!Number.isFinite(retail) || retail <= 0) fail(`${prefix}: invalid China official retail price`);
      if (retail !== Number(product.retail_price)) fail(`${prefix}: China retail price mismatch`);
      if (product.vp_verified !== false || Number(product.vp) !== 0) fail(`${prefix}: China VP must remain unverified`);
      const unsupported = ['15%', '25%', '35%', '42%', '50%', '銅級', '銀級', '金級', '58%', 'cost'];
      if (unsupported.some(key => key in product)) fail(`${prefix}: China discount tier must not be invented`);
      if (stockNo.startsWith('CN') && product.stock_no_verified === true) fail(`${prefix}: internal stock number claimed as official`);
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

const mappedProductsSeen = new Set();
const groupIdsSeen = new Set();
for (const [index, group] of groups.entries()) {
  if (!group || typeof group !== 'object') { fail(`Comparison group #${index + 1}: invalid object`); continue; }
  if (!group.id) fail(`Comparison group #${index + 1}: missing id`);
  if (!group.label) fail(`Comparison group ${group.id || `#${index + 1}`}: missing label`);
  if (groupIdsSeen.has(group.id)) fail(`Duplicate comparison group id ${group.id}`);
  groupIdsSeen.add(group.id);
  if (group.comparisonMode && !['viewOnly'].includes(group.comparisonMode)) fail(`${group.id}: invalid comparisonMode`);
  if (group.nonComparableRegions && (!Array.isArray(group.nonComparableRegions) || group.nonComparableRegions.some(code => !countryConfigs[code]))) {
    fail(`${group.id}: invalid nonComparableRegions`);
  }
  let mapped = 0;
  for (const code of Object.keys(countryConfigs)) {
    const stockNo = group[code];
    if (!stockNo) continue;
    mapped += 1;
    const uniqueMapping = code + ':' + stockNo;
    if (mappedProductsSeen.has(uniqueMapping)) fail(`${group.id}: duplicate mapping ${uniqueMapping}`);
    mappedProductsSeen.add(uniqueMapping);
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
