(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'maintenance',
    'Database maintenance',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div id="pageOk" class="ok-banner" style="display:none"></div>' +
      '<div class="maint-intro card">' +
      '<p><strong>Darkworkstore master admin only.</strong> Clear MongoDB data for testing or resets. ' +
      '<span class="danger-text">Master admin login (<code>adminmasters</code>) is always preserved.</span></p>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnRefresh">Refresh counts</button>' +
      '</div>' +
      '<section class="maint-section">' +
      '<h2 class="section-title">Delete by module</h2>' +
      '<p class="muted section-hint">Clear related collections together (users, payments, services, etc.)</p>' +
      '<div id="groupsGrid" class="maint-grid"><div class="loading">Loading…</div></div>' +
      '</section>' +
      '<section class="maint-section">' +
      '<h2 class="section-title">Delete by collection</h2>' +
      '<p class="muted section-hint">Clear one collection at a time</p>' +
      '<div class="table-wrap"><table class="data">' +
      '<thead><tr><th>Collection</th><th>Label</th><th>Module</th><th>Documents</th><th class="col-actions">Actions</th></tr></thead>' +
      '<tbody id="collectionsBody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody>' +
      '</table></div>' +
      '</section>' +
      '<section class="maint-section danger-zone">' +
      '<h2 class="section-title danger-text">Delete all application data</h2>' +
      '<p class="muted">Removes every document from all collections except <code>adminmasters</code>. ' +
      'Darkworkstore login remains. This cannot be undone.</p>' +
      '<p class="muted"><strong>Total deletable documents:</strong> <span id="totalDeletable">—</span></p>' +
      '<button type="button" class="btn btn-danger" id="btnDeleteAll">Delete all data</button>' +
      '</section>'
  );

  var errBox = document.getElementById('pageErr');
  var okBox = document.getElementById('pageOk');
  var groupsGrid = document.getElementById('groupsGrid');
  var collectionsBody = document.getElementById('collectionsBody');
  var totalDeletableEl = document.getElementById('totalDeletable');
  var busy = false;

  function showErr(msg) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
    okBox.style.display = 'none';
  }

  function showOk(msg) {
    okBox.textContent = msg;
    okBox.style.display = 'block';
    errBox.style.display = 'none';
  }

  function clearMessages() {
    errBox.style.display = 'none';
    okBox.style.display = 'none';
  }

  function promptConfirm(expectedPhrase, title) {
    var typed = window.prompt(
      (title || 'Confirm delete') +
        '\n\nType exactly:\n' +
        expectedPhrase +
        '\n\nto continue. This cannot be undone.'
    );
    if (typed == null) return null;
    return String(typed).trim();
  }

  async function loadOverview() {
    clearMessages();
    groupsGrid.innerHTML = '<div class="loading">Loading…</div>';
    collectionsBody.innerHTML = '<tr><td colspan="5" class="loading">Loading…</td></tr>';
    try {
      var res = await AdminApp.apiGet('/db/overview');
      var data = res.data || {};
      renderGroups(data.groups || []);
      renderCollections(data.collections || []);
      totalDeletableEl.textContent = String(data.totalDeletableDocuments != null ? data.totalDeletableDocuments : '—');
    } catch (err) {
      showErr(err.message || 'Failed to load overview');
      groupsGrid.innerHTML = '';
      collectionsBody.innerHTML = '<tr><td colspan="5" class="muted">Failed to load</td></tr>';
    }
  }

  function renderGroups(groups) {
    if (!groups.length) {
      groupsGrid.innerHTML = '<p class="muted">No groups</p>';
      return;
    }
    groupsGrid.innerHTML = groups
      .map(function (g) {
        return (
          '<div class="maint-card card">' +
          '<h3>' +
          AdminApp.esc(g.label) +
          '</h3>' +
          '<p class="muted">' +
          AdminApp.esc(g.description || '') +
          '</p>' +
          '<p class="maint-count"><strong>' +
          (g.totalDocuments != null ? g.totalDocuments : 0) +
          '</strong> documents · ' +
          (g.collections ? g.collections.length : 0) +
          ' collections</p>' +
          '<button type="button" class="btn btn-danger btn-sm js-clear-group" data-group="' +
          AdminApp.esc(g.key) +
          '" data-label="' +
          AdminApp.esc(g.label) +
          '">Clear module</button>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderCollections(collections) {
    if (!collections.length) {
      collectionsBody.innerHTML = '<tr><td colspan="5" class="muted">No collections</td></tr>';
      return;
    }
    collectionsBody.innerHTML = collections
      .map(function (c) {
        var protectedBadge = c.protected
          ? '<span class="pill pill-warn">Protected</span>'
          : '<button type="button" class="btn btn-ghost btn-sm danger-text js-clear-collection" data-collection="' +
            AdminApp.esc(c.collection) +
            '" data-label="' +
            AdminApp.esc(c.label) +
            '">Clear</button>';
        return (
          '<tr>' +
          '<td><code>' +
          AdminApp.esc(c.collection) +
          '</code></td>' +
          '<td>' +
          AdminApp.esc(c.label) +
          '</td>' +
          '<td class="muted">' +
          AdminApp.esc(c.group || '—') +
          '</td>' +
          '<td>' +
          (c.count != null ? c.count : 0) +
          '</td>' +
          '<td class="col-actions">' +
          protectedBadge +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function onClearCollection(collection, label) {
    if (busy || !collection) return;
    var phrase = 'DELETE ' + collection;
    var confirmed = promptConfirm(phrase, 'Clear collection: ' + label);
    if (confirmed !== phrase) {
      if (confirmed != null) showErr('Confirmation phrase did not match.');
      return;
    }
    busy = true;
    clearMessages();
    try {
      var res = await AdminApp.apiPost('/db/clear/collection', {
        collection: collection,
        confirmPhrase: confirmed,
      });
      showOk(res.message || 'Collection cleared');
      await loadOverview();
    } catch (err) {
      showErr(err.message || 'Failed to clear collection');
    } finally {
      busy = false;
    }
  }

  async function onClearGroup(group, label) {
    if (busy || !group) return;
    var phrase = 'DELETE GROUP ' + group;
    var confirmed = promptConfirm(phrase, 'Clear module: ' + label);
    if (confirmed !== phrase) {
      if (confirmed != null) showErr('Confirmation phrase did not match.');
      return;
    }
    busy = true;
    clearMessages();
    try {
      var res = await AdminApp.apiPost('/db/clear/group', {
        group: group,
        confirmPhrase: confirmed,
      });
      showOk(res.message || 'Module cleared');
      await loadOverview();
    } catch (err) {
      showErr(err.message || 'Failed to clear module');
    } finally {
      busy = false;
    }
  }

  async function onClearAll() {
    if (busy) return;
    var phrase = 'DELETE ALL DATA';
    var ok = window.confirm(
      'Delete ALL application data?\n\nMaster admin login will be kept.\nThis cannot be undone.'
    );
    if (!ok) return;
    var confirmed = promptConfirm(phrase, 'Delete all application data');
    if (confirmed !== phrase) {
      if (confirmed != null) showErr('Confirmation phrase did not match.');
      return;
    }
    busy = true;
    clearMessages();
    try {
      var res = await AdminApp.apiPost('/db/clear/all', { confirmPhrase: confirmed });
      showOk(res.message || 'All data cleared');
      await loadOverview();
    } catch (err) {
      showErr(err.message || 'Failed to clear all data');
    } finally {
      busy = false;
    }
  }

  document.getElementById('btnRefresh').addEventListener('click', function () {
    if (!busy) loadOverview();
  });

  document.getElementById('btnDeleteAll').addEventListener('click', onClearAll);

  groupsGrid.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.js-clear-group') : null;
    if (!btn) return;
    onClearGroup(btn.getAttribute('data-group'), btn.getAttribute('data-label'));
  });

  collectionsBody.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.js-clear-collection') : null;
    if (!btn) return;
    onClearCollection(btn.getAttribute('data-collection'), btn.getAttribute('data-label'));
  });

  loadOverview();
})();
