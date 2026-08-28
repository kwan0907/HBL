const COUNTRY_CONFIGS = window.HBL_COUNTRY_CONFIGS || {};
const CURRENCY_META = window.HBL_CURRENCY_META || {};
const COMPARISON_GROUPS = window.HBL_COMPARISON_GROUPS || [];
const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS);
const ALL_CURRENCIES = Object.keys(CURRENCY_META);
const BASE_CURRENCY = 'HKD';
const FX_API_URL = 'https://open.er-api.com/v6/latest/HKD';
const FX_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
const FX_LAST_UPDATED_KEY = 'calcExchangeRatesLastUpdated';
const countryState = Object.fromEntries(ALL_COUNTRIES.map(code => [code, {
  selected: [], tier1: COUNTRY_CONFIGS[code].defaultTier, tier2: '', includeFreight: false
}]));

let currentCountry = ALL_COUNTRIES[0] || 'HK';
let productsData = [];
let originalProductsData = [];
let includeFreight = false;
let currentWorkspace = 'single';
let singleCurrencyMode = 'AUTO';
let comparisonCurrency = BASE_CURRENCY;
let comparisonTier = 'retail';
let comparisonSort = { country: currentCountry, direction: 'asc' };
let exchangeRates = Object.fromEntries(ALL_CURRENCIES.map(code => [code, Number(CURRENCY_META[code].ratePerHKD) || 1]));
let selectedProducts = [];
let currentCategory = 'all';
let currentView = 'table';
let newlyAddedStockNos = new Set();
let candidateStockNos = new Set();
let currentStrategy = 'accurate';
let vpWorker = null;

function regionCountLabel() {
  const chinese = { 1:'單區', 2:'兩區', 3:'三區', 4:'四區', 5:'五區', 6:'六區' };
  return chinese[ALL_COUNTRIES.length] || ALL_COUNTRIES.length + '區';
}

function loadScript(src, fresh = false) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = fresh ? src + (src.includes('?') ? '&' : '?') + 'fresh=' + Date.now() : src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('無法載入：' + src));
    document.head.appendChild(script);
  });
}

async function loadCountryDataFiles() {
  window.HBL_COUNTRY_DATA = window.HBL_COUNTRY_DATA || {};
  for (const code of ALL_COUNTRIES) {
    if (!window.HBL_COUNTRY_DATA[code]) await loadScript(COUNTRY_CONFIGS[code].dataFile, true);
    if (!Array.isArray(window.HBL_COUNTRY_DATA[code]?.products)) throw new Error(code + ' 地區資料格式不正確');
  }
}

async function reloadCountryPriceData() {
  const button = document.getElementById('price-data-refresh');
  const backup = { ...(window.HBL_COUNTRY_DATA || {}) };
  if (button) { button.disabled = true; button.textContent = '更新中…'; }
  try {
    saveCurrentCountryState();
    window.HBL_COUNTRY_DATA = {};
    for (const code of ALL_COUNTRIES) {
      await loadScript(COUNTRY_CONFIGS[code].dataFile, true);
      if (!Array.isArray(window.HBL_COUNTRY_DATA[code]?.products)) throw new Error(code + ' 地區資料格式不正確');
    }
    hydrateCountryProducts(currentCountry);
    restoreCountrySelection();
    refreshCountryUi();
    if (getCountryConfig().supportsFreight && includeFreight) toggleFreight(true, false);
    else updateFreightButtons(false);
    initCategories();
    updateProductDisplay();
    filterProducts();
    renderComparison();
    showToast('✅ 已重新載入各區最新價目');
  } catch (error) {
    console.error('重新載入價目失敗', error);
    window.HBL_COUNTRY_DATA = backup;
    hydrateCountryProducts(currentCountry);
    restoreCountrySelection();
    refreshCountryUi();
    updateProductDisplay();
    showToast('未能更新價目，已保留目前版本');
  } finally {
    if (button) { button.disabled = false; button.textContent = '🔄 更新價目'; }
  }
}

function renderDynamicControls() {
  document.documentElement.style.setProperty('--country-count', String(Math.max(ALL_COUNTRIES.length, 1)));
  document.getElementById('country-buttons').innerHTML = ALL_COUNTRIES.map((code, index) =>
    '<button class="font-ctrl-btn' + (index === 0 ? ' active' : '') + '" id="country-' + code.toLowerCase() + '" onclick="switchCountry(&quot;' + code + '&quot;)">' + COUNTRY_CONFIGS[code].flag + ' ' + COUNTRY_CONFIGS[code].name + '</button>'
  ).join('');
  document.getElementById('single-currency-buttons').innerHTML =
    '<button id="single-currency-auto" class="active" onclick="setSingleCurrency(&quot;AUTO&quot;)">自動／當地</button>' +
    ALL_CURRENCIES.map(code => '<button id="single-currency-' + code.toLowerCase() + '" onclick="setSingleCurrency(&quot;' + code + '&quot;)">' + CURRENCY_META[code].label + '</button>').join('');
  document.getElementById('compare-currency-buttons').innerHTML = ALL_CURRENCIES.map((code, index) =>
    '<button id="compare-currency-' + code.toLowerCase() + '" class="' + (index === 0 ? 'active' : '') + '" onclick="setComparisonCurrency(&quot;' + code + '&quot;)">' + CURRENCY_META[code].label + '</button>'
  ).join('');
  document.getElementById('compare-sort-buttons').innerHTML = ALL_COUNTRIES.map((code, index) =>
    '<button id="compare-sort-' + code.toLowerCase() + '" class="' + (index === 0 ? 'active' : '') + '" onclick="sortComparison(&quot;' + code + '&quot;)">' + COUNTRY_CONFIGS[code].flag + ' ' + COUNTRY_CONFIGS[code].name + ' ' + (index === 0 ? '↑' : '↕') + '</button>'
  ).join('');
  document.getElementById('rate-editor-fields').innerHTML = ALL_CURRENCIES.filter(code => code !== BASE_CURRENCY).map(code =>
    '<div class="rate-input-row"><span>1 ' + BASE_CURRENCY + ' =</span><input id="rate-' + code.toLowerCase() + '" type="number" inputmode="decimal" step="0.0001"><span>' + code + '</span></div>'
  ).join('');
  document.getElementById('mode-compare-btn').textContent = '🌍 ' + regionCountLabel() + '格價';
  document.getElementById('compare-panel-title').textContent = '🌍 ' + regionCountLabel() + '產品格價';
}

function getCountryConfig() { return COUNTRY_CONFIGS[currentCountry]; }

function getCountryProducts(country) {
  return window.HBL_COUNTRY_DATA?.[country]?.products || [];
}
function hydrateCountryProducts(country) {
  productsData = JSON.parse(JSON.stringify(getCountryProducts(country)));
  originalProductsData = JSON.parse(JSON.stringify(productsData));
}


function getSingleDisplayCurrency() {
  return singleCurrencyMode === 'AUTO' ? getCountryConfig().currencyCode : singleCurrencyMode;
}

function convertCurrency(amount, fromCountry, targetCurrency) {
  const sourceCode = COUNTRY_CONFIGS[fromCountry]?.currencyCode || fromCountry;
  const sourceRate = exchangeRates[sourceCode];
  const targetRate = exchangeRates[targetCurrency];
  if (!Number.isFinite(Number(amount)) || !sourceRate || !targetRate) return null;
  return (Number(amount) / sourceRate) * targetRate;
}

