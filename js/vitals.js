/* vitals.js: the Vitals page (metric cards, sensor map, chart). */

/* ---------- View 3: vitals ---------- */
function renderVitals() {
  $('#vitals').innerHTML =
    '<p class="lede" id="vit-lede"></p>' +
    '<div class="vit">' +
      '<div>' +
        '<div class="strip-wrap">' +
          '<button type="button" class="arrow" id="prev" aria-label="Previous vital">\u2190</button>' +
          '<div class="strip" id="strip">' +
            METRICS.map((m) => '<button type="button" class="metric" data-key="' + m.key + '" aria-pressed="false">' +
              '<span class="label">' + esc(m.label) + '</span>' +
              '<span class="num"><span data-val></span><small>' + esc(m.unit) + '</small></span>' +
              '<span class="pill" data-pill></span></button>').join('') +
          '</div>' +
          '<button type="button" class="arrow" id="next" aria-label="Next vital">\u2192</button>' +
        '</div>' +
        '<div class="card detail" id="detail"></div>' +
      '</div>' +
      '<div class="card figure">' +
        '<div><h3>Sensor map</h3><p class="small">Tap a number to open that vital.</p></div>' +
        '<div>' +
          '<div class="body-wrap">' +
            '<svg viewBox="0 0 200 380" aria-hidden="true"><circle cx="100" cy="46" r="30"/><path d="M100 76v140M100 100L38 170M100 100l62 70M100 216l-40 140M100 216l40 140"/></svg>' +
            METRICS.map((m, i) => '<button type="button" class="hot" data-key="' + m.key + '" style="left:' + HOTSPOTS[m.key][0] + '%;top:' + HOTSPOTS[m.key][1] + '%" aria-label="' + esc(m.label) + '" aria-pressed="false">' + (i + 1) + '</button>').join('') +
          '</div>' +
          '<ul class="legend">' +
            METRICS.map((m, i) => '<li><button type="button" data-key="' + m.key + '"><span class="n">' + (i + 1) + '</span><span class="l">' + esc(m.label) + '</span><span class="v" data-leg></span></button></li>').join('') +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</div>';
  updateVitals();
}

function updateVitals() {
  const root = $('#vitals');
  if (!root || !$('#strip')) return;
  const a = current();
  $('#vit-lede').textContent = a.name + ', ' + a.role + '. Readings refresh every ' + (TICK_MS / 1000) + ' seconds.';

  METRICS.forEach((m) => {
    const lvl = levelOf(m.key, value(a, m.key));
    const card = $('.metric[data-key="' + m.key + '"]', root);
    $('[data-val]', card).textContent = display(a, m.key);
    const pill = $('[data-pill]', card);
    pill.textContent = LABEL[lvl];
    pill.className = 'pill st-' + lvl;
    card.setAttribute('aria-pressed', String(m.key === state.metric));
    $('.legend [data-key="' + m.key + '"] [data-leg]', root).textContent = display(a, m.key) + ' ' + m.unit;
  });
  $$('.hot', root).forEach((h) => h.setAttribute('aria-pressed', String(h.dataset.key === state.metric)));

  const m = METRIC[state.metric];
  const lvl = levelOf(m.key, value(a, m.key));
  const range = m.key === 'bp' ? 'systolic ' + m.min + ' to ' + m.max : m.min + ' to ' + m.max;
  $('#detail').innerHTML =
    '<div><h3>' + esc(m.label) + '</h3>' +
      '<p class="meta">' + esc(m.sensor) + '. Normal range: ' + range + ' ' + esc(m.unit) + '.</p>' +
      '<p>' + esc(m.desc) + '</p>' +
      '<p class="tip"><strong>' + (lvl === 'ok' ? 'If it drifts:' : 'What to do now:') + '</strong> ' + esc(m.tip) + '</p></div>' +
    '<div><p class="pill st-' + lvl + '">' + LABEL[lvl] + '</p>' +
      spark(series(a, m.key), m) +
      '<p class="chart-cap">' + (m.key === 'rem' ? 'Last 7 nights' : 'Last ' + HISTORY + ' readings') + '. Shaded band is the normal range.</p></div>';
}
