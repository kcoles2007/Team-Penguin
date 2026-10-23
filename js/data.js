/* data.js: the made-up crew, the health limits, and the fake sensor readings.
   Every file in this project shares these variables, so the other files
   can use ASTRONAUTS, METRICS, state, and the helper functions below. */

/* ---------- Settings ---------- */
// Paste a Google Apps Script web-app URL here to send each saved record to a Google Sheet.
const SHEETS_URL = '';
const TICK_MS = 2000;      // how often the simulated sensors update
const SYNC_MS = 10000;     // how often a record is auto-saved "to Earth"
const HISTORY = 40;        // readings kept for each chart
const STORE = { log: 'nasa-hms-log', checkups: 'nasa-hms-checkups' };

/* ---------- Small helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const timeFmt = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const dateFmt = (t) => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: keep running in memory */ }
}

/* ---------- Metrics (from the health assessment list) ---------- */
// min/max = normal range. lo/hi = outer limits before a reading counts as an alert.
const METRICS = [
  { key: 'hr', label: 'Heartbeat', unit: 'bpm', dec: 0, min: 50, max: 100, lo: 40, hi: 120, sensor: 'MAX30102 sensor',
    desc: 'Beats per minute, read by the MAX30102 optical sensor. Fit adults normally rest between 50 and 100.',
    tip: 'Rest for ten minutes, cut caffeine, then measure again. If it stays out of range, message the flight surgeon.' },
  { key: 'temp', label: 'Temperature', unit: '°C', dec: 1, min: 36.1, max: 37.2, lo: 35.0, hi: 38.2, sensor: 'MAX30205 sensor',
    desc: 'Body temperature from the MAX30205. Normal is about 36.1 to 37.2 °C.',
    tip: 'Check suit and cabin temperature, rest, and measure again. A fever that lasts more than a few hours needs the flight surgeon.' },
  { key: 'bp', label: 'Blood pressure', unit: 'mmHg', dec: 0, min: 90, max: 120, lo: 80, hi: 140, sensor: 'Estimated in software',
    desc: 'There is no cuff in orbit, so the software estimates systolic over diastolic from heart rate and each astronaut\u2019s baseline. Normal systolic is about 90 to 120.',
    tip: 'Sit still for five minutes, breathe slowly, and measure again. Repeated high readings go to the flight surgeon.' },
  { key: 'hyd', label: 'Hydration', unit: '%', dec: 0, min: 65, max: 100, lo: 55, hi: 101, sensor: 'Trend from sensor data',
    desc: 'Share of target body water. 65% or higher is healthy.',
    tip: 'Drink water or an electrolyte drink, log the intake, and check again in 30 minutes.' },
  { key: 'o2', label: 'Oxygen intake', unit: '% SpO\u2082', dec: 0, min: 95, max: 100, lo: 92, hi: 101, sensor: 'MAX30102 sensor',
    desc: 'Blood oxygen saturation (SpO\u2082) from the MAX30102. 95 to 100% is normal.',
    tip: 'Check cabin O\u2082 and suit pressure, take slow deep breaths, and measure again. Below 92% is an alert.' },
  { key: 'sugar', label: 'Sugar level', unit: 'mg/dL', dec: 0, min: 70, max: 140, lo: 60, hi: 180, sensor: 'Glucose reading (simulated)',
    desc: 'Blood sugar. 70 to 140 mg/dL is normal across fasting and after meals.',
    tip: 'If low, eat a balanced snack. If high, skip sugary food and check again after an hour.' },
  { key: 'rem', label: 'REM sleep', unit: 'min', dec: 0, min: 80, max: 130, lo: 50, hi: 160, sensor: 'Sleep tracker (last night)',
    desc: 'Minutes of REM sleep last night. 80 to 130 minutes is typical.',
    tip: 'Keep a fixed sleep window, dim the lights before bed, and limit screens and caffeine.' }
];
const METRIC = Object.fromEntries(METRICS.map((m) => [m.key, m]));

// Positions of the numbered hotspots on the body figure (percent of the figure box).
const HOTSPOTS = { temp: [50, 12], rem: [78, 9], hr: [58, 28], o2: [19, 46], bp: [82, 40], hyd: [50, 44], sugar: [50, 57] };