function formatCurrencyAmount(amount, currencyCode, forceInteger = false) {
  const meta = CURRENCY_META[currencyCode];
  const value = Number(amount);
  if (!meta || !Number.isFinite(value)) return '—';
  const decimals = forceInteger ? 0 : meta.decimals;
  return meta.symbol + value.toLocaleString(meta.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatConvertedPrice(amount, fromCountry = currentCountry, isPackage = false, targetCurrency = getSingleDisplayCurrency()) {
  const converted = convertCurrency(amount, fromCountry, targetCurrency);
  const forceInteger = isPackage && fromCountry === 'HK' && targetCurrency === 'HKD';
  return formatCurrencyAmount(converted, targetCurrency, forceInteger);
}

function formatRateValue(value) {
  return Number(value).toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
}
function formatRateTimestamp(timestamp) {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('zh-HK', {
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
  });
}
function setRateStatus(message, state = '') {
  const status = document.getElementById('rate-update-status');
  if (!status) return;
  status.textContent = message;
  status.className = 'rate-update-status' + (state ? ' ' + state : '');
}
function syncExchangeRateInputs() {
  ALL_CURRENCIES.filter(code => code !== BASE_CURRENCY).forEach(code => {
    const input = document.getElementById('rate-' + code.toLowerCase());
    if (input) input.value = formatRateValue(exchangeRates[code]);
  });
}
function persistExchangeRates(updatedAt = Date.now()) {
  try {
    localStorage.setItem('calcExchangeRates', JSON.stringify(exchangeRates));
    localStorage.setItem(FX_LAST_UPDATED_KEY, String(updatedAt));
  } catch(e) {}
}
function redrawCurrencyPrices() {
  refreshCurrencyUi();
  updateProductDisplay();
  filterProducts();
  renderComparison();
}

function initCurrencySettings() {
  try {
    const savedRates = JSON.parse(localStorage.getItem('calcExchangeRates') || 'null');
    if (savedRates) ALL_CURRENCIES.forEach(code => {
      if (Number(savedRates[code]) > 0) exchangeRates[code] = Number(savedRates[code]);
    });
    exchangeRates[BASE_CURRENCY] = 1;
    const savedSingle = localStorage.getItem('calcSingleCurrency');
    if (savedSingle === 'AUTO' || ALL_CURRENCIES.includes(savedSingle)) singleCurrencyMode = savedSingle;
    const savedCompare = localStorage.getItem('calcComparisonCurrency');
    if (ALL_CURRENCIES.includes(savedCompare)) comparisonCurrency = savedCompare;
  } catch(e) {}
  syncExchangeRateInputs();
  refreshCurrencyUi();
  try {
    const lastUpdated = Number(localStorage.getItem(FX_LAST_UPDATED_KEY));
    if (lastUpdated > 0) setRateStatus('上次匯率更新：' + formatRateTimestamp(lastUpdated));
  } catch(e) {}
}
function refreshCurrencyUi() {
  ['AUTO', ...ALL_CURRENCIES].forEach(code => {
    const btn = document.getElementById('single-currency-' + code.toLowerCase());
    if (btn) btn.classList.toggle('active', singleCurrencyMode === code);
  });
  ALL_CURRENCIES.forEach(code => {
    const btn = document.getElementById('compare-currency-' + code.toLowerCase());
    if (btn) btn.classList.toggle('active', comparisonCurrency === code);
  });
  const singleCode = getSingleDisplayCurrency();
  document.getElementById('single-currency-current').textContent = CURRENCY_META[singleCode].label;
  document.getElementById('single-currency-note').textContent = singleCurrencyMode === 'AUTO'
    ? '自動模式：' + getCountryConfig().flag + ' ' + getCountryConfig().name + '產品顯示' + CURRENCY_META[singleCode].label + '。'
    : '已統一換算為' + CURRENCY_META[singleCode].label + '；產品原始價格資料沒有改動。';
  document.getElementById('compare-currency-current').textContent = CURRENCY_META[comparisonCurrency].label;
  document.getElementById('rate-summary').textContent = ALL_CURRENCIES.map((code, index) =>
    (index === 0 ? '1 ' + BASE_CURRENCY : formatRateValue(exchangeRates[code]) + ' ' + code)
  ).join(' = ');
  refreshPackagePlanPrices();
}
function setSingleCurrency(code) {
  if (code !== 'AUTO' && !ALL_CURRENCIES.includes(code)) return;
  singleCurrencyMode = code;
  try { localStorage.setItem('calcSingleCurrency', code); } catch(e) {}
  refreshCurrencyUi(); updateProductDisplay(); filterProducts();
  showToast(code === 'AUTO' ? '已按地區顯示當地貨幣' : '全部價格已換算為' + CURRENCY_META[code].label);
}
function setComparisonCurrency(code) {
  if (!ALL_CURRENCIES.includes(code)) return;
  comparisonCurrency = code;
  try { localStorage.setItem('calcComparisonCurrency', code); } catch(e) {}
  refreshCurrencyUi(); renderComparison();
}
function saveExchangeRates() {
  const nextRates = { [BASE_CURRENCY]: 1 };
  for (const code of ALL_CURRENCIES.filter(code => code !== BASE_CURRENCY)) {
    const value = Number(document.getElementById('rate-' + code.toLowerCase()).value);
    if (!(value > 0)) { showToast('請輸入有效匯率'); return; }
    nextRates[code] = value;
  }
  exchangeRates = nextRates;
  const updatedAt = Date.now();
  persistExchangeRates(updatedAt);
  syncExchangeRateInputs(); redrawCurrencyPrices();
  setRateStatus('手動匯率已儲存：' + formatRateTimestamp(updatedAt), 'success');
  showToast('匯率已更新，所有價格已重新換算');
}
async function refreshExchangeRatesFromApi(announce = true) {
  const button = document.getElementById('rate-refresh-btn');
  if (button) { button.disabled = true; button.textContent = '更新中…'; }
  setRateStatus('正在取得最新參考匯率…', 'loading');
  try {
    const response = await fetch(FX_API_URL, { cache:'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (data?.result !== 'success' || data?.base_code !== BASE_CURRENCY || !data?.rates) throw new Error('匯率資料格式不正確');
    const nextRates = { [BASE_CURRENCY]: 1 };
    for (const code of ALL_CURRENCIES.filter(code => code !== BASE_CURRENCY)) {
      const rate = Number(data.rates[code]);
      if (!(rate > 0)) throw new Error('缺少 ' + code + ' 匯率');
      nextRates[code] = rate;
    }
    exchangeRates = nextRates;
    const updatedAt = Number(data.time_last_update_unix) > 0
      ? Number(data.time_last_update_unix) * 1000
      : Date.now();
    persistExchangeRates(updatedAt);
    syncExchangeRateInputs(); redrawCurrencyPrices();
    setRateStatus('自動匯率已更新：' + formatRateTimestamp(updatedAt), 'success');
    if (announce) showToast('✅ 已取得最新匯率並重新格價');
    return true;
  } catch (error) {
    console.warn('匯率自動更新失敗', error);
    setRateStatus('自動更新失敗；目前保留原匯率，可手動輸入。', 'error');
    if (announce) showToast('未能連線取得匯率，已保留原設定');
    return false;
  } finally {
    if (button) { button.disabled = false; button.textContent = '🔄 取得最新匯率'; }
  }
}
function maybeAutoRefreshExchangeRates() {
  let lastUpdated = 0;
  try { lastUpdated = Number(localStorage.getItem(FX_LAST_UPDATED_KEY)) || 0; } catch(e) {}
  if (!lastUpdated || Date.now() - lastUpdated >= FX_REFRESH_INTERVAL) {
    refreshExchangeRatesFromApi(false);
  }
}
function refreshPackagePlanPrices() {
  document.querySelectorAll('.package-plan-btn').forEach(btn => {
    const match = (btn.getAttribute('onclick') || '').match(/'([^']+)'/);
    if (!match) return;
    const product = getCountryProducts('HK').find(p => p.stock_no === match[1]);
    if (!product) return;
    const priceEl = btn.querySelector('.plan-price');
    const profitEl = btn.querySelector('.plan-profit');
    if (priceEl) priceEl.textContent = formatConvertedPrice(product.標準價, 'HK', true);
    if (profitEl) profitEl.textContent = '💰 利潤 ' + formatConvertedPrice(product.fixedProfit, 'HK', false);
  });
}
function switchWorkspace(mode, announce = true) {
  if (!['single','compare'].includes(mode)) return;
  currentWorkspace = mode;
  document.getElementById('single-country-workspace').style.display = mode === 'single' ? 'block' : 'none';
  document.getElementById('compare-workspace').style.display = mode === 'compare' ? 'block' : 'none';
  document.getElementById('mode-single-btn').classList.toggle('active', mode === 'single');
  document.getElementById('mode-compare-btn').classList.toggle('active', mode === 'compare');
  document.getElementById('app-title').lastChild.textContent = mode === 'compare' ? 'HBL ' + regionCountLabel() + '產品格價' : 'HBL ' + getCountryConfig().name + '產品計算器';
  document.title = mode === 'compare' ? 'HBL ' + ALL_COUNTRIES.map(code => COUNTRY_CONFIGS[code].name).join('／') + '格價' : 'HBL ' + getCountryConfig().name + '產品計算器';
  if (mode === 'compare') renderComparison(); else updateProductDisplay();
  if (announce) showToast(mode === 'compare' ? '已開啟' + regionCountLabel() + '格價' : '已返回單區計算');
}
function setCompareTier(tier) {
  if (!ALL_COUNTRIES.some(code => COUNTRY_CONFIGS[code].compareTiers?.[tier])) return;
  comparisonTier = tier; renderComparison();
}
function sortComparison(country) {
  if (!ALL_COUNTRIES.includes(country)) return;
  if (comparisonSort.country === country) comparisonSort.direction = comparisonSort.direction === 'asc' ? 'desc' : 'asc';
  else comparisonSort = { country, direction: 'asc' };
  renderComparison();
}
function comparisonProduct(group, country) {
  const stockNo = group[country];
  if (!stockNo) return null;
  return getCountryProducts(country).find(p => p.stock_no === stockNo) || null;
}

function comparisonPrice(group, country) {
  const product = comparisonProduct(group, country);
  if (!product) return null;
  const key = COUNTRY_CONFIGS[country].compareTiers?.[comparisonTier];
  const nativePrice = Number(product[key]);
  if (!key || !Number.isFinite(nativePrice)) return null;
  const converted = convertCurrency(nativePrice, country, comparisonCurrency);
  return { product, nativePrice, converted };
}
function comparisonSearchText(group) {
  return ALL_COUNTRIES.reduce((parts, country) => {
    const product = comparisonProduct(group, country);
    if (product) parts.push(product.stock_no, product.prod_name, product.prod_name_en);
    return parts;
  }, [group.label]).join(' ').toLowerCase();
}
function comparisonVp(data, country) {
  if (!data || COUNTRY_CONFIGS[country]?.hasVPData === false) return null;
  const vp = Number(data.product?.vp);
  return Number.isFinite(vp) ? vp : null;
}
function comparisonVpClass(vp, minimum, maximum, differs) {
  if (!Number.isFinite(vp)) return 'vp-unavailable';
  if (!differs) return 'vp-same';
  if (Math.abs(vp - minimum) < 0.01) return 'vp-low';
  if (Math.abs(vp - maximum) < 0.01) return 'vp-high';
  return 'vp-mid';
}
function renderComparison() {
  const container = document.getElementById('compare-results');
  if (!container) return;
  const search = document.getElementById('compare-search');
  const query = (search?.value || '').trim().toLowerCase();
  let groups = COMPARISON_GROUPS.filter(group => !query || comparisonSearchText(group).includes(query));
  const sortCountry = comparisonSort.country;
  groups.sort((a, b) => {
    const pa = comparisonPrice(a, sortCountry)?.converted;
    const pb = comparisonPrice(b, sortCountry)?.converted;
    if (!Number.isFinite(pa) && !Number.isFinite(pb)) return a.label.localeCompare(b.label, 'zh-Hant');
    if (!Number.isFinite(pa)) return 1;
    if (!Number.isFinite(pb)) return -1;
    return comparisonSort.direction === 'asc' ? pa - pb : pb - pa;
  });
  ALL_COUNTRIES.forEach(country => {
    const btn = document.getElementById('compare-sort-' + country.toLowerCase());
    if (!btn) return;
    const active = comparisonSort.country === country;
    btn.classList.toggle('active', active);
    const arrow = active ? (comparisonSort.direction === 'asc' ? '↑' : '↓') : '↕';
    btn.textContent = COUNTRY_CONFIGS[country].flag + ' ' + COUNTRY_CONFIGS[country].name + ' ' + arrow;
  });
  document.getElementById('compare-sort-label').textContent = COUNTRY_CONFIGS[sortCountry].name + '・' + (comparisonSort.direction === 'asc' ? '由低至高' : '由高至低');
  document.getElementById('compare-result-count').textContent = groups.length + ' 項';
  document.getElementById('compare-meta-left').textContent = (comparisonTier === 'retail' ? '零售價' : comparisonTier + ' 等級') + '・' + CURRENCY_META[comparisonCurrency].label;
  if (groups.length === 0) {
    container.innerHTML = '<div class="compare-card" style="text-align:center;color:var(--text-muted);padding:22px;">沒有找到符合的同類產品</div>';
    return;
  }
  container.innerHTML = groups.map(group => {
    const prices = ALL_COUNTRIES.map(country => ({ country, data: comparisonPrice(group, country) }));
    const available = prices.filter(item => item.data && Number.isFinite(item.data.converted));
    const minimum = available.length ? Math.min(...available.map(item => item.data.converted)) : Infinity;
    const maximum = available.length ? Math.max(...available.map(item => item.data.converted)) : -Infinity;
    const spread = Number.isFinite(minimum) && Number.isFinite(maximum) ? maximum - minimum : null;
    const vpValues = prices.map(({ country, data }) => comparisonVp(data, country)).filter(Number.isFinite);
    const minimumVp = vpValues.length ? Math.min(...vpValues) : null;
    const maximumVp = vpValues.length ? Math.max(...vpValues) : null;
    const vpDiffers = vpValues.length > 1 && maximumVp - minimumVp > 0.01;
    const boxes = prices.map(({ country, data }) => {
      if (!data) return '<div class="compare-price-box"><div class="compare-country-name">' + COUNTRY_CONFIGS[country].flag + ' ' + COUNTRY_CONFIGS[country].name + '</div><div class="missing-price">—</div><div class="compare-vp vp-unavailable">VP —</div></div>';
      const cheapest = Math.abs(data.converted - minimum) < 0.01;
      const delta = Math.max(0, data.converted - minimum);
      const vp = comparisonVp(data, country);
      const vpClass = comparisonVpClass(vp, minimumVp, maximumVp, vpDiffers);
      const vpText = Number.isFinite(vp) ? 'VP ' + vp.toFixed(2) : 'VP —';
      const deltaHtml = cheapest
        ? '<div class="price-delta best">最低價基準</div>'
        : '<div class="price-delta">貴 +' + formatCurrencyAmount(delta, comparisonCurrency) + '</div>';
      return '<div class="compare-price-box ' + (cheapest ? 'cheapest' : '') + '"><div class="compare-country-name">' + COUNTRY_CONFIGS[country].flag + ' ' + COUNTRY_CONFIGS[country].name + '</div><div class="compare-price">' + formatCurrencyAmount(data.converted, comparisonCurrency) + '</div>' + (cheapest ? '<div class="cheapest-badge">✓ 最平</div>' : '') + deltaHtml + '<div class="compare-vp ' + vpClass + '">' + vpText + '</div></div>';
    }).join('');
    const spreadText = Number.isFinite(spread) ? '・最高相差 ' + formatCurrencyAmount(spread, comparisonCurrency) : '';
    const vpWarning = vpDiffers ? '<span class="vp-difference-warning">⚠ 各區 VP 不同</span>' : '';
    return '<div class="compare-card"><div class="compare-card-title">' + group.label + '<div class="compare-card-sub">可比較 ' + available.length + ' 個地區' + spreadText + vpWarning + '</div></div><div class="compare-country-scroll"><div class="compare-country-grid">' + boxes + '</div></div></div>';
  }).join('');
}
function updateTierSelectors() {
  const config = getCountryConfig();
  const tier1 = document.getElementById('pricing-tier1');
  const tier2 = document.getElementById('pricing-tier2');
  const state = countryState[currentCountry];
  tier1.innerHTML = config.tiers.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  tier2.innerHTML = '<option value="">不使用</option>' + config.tiers.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  tier1.value = config.tiers.some(([value]) => value === state.tier1) ? state.tier1 : config.defaultTier;
  tier2.value = config.tiers.some(([value]) => value === state.tier2) ? state.tier2 : '';
}

function saveCurrentCountryState() {
  const state = countryState[currentCountry];
  state.selected = selectedProducts.map(p => ({ stock_no: p.stock_no, quantity: p.quantity }));
  state.tier1 = document.getElementById('pricing-tier1').value;
  state.tier2 = document.getElementById('pricing-tier2').value;
  state.includeFreight = includeFreight;
  saveCandidates();
}

function restoreCountrySelection() {
  selectedProducts = countryState[currentCountry].selected.map(item => {
    const product = productsData.find(p => p.stock_no === item.stock_no);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);
}

function refreshCountryUi() {
  const config = getCountryConfig();
  ALL_COUNTRIES.forEach(code => {
    const button = document.getElementById('country-' + code.toLowerCase());
    if (button) button.classList.toggle('active', currentCountry === code);
  });
  if (currentWorkspace === 'single') document.getElementById('app-title').lastChild.textContent = 'HBL ' + config.name + '產品計算器';
  if (currentWorkspace === 'single') document.title = 'HBL ' + config.name + '產品計算器';
  document.getElementById('freight-control').style.display = config.supportsFreight ? 'flex' : 'none';
  document.getElementById('hk-package-plans').style.display = config.showSpecialShortcuts ? 'block' : 'none';
  document.getElementById('hk-big-meal-shortcut').style.display = config.showSpecialShortcuts ? 'block' : 'none';
  document.getElementById('btn-vp-assistant').style.display = config.supportsVP ? 'flex' : 'none';
  updateTierSelectors(); refreshCurrencyUi();
}
function switchCountry(country, announce = true) {
  if (!COUNTRY_CONFIGS[country] || country === currentCountry) return;
  saveCurrentCountryState(); currentCountry = country;
  try { localStorage.setItem('calcCountry', currentCountry); } catch(e) {}
  hydrateCountryProducts(currentCountry);
  includeFreight = COUNTRY_CONFIGS[currentCountry].supportsFreight ? countryState[currentCountry].includeFreight : false;
  restoreCountrySelection(); candidateStockNos = new Set(); loadCandidates(); refreshCountryUi();
  if (COUNTRY_CONFIGS[currentCountry].supportsFreight && includeFreight) toggleFreight(true, false); else updateFreightButtons(false);
  initCategories(); updateProductDisplay(); filterProducts();
  if (announce) showToast('已切換至' + getCountryConfig().flag + ' ' + getCountryConfig().name + '產品及價格');
}
function initCountry() {
  let saved = ALL_COUNTRIES[0] || 'HK';
  try { saved = localStorage.getItem('calcCountry') || saved; } catch(e) {}
  if (!COUNTRY_CONFIGS[saved]) saved = ALL_COUNTRIES[0];
  currentCountry = saved; comparisonSort.country = ALL_COUNTRIES.includes(comparisonSort.country) ? comparisonSort.country : currentCountry;
  hydrateCountryProducts(currentCountry);
  includeFreight = COUNTRY_CONFIGS[currentCountry].supportsFreight ? countryState[currentCountry].includeFreight : false;
  refreshCountryUi(); updateFreightButtons(includeFreight);
}
function updateFreightButtons(val) {
  document.getElementById('freight-normal').classList.toggle('active', !val);
  document.getElementById('freight-included').classList.toggle('active', val);
}

function toggleFreight(val, announce = true) {
  if (!getCountryConfig().supportsFreight) return;
  includeFreight = val; countryState[currentCountry].includeFreight = val; updateFreightButtons(val);
  if (announce) triggerHaptic('light');
  const noFreightStockNos = ['PKG1','PKG2','PKG3','PKG4','BO1L','I839','H258','H260','H262','8601','8602','5122','DC30','X001','DC40','9909','DC60'];
  const tiers = ['銅級','銀級','金級','58%','50%'];
  [productsData, selectedProducts].forEach(list => list.forEach(p => {
    if (noFreightStockNos.includes(p.stock_no) || p.type === 'package') return;
    tiers.forEach(tier => {
      const originalProduct = originalProductsData.find(op => op.stock_no === p.stock_no);
      if (!originalProduct) return;
      p[tier] = includeFreight ? Math.round(originalProduct[tier] + p['標準價'] * 0.03) : originalProduct[tier];
    });
  }));
  updatePricing(); filterProducts();
  if (announce) showToast(val ? '已切換為含運費價格 (+3%)' : '已切換為正常價格');
}
function triggerHaptic(type = 'light') { if (!navigator.vibrate) return; try { switch (type) { case 'light': navigator.vibrate(10); break; case 'medium': navigator.vibrate(20); break; case 'heavy': navigator.vibrate(30); break; case 'success': navigator.vibrate([15, 50, 15]); break; } } catch(e) {} }

const FONT_SIZES  = [11, 13, 16, 20];
const FONT_LABELS = ['小', '標準', '大', '特大'];
let currentFontLevel = 1;

function initFontSize() { try { const saved = localStorage.getItem('calcFontLevel'); if (saved !== null) { const v = parseInt(saved); if (!isNaN(v) && v >= 0 && v < FONT_SIZES.length) currentFontLevel = v; } } catch(e) {} applyFontSize(); }
function changeFontSize(delta) { triggerHaptic('light'); const next = currentFontLevel + delta; if (next < 0 || next >= FONT_SIZES.length) return; currentFontLevel = next; try { localStorage.setItem('calcFontLevel', currentFontLevel); } catch(e) {} applyFontSize(); showToast('字體大小：' + FONT_LABELS[currentFontLevel]); }
function applyFontSize() { document.body.style.fontSize = FONT_SIZES[currentFontLevel] + 'px'; const disp = document.getElementById('font-size-display'); if (disp) disp.textContent = FONT_LABELS[currentFontLevel]; const decBtn = document.getElementById('font-decrease-btn'); const incBtn = document.getElementById('font-increase-btn'); if (decBtn) decBtn.disabled = (currentFontLevel === 0); if (incBtn) incBtn.disabled = (currentFontLevel === FONT_SIZES.length - 1); }

let longPressTimer = null; let longPressInterval = null;
function startIncrease(stockNo) { endLongPress(); triggerHaptic('light'); increaseQuantity(stockNo); longPressTimer = setTimeout(() => { longPressInterval = setInterval(() => {triggerHaptic('light'); increaseQuantity(stockNo);}, 90); }, 480); }
function startDecrease(stockNo) { endLongPress(); triggerHaptic('light'); decreaseQuantity(stockNo); longPressTimer = setTimeout(() => { longPressInterval = setInterval(() => {triggerHaptic('light'); decreaseQuantity(stockNo);}, 90); }, 480); }
function endLongPress() { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } if (longPressInterval) { clearInterval(longPressInterval); longPressInterval = null; } }

function scrollListToTop() { document.getElementById('product-list').scrollTop = 0; }
function openSearchModal() { const overlay = document.getElementById('search-modal-overlay'); overlay.style.display = 'flex'; const content = overlay.querySelector('.search-modal-content'); content.style.animation = 'none'; content.offsetHeight; content.style.animation = ''; filterProducts(); scrollListToTop(); setTimeout(() => { document.getElementById('product-search').focus(); }, 80); }
function closeSearchModal() { document.getElementById('search-modal-overlay').style.display = 'none'; document.getElementById('product-search').value = ''; updateClearBtn(); }
function handleOverlayClick(e) { if (e.target === document.getElementById('search-modal-overlay')) { triggerHaptic('light'); closeSearchModal(); } }
function updateClearBtn() { const val = document.getElementById('product-search').value; document.getElementById('search-clear-btn').classList.toggle('visible', !!val); }
function clearSearch() { document.getElementById('product-search').value = ''; updateClearBtn(); filterProducts(); scrollListToTop(); document.getElementById('product-search').focus(); }

function formatPrice(price, isPackage) { return formatConvertedPrice(price, currentCountry, isPackage); }
function formatProfit(profit) { return formatConvertedPrice(profit, currentCountry, false); }

// 新增：取得日/次成本 HTML 字串的函數
function getCostHtml(price, days, servings) {
  if (!days || !servings) return '';
  const dCost = formatPrice(price / days, false);
  const sCost = formatPrice(price / servings, false);
  if (days === servings) return `<div style="font-size:0.75em;color:var(--text-muted);margin-top:2px;font-weight:600;">日/次:${dCost}</div>`;
  return `<div style="font-size:0.75em;color:var(--text-muted);margin-top:2px;font-weight:600;">日:${dCost} | 次:${sCost}</div>`;
}

// 新增：取得複製專用的成本字串
const getCopyCostStr = (price, days, servings) => {
  if (!days || !servings) return '';
  const d = formatPrice(price / days, false);
  const s = formatPrice(price / servings, false);
  return days === servings ? ` (日/次:${d})` : ` (日:${d}/次:${s})`;
};

function copyToClipboard() { if (selectedProducts.length === 0) { triggerHaptic('medium'); showToast('沒有可複製的產品'); return; } triggerHaptic('light'); const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; const hasPkgProfit = selectedProducts.some(p => p.type === 'package' && p.fixedProfit !== undefined); const hasProfit = cmp || hasPkgProfit; let modalHtml = `<div class="modal-overlay" id="copy-modal" style="display:flex; z-index: 2000;"><div class="modal"><div class="modal-title">📋 選擇複製資訊</div><div class="modal-content"><label class="copy-opt-label"><input type="checkbox" id="copy-opt-unitprice" checked> 單價</label><label class="copy-opt-label"><input type="checkbox" id="copy-opt-totalprice" checked> 總價</label><label class="copy-opt-label"><input type="checkbox" id="copy-opt-vp" checked> VP 分數</label><label class="copy-opt-label"><input type="checkbox" id="copy-opt-totalvp" checked> 總 VP 分數</label>`; if (hasProfit) modalHtml += `<label class="copy-opt-label"><input type="checkbox" id="copy-opt-profit" checked> 利潤</label>`; modalHtml += `</div><div class="modal-actions"><button onclick="triggerHaptic('light'); document.getElementById('copy-modal').remove()" style="padding: 8px 16px;">取消</button><button class="btn-primary" onclick="triggerHaptic('success'); executeCopy()" style="padding: 8px 16px;">確定複製</button></div></div></div>`; const oldModal = document.getElementById('copy-modal'); if (oldModal) oldModal.remove(); document.body.insertAdjacentHTML('beforeend', modalHtml); }
function executeCopy() { const includeUnitPrice = document.getElementById('copy-opt-unitprice') ? document.getElementById('copy-opt-unitprice').checked : false; const includeTotalPrice = document.getElementById('copy-opt-totalprice') ? document.getElementById('copy-opt-totalprice').checked : false; const includeVP = document.getElementById('copy-opt-vp') ? document.getElementById('copy-opt-vp').checked : false; const includeTotalVP = document.getElementById('copy-opt-totalvp') ? document.getElementById('copy-opt-totalvp').checked : false; const includeProfit = document.getElementById('copy-opt-profit') ? document.getElementById('copy-opt-profit').checked : false; const copyModal = document.getElementById('copy-modal'); if (copyModal) copyModal.remove(); const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; const now = new Date(); const locale = getCountryConfig().locale; const dateStr = now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }); let lines = ['📋 產品詳細計算', '地區：' + getCountryConfig().flag + ' ' + getCountryConfig().name, '日期：' + dateStr, '等級：' + t1 + (cmp ? ' / ' + t2 : ''), '================================', '']; selectedProducts.forEach((p, i) => { const isPkg = p.type === 'package'; const price1 = p[t1], totalPrice1 = price1 * p.quantity, totalVP = p.vp * p.quantity; lines.push((i+1) + '. ' + p.prod_name + (isPkg ? '【套裝】' : '') + ' * ' + p.quantity); if (cmp) { const price2 = p[t2], totalPrice2 = price2 * p.quantity; let up, tp; if (isPkg && p.fixedProfit !== undefined) { up = p.fixedProfit; tp = up * p.quantity; } else { up = Math.abs(price2 - price1); tp = up * p.quantity; } let parts1 = []; if (includeUnitPrice) parts1.push('單價：' + formatPrice(price1, isPkg) + getCopyCostStr(price1, p.days, p.servings)); if (includeTotalPrice) parts1.push('總價：' + formatPrice(totalPrice1, isPkg)); if (parts1.length) lines.push('   ' + t1 + ' ' + parts1.join('  ')); let parts2 = []; if (includeUnitPrice) parts2.push('單價：' + formatPrice(price2, isPkg) + getCopyCostStr(price2, p.days, p.servings)); if (includeTotalPrice) parts2.push('總價：' + formatPrice(totalPrice2, isPkg)); if (parts2.length) lines.push('   ' + t2 + ' ' + parts2.join('  ')); if (includeProfit) { lines.push('   💰 利潤：' + formatProfit(up) + ' / 件 合計：' + formatProfit(tp)); } } else { let parts = []; if (includeUnitPrice) parts.push('單價：' + formatPrice(price1, isPkg) + getCopyCostStr(price1, p.days, p.servings)); if (includeTotalPrice) parts.push('總價：' + formatPrice(totalPrice1, isPkg)); if (parts.length) lines.push('   ' + parts.join('  ')); if (includeProfit && isPkg && p.fixedProfit !== undefined) { lines.push('   💰 固定利潤：' + formatProfit(p.fixedProfit) + ' / 件 合計：' + formatProfit(p.fixedProfit * p.quantity)); } } let vpParts = []; if (includeVP) vpParts.push('VP：' + p.vp.toFixed(2)); if (includeTotalVP) vpParts.push('總VP：' + totalVP.toFixed(2)); if (vpParts.length) lines.push('   ' + vpParts.join('  ')); lines.push(''); }); const totalQty = selectedProducts.reduce((s, p) => s + p.quantity, 0); const totalP1 = selectedProducts.reduce((s, p) => s + p[t1] * p.quantity, 0); const totalVP = selectedProducts.reduce((s, p) => s + p.vp * p.quantity, 0); const pkgProds = selectedProducts.filter(p => p.type === 'package' && p.fixedProfit !== undefined); const totalPkgPr = pkgProds.reduce((s, p) => s + p.fixedProfit * p.quantity, 0); lines.push('================================', '📊 總計', '總數量：' + totalQty + ' 件'); if (includeTotalPrice) { lines.push('總金額（' + t1 + '）：' + formatPrice(totalP1, false)); if (cmp) { const totalP2 = selectedProducts.reduce((s, p) => s + p[t2] * p.quantity, 0); lines.push('總金額（' + t2 + '）：' + formatPrice(totalP2, false)); } } if (includeProfit && cmp) { const totalPr = selectedProducts.reduce((s, p) => { if (p.type === 'package' && p.fixedProfit !== undefined) return s + p.fixedProfit * p.quantity; return s + Math.abs(p[t2] - p[t1]) * p.quantity; }, 0); lines.push('💰 總利潤：' + formatProfit(totalPr)); } if (includeTotalVP) { lines.push('總VP：' + totalVP.toFixed(2)); } if (includeProfit && pkgProds.length > 0) { lines.push('', '💰 套裝固定利潤'); pkgProds.forEach(p => lines.push('  ' + p.prod_name + ' * ' + p.quantity + '：' + formatProfit(p.fixedProfit * p.quantity))); lines.push('  套裝利潤合計：' + formatProfit(totalPkgPr)); } const text = lines.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => showToast('✅ 全資料已複製！')).catch(() => fallbackCopy(text)); } else { fallbackCopy(text); } }
function fallbackCopy(text) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); showToast('✅ 成功複製！'); } catch (e) { showToast('複製失敗，請手動選取'); } document.body.removeChild(ta); }
function copyCartSimple() { triggerHaptic('light'); if (selectedProducts.length === 0) { showToast('購物車是空的'); return; } const t1 = document.getElementById('pricing-tier1').value; let lines = ['🛒 購物車清單', '====================']; let tQty = 0, tPrice = 0, tVP = 0; selectedProducts.forEach(p => { const isPkg = p.type === 'package'; const pr = p[t1]; lines.push(`- ${p.prod_name}${isPkg ? ' (套裝)' : ''} * ${p.quantity}`); tQty += p.quantity; tPrice += pr * p.quantity; tVP += p.vp * p.quantity; }); lines.push('===================='); lines.push(`總數量: ${tQty} 件`); lines.push(`總VP分數: ${tVP.toFixed(2)}`); lines.push(`💰 總計價錢: ${formatPrice(tPrice, false)}`); const text = lines.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => { triggerHaptic('success'); showToast('✅ 購物車已複製！'); }).catch(() => fallbackCopy(text)); } else { fallbackCopy(text); } }

