/* summary.js: the Summary page (profile, mission, overall status). */

/* ---------- View 2: summary ---------- */
function renderSummary() {
  const a = current();
  const o = overall(a);
  const mates = [ASTRONAUTS[a.id % 8], ASTRONAUTS[(a.id + 1) % 8]];
  $('#summary').innerHTML =
    '<div class="sum">' +
      '<div class="card profile">' +
        '<span class="avatar lg" aria-hidden="true">' + esc(a.initials) + '</span>' +
        '<div><h3>' + esc(a.name) + '</h3><p class="role">' + esc(a.role) + '</p>' +
        '<dl><dt>Age</dt><dd>' + a.age + ' years</dd><dt>Weight</dt><dd>' + a.kg + ' kg</dd><dt>Height</dt><dd>' + a.cm + ' cm</dd></dl></div>' +
      '</div>' +
      '<div class="card mission"><h3>Mission</h3>' +
        '<p>' + esc(MISSION) + '. ' + esc(a.name.split(' ')[0]) + ' is working alongside ' + esc(mates[0].name) + ' (' + esc(mates[0].role) + ') and ' + esc(mates[1].name) + ' (' + esc(mates[1].role) + ').</p>' +
        '<p class="small">Health data is saved back to Earth every ' + (SYNC_MS / 1000) + ' seconds.</p>' +
      '</div>' +
      '<div class="actions">' +
        '<button type="button" class="action" data-go="vitals"><strong>Vitals</strong><span>Heartbeat, temperature, blood pressure and more</span></button>' +
        '<button type="button" class="action" data-go="checkup"><strong>Weekly check-up</strong><span>' + (lastCheckup(a) ? 'Last done ' + dateFmt(lastCheckup(a).t) : 'Not done yet') + '</span></button>' +
        '<div class="card overall"><h3>Overall status</h3>' +
          '<div class="big st-' + o.level + '">' + LABEL[o.level] + '</div>' +
          (o.flags.length
            ? '<ul>' + o.flags.map((f) => '<li>' + esc(f.label) + ': ' + esc(f.text) + ' (' + LABEL[f.lvl].toLowerCase() + ')</li>').join('') + '</ul>'
            : '<p class="small">All seven checks are in their normal range.</p>') +
        '</div>' +
      '</div>' +
    '</div>';
}
