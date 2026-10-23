/* checkup.js: the Weekly check-up page (form and past answers). */

/* ---------- View 4: weekly check-up ---------- */
function renderCheckup() {
  const a = current();
  const list = checkups[a.id] || [];
  const last = list[0];
  const overdue = !last || Date.now() - last.t > 7 * DAY;
  $('#checkup').innerHTML =
    '<div class="chk">' +
      '<form class="card" id="chk-form" novalidate>' +
        '<p class="question">How are you feeling these past few days?</p>' +
        '<p class="due"><span class="pill ' + (overdue ? 'st-watch' : 'st-ok') + '">' + (overdue ? 'Check-up due' : 'Up to date') + '</span> <span class="small">for ' + esc(a.name) + '</span></p>' +
        '<fieldset><legend>Overall</legend><div class="opts">' +
          MOODS.map((m, i) => '<label class="opt"><input type="radio" name="mood" value="' + (i + 1) + '"><span>' + m + '</span></label>').join('') +
        '</div></fieldset>' +
        '<fieldset><legend>Anything bothering you? (optional)</legend><div class="opts">' +
          SYMPTOMS.map((s) => '<label class="opt"><input type="checkbox" name="sym" value="' + esc(s) + '"><span>' + esc(s) + '</span></label>').join('') +
        '</div></fieldset>' +
        '<fieldset><legend><label for="note">In your own words</label></legend>' +
          '<textarea id="note" maxlength="600" placeholder="Type how you have been feeling, sleeping and eating."></textarea></fieldset>' +
        '<button type="submit" class="btn">Save check-up</button>' +
        '<p class="msg-error" id="chk-error" role="alert"></p>' +
      '</form>' +
      '<div class="card"><h3>Past check-ups</h3>' +
        (list.length
          ? '<ul class="history">' + list.slice(0, 5).map((c) =>
              '<li><p><strong>' + MOODS[c.mood - 1] + '</strong>' + (c.symptoms.length ? ' &middot; ' + c.symptoms.map(esc).join(', ') : '') + '</p>' +
              (c.note ? '<p>' + esc(c.note) + '</p>' : '') + '<p class="when">' + dateFmt(c.t) + '</p></li>').join('') + '</ul>'
          : '<p class="small">No check-ups yet. Fill in the form to save the first one.</p>') +
      '</div>' +
    '</div>';
}

function submitCheckup(form) {
  const mood = form.querySelector('input[name="mood"]:checked');
  const err = $('#chk-error');
  if (!mood) { err.textContent = 'Choose how you are feeling overall before saving.'; return; }
  const a = current();
  const entry = {
    t: Date.now(),
    mood: Number(mood.value),
    symptoms: $$('input[name="sym"]:checked', form).map((i) => i.value),
    note: $('#note').value.trim()
  };
  checkups[a.id] = [entry].concat(checkups[a.id] || []).slice(0, 20);
  save(STORE.checkups, checkups);
  toast('Check-up saved for ' + a.name.split(' ')[0]);
  renderCheckup();
  updateWho();
}