function switchView(viewType) { triggerHaptic('light'); currentView = viewType; document.getElementById('table-container').style.display = 'none'; document.getElementById('product-cards').style.display = 'none'; document.getElementById('cart-container').style.display = 'none'; document.getElementById('table-view-btn').classList.remove('active'); document.getElementById('card-view-btn').classList.remove('active'); document.getElementById('cart-view-btn').classList.remove('active'); if (viewType === 'table') { document.getElementById('table-container').style.display = 'block'; document.getElementById('table-view-btn').classList.add('active'); } else if (viewType === 'card') { document.getElementById('product-cards').style.display = 'block'; document.getElementById('card-view-btn').classList.add('active'); } else if (viewType === 'cart') { document.getElementById('cart-container').style.display = 'block'; document.getElementById('cart-view-btn').classList.add('active'); } updateProductDisplay(); }
function initCategories() { currentCategory = 'all'; const categories = ['all', ...new Set(productsData.map(p => p.category))]; const tabsContainer = document.getElementById('category-tabs'); tabsContainer.innerHTML = ''; categories.forEach(category => { const tab = document.createElement('div'); tab.className = 'category-tab' + (category === 'all' ? ' active' : ''); tab.textContent = category === 'all' ? '全部' : category; tab.onclick = () => { triggerHaptic('light'); document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); currentCategory = category; filterProducts(); scrollListToTop(); }; tabsContainer.appendChild(tab); }); }

