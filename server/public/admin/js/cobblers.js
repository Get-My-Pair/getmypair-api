(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'cobblers',
    'Cobblers',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Name</th><th>Phone</th><th>Shop</th><th>Verification</th><th>Updated</th><th class="col-actions">Actions</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  var tbody = document.getElementById('tbody');
  var errBox = document.getElementById('pageErr');
  var rowsById = {};

  async function loadCobblers() {
    try {
      var j = await AdminApp.apiGet('/cobblers?limit=100');
      var items = (j.data && j.data.items) || [];
      rowsById = {};
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="muted">No cobbler profiles</td></tr>';
        return;
      }
      items.forEach(function (c) {
        if (c && c._id) rowsById[String(c._id)] = c;
      });
      tbody.innerHTML = items
        .map(function (c) {
          var id = c && c._id ? String(c._id) : '';
          var isVerified = c && c.verificationStatus === 'verified';
          return (
            '<tr data-id="' +
            AdminApp.esc(id) +
            '"><td>' +
            AdminApp.esc(c.name) +
            '</td><td>' +
            AdminApp.esc(c.phone) +
            '</td><td>' +
            AdminApp.esc(c.shopName || '—') +
            '</td><td>' +
            AdminApp.esc(c.verificationStatus) +
            '</td><td class="mono">' +
            AdminApp.esc(c.updatedAt ? String(c.updatedAt).slice(0, 19) : '') +
            '</td><td class="col-actions">' +
            (isVerified
              ? '<button type="button" class="btn-ghost btn-sm btn-row" disabled>Accepted</button>'
              : '<button type="button" class="btn-ghost btn-sm btn-row" data-act="verify">Verify</button>') +
            '</td></tr>'
          );
        })
        .join('');
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  }

  tbody.addEventListener('click', async function (ev) {
    var btn = ev.target.closest('[data-act="verify"]');
    if (!btn || !tbody.contains(btn)) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var id = tr.getAttribute('data-id');
    if (!id || !rowsById[id]) return;
    btn.disabled = true;
    try {
      await AdminApp.apiPatch('/cobblers/' + encodeURIComponent(id) + '/verify', { status: 'verified' });
      await loadCobblers();
    } catch (e) {
      btn.disabled = false;
      errBox.textContent = e.message || 'Failed to verify cobbler';
      errBox.style.display = 'block';
    }
  });

  (async function () {
    await loadCobblers();
  })();
})();
