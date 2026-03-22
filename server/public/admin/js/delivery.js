(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'delivery',
    'Delivery partners',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Name</th><th>Phone</th><th>Vehicle</th><th>Verification</th><th>Updated</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  (async function () {
    var tbody = document.getElementById('tbody');
    var errBox = document.getElementById('pageErr');
    try {
      var j = await AdminApp.apiGet('/delivery-partners?limit=100');
      var items = (j.data && j.data.items) || [];
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="muted">No delivery profiles</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (d) {
          var veh = (d.vehicleType || '') + (d.vehicleNumber ? ' · ' + d.vehicleNumber : '');
          return (
            '<tr><td>' +
            AdminApp.esc(d.name) +
            '</td><td>' +
            AdminApp.esc(d.phone) +
            '</td><td>' +
            AdminApp.esc(veh || '—') +
            '</td><td>' +
            AdminApp.esc(d.verificationStatus) +
            '</td><td class="mono">' +
            AdminApp.esc(d.updatedAt ? String(d.updatedAt).slice(0, 19) : '') +
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
