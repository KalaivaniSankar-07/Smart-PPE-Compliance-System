// ============================================================
//  SmartHelmet — Firebase Real-Time Handler
//  Light theme UI · Professional Edition
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://mines-7b85e-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const THRESH = {
  temp: { warn: 40, danger: 50, max: 100 },
  hum:  { warn: 80, danger: 90, max: 100 },
  gas:  { warn: 600, danger: 700, max: 1000 },
};

let logRows = [];

// ── Real-time listener ────────────────────────────────────────
onValue(ref(db, '/'), (snap) => {
  const d = snap.val();
  if (!d) return;

  setConnection(true);

  const temp = parseFloat(d.Temp)  || 0;
  const hum  = parseFloat(d.Hum)   || 0;
  const gas  = parseFloat(d.Gas)   || 0;
  const ts   = d.Timestamp || new Date().toLocaleTimeString();

  updateKPI('temp', temp, THRESH.temp);
  updateKPI('hum',  hum,  THRESH.hum);
  updateKPI('gas',  gas,  THRESH.gas);

  const el = document.getElementById('lastTimestamp');
  if (el) el.textContent = ts;

  if (window.drawRadial) {
    window.drawRadial('gTemp', temp / THRESH.temp.max, 'temp', temp.toFixed(1), '\u00b0C');
    window.drawRadial('gHum',  hum  / THRESH.hum.max,  'hum',  hum.toFixed(1),  '%RH');
    window.drawRadial('gGas',  gas  / THRESH.gas.max,  'gas',  gas.toFixed(0),  'ppm');
  }

  const score = calcScore(temp, hum, gas);
  updateScoreUI(score);

  checkAlerts(temp, hum, gas);
  addLogRow(ts, temp, hum, gas, score);

}, (err) => {
  console.error(err);
  setConnection(false);
});

// ── KPI update ────────────────────────────────────────────────
function cap(key) { return key.charAt(0).toUpperCase() + key.slice(1); }

function updateKPI(key, value, thresh) {
  const pct   = Math.min((value / thresh.max) * 100, 100);
  const level = value >= thresh.danger ? 'danger' : value >= thresh.warn ? 'warn' : 'safe';
  const labels = { safe: 'Normal', warn: 'Warning', danger: 'Danger' };
  const suffix = { temp: '\u00b0C', hum: '%', gas: 'ppm' }[key];

  const valEl  = document.getElementById(`${key}Value`);
  const barEl  = document.getElementById(`${key}Bar`);
  const pillEl = document.getElementById(`${cap(key)}Pill`);
  const cardEl = document.getElementById(`kpi${cap(key)}`);

  if (valEl)  valEl.innerHTML = `${value.toFixed(key === 'gas' ? 0 : 1)}<span class="kpi-suffix">${suffix}</span>`;
  if (barEl)  barEl.style.width = `${pct}%`;
  if (pillEl) { pillEl.textContent = labels[level]; pillEl.className = `kpi-status-pill ${level}`; }
  if (cardEl) cardEl.className = `kpi-card${level !== 'safe' ? ' state-' + level : ''}`;

  const sbEl  = document.getElementById(`sb${cap(key)}`);
  const sbVal = document.getElementById(`sb${cap(key)}Val`);
  if (sbEl)  sbEl.style.width = `${pct}%`;
  if (sbVal) sbVal.textContent = key === 'gas' ? value.toFixed(0) : value.toFixed(1);
}

// ── Score ──────────────────────────────────────────────────────
function calcScore(temp, hum, gas) {
  let s = 100;
  s -= penalty(temp, THRESH.temp, 33);
  s -= penalty(hum,  THRESH.hum,  33);
  s -= penalty(gas,  THRESH.gas,  34);
  return Math.max(0, Math.round(s));
}

function penalty(v, t, maxP) {
  if (v <= t.warn)   return 0;
  if (v >= t.danger) return maxP;
  return Math.round(((v - t.warn) / (t.danger - t.warn)) * maxP);
}

function updateScoreUI(score) {
  const numEl     = document.getElementById('scoreNum');
  const labelEl   = document.getElementById('scoreLabel');
  const verdictEl = document.getElementById('scoreVerdict');
  const chipEl    = document.getElementById('scoreChip');

  if (numEl)   numEl.textContent   = score;
  if (labelEl) labelEl.textContent = `Score: ${score}`;

  let lvl = 'safe', txt = 'All Clear';
  if (score < 50)      { lvl = 'danger'; txt = 'Critical Danger'; }
  else if (score < 75) { lvl = 'warn';   txt = 'Caution';         }

  if (verdictEl) { verdictEl.textContent = txt; verdictEl.className = `score-verdict ${lvl === 'safe' ? '' : lvl}`; }
  if (chipEl)    chipEl.className = `score-chip ${lvl === 'safe' ? '' : lvl}`;

  if (window.drawScoreRing) window.drawScoreRing('scoreRing', score);
}

// ── Alerts ─────────────────────────────────────────────────────
function checkAlerts(temp, hum, gas) {
  const msgs = [];
  if (temp >= THRESH.temp.danger) msgs.push(`High temperature: ${temp.toFixed(1)}\u00b0C`);
  if (hum  >= THRESH.hum.danger)  msgs.push(`High humidity: ${hum.toFixed(1)}%`);
  if (gas  >= THRESH.gas.danger)  msgs.push(`Gas detected: ${gas.toFixed(0)} ppm`);

  const strip = document.getElementById('alertStrip');
  const msgEl = document.getElementById('alertMessage');
  const badge = document.getElementById('navBadge');

  if (msgs.length && strip && msgEl) {
    msgEl.textContent = msgs.join('  \u00b7  ');
    strip.style.display = 'flex';
    if (badge) { badge.textContent = msgs.length; badge.style.display = 'inline'; }
  } else if (!msgs.length && strip) {
    strip.style.display = 'none';
    if (badge) badge.style.display = 'none';
  }
}

window.dismissAlert = () => {
  const s = document.getElementById('alertStrip');
  if (s) s.style.display = 'none';
};

// ── Log ────────────────────────────────────────────────────────
function addLogRow(ts, temp, hum, gas, score) {
  const tbody = document.getElementById('logBody');
  if (!tbody) return;
  const empty = tbody.querySelector('.log-empty');
  if (empty) empty.remove();

  const lvl = score >= 75 ? 'safe' : score >= 50 ? 'warn' : 'danger';
  const lbl = { safe: 'Normal', warn: 'Warning', danger: 'Danger' }[lvl];

  const tr = document.createElement('tr');
  tr.className = 'row-flash';
  tr.innerHTML = `
    <td>${ts}</td>
    <td style="color:var(--temp)">${temp.toFixed(1)}</td>
    <td style="color:var(--hum)">${hum.toFixed(1)}</td>
    <td style="color:var(--gas)">${gas.toFixed(0)}</td>
    <td><span class="log-pill ${lvl}">${lbl}</span></td>
  `;
  tbody.insertBefore(tr, tbody.firstChild);
  logRows.push(tr);
  if (logRows.length > 50) { logRows[0].remove(); logRows.shift(); }
}

window.clearLog = () => {
  const tbody = document.getElementById('logBody');
  if (tbody) {
    tbody.innerHTML = '<tr class="log-empty"><td colspan="5">Log cleared.</td></tr>';
    logRows = [];
  }
};

// ── Connection ─────────────────────────────────────────────────
function setConnection(live) {
  const dot   = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  if (dot)   dot.className  = `conn-dot ${live ? 'live' : 'offline'}`;
  if (label) label.textContent = live ? 'Live' : 'Offline';
}

