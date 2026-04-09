(function () {
  'use strict';

  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'dashboard',
    'Dashboard',
    '<div id="dashErr" class="err" style="display:none"></div>' +
      '<div class="ops-shell" id="opsShell">' +
      '<div class="ops-top">' +
      '<div><h2 class="ops-title">Operations Overview</h2><p class="ops-sub" id="opsSub">Loading...</p></div>' +
      '<div class="ops-right"><span class="ops-live-dot"></span><span>Live</span><span id="activeItemsTxt">0 active items</span></div>' +
      '</div>' +
      '<div class="ops-cards" id="opsCards"><p class="loading">Loading stats...</p></div>' +
      '<div class="ops-lower">' +
      '<div class="ops-panel">' +
      '<h3 class="ops-panel-title">Stage distribution</h3>' +
      '<div id="stageDist"></div>' +
      '</div>' +
      '<div class="ops-panel">' +
      '<h3 class="ops-panel-title">Recent activity</h3>' +
      '<ul id="recentActivity" class="ops-activity"></ul>' +
      '</div>' +
      '</div>' +
      '</div>'
  );

  (async function () {
    var shell = document.getElementById('opsShell');
    var cards = document.getElementById('opsCards');
    var stageDist = document.getElementById('stageDist');
    var recentActivity = document.getElementById('recentActivity');
    var activeItemsTxt = document.getElementById('activeItemsTxt');
    var opsSub = document.getElementById('opsSub');
    var errBox = document.getElementById('dashErr');

    try {
      var j = await AdminApp.apiGet('/dashboard/stats');
      var d = j.data || {};
      var usersCount = asNum(d.usersCount);
      var articlesCount = asNum(d.articlesCount);
      var serviceCount = asNum(d.serviceRequestsCount);
      var cobblersCount = asNum(d.cobblersCount);
      var deliveryCount = asNum(d.deliveryCount);
      var activeItems = serviceCount + cobblersCount + deliveryCount;

      cards.innerHTML =
        overviewCard(usersCount, 'Total users', 'Current registered') +
        overviewCard(articlesCount, 'Articles', 'Digital shoes') +
        overviewCard(serviceCount, 'Service requests', 'Across all stages') +
        overviewCard(cobblersCount, 'Active cobblers', 'Profiles linked') +
        overviewCard(deliveryCount, 'Delivery partners', 'Profiles linked');

      activeItemsTxt.textContent = String(activeItems) + ' active items';
      opsSub.textContent = d.generatedAt ? 'Updated ' + formatDateTime(d.generatedAt) : 'Workshop active';

      renderStageDistribution(stageDist, {
        intake: usersCount,
        inspection: articlesCount,
        repair: serviceCount,
        dispatch: deliveryCount,
        cobblers: cobblersCount,
      });
      renderRecentActivity(recentActivity, d.generatedAt, {
        usersCount: usersCount,
        articlesCount: articlesCount,
        serviceCount: serviceCount,
        cobblersCount: cobblersCount,
        deliveryCount: deliveryCount,
      });
      shell.style.display = 'block';
    } catch (e) {
      cards.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();

  function asNum(v) {
    var n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function formatDateTime(raw) {
    var dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return String(raw);
    return dt.toLocaleString();
  }

  function overviewCard(val, lbl, hint) {
    return (
      '<div class="ops-card"><div class="ops-card-val">' +
      AdminApp.esc(val != null ? val : '—') +
      '</div><div class="ops-card-lbl">' +
      AdminApp.esc(lbl) +
      '</div><div class="ops-card-hint">' +
      AdminApp.esc(hint) +
      '</div></div>'
    );
  }

  function renderStageDistribution(el, counts) {
    if (!el) return;
    var rows = [
      { key: 'intake', label: 'Intake', value: counts.intake },
      { key: 'inspection', label: 'Inspection', value: counts.inspection },
      { key: 'repair', label: 'In Repair', value: counts.repair },
      { key: 'dispatch', label: 'Dispatch', value: counts.dispatch },
      { key: 'cobblers', label: 'Cobblers', value: counts.cobblers },
    ];
    var maxVal = Math.max.apply(
      null,
      rows.map(function (r) { return r.value; }).concat([1])
    );
    el.innerHTML = rows
      .map(function (r) {
        var widthPct = Math.max(8, Math.round((r.value / maxVal) * 100));
        return (
          '<div class="ops-stage-row">' +
          '<div class="ops-stage-name">' + AdminApp.esc(r.label) + '</div>' +
          '<div class="ops-stage-bar"><span style="width:' + widthPct + '%"></span></div>' +
          '<div class="ops-stage-val">' + AdminApp.esc(r.value) + '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderRecentActivity(el, generatedAt, counts) {
    if (!el) return;
    var lines = [
      'Users synced: ' + counts.usersCount,
      'Articles available: ' + counts.articlesCount,
      'Service requests tracked: ' + counts.serviceCount,
      'Cobblers active: ' + counts.cobblersCount,
      'Delivery partners active: ' + counts.deliveryCount,
    ];
    el.innerHTML = lines
      .map(function (line, idx) {
        var mins = (idx + 1) * 5;
        return (
          '<li><span class="ops-activity-dot"></span><div><div>' +
          AdminApp.esc(line) +
          '</div><small class="muted">' +
          (generatedAt ? mins + ' min ago' : 'just now') +
          '</small></div></li>'
        );
      })
      .join('');
  }
})();
