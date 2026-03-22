(function () {
  'use strict';

  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'dashboard',
    'Dashboard',
    '<div id="dashErr" class="err" style="display:none"></div>' +
      '<div class="stats-grid" id="statsGrid"><p class="loading">Loading stats…</p></div>' +
      '<p class="muted" id="ts"></p>'
  );

  (async function () {
    var grid = document.getElementById('statsGrid');
    var errBox = document.getElementById('dashErr');
    var ts = document.getElementById('ts');

    try {
      var j = await AdminApp.apiGet('/dashboard/stats');
      var d = j.data || {};

      grid.innerHTML =
        statCard(d.usersCount, 'Users') +
        statCard(d.articlesCount, 'Articles (shoes)') +
        statCard(d.serviceRequestsCount, 'Service requests') +
        statCard(d.cobblersCount, 'Cobbler profiles') +
        statCard(d.deliveryCount, 'Delivery profiles');

      ts.textContent = d.generatedAt ? 'Last updated: ' + d.generatedAt : '';
    } catch (e) {
      grid.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();

  function statCard(val, lbl) {
    return (
      '<div class="stat-card"><div class="val">' +
      AdminApp.esc(val != null ? val : '—') +
      '</div><div class="lbl">' +
      AdminApp.esc(lbl) +
      '</div></div>'
    );
  }
})();