/* ---------- Made-up crew ---------- */
const MISSION = 'Lunar Orbit Expedition 7';
const MOODS = ['Very poor', 'Poor', 'Okay', 'Good', 'Great'];
const SYMPTOMS = ['Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Poor sleep', 'Muscle aches', 'Low appetite'];

const ASTRONAUTS = [
  { id: 1, name: 'Mara Voss',      role: 'Commander',          age: 41, kg: 68, cm: 170, base: { hr: 64, temp: 36.6, sys: 112, dia: 72, hyd: 82, o2: 98, sugar: 92 } },
  { id: 2, name: 'Ibrahim Reyes',  role: 'Pilot',              age: 38, kg: 79, cm: 181, base: { hr: 68, temp: 36.7, sys: 118, dia: 76, hyd: 78, o2: 98, sugar: 98 } },
  { id: 3, name: 'Lena Park',      role: 'Medical Officer',    age: 36, kg: 60, cm: 165, base: { hr: 62, temp: 36.5, sys: 108, dia: 68, hyd: 85, o2: 99, sugar: 88 } },
  { id: 4, name: 'Tomas Ilves',    role: 'Flight Engineer',    age: 44, kg: 83, cm: 184, base: { hr: 72, temp: 36.8, sys: 122, dia: 80, hyd: 61, o2: 97, sugar: 110 } },
  { id: 5, name: 'Aiko Tanaka',    role: 'Mission Specialist', age: 33, kg: 55, cm: 160, base: { hr: 66, temp: 36.6, sys: 106, dia: 66, hyd: 88, o2: 99, sugar: 90 } },
  { id: 6, name: 'Dario Costa',    role: 'Flight Engineer',    age: 47, kg: 86, cm: 178, base: { hr: 74, temp: 36.9, sys: 126, dia: 82, hyd: 74, o2: 93.5, sugar: 118 } },
  { id: 7, name: 'Nia Mensah',     role: 'Science Officer',    age: 35, kg: 63, cm: 168, base: { hr: 92, temp: 37.9, sys: 134, dia: 86, hyd: 52, o2: 96, sugar: 150 } },
  { id: 8, name: 'Jonas Berg',     role: 'Mission Specialist', age: 39, kg: 76, cm: 179, base: { hr: 63, temp: 36.6, sys: 114, dia: 74, hyd: 80, o2: 98, sugar: 95 } }
];
const REM_BASE = [104, 96, 112, 74, 108, 88, 62, 100];

ASTRONAUTS.forEach((a, i) => {
  a.initials = a.name.split(' ').map((p) => p[0]).join('');
  a.cur = { hr: a.base.hr, temp: a.base.temp, hyd: a.base.hyd, o2: a.base.o2, sugar: a.base.sugar, sys: a.base.sys, dia: a.base.dia };
  a.hist = { hr: [], temp: [], bp: [], hyd: [], o2: [], sugar: [] };
  a.rem = Array.from({ length: 7 }, () => Math.round(REM_BASE[i] + rnd(-9, 9)));
  for (let k = 0; k < HISTORY; k++) step(a);
});

/* ---------- Simulated sensors ---------- */
function step(a) {
  const b = a.base, c = a.cur;
  c.hr = clamp(c.hr + (b.hr - c.hr) * 0.2 + rnd(-2.5, 2.5), 40, 150);
  c.temp = clamp(c.temp + (b.temp - c.temp) * 0.2 + rnd(-0.06, 0.06), 35, 39.5);
  c.hyd = clamp(c.hyd + (b.hyd - c.hyd) * 0.1 + rnd(-0.6, 0.6), 30, 100);
  c.o2 = clamp(c.o2 + (b.o2 - c.o2) * 0.25 + rnd(-0.4, 0.4), 85, 100);
  c.sugar = clamp(c.sugar + (b.sugar - c.sugar) * 0.15 + rnd(-3, 3), 40, 300);
  // Blood pressure has no sensor: estimate it from heart rate and the astronaut's baseline.
  c.sys = clamp(b.sys + (c.hr - b.hr) * 0.5 + rnd(-2, 2), 70, 200);
  c.dia = clamp(b.dia + (c.hr - b.hr) * 0.3 + rnd(-1.5, 1.5), 40, 130);
  const h = a.hist;
  [['hr', c.hr], ['temp', c.temp], ['bp', c.sys], ['hyd', c.hyd], ['o2', c.o2], ['sugar', c.sugar]].forEach(([k, v]) => {
    h[k].push(v);
    if (h[k].length > HISTORY) h[k].shift();
  });
}