function toggleCandidate(stockNo) { if (candidateStockNos.has(stockNo)) candidateStockNos.delete(stockNo); else candidateStockNos.add(stockNo); saveCandidates(); filterProducts(); updateCandidateCount(); }
function bulkAddCandidates() { triggerHaptic('medium'); const searchText = document.getElementById('product-search').value.toLowerCase(); const filtered = productsData.filter(p => { const matchSearch = !searchText || p.stock_no.toLowerCase().includes(searchText) || p.prod_name.toLowerCase().includes(searchText) || p.prod_name_en.toLowerCase().includes(searchText); const matchCat = currentCategory === 'all' || p.category === currentCategory; return matchSearch && matchCat; }); filtered.forEach(p => candidateStockNos.add(p.stock_no)); saveCandidates(); updateCandidateCount(); filterProducts(); showToast(`已加入 ${filtered.length} 件候選產品`); }
function bulkRemoveCandidates() { triggerHaptic('medium'); const searchText = document.getElementById('product-search').value.toLowerCase(); const filtered = productsData.filter(p => { const matchSearch = !searchText || p.stock_no.toLowerCase().includes(searchText) || p.prod_name.toLowerCase().includes(searchText) || p.prod_name_en.toLowerCase().includes(searchText); const matchCat = currentCategory === 'all' || p.category === currentCategory; return matchSearch && matchCat; }); filtered.forEach(p => candidateStockNos.delete(p.stock_no)); saveCandidates(); updateCandidateCount(); filterProducts(); showToast(`已移除 ${filtered.length} 件候選產品`); }
function saveCandidates() { try { localStorage.setItem('calcCandidates_' + currentCountry, JSON.stringify([...candidateStockNos])); } catch(e) {} }
function loadCandidates() { try { let saved = localStorage.getItem('calcCandidates_' + currentCountry); if (!saved && currentCountry === 'HK') saved = localStorage.getItem('calcCandidates'); candidateStockNos = saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e) { candidateStockNos = new Set(); } updateCandidateCount(); }
function updateCandidateCount() { const btn = document.getElementById('btn-vp-assistant'); if (btn) btn.innerHTML = `🎯 VP 推薦助手 (${candidateStockNos.size})`; }

