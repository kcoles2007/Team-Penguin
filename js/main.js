/* main.js: navigation, button clicks, the live update loop, and start-up.
   Load order matters: this file must come after all the others. */

// Call this from the Astronauts page when someone picks an astronaut.
// Example: chooseAstronaut(3)  -> opens the Summary page for astronaut 3
function chooseAstronaut(id) {
  state.id = id;
  show('summary', true);
}

/* ---------- Shell: header chip, navigation ---------- */
function updateWho() {
  const a = current();
  const lvl = overall(a).level;
  $('#who').innerHTML = '<span class="avatar sm" aria-hidden="true">' + esc(a.initials) + '</span><span>' + esc(a.name) + '</span><span class="pill st-' + lvl + '">' + LABEL[lvl] + '</span>';
  $('#who').setAttribute('aria-label', 'Selected astronaut: ' + a.name + ', ' + LABEL[lvl] + '. Open astronaut list');
}

const RENDER = { astronauts: renderAstronautsPage, summary: renderSummary, vitals: renderVitals, checkup: renderCheckup, records: renderRecords };

function show(view, focus) {
  state.view = view;
  $$('[id^="view-"]').forEach((s) => { s.hidden = s.id !== 'view-' + view; });
  $$('#nav button').forEach((b) => {
    if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  RENDER[view]();
  updateWho();
  if (focus) $('#main').focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

/* ---------- Events ---------- */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('#nav button');
  if (nav) return show(nav.dataset.view, true);

  if (e.target.closest('#who')) return show('astronauts', true);

  const go = e.target.closest('[data-go]');
  if (go) return show(go.dataset.go, true);

  const key = e.target.closest('#vitals [data-key]');
  if (key) { state.metric = key.dataset.key; updateVitals(); return; }

  if (e.target.closest('#prev') || e.target.closest('#next')) {
    const strip = $('#strip');
    const dir = e.target.closest('#next') ? 1 : -1;
    strip.scrollBy({ left: dir * (strip.firstElementChild.offsetWidth + 16), behavior: 'smooth' });
    return;
  }
  if (e.target.closest('#save-now')) { autosave(); toast('Record saved'); return; }
  if (e.target.closest('#csv')) return downloadCsv();
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'auto') {
    state.autosave = e.target.checked;
    toast(state.autosave ? 'Auto-save is on' : 'Auto-save is off');
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.id === 'chk-form') { e.preventDefault(); submitCheckup(e.target); }
});

/* ---------- Live loop ---------- */
function tick() {
  ASTRONAUTS.forEach(step);
  $('#clock').textContent = 'Last reading ' + timeFmt(Date.now());
  updateWho();
  if (state.view === 'summary') renderSummary();
  else if (state.view === 'vitals') updateVitals();
}

/* ---------- Start ---------- */
show('astronauts', false);
$('#clock').textContent = 'Last reading ' + timeFmt(Date.now());
autosave();
setInterval(tick, TICK_MS);
setInterval(() => { if (state.autosave) autosave(); }, SYNC_MS);
