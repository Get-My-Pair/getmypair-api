(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'cobblers',
    'Cobblers',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Name</th><th>Phone</th><th>Shop</th><th>Verification</th><th>Updated</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  (async function () {
    var tbody = document.getElementById('tbody');
    var errBox = document.getElementById('pageErr');
    try {
      var j = await AdminApp.apiGet('/cobblers?limit=100');
      var items = (j.data && j.data.items) || [];
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="muted">No cobbler profiles</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (c) {
          return (
            '<tr><td>' +
            AdminApp.esc(c.name) +
            '</td><td>' +
            AdminApp.esc(c.phone) +
            '</td><td>' +
            AdminApp.esc(c.shopName || '—') +
            '</td><td>' +
            AdminApp.esc(c.verificationStatus) +
            '</td><td class="mono">' +
            AdminApp.esc(c.updatedAt ? String(c.updatedAt).slice(0, 19) : '') +
            '</td></tr>'
          );
        })
        .join('');
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();
})();
