(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'users',
    'Users',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Mobile</th><th>Name</th><th>Role</th><th>Verified</th><th>Created</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  (async function () {
    var tbody = document.getElementById('tbody');
    var errBox = document.getElementById('pageErr');
    try {
      var j = await AdminApp.apiGet('/users?limit=100');
      var items = (j.data && j.data.items) || [];
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="muted">No users</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (u) {
          var roleName = '';
          if (u.role && u.role.name) roleName = u.role.name;
          else if (typeof u.role === 'string') roleName = u.role;
          return (
            '<tr><td>' +
            AdminApp.esc(u.mobile) +
            '</td><td>' +
            AdminApp.esc(u.name) +
            '</td><td>' +
            AdminApp.esc(roleName) +
            '</td><td>' +
            AdminApp.esc(u.isPhoneVerified ? 'Yes' : 'No') +
            '</td><td class="mono">' +
            AdminApp.esc(u.createdAt ? String(u.createdAt).slice(0, 19) : '') +
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