function filterProducts() {
  const searchText = document.getElementById('product-search').value.toLowerCase();
  const t1 = document.getElementById('pricing-tier1').value;
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  const filtered = productsData.filter(p => {
    const matchSearch = !searchText || p.stock_no.toLowerCase().includes(searchText) || p.prod_name.toLowerCase().includes(searchText) || p.prod_name_en.toLowerCase().includes(searchText);
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    return matchSearch && matchCat;
  });
  filtered.sort((a, b) => a.prod_seq - b.prod_seq);
  filtered.forEach(product => {
    const item = document.createElement('div');
    const isPkg = product.type === 'package';
    item.className = 'product-item' + (isPkg ? ' product-item-package' : '');
    const sel = selectedProducts.find(p => p.stock_no === product.stock_no);
    const badge = sel ? `<span class="selected-badge">✓ ${sel.quantity}</span>` : '';
    const price = formatPrice(product[t1], isPkg);
    const isCand = candidateStockNos.has(product.stock_no);
    const vpText = getCountryConfig().hasVPData === false ? 'VP —' : 'VP ' + Number(product.vp || 0).toFixed(2);
    item.innerHTML = `<div class="product-item-inner"><div class="product-item-left">${badge}<strong>${product.stock_no}</strong> - ${product.prod_name}${isPkg ? ` <span style="color:var(--color-pkg);font-size:0.78em;">[套裝]</span>` : ''}</div><div class="product-item-actions"><span class="product-item-vp">${vpText}</span><button class="btn-candidate ${isCand ? 'active' : ''}" onclick="event.stopPropagation(); toggleCandidate('${product.stock_no}')">${isCand ? '✓ 候選' : '🔖'}</button><div class="product-item-price">${price}</div></div></div>`;
    item.onclick = () => addProduct(product);
    productList.appendChild(item);
  });
  if (filtered.length === 0) {
    const el = document.createElement('div');
    el.className = 'product-item';
    el.style.color = 'var(--text-muted)';
    el.style.fontStyle = 'italic';
    el.style.textAlign = 'center';
    el.textContent = '沒有找到符合條件的產品';
    productList.appendChild(el);
  }
}

