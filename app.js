/* EcoSeek Bioclim — site JS (xbioclim.org static frontend) */
const API = 'https://data.xbioclim.org';

const BIOCLIM_VARS = {
  bio01: 'Annual Mean Temperature', bio02: 'Mean Diurnal Range', bio03: 'Isothermality',
  bio04: 'Temperature Seasonality', bio05: 'Max Temp Warmest Month', bio06: 'Min Temp Coldest Month',
  bio07: 'Temperature Annual Range', bio08: 'Mean Temp Wettest Quarter', bio09: 'Mean Temp Driest Quarter',
  bio10: 'Mean Temp Warmest Quarter', bio11: 'Mean Temp Coldest Quarter',
  bio12: 'Annual Precipitation', bio13: 'Precip Wettest Month', bio14: 'Precip Driest Month',
  bio15: 'Precip Seasonality (CV)', bio16: 'Precip Wettest Quarter', bio17: 'Precip Driest Quarter',
  bio18: 'Precip Warmest Quarter', bio19: 'Precip Coldest Quarter',
};
const TEMP_VARS = Object.fromEntries(Object.entries(BIOCLIM_VARS).filter(([k]) => parseInt(k.replace('bio', '')) <= 11));
const PRECIP_VARS = Object.fromEntries(Object.entries(BIOCLIM_VARS).filter(([k]) => parseInt(k.replace('bio', '')) >= 12));

let dataset = '9km';
let years = [];
let yrMin = 1980, yrMax = 2020;
let totalFiles = 779;

function dsQs(sep) { return dataset === '9km' ? '' : sep + 'dataset=' + dataset; }
function apiUrl(path) { return API + path + dsQs('?'); }

/* ── Theme ── */
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
(function () {
  const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
})();

/* ── Toast ── */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

/* ── Data load ── */
async function loadStats() {
  try {
    const r = await fetch(apiUrl('/api/years'));
    const j = await r.json();
    years = j.years || [];
    yrMin = parseInt(years[0]); yrMax = parseInt(years[years.length - 1]);
    document.getElementById('statYears').textContent = years.length;
    const s = await (await fetch(apiUrl('/api/summary'))).json();
    const n = (s.years && Object.values(s.years).reduce((a, v) => a + v.length, 0)) || s.total_files || totalFiles;
    totalFiles = n;
    document.getElementById('statFiles').textContent = n;
    const y = document.getElementById('yearInput');
    y.min = yrMin; y.max = yrMax; y.placeholder = yrMax; y.value = yrMax;
    document.getElementById('rangeStart').min = yrMin;
    document.getElementById('rangeStart').max = yrMax;
    document.getElementById('rangeEnd').min = yrMin;
    document.getElementById('rangeEnd').max = yrMax;
    document.getElementById('rangeStart').value = yrMin;
    document.getElementById('rangeEnd').value = yrMax;
    updateRange();
  } catch (e) {
    document.getElementById('statYears').textContent = '41';
    document.getElementById('statFiles').textContent = '779';
  }
}

/* ── Variable chips ── */
function renderVars() {
  const chips = (d) => Object.entries(d).map(([k, v]) =>
    `<div class="var-chip"><code>${k}</code><span>${v}</span></div>`).join('');
  document.getElementById('tempVars').innerHTML = chips(TEMP_VARS);
  document.getElementById('precipVars').innerHTML = chips(PRECIP_VARS);
}

/* ── Dataset toggle ── */
function setDataset(d) {
  dataset = d;
  document.getElementById('ds9').classList.toggle('dataset-btn-active', d === '9km');
  document.getElementById('ds1').classList.toggle('dataset-btn-active', d === '1km');
  updateRange();
}

/* ── Range / curl ── */
function updateRange() {
  let s = parseInt(document.getElementById('rangeStart').value);
  let e = parseInt(document.getElementById('rangeEnd').value);
  if (s > e) { document.getElementById('rangeEnd').value = s; e = s; }
  document.getElementById('startVal').textContent = s;
  document.getElementById('endVal').textContent = e;
  const n = e - s + 1;
  document.getElementById('fileCount').textContent = n * 19;
  document.getElementById('yearCount').textContent = n;
  const cmd = `curl -sSf "${API}/api/scripts?start=${s}&end=${e}&fmt=bash${dsQs('&')}" -o bioclim.sh && bash bioclim.sh`;
  document.getElementById('curlCmd').textContent = cmd;
}

function copyCurl() {
  navigator.clipboard.writeText(document.getElementById('curlCmd').textContent).then(() => toast('Copied'));
}
function downloadScript(fmt) {
  const s = parseInt(document.getElementById('rangeStart').value);
  const e = parseInt(document.getElementById('rangeEnd').value);
  window.open(`${API}/api/scripts?start=${s}&end=${e}&fmt=${fmt}${dsQs('&')}`, '_blank');
}
function goToYear() {
  const y = document.getElementById('yearInput').value;
  if (y && y >= yrMin && y <= yrMax) window.open(`${API}/${y}/${dsQs('?')}`, '_blank');
}

/* ── Client docs ── */
const CLIENTS = {
  python: `from ecoseek_bioclim import BioclimClient

client = BioclimClient()  # defaults to https://data.xbioclim.org

years = client.years()                      # ['1980', ..., '2020']
summary = client.summary()                  # {"total_files": 779, ...}
client.download("bio01", 2020, "/tmp/bio01_2020.tif")   # single file

import rasterio
with client.open_rasterio("bio01", 2020) as src:
    data = src.read(1)`,
  r: `library(terra)

url  <- "https://data.xbioclim.org/api/download/2020/bio01_2020.tif"
dest <- tempfile(fileext = ".tif")
download.file(url, dest, mode = "wb")

r <- rast(dest)
plot(r, main = "Annual Mean Temperature (2020)")`,
  curl: `# all files 1980-2020 (bash script)
curl -sSf "https://data.xbioclim.org/api/scripts?start=1980&end=2020&fmt=bash" -o bioclim.sh \\
  && bash bioclim.sh

# single file
curl -sSf -o bio01_2020.tif \\
  "https://data.xbioclim.org/api/download/2020/bio01_2020.tif"`,
};

function showClient(lang) {
  ['python', 'r', 'curl'].forEach((k) => document.getElementById('tab' + k[0].toUpperCase() + k.slice(1)).classList.toggle('client-tab-active', k === lang));
  document.getElementById('clientCode').textContent = CLIENTS[lang] || CLIENTS.python;
}
function copyClient() {
  const lang = document.querySelector('.client-tab-active').id.replace('tab', '').toLowerCase();
  navigator.clipboard.writeText(CLIENTS[lang] || CLIENTS.python).then(() => toast('Copied'));
}

renderVars();
loadStats();