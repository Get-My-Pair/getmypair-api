(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'users',
    'Users',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button type="button" class="btn btn-ghost btn-sm danger-text" id="btnDeleteSelected" disabled>Delete selected</button>' +
      '</div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th class="col-actions"><input type="checkbox" id="selectAllUsers" aria-label="Select all users" /></th>' +
      '<th>Mobile</th><th>Name</th><th>Role</th><th>Verified</th><th>Created</th><th class="col-actions">Actions</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="7" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  (async function () {
    var tbody = document.getElementById('tbody');
    var errBox = document.getElementById('pageErr');
    var selectAll = document.getElementById('selectAllUsers');
    var btnDeleteSelected = document.getElementById('btnDeleteSelected');
    var deletingId = '';
    var deletingBulk = false;

    function selectedUserIds() {
      return Array.prototype.slice
        .call(tbody.querySelectorAll('.js-user-select:checked'))
        .map(function (cb) {
          return cb.getAttribute('data-user-id') || '';
        })
        .filter(Boolean);
    }

    function updateSelectionUi() {
      var checkboxes = Array.prototype.slice.call(tbody.querySelectorAll('.js-user-select'));
      var total = checkboxes.length;
      var selected = selectedUserIds().length;
      if (selectAll) {
        selectAll.checked = total > 0 && selected === total;
        selectAll.indeterminate = selected > 0 && selected < total;
      }
      if (btnDeleteSelected) {
        btnDeleteSelected.disabled = deletingBulk || selected === 0;
      }
    }

    function renderNoUsersIfEmpty() {
      if (!tbody.querySelector('tr')) {
        tbody.innerHTML = '<tr><td colspan="7" class="muted">No users</td></tr>';
      }
      updateSelectionUi();
    }

    async function deleteUsersByIds(ids) {
      for (var i = 0; i < ids.length; i += 1) {
        await AdminApp.apiDelete('/users/' + encodeURIComponent(ids[i]));
      }
    }

    async function onDeleteClick(e) {
      var btn = e.target && e.target.closest ? e.target.closest('.js-delete-user') : null;
      if (!btn) return;
      var userId = btn.getAttribute('data-user-id');
      if (!userId || deletingId) return;
      var userName = btn.getAttribute('data-user-name') || 'this user';
      var ok = window.confirm('Delete user "' + userName + '"? This cannot be undone.');
      if (!ok) return;
      deletingId = userId;
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      errBox.style.display = 'none';
      try {
        await deleteUsersByIds([userId]);
        var row = btn.closest('tr');
        if (row && row.parentNode) row.parentNode.removeChild(row);
        renderNoUsersIfEmpty();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Delete';
        errBox.textContent = err.message || 'Failed to delete user';
        errBox.style.display = 'block';
      } finally {
        deletingId = '';
        updateSelectionUi();
      }
    }

    function onTableChange(e) {
      var target = e.target;
      if (!target) return;
      if (target.id === 'selectAllUsers') {
        var checked = !!target.checked;
        Array.prototype.slice.call(tbody.querySelectorAll('.js-user-select')).forEach(function (cb) {
          cb.checked = checked;
        });
        updateSelectionUi();
        return;
      }
      if (target.classList && target.classList.contains('js-user-select')) {
        updateSelectionUi();
      }
    }

    async function onDeleteSelectedClick() {
      if (deletingBulk || deletingId) return;
      var ids = selectedUserIds();
      if (!ids.length) return;
      var ok = window.confirm('Delete ' + ids.length + ' selected user(s)? This cannot be undone.');
      if (!ok) return;
      deletingBulk = true;
      btnDeleteSelected.disabled = true;
      btnDeleteSelected.textContent = 'Deleting...';
      errBox.style.display = 'none';
      try {
        await deleteUsersByIds(ids);
        ids.forEach(function (id) {
          var row = tbody.querySelector('tr[data-user-id="' + id + '"]');
          if (row && row.parentNode) row.parentNode.removeChild(row);
        });
        renderNoUsersIfEmpty();
      } catch (err) {
        errBox.textContent = err.message || 'Failed to delete selected users';
        errBox.style.display = 'block';
      } finally {
        deletingBulk = false;
        btnDeleteSelected.textContent = 'Delete selected';
        updateSelectionUi();
      }
    }

    try {
      var j = await AdminApp.apiGet('/users?limit=100');
      var items = (j.data && j.data.items) || [];
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="muted">No users</td></tr>';
        updateSelectionUi();
        return;
      }
      tbody.innerHTML = items
        .map(function (u) {
          var roleName = '';
          if (u.role && u.role.name) roleName = u.role.name;
          else if (typeof u.role === 'string') roleName = u.role;
          return (
            '<tr data-user-id="' +
            AdminApp.esc(String(u._id || '')) +
            '"><td class="col-actions"><input type="checkbox" class="js-user-select" data-user-id="' +
            AdminApp.esc(String(u._id || '')) +
            '" aria-label="Select user" /></td><td>' +
            AdminApp.esc(u.mobile) +
            '</td><td>' +
            AdminApp.esc(u.name) +
            '</td><td>' +
            AdminApp.esc(roleName) +
            '</td><td>' +
            AdminApp.esc(u.isPhoneVerified ? 'Yes' : 'No') +
            '</td><td class="mono">' +
            AdminApp.esc(u.createdAt ? String(u.createdAt).slice(0, 19) : '') +
            '</td><td class="col-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm danger-text js-delete-user" data-user-id="' +
            AdminApp.esc(String(u._id || '')) +
            '" data-user-name="' +
            AdminApp.esc(u.name || '') +
            '">Delete</button>' +
            '</td></tr>'
          );
        })
        .join('');
      tbody.addEventListener('click', onDeleteClick);
      tbody.addEventListener('change', onTableChange);
      if (selectAll) selectAll.addEventListener('change', onTableChange);
      if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', onDeleteSelectedClick);
      updateSelectionUi();
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();
})();