function addProduct(product) { triggerHaptic('medium'); const existing = selectedProducts.find(p => p.stock_no === product.stock_no); if (existing) { existing.quantity += 1; showToast(`${product.prod_name} * ${existing.quantity}`); } else { selectedProducts.push({ ...product, quantity: 1 }); newlyAddedStockNos.add(product.stock_no); showToast(`已添加：${product.prod_name}`); } updateProductDisplay(); filterProducts(); setTimeout(() => newlyAddedStockNos.clear(), 400); }
function addBigMealCombo() { triggerHaptic('light'); showConfirmDialog('確定要快捷添加「大餐四寶」到購物車嗎？', () => { triggerHaptic('success'); const stockNos = ["0079", "0210", "0111", "0130"]; let added = false; stockNos.forEach(stockNo => { const product = productsData.find(p => p.stock_no === stockNo); if (product) { const existing = selectedProducts.find(p => p.stock_no === stockNo); if (existing) { existing.quantity += 1; } else { selectedProducts.push({ ...product, quantity: 1 }); newlyAddedStockNos.add(stockNo); } added = true; } }); if (added) { updateProductDisplay(); showToast('🍽️ 已成功添加：大餐四寶 (4件獨立產品)'); setTimeout(() => newlyAddedStockNos.clear(), 400); } }); }
function addPackagePlan(stockNo) { triggerHaptic('medium'); const plan = productsData.find(p => p.stock_no === stockNo); if (!plan) return; const existing = selectedProducts.find(p => p.stock_no === stockNo); if (existing) { existing.quantity += 1; } else { selectedProducts.push({ ...plan, quantity: 1 }); newlyAddedStockNos.add(stockNo); } updateProductDisplay(); setTimeout(() => newlyAddedStockNos.clear(), 400); showToast(`已添加：${plan.prod_name}`); }
function removeProductWithAnimation(stockNo) { triggerHaptic('medium'); const els = document.querySelectorAll(`[data-stockno="${stockNo}"]`); if (els.length > 0) { els.forEach(el => el.classList.add('removing')); setTimeout(() => removeProduct(stockNo), 200); } else { removeProduct(stockNo); } }
function removeProduct(stockNo) { selectedProducts = selectedProducts.filter(p => p.stock_no !== stockNo); updateProductDisplay(); }
function updateQuantity(stockNo, newQty) { triggerHaptic('light'); const p = selectedProducts.find(p => p.stock_no === stockNo); if (p) { p.quantity = Math.max(1, newQty); updateProductDisplay(); } }
function increaseQuantity(stockNo) { const p = selectedProducts.find(p => p.stock_no === stockNo); if (p) { p.quantity += 1; updateProductDisplay(); } }
function decreaseQuantity(stockNo) { const p = selectedProducts.find(p => p.stock_no === stockNo); if (p && p.quantity > 1) { p.quantity -= 1; updateProductDisplay(); } }

