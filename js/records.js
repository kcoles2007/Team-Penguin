/* records.js: the Earth records page (saving and CSV download). */

/* ---------- View 5: records sent back to Earth ---------- */
let log = load(STORE.log, []);

function rowFor(a, t) {
  return {
    time: new Date(t).toISOString(), astronaut: a.name, status: LABEL[overall(a).level],
    heartbeat_bpm: Math.round(a.cur.hr), temperature_c: +a.cur.temp.toFixed(1),
    bp_systolic: Math.round(a.cur.sys), bp_diastolic: Math.round(a.cur.dia),
    hydration_pct: Math.round(a.cur.hyd), spo2_pct: Math.round(a.cur.o2),
    sugar_mgdl: Math.round(a.cur.sugar), rem_min: value(a, 'rem')
  };
}

function autosave() {
  const t = Date.now();
  const entry = { t: t, rows: ASTRONAUTS.map((a) => rowFor(a, t)), sent: false };
  log.unshift(entry);
  log = log.slice(0, 30);
  save(STORE.log, log);
  if (SHEETS_URL) {
    fetch(SHEETS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(entry.rows) })
      .then(() => { entry.sent = true; save(STORE.log, log); if (state.view === 'records') renderRecords(); })
      .catch(() => { /* will show as "saved on this device" */ });
  }
  if (state.view === 'records') renderRecords();
}

function renderRecords() {
  const a = current();
  const latest = log[0];
  const mine = latest ? latest.rows.find((r) => r.astronaut === a.name) : null;
  $('#records').innerHTML =
    '<div class="rec">' +
      '<div class="rec-top">' +
        '<div class="card"><h3>Auto-save to Earth</h3>' +
          '<label class="switch"><input type="checkbox" id="auto"' + (state.autosave ? ' checked' : '') + '><span>Save every ' + (SYNC_MS / 1000) + ' seconds</span></label>' +
          '<p>' + (latest ? 'Last record saved at ' + timeFmt(latest.t) + (latest.sent ? ' and sent to Google Sheets.' : ' on this device.') : 'Nothing saved yet.') + '</p>' +
          '<div class="pipeline" aria-label="Data path"><span>ESP32 sensors</span><i>\u2192</i><span>This page</span><i>\u2192</i><span>Google Sheets</span></div>' +
          '<p class="small" style="margin-top:.7rem">' + (SHEETS_URL ? 'Google Sheets sync is on.' : 'Google Sheets sync is off. Add your Apps Script URL to SHEETS_URL in script.js to turn it on.') + '</p>' +
          '<div class="rec-row"><button type="button" class="btn" id="save-now">Save a record now</button><button type="button" class="btn ghost" id="csv"' + (log.length ? '' : ' disabled') + '>Download CSV</button></div>' +
        '</div>' +
        '<div class="card"><h3>Latest record for ' + esc(a.name) + '</h3>' +
          (mine
            ? '<div class="table-wrap"><table><tbody>' +
              '<tr><th scope="row">Heartbeat</th><td>' + mine.heartbeat_bpm + ' bpm</td></tr>' +
              '<tr><th scope="row">Temperature</th><td>' + mine.temperature_c + ' °C</td></tr>' +
              '<tr><th scope="row">Blood pressure</th><td>' + mine.bp_systolic + '/' + mine.bp_diastolic + ' mmHg</td></tr>' +
              '<tr><th scope="row">Hydration</th><td>' + mine.hydration_pct + '%</td></tr>' +
              '<tr><th scope="row">Oxygen</th><td>' + mine.spo2_pct + '%</td></tr>' +
              '<tr><th scope="row">Sugar</th><td>' + mine.sugar_mgdl + ' mg/dL</td></tr>' +
              '<tr><th scope="row">REM sleep</th><td>' + mine.rem_min + ' min</td></tr>' +
              '<tr><th scope="row">Status</th><td>' + esc(mine.status) + '</td></tr></tbody></table></div>'
            : '<p class="small">Save a record to see it here.</p>') +
        '</div>' +
      '</div>' +
      '<div class="card"><h3>Recent saves</h3>' +
        (log.length
          ? '<div class="table-wrap"><table><thead><tr><th>Time</th><th>Crew recorded</th><th>Where</th></tr></thead><tbody>' +
            log.slice(0, 6).map((e) => '<tr><td>' + timeFmt(e.t) + '</td><td>' + e.rows.length + '</td><td>' + (e.sent ? 'Google Sheets' : 'This device') + '</td></tr>').join('') +
            '</tbody></table></div>'
          : '<p class="small">No saves yet.</p>') +
      '</div>' +
      '<div class="limits">' +
        '<div class="card"><h3>Known problems</h3><ul>' +
          '<li><strong>Storage:</strong> weeks of readings add up, so old records need to be trimmed or archived.</li>' +
          '<li><strong>Deterioration:</strong> sensors drift and wear out over a mission and need re-checking.</li>' +
          '<li><strong>Connecting devices:</strong> every sensor has to reach the system reliably.</li></ul></div>' +
        '<div class="card"><h3>Not measured</h3><ul>' +
          '<li><strong>Bone loss:</strong> cannot be tracked with these sensors.</li>' +
          '<li><strong>Radiation:</strong> cannot be tracked with these sensors.</li></ul></div>' +
      '</div>' +
    '</div>';
}

function downloadCsv() {
  if (!log.length) return;
  const rows = [].concat.apply([], log.slice().reverse().map((e) => e.rows));
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(',')].concat(rows.map((r) => cols.map((c) => '"' + String(r[c]).replace(/"/g, '""') + '"').join(','))).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'astronaut-health-records.csv';
  document.body.appendChild(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
  toast('CSV downloaded');
}
