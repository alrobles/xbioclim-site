/* Bioclim - site JS (xbioclim.org static frontend) */
'use strict';

const API = 'https://data.xbioclim.org';

const BIOCLIM_VARS = {
  bio01: 'Annual Mean Temperature',
  bio02: 'Mean Diurnal Range',
  bio03: 'Isothermality',
  bio04: 'Temperature Seasonality',
  bio05: 'Max Temp Warmest Month',
  bio06: 'Min Temp Coldest Month',
  bio07: 'Temperature Annual Range',
  bio08: 'Mean Temp Wettest Quarter',
  bio09: 'Mean Temp Driest Quarter',
  bio10: 'Mean Temp Warmest Quarter',
  bio11: 'Mean Temp Coldest Quarter',
  bio12: 'Annual Precipitation',
  bio13: 'Precip Wettest Month',
  bio14: 'Precip Driest Month',
  bio15: 'Precip Seasonality (CV)',
  bio16: 'Precip Wettest Quarter',
  bio17: 'Precip Driest Quarter',
  bio18: 'Precip Warmest Quarter',
  bio19: 'Precip Coldest Quarter'
};

const TEMP_VARS = {};
const PRECIP_VARS = {};
Object.keys(BIOCLIM_VARS).forEach(function (k) {
  const n = parseInt(k.replace('bio', ''), 10);
  if (n <= 11) TEMP_VARS[k] = BIOCLIM_VARS[k];
  else PRECIP_VARS[k] = BIOCLIM_VARS[k];
});

let dataset = '9km';
let years = [];
let yrMin = 1980;
let yrMax = 2020;
let totalFiles = 779;

function $id(id) { return document.getElementById(id); }
function dsQs(sep) { return dataset === '9km' ? '' : sep + 'dataset=' + dataset; }
function apiUrl(path) { return API + path + dsQs('?'); }

/* Theme */
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
(function initTheme() {
  const t = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
})();

/* Toast */
function toast(msg) {
  const el = $id('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 1800);
}

/* Data load */
async function loadStats() {
  try {
    const r = await fetch(apiUrl('/api/years'));
    const j = await r.json();
    years = j.years || [];
    if (!years.length) throw new Error('no years');
    yrMin = parseInt(years[0], 10);
    yrMax = parseInt(years[years.length - 1], 10);

    if ($id('statYears')) $id('statYears').textContent = years.length;

    const s = await (await fetch(apiUrl('/api/summary'))).json();
    const n = (s.years && Object.values(s.years).reduce(function (a, v) { return a + v.length; }, 0)) ||
      s.total_files || totalFiles;
    totalFiles = n;
    if ($id('statFiles')) $id('statFiles').textContent = n;

    const y = $id('yearInput');
    if (y) { y.min = yrMin; y.max = yrMax; y.placeholder = yrMax; y.value = yrMax; }
    const rs = $id('rangeStart');
    const re = $id('rangeEnd');
    if (rs) { rs.min = yrMin; rs.max = yrMax; rs.value = yrMin; }
    if (re) { re.min = yrMin; re.max = yrMax; re.value = yrMax; }
    updateRange();
  } catch (e) {
    if ($id('statYears')) $id('statYears').textContent = '41';
    if ($id('statFiles')) $id('statFiles').textContent = '779';
  }
}

/* Variable chips */
function renderVars() {
  function chips(d) {
    return Object.keys(d).map(function (k) {
      return '<div class="var-chip"><code>' + k + '</code><span>' + d[k] + '</span></div>';
    }).join('');
  }
  if ($id('tempVars')) $id('tempVars').innerHTML = chips(TEMP_VARS);
  if ($id('precipVars')) $id('precipVars').innerHTML = chips(PRECIP_VARS);
}

/* Dataset toggle */
function setDataset(d) {
  dataset = d;
  const b9 = $id('ds9');
  const b1 = $id('ds1');
  if (b9) b9.classList.toggle('dataset-btn-active', d === '9km');
  if (b1) b1.classList.toggle('dataset-btn-active', d === '1km');
  updateRange();
}

/* Range / curl */
function updateRange() {
  const rs = $id('rangeStart');
  const re = $id('rangeEnd');
  const s = rs ? parseInt(rs.value, 10) : yrMin;
  let e = re ? parseInt(re.value, 10) : yrMax;
  if (s > e) { if (re) re.value = s; e = s; }
  if ($id('startVal')) $id('startVal').textContent = s;
  if ($id('endVal')) $id('endVal').textContent = e;
  const n = e - s + 1;
  if ($id('fileCount')) $id('fileCount').textContent = n * 19;
  if ($id('yearCount')) $id('yearCount').textContent = n;
  const cmd = 'curl -sSf "' + API + '/api/scripts?start=' + s + '&end=' + e + '&fmt=bash' + dsQs('&') + '" -o bioclim.sh && bash bioclim.sh';
  if ($id('curlCmd')) $id('curlCmd').textContent = cmd;
}

function copyCurl() {
  navigator.clipboard.writeText($id('curlCmd').textContent).then(function () { toast('Copied'); });
}
function downloadScript(fmt) {
  const s = $id('rangeStart') ? parseInt($id('rangeStart').value, 10) : yrMin;
  const e = $id('rangeEnd') ? parseInt($id('rangeEnd').value, 10) : yrMax;
  window.open(API + '/api/scripts?start=' + s + '&end=' + e + '&fmt=' + fmt + dsQs('&'), '_blank');
}
function goToYear() {
  const y = $id('yearInput') ? $id('yearInput').value : '';
  if (y && y >= yrMin && y <= yrMax) window.open(API + '/' + y + '/' + dsQs('?'), '_blank');
}

/* Client docs */
const CLIENTS = {
  python: 'from ecoseek_bioclim import BioclimClient\n\nclient = BioclimClient()',
  r: 'library(terra)',
  curl: 'curl -sSf "https://data.xbioclim.org/api/scripts"'
};

function showClient(lang) {
  ['python', 'r', 'curl'].forEach(function (k) {
    const el = $id('tab' + k[0].toUpperCase() + k.slice(1));
    if (el) el.classList.toggle('client-tab-active', k === lang);
  });
  const code = $id('clientCode');
  if (code) code.textContent = CLIENTS[lang] || CLIENTS.python;
}

function copyClient() {
  const active = document.querySelector('.client-tab-active');
  const lang = active ? active.id.replace('tab', '').toLowerCase() : 'python';
  navigator.clipboard.writeText(CLIENTS[lang] || CLIENTS.python).then(function () { toast('Copied'); });
}

renderVars();
loadStats();
showClient('python');