function updateProductDisplay() { updateTableHeader(); if (currentView === 'table') updateProductTable(); else if (currentView === 'card') updateProductCards(); else if (currentView === 'cart') updateCartView(); updateSummary(); }
function updateTableHeader() { const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; const hasPkgProfit = selectedProducts.some(p => p.type === 'package' && p.fixedProfit !== undefined); const showProfitCols = cmp || hasPkgProfit; let h = '<tr><th>編號</th><th>名稱</th><th>數量</th>'; if (cmp) h += `<th>${t1}<br>單價</th><th>${t1}<br>總價</th><th>${t2}<br>單價</th><th>${t2}<br>總價</th>`; else h += '<th>單價</th><th>總價</th>'; if (showProfitCols) h += '<th>單件<br>利潤</th><th>總<br>利潤</th>'; h += '<th>VP</th><th>總VP</th><th>操作</th></tr>'; document.getElementById('product-table-head').innerHTML = h; }
function qtyBtnHTML(action, stockNo, label) { const fn = action === 'inc' ? 'startIncrease' : 'startDecrease'; return `<div class="qty-btn" onmousedown="${fn}('${stockNo}')" onmouseup="endLongPress()" onmouseleave="endLongPress()" ontouchstart="event.preventDefault();${fn}('${stockNo}')" ontouchend="endLongPress()" ontouchcancel="endLongPress()">${label}</div>`; }
function updateProductTable() { const tbody = document.getElementById('product-table-body'); const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; const hasPkgProfit = selectedProducts.some(p => p.type === 'package' && p.fixedProfit !== undefined); const showProfitCols = cmp || hasPkgProfit; const colCount = 6 + (cmp ? 4 : 2) + (showProfitCols ? 2 : 0); tbody.innerHTML = ''; if (selectedProducts.length === 0) { tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; padding:20px; color:var(--text-muted);">尚未選擇任何產品</td></tr>`; return; } selectedProducts.forEach(product => { const row = document.createElement('tr'); const isPkg = product.type === 'package'; row.className = [isPkg ? 'package-row' : '', newlyAddedStockNos.has(product.stock_no) ? 'animate-in' : ''].filter(Boolean).join(' '); row.setAttribute('data-stockno', product.stock_no); const p1 = product[t1], tp1 = p1 * product.quantity, tvp = product.vp * product.quantity; let html = `<td>${product.stock_no}</td><td class="product-name">${product.prod_name}${isPkg ? `<span class="package-badge" style="background:var(--color-pkg);color:white;font-size:0.6rem;padding:2px 4px;border-radius:4px;margin-left:4px;">套裝</span>` : ''}</td><td style="white-space:nowrap;"><div class="qty-control">${qtyBtnHTML('dec', product.stock_no, '−')}<input type="number" class="qty-input" value="${product.quantity}" min="1" onchange="updateQuantity('${product.stock_no}', parseInt(this.value))">${qtyBtnHTML('inc', product.stock_no, '+')}</div></td>`; if (cmp) { const p2 = product[t2], tp2 = p2 * product.quantity; let up, tpr; if (isPkg && product.fixedProfit !== undefined) { up = product.fixedProfit; tpr = up * product.quantity; } else { up = Math.abs(p2 - p1); tpr = up * product.quantity; } let cost1 = getCostHtml(p1, product.days, product.servings); let cost2 = getCostHtml(p2, product.days, product.servings); html += `<td>${formatPrice(p1,isPkg)}${cost1}</td><td>${formatPrice(tp1,isPkg)}</td><td>${formatPrice(p2,isPkg)}${cost2}</td><td>${formatPrice(tp2,isPkg)}</td>`; if (showProfitCols) html += `<td class="profit">${formatProfit(up)}</td><td class="profit">${formatProfit(tpr)}</td>`; } else { let cost1 = getCostHtml(p1, product.days, product.servings); html += `<td>${formatPrice(p1,isPkg)}${cost1}</td><td>${formatPrice(tp1,isPkg)}</td>`; if (showProfitCols) { if (isPkg && product.fixedProfit !== undefined) { html += `<td class="profit">${formatProfit(product.fixedProfit)}</td><td class="profit">${formatProfit(product.fixedProfit*product.quantity)}</td>`; } else { html += `<td style="color:var(--text-muted);text-align:center;">-</td><td style="color:var(--text-muted);text-align:center;">-</td>`; } } } html += `<td>${product.vp.toFixed(2)}</td><td>${tvp.toFixed(2)}</td><td><button class="btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="removeProductWithAnimation('${product.stock_no}')">移除</button></td>`; row.innerHTML = html; tbody.appendChild(row); }); }
function updateProductCards() { const cc = document.getElementById('product-cards'); const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; cc.innerHTML = ''; if (selectedProducts.length === 0) { cc.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-style:italic;">尚未選擇任何產品</div>'; return; } selectedProducts.forEach(product => { const p1 = product[t1], tp1 = p1 * product.quantity, tvp = product.vp * product.quantity; const isPkg = product.type === 'package'; const card = document.createElement('div'); card.className = ['product-card', newlyAddedStockNos.has(product.stock_no) ? 'animate-in' : ''].filter(Boolean).join(' '); card.setAttribute('data-stockno', product.stock_no); let html = `<div class="card-header"><div>${product.prod_name}${isPkg ? `<span style="background:var(--color-pkg);color:white;font-size:0.7rem;padding:2px 6px;border-radius:6px;margin-left:6px;">套裝</span>` : ''}</div><div style="color:var(--text-muted);">${product.stock_no}</div></div><div style="margin-bottom:8px;"><div style="color:var(--text-muted);font-size:0.8rem;margin-bottom:6px;">${product.prod_name_en}</div>`; if (isPkg) { html += `<div style="font-size:0.75rem;color:var(--color-pkg);margin-bottom:6px;">⚠ 此套裝價格固定，不受等級影響</div><div class="card-price-row"><div>套裝價：</div><div style="color:var(--color-pkg);font-weight:800;">${formatPrice(p1,true)}</div></div><div class="card-price-row"><div>套裝總價 (* ${product.quantity})：</div><div style="color:var(--color-pkg);font-weight:800;">${formatPrice(tp1,true)}</div></div>`; if (product.fixedProfit !== undefined) { html += `<div class="card-price-row"><div>💰 固定利潤 (單件)：</div><div class="profit">${formatProfit(product.fixedProfit)}</div></div><div class="card-price-row"><div>💰 固定利潤 (* ${product.quantity})：</div><div class="profit">${formatProfit(product.fixedProfit*product.quantity)}</div></div>`; } } else if (cmp) { const p2 = product[t2], tp2 = p2 * product.quantity; const up = Math.abs(p2 - p1), tpr = up * product.quantity; let cost1 = getCostHtml(p1, product.days, product.servings); let cost2 = getCostHtml(p2, product.days, product.servings); html += `<div class="card-price-row"><div>${t1} 單價:</div><div style="text-align:right;">${formatPrice(p1,false)}${cost1}</div></div><div class="card-price-row"><div>${t2} 單價:</div><div style="text-align:right;">${formatPrice(p2,false)}${cost2}</div></div><div class="card-price-row"><div>單件利潤:</div><div class="profit">${formatProfit(up)}</div></div><div class="card-price-row"><div>${t1} 總價 (* ${product.quantity}):</div><div>${formatPrice(tp1,false)}</div></div><div class="card-price-row"><div>${t2} 總價 (* ${product.quantity}):</div><div>${formatPrice(tp2,false)}</div></div><div class="card-price-row"><div>總利潤:</div><div class="profit">${formatProfit(tpr)}</div></div>`; } else { let cost1 = getCostHtml(p1, product.days, product.servings); html += `<div class="card-price-row"><div>${t1} 單價:</div><div style="text-align:right;">${formatPrice(p1,false)}${cost1}</div></div><div class="card-price-row"><div>${t1} 總價 (* ${product.quantity}):</div><div>${formatPrice(tp1,false)}</div></div>`; } html += `<div class="card-price-row"><div>VP:</div><div>${product.vp.toFixed(2)}</div></div><div class="card-price-row"><div>總VP:</div><div>${tvp.toFixed(2)}</div></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;"><div class="qty-control">${qtyBtnHTML('dec', product.stock_no, '−')}<input type="number" class="qty-input" value="${product.quantity}" min="1" onchange="updateQuantity('${product.stock_no}', parseInt(this.value))">${qtyBtnHTML('inc', product.stock_no, '+')}</div><button class="btn-danger" style="padding:6px 12px;font-size:0.85rem;" onclick="removeProductWithAnimation('${product.stock_no}')">移除</button></div>`; card.innerHTML = html; cc.appendChild(card); }); }
function updateCartView() { const cc = document.getElementById('cart-view-content'); const t1 = document.getElementById('pricing-tier1').value; cc.innerHTML = ''; if (selectedProducts.length === 0) { cc.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-style:italic;">🛒 購物車是空的</div>'; document.getElementById('cart-summary-section').style.display = 'none'; return; } document.getElementById('cart-summary-section').style.display = 'block'; let totalQty = 0, totalPrice = 0, totalVP = 0; selectedProducts.forEach(product => { const isPkg = product.type === 'package'; const price = product[t1]; const tp = price * product.quantity; totalQty += product.quantity; totalPrice += tp; totalVP += product.vp * product.quantity; const item = document.createElement('div'); item.className = ['cart-item', newlyAddedStockNos.has(product.stock_no) ? 'animate-in' : ''].filter(Boolean).join(' '); item.setAttribute('data-stockno', product.stock_no); item.innerHTML = `<div class="cart-item-info"><div class="cart-item-name">${product.prod_name}${isPkg ? ' <span style="font-size:0.8em;color:var(--color-pkg);">(套裝)</span>' : ''}</div><div class="cart-item-price">${formatPrice(price, isPkg)} / 件</div></div><div class="cart-item-actions"><div class="cart-item-total">計: ${formatPrice(tp, isPkg)}</div><div class="qty-control">${qtyBtnHTML('dec', product.stock_no, '−')}<input type="number" class="qty-input cart-qty-input" value="${product.quantity}" min="1" onchange="updateQuantity('${product.stock_no}', parseInt(this.value))">${qtyBtnHTML('inc', product.stock_no, '+')}</div></div>`; cc.appendChild(item); }); document.getElementById('cart-total-qty').textContent = totalQty; document.getElementById('cart-total-vp').textContent = totalVP.toFixed(2); document.getElementById('cart-total-price').textContent = formatPrice(totalPrice, false); }
function updatePricing() { updateProductDisplay(); }
function updateSummary() { const sc = document.getElementById('summary'); if (currentView === 'cart') { sc.style.display = 'none'; return; } sc.style.display = 'block'; const t1 = document.getElementById('pricing-tier1').value; const t2 = document.getElementById('pricing-tier2').value; const cmp = t2 && t1 !== t2; const totalQty = selectedProducts.reduce((s, p) => s + p.quantity, 0); const totalP1 = selectedProducts.reduce((s, p) => s + p[t1] * p.quantity, 0); const totalVP = selectedProducts.reduce((s, p) => s + p.vp * p.quantity, 0); const pkgProds = selectedProducts.filter(p => p.type === 'package' && p.fixedProfit !== undefined); const totalPkgPr = pkgProds.reduce((s, p) => s + p.fixedProfit * p.quantity, 0); let html = '<div style="display:flex;flex-wrap:wrap;gap:12px;">'; if (cmp) { const totalP2 = selectedProducts.reduce((s, p) => s + p[t2] * p.quantity, 0); const totalPr = selectedProducts.reduce((s, p) => { if (p.type === 'package' && p.fixedProfit !== undefined) return s + p.fixedProfit * p.quantity; return s + Math.abs(p[t2] - p[t1]) * p.quantity; }, 0); const prRate = totalP1 > 0 ? (totalPr / totalP1) * 100 : 0; html += `<div class="summary-item"><h3>${t1} 價格</h3><div class="summary-row"><div>總數量:</div><div>${totalQty}</div></div><div class="summary-row total"><div>總金額:</div><div>${formatPrice(totalP1, false)}</div></div></div><div class="summary-item"><h3>${t2} 價格</h3><div class="summary-row"><div>總數量:</div><div>${totalQty}</div></div><div class="summary-row total"><div>總金額:</div><div>${formatPrice(totalP2, false)}</div></div></div><div class="summary-item"><h3>利潤計算</h3><div class="summary-row"><div>總利潤:</div><div class="profit">${formatProfit(totalPr)}</div></div><div class="summary-row"><div>利潤率:</div><div class="profit">${prRate.toFixed(2)}%</div></div><div class="summary-row"><div>平均單件:</div><div class="profit">${totalQty > 0 ? formatProfit(totalPr / totalQty) : formatProfit(0)}</div></div></div>`; if (pkgProds.length > 0) { html += `<div class="summary-item profit-section"><h3>💰 套裝固定利潤</h3>`; pkgProds.forEach(p => { html += `<div class="summary-row"><div>${p.prod_name}(* ${p.quantity}):</div><div class="profit">${formatProfit(p.fixedProfit * p.quantity)}</div></div>`; }); html += `<div class="summary-row total"><div>套裝利潤合計:</div><div class="profit">${formatProfit(totalPkgPr)}</div></div></div>`; } } else { html += `<div class="summary-item"><h3>${t1} 總計</h3><div class="summary-row"><div>總數量:</div><div>${totalQty}</div></div><div class="summary-row total"><div>總金額:</div><div>${formatPrice(totalP1, false)}</div></div></div>`; if (pkgProds.length > 0) { html += `<div class="summary-item profit-section"><h3>💰 套裝固定利潤</h3>`; pkgProds.forEach(p => { html += `<div class="summary-row"><div>${p.prod_name}(* ${p.quantity}):</div><div class="profit">${formatProfit(p.fixedProfit * p.quantity)}</div></div>`; }); html += `<div class="summary-row total"><div>套裝利潤合計:</div><div class="profit">${formatProfit(totalPkgPr)}</div></div></div>`; } } html += `<div class="summary-item"><h3>VP計算</h3><div class="summary-row"><div>總VP:</div><div>${totalVP.toFixed(2)}</div></div><div class="summary-row"><div>平均VP:</div><div>${totalQty > 0 ? (totalVP / totalQty).toFixed(2) : '0.00'}</div></div></div>`; html += '</div>'; sc.innerHTML = html; }

function confirmClearSelection() { if (selectedProducts.length === 0) { triggerHaptic('medium'); showToast('沒有可清空的產品'); return; } triggerHaptic('light'); showConfirmDialog('確定要清空所有已選產品嗎?', () => clearSelection()); }
function showConfirmDialog(message, callback) { document.getElementById('confirm-message').textContent = message; document.getElementById('confirm-action-btn').onclick = () => { triggerHaptic('light'); hideConfirmDialog(); if (typeof callback === 'function') callback(); }; document.getElementById('confirm-modal').style.display = 'flex'; }
function hideConfirmDialog() { document.getElementById('confirm-modal').style.display = 'none'; }
function showToast(message, duration = 2500) { const t = document.getElementById('toast-message'); t.textContent = message; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), duration); }
function clearSelection() { triggerHaptic('success'); selectedProducts = []; updateProductDisplay(); showToast('已清空所有選擇的產品'); }

function openVpAssistantModal() { document.getElementById('vp-assistant-modal').style.display = 'flex'; document.getElementById('target-vp-input').focus(); }
function closeVpAssistantModal() { document.getElementById('vp-assistant-modal').style.display = 'none'; }
function selectStrategy(el) { document.querySelectorAll('.vp-strategy-opt').forEach(e => e.classList.remove('active')); el.classList.add('active'); currentStrategy = el.dataset.strategy; triggerHaptic('light'); }

function initVpWorker() {
  const workerCode = `
    self.onmessage = function(e) {
      const { targetVP, candidates, strategy } = e.data;
      let validCandidates = candidates.filter(p => p.vp > 0);
      validCandidates.forEach(p => p.cp = p.vp / p.price);
      validCandidates.sort((a, b) => b.cp - a.cp);
      let bestPrice = Infinity;
      let bestResults = [];
      let gVP = 0, gPrice = 0, gItems = [];
      for(let p of validCandidates) {
        while(gVP < targetVP) {
          gVP += p.vp; gPrice += p.price; gItems.push(p);
        }
        if(gVP >= targetVP) break;
      }
      if(gVP >= targetVP) {
        bestPrice = gPrice;
        bestResults.push({ items: gItems, totalVP: gVP, totalPrice: gPrice, qty: gItems.length, diff: gVP - targetVP });
      }
      function dfs(index, currentItems, currentVP, currentPrice, totalQty) {
        if (currentPrice > bestPrice && strategy !== 'fewest') return;
        if (totalQty > 20) return;
        if (currentVP >= targetVP) {
          const diff = currentVP - targetVP;
          if (currentPrice < bestPrice && strategy !== 'fewest') bestPrice = currentPrice;
          bestResults.push({ items: [...currentItems], totalVP: currentVP, totalPrice: currentPrice, qty: totalQty, diff: diff });
          return;
        }
        for (let i = index; i < validCandidates.length; i++) {
          const p = validCandidates[i];
          let maxQty = Math.ceil((targetVP - currentVP) / p.vp) + 1;
          for(let q = 1; q <= maxQty; q++) {
            let newPrice = currentPrice + p.price * q;
            if (newPrice > bestPrice && strategy !== 'fewest') break;
            let newItems = [...currentItems];
            for(let k = 0; k < q; k++) newItems.push(p);
            dfs(i + 1, newItems, currentVP + p.vp * q, newPrice, totalQty + q);
          }
        }
      }
      dfs(0, [], 0, 0, 0);
      if (strategy === 'accurate') {
        bestResults.sort((a, b) => a.diff - b.diff || a.totalPrice - b.totalPrice);
      } else if (strategy === 'cheapest') {
        bestResults.sort((a, b) => a.totalPrice - b.totalPrice || a.diff - b.diff);
      } else if (strategy === 'fewest') {
        bestResults.sort((a, b) => a.qty - b.qty || a.diff - b.diff);
      }
      const uniqueResults = [];
      const seen = new Set();
      for (const r of bestResults) {
        const sig = r.items.map(p => p.stock_no).sort().join(',');
        if (!seen.has(sig)) {
          seen.add(sig);
          uniqueResults.push(r);
        }
        if (uniqueResults.length >= 5) break;
      }
      self.postMessage(uniqueResults);
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  vpWorker = new Worker(URL.createObjectURL(blob));
  vpWorker.onmessage = function(e) {
    renderVpResults(e.data);
  };
}

function calculateVpRecommendations() {
  if (!getCountryConfig().supportsVP) { showToast(getCountryConfig().name + '價目表沒有 VP 資料，已停用 VP 推薦'); return; }
  const targetVP = parseFloat(document.getElementById('target-vp-input').value);
  if (isNaN(targetVP) || targetVP <= 0) { showToast('請輸入有效的 VP 分數'); return; }
  if (candidateStockNos.size === 0) { showToast('請先在搜尋頁面用 🔖 選擇候選產品'); return; }
  const t1 = document.getElementById('pricing-tier1').value;
  document.getElementById('vp-assistant-results').innerHTML = '<div class="vp-loading"><div class="spinner"></div>計算中，請稍候...</div>';
  const candidates = productsData.filter(p => candidateStockNos.has(p.stock_no));
  const simpleCandidates = candidates.map(p => ({ stock_no:p.stock_no, prod_name:p.prod_name, vp:p.vp, price:p[t1] }));
  if (vpWorker) vpWorker.postMessage({ targetVP, candidates:simpleCandidates, strategy:currentStrategy });
}
function renderVpResults(results) {
  const container = document.getElementById('vp-assistant-results');
  if (results.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-muted);">找不到符合的組合，請增加候選產品。</div>';
    return;
  }
  let html = '';
  results.forEach((r, idx) => {
    const itemMap = {};
    r.items.forEach(p => {
      if (!itemMap[p.stock_no]) itemMap[p.stock_no] = { ...p, count: 0 };
      itemMap[p.stock_no].count++;
    });
    const itemsHtml = Object.values(itemMap).map(p => `${p.prod_name} <span style="color:var(--text-muted); font-size:0.8em;">(x${p.count})</span>`).join(' + ');
    html += `<div class="vp-result-card"><div class="vp-result-header"><strong style="color: var(--text-heading);">方案 ${idx + 1}</strong><span style="color: var(--color-profit); font-weight: 800; font-size: 0.9rem;">總 VP: ${r.totalVP.toFixed(2)} (+${r.diff.toFixed(2)})</span></div><div class="vp-result-items">${itemsHtml}</div><div style="display:flex; justify-content:space-between; align-items:center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;"><span>件數: ${r.qty}</span><span>金額: ${formatPrice(r.totalPrice, false)}</span></div><button class="btn-primary" style="width:100%; padding: 6px; font-size: 0.85rem; border-radius: 8px;" onclick='addRecommendationToCart(${JSON.stringify(Object.values(itemMap).map(p => ({stock_no: p.stock_no, qty: p.count})))})'>加入購物車</button></div>`;
  });
  container.innerHTML = html;
}

function addRecommendationToCart(items) {
  triggerHaptic('success');
  items.forEach(item => {
    const product = productsData.find(p => p.stock_no === item.stock_no);
    if (product) {
      const existing = selectedProducts.find(p => p.stock_no === item.stock_no);
      if (existing) existing.quantity += item.qty;
      else { selectedProducts.push({ ...product, quantity: item.qty }); newlyAddedStockNos.add(item.stock_no); }
    }
  });
  updateProductDisplay();
  closeVpAssistantModal();
  showToast('✅ 已將推薦組合加入購物車');
  setTimeout(() => newlyAddedStockNos.clear(), 400);
}

let deferredInstallPrompt = null;
function initPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; showPwaInstallBtn(); });
  window.addEventListener('appinstalled', () => { hidePwaInstallBtn(); showToast('✅ App 已成功安裝到主畫面！'); });
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (!isStandalone) setTimeout(showPwaInstallBtn, 600);
}
function showPwaInstallBtn() { var w = document.getElementById('pwa-install-wrap'); if (w) w.style.display = 'block'; }
function hidePwaInstallBtn() { var w = document.getElementById('pwa-install-wrap'); if (w) w.style.display = 'none'; }
function handlePwaInstall() { triggerHaptic('medium'); if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.then(function(r) { deferredInstallPrompt = null; if (r.outcome === 'accepted') hidePwaInstallBtn(); }); return; } var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; var isAndroid = /Android/.test(navigator.userAgent); var msg; if (isIOS) msg = 'iPhone / iPad 安裝步驟：\n\n① 確認使用 Safari 瀏覽器打開\n\n② 點底部的「分享」按鈕\n   （方框加箭頭的圖示 □↑）\n\n③ 向下滑動，找到\n   「加入主畫面」\n\n④ 點右上角「新增」即完成 ✅'; else if (isAndroid) msg = 'Android 安裝步驟：\n\n① 確認使用 Chrome 瀏覽器打開\n\n② 點右上角「⋮」選單\n\n③ 選「安裝應用程式」\n   或「新增至主畫面」\n\n④ 點「安裝」即完成 ✅'; else msg = '安裝步驟：\n\n在瀏覽器網址列右側\n或「⋮」選單中\n找到「安裝應用程式」\n點擊後即可安裝到桌面 ✅'; document.getElementById('pwa-info-content').textContent = msg; document.getElementById('pwa-info-modal').style.display = 'flex'; }
function closeNewProductModal() { document.getElementById('new-product-modal').style.display = 'none'; }
function checkNewProductNotification() { if (!localStorage.getItem('seen_new_product_nightmode_and_relaxationtea_2')) { document.getElementById('new-product-modal').style.display = 'flex'; localStorage.setItem('seen_new_product_nightmode_and_relaxationtea_2', 'true'); } }

window.onload = async function () {
  try {
    await loadCountryDataFiles();
    renderDynamicControls();
    initPWA(); initFontSize(); initCurrencySettings(); initCountry(); loadCandidates();
    initCategories(); initVpWorker(); switchView('table'); updateProductDisplay();
    switchWorkspace('single', false); renderComparison(); checkNewProductNotification();
    maybeAutoRefreshExchangeRates();
    document.addEventListener('touchend', function (e) { const btn = e.target.closest('button'); if (btn) setTimeout(() => btn.blur(), 50); }, { passive:true });
  } catch (error) {
    console.error(error);
    document.getElementById('app-title').lastChild.textContent = 'HBL 資料載入失敗';
    showToast('地區價格資料載入失敗，請檢查資料檔案');
  }
};