function value(a, key) {
  if (key === 'bp') return a.cur.sys;
  if (key === 'rem') return a.rem[a.rem.length - 1];
  return a.cur[key];
}
function series(a, key) { return key === 'rem' ? a.rem : a.hist[key]; }
function display(a, key) {
  const m = METRIC[key];
  if (key === 'bp') return Math.round(a.cur.sys) + '/' + Math.round(a.cur.dia);
  return Number(value(a, key)).toFixed(m.dec);
}
function levelOf(key, v) {
  const m = METRIC[key];
  if (v >= m.min && v <= m.max) return 'ok';
  if (v >= m.lo && v <= m.hi) return 'watch';
  return 'alert';
}
const LABEL = { ok: 'Nominal', watch: 'Watch', alert: 'Alert' };
const RANK = { ok: 0, watch: 1, alert: 2 };

/* ---------- Weekly check-ups ---------- */
const DAY = 864e5;
let checkups = load(STORE.checkups, null);
if (!checkups) {
  checkups = {};
  ASTRONAUTS.forEach((a, i) => {
    const mood = a.id === 7 ? 2 : (a.id === 4 ? 3 : 4);
    checkups[a.id] = [{
      t: Date.now() - (3 + (i % 5)) * DAY, mood: mood,
      symptoms: a.id === 7 ? ['Fatigue', 'Headache'] : [],
      note: a.id === 7 ? 'Tired most days and my head aches by the evening.' : 'Feeling steady. Workouts and meals are on schedule.'
    }];
  });
  save(STORE.checkups, checkups);
}
const lastCheckup = (a) => (checkups[a.id] || [])[0];

function overall(a) {
  let worst = 'ok';
  const flags = [];
  METRICS.forEach((m) => {
    const lvl = levelOf(m.key, value(a, m.key));
    if (lvl !== 'ok') flags.push({ label: m.label, lvl: lvl, text: display(a, m.key) + ' ' + m.unit });
    if (RANK[lvl] > RANK[worst]) worst = lvl;
  });
  const c = lastCheckup(a);
  if (c && c.mood <= 2) {
    flags.push({ label: 'Weekly check-up', lvl: 'watch', text: 'reported feeling ' + MOODS[c.mood - 1].toLowerCase() });
    if (worst === 'ok') worst = 'watch';
  }
  return { level: worst, flags: flags };
}

/* ---------- App state ---------- */
const state = { view: 'astronauts', id: 1, metric: 'hr', autosave: true };
const current = () => ASTRONAUTS.find((a) => a.id === state.id);

function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- Charts ---------- */
function spark(vals, m) {
  const W = 300, H = 96, pad = 8;
  let lo = Math.min(m.min, Math.min.apply(null, vals)), hi = Math.max(m.max, Math.max.apply(null, vals));
  const margin = (hi - lo) * 0.12; lo -= margin; hi += margin;
  const y = (v) => H - pad - ((v - lo) / (hi - lo || 1)) * (H - pad * 2);
  const x = (i) => pad + i * (W - pad * 2) / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
  const top = y(m.max), bot = y(m.min);
  return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Trend of recent ' + esc(m.label.toLowerCase()) + ' readings">' +
    '<rect class="band" x="0" y="' + top.toFixed(1) + '" width="' + W + '" height="' + Math.max(bot - top, 0).toFixed(1) + '"/>' +
    '<polyline class="line" points="' + pts + '"/>' +
    '<circle class="dot" cx="' + x(vals.length - 1).toFixed(1) + '" cy="' + y(vals[vals.length - 1]).toFixed(1) + '" r="4"/></svg>';
}
