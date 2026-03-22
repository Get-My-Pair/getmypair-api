(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  var TRACKING_STATES = [
    'request_created',
    'pickup_scheduled',
    'item_picked',
    'dark_store_received',
    'inspection_started',
    'repair_in_progress',
    'repair_completed',
    'dispatch_ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  AdminApp.mountShell(
    'services',
    'Service requests',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<p class="muted" style="margin:0 0 16px">Workflow, assignments (delivery / cobbler / dark store), and notes. The app reads the same fields.</p>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>User</th><th>Article</th><th>Type</th><th>Status</th><th>Tracking</th><th>Created</th><th class="col-actions">Actions</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="7" class="loading">Loading…</td></tr></tbody></table></div>' +
      '<div id="svcModal" class="modal-root" style="display:none" aria-hidden="true">' +
      '<div class="modal-backdrop" id="svcModalBackdrop"></div>' +
      '<div class="modal-panel modal-panel-wide" role="dialog" aria-labelledby="svcModalTitle">' +
      '<h3 id="svcModalTitle" class="modal-title">Request control</h3>' +
      '<p id="svcModalSubtitle" class="muted modal-sub"></p>' +
      '<h4 class="modal-section">Workflow</h4>' +
      '<div class="form-group"><label for="svcModalState">Tracking stage</label>' +
      '<select id="svcModalState" class="modal-select"></select></div>' +
      '<div class="form-group"><label for="svcModalNote">Note (optional)</label>' +
      '<textarea id="svcModalNote" class="modal-textarea" rows="2" placeholder="Shown in app timeline"></textarea></div>' +
      '<h4 class="modal-section">Assignments</h4>' +
      '<div class="form-group"><label for="svcModalDelivery">Delivery partner</label>' +
      '<select id="svcModalDelivery" class="modal-select"></select>' +
      '<p class="muted" style="font-size:0.75rem;margin:6px 0 0">Verified profiles only (same as mobile APIs).</p></div>' +
      '<div class="form-group"><label for="svcModalCobbler">Cobbler</label>' +
      '<select id="svcModalCobbler" class="modal-select"></select></div>' +
      '<div class="form-group"><label for="svcModalDarkMode">Dark store</label>' +
      '<select id="svcModalDarkMode" class="modal-select">' +
      '<option value="keep">No change</option>' +
      '<option value="clear">Clear dark store</option>' +
      '<option value="set">Set id + name below</option>' +
      '</select></div>' +
      '<div id="svcDarkFields" class="form-group" style="display:none">' +
      '<input type="text" id="svcModalDarkId" class="modal-select" placeholder="Dark store id" />' +
      '<input type="text" id="svcModalDarkName" class="modal-select" style="margin-top:8px" placeholder="Display name (optional)" />' +
      '</div>' +
      '<div class="form-group"><label for="svcModalRouting">Routing</label>' +
      '<select id="svcModalRouting" class="modal-select">' +
      '<option value="">No change</option>' +
      '<option value="dark_store">dark_store</option>' +
      '<option value="direct">direct</option>' +
      '</select></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn-ghost btn-sm" id="svcModalCancel">Cancel</button>' +
      '<button type="button" class="btn primary btn-modal-primary" id="svcModalSave">Save</button>' +
      '</div></div></div>'
  );

  var tbody = document.getElementById('tbody');
  var errBox = document.getElementById('pageErr');
  var modal = document.getElementById('svcModal');
  var modalBackdrop = document.getElementById('svcModalBackdrop');
  var modalSubtitle = document.getElementById('svcModalSubtitle');
  var modalState = document.getElementById('svcModalState');
  var modalNote = document.getElementById('svcModalNote');
  var modalDelivery = document.getElementById('svcModalDelivery');
  var modalCobbler = document.getElementById('svcModalCobbler');
  var modalDarkMode = document.getElementById('svcModalDarkMode');
  var svcDarkFields = document.getElementById('svcDarkFields');
  var modalDarkId = document.getElementById('svcModalDarkId');
  var modalDarkName = document.getElementById('svcModalDarkName');
  var modalRouting = document.getElementById('svcModalRouting');
  var editingId = null;
  var rowById = {};
  var currentRow = null;
  var deliveryList = [];
  var cobblerList = [];

  function esc(s) {
    return AdminApp.esc(s);
  }

  function humanStage(s) {
    return String(s || '')
      .split('_')
      .join(' ');
  }

  function fillStateSelect(current) {
    modalState.innerHTML = TRACKING_STATES.map(function (st) {
      return (
        '<option value="' +
        esc(st) +
        '"' +
        (st === current ? ' selected' : '') +
        '>' +
        esc(humanStage(st)) +
        '</option>'
      );
    }).join('');
  }

  function buildAssignmentSelects() {
    var dOpts =
      '<option value="">No change</option><option value="__CLEAR__">— Clear delivery —</option>';
    deliveryList.forEach(function (p) {
      var uid = p.userId ? String(p.userId) : '';
      if (!uid) return;
      var lab = (p.name || 'Partner') + ' · …' + uid.slice(-6);
      dOpts +=
        '<option value="' +
        esc(uid) +
        '">' +
        esc(lab) +
        '</option>';
    });
    if (deliveryList.length === 0) {
      dOpts += '<option value="" disabled>No verified delivery partners in DB</option>';
    }
    modalDelivery.innerHTML = dOpts;

    var cOpts =
      '<option value="">No change</option><option value="__CLEAR__">— Clear cobbler —</option>';
    cobblerList.forEach(function (p) {
      var uid = p.userId ? String(p.userId) : '';
      if (!uid) return;
      var lab = (p.name || 'Cobbler') + ' · …' + uid.slice(-6);
      cOpts += '<option value="' + esc(uid) + '">' + esc(lab) + '</option>';
    });
    if (cobblerList.length === 0) {
      cOpts += '<option value="" disabled>No verified cobblers in DB</option>';
    }
    modalCobbler.innerHTML = cOpts;
  }

  function syncDarkFieldsVisibility() {
    var m = modalDarkMode.value;
    svcDarkFields.style.display = m === 'set' ? 'block' : 'none';
    if (m === 'set' && currentRow) {
      if (!modalDarkId.value) {
        modalDarkId.value = currentRow.darkStoreId ? String(currentRow.darkStoreId) : '';
      }
      if (!modalDarkName.value) {
        modalDarkName.value = currentRow.darkStoreName ? String(currentRow.darkStoreName) : '';
      }
    }
  }

  function openModal(row) {
    currentRow = row;
    editingId = row._id ? String(row._id) : '';
    var uname = row.user && row.user.name ? row.user.name : '—';
    var mob = row.user && row.user.mobile ? row.user.mobile : '';
    var curDel = row.deliveryPartnerId ? String(row.deliveryPartnerId) : '';
    var curCob = row.cobblerId ? String(row.cobblerId) : '';
    modalSubtitle.textContent =
      uname +
      (mob ? ' · ' + mob : '') +
      ' · ' +
      (row.serviceType || '') +
      ' · ID …' +
      editingId.slice(-8) +
      (curDel ? ' · delivery ' + curDel.slice(-6) : '') +
      (curCob ? ' · cobbler ' + curCob.slice(-6) : '') +
      (row.darkStoreId ? ' · DS ' + String(row.darkStoreId).slice(0, 12) : '');
    fillStateSelect(row.trackingState || 'request_created');
    modalNote.value = '';
    buildAssignmentSelects();
    modalDelivery.value = '';
    modalCobbler.value = '';
    modalDarkMode.value = 'keep';
    modalDarkId.value = row.darkStoreId ? String(row.darkStoreId) : '';
    modalDarkName.value = row.darkStoreName ? String(row.darkStoreName) : '';
    modalRouting.value = '';
    syncDarkFieldsVisibility();
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    editingId = null;
    currentRow = null;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  async function loadAssignLists() {
    try {
      var d = await AdminApp.apiGet('/delivery-partners?limit=100');
      var c = await AdminApp.apiGet('/cobblers?limit=100');
      var dItems = (d.data && d.data.items) || [];
      var cItems = (c.data && c.data.items) || [];
      deliveryList = dItems.filter(function (x) {
        return x.verificationStatus === 'verified';
      });
      cobblerList = cItems.filter(function (x) {
        return x.verificationStatus === 'verified';
      });
    } catch (e) {
      deliveryList = [];
      cobblerList = [];
    }
  }

  async function loadTable() {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading…</td></tr>';
    errBox.style.display = 'none';
    var j = await AdminApp.apiGet('/service-requests?limit=100');
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">No service requests</td></tr>';
      rowById = {};
      return;
    }
    rowById = {};
    items.forEach(function (r) {
      if (r._id) rowById[String(r._id)] = r;
    });
    tbody.innerHTML = items
      .map(function (r) {
        var id = r._id ? String(r._id) : '';
        var uname = r.user && r.user.name ? r.user.name : '—';
        var umob = r.user && r.user.mobile ? r.user.mobile : '';
        var userCell =
          '<div class="cell-user"><strong>' +
          esc(uname) +
          '</strong><br/><span class="mono muted">' +
          esc(umob || r.userId || '') +
          '</span></div>';
        var abrand = r.article && r.article.brand ? r.article.brand : '';
        var amodel = r.article && r.article.model ? r.article.model : '';
        var artCell =
          abrand || amodel
            ? esc(abrand + (amodel ? ' · ' + amodel : ''))
            : '<span class="muted">—</span>';
        return (
          '<tr data-id="' +
          esc(id) +
          '">' +
          '<td>' +
          userCell +
          '</td><td>' +
          artCell +
          '</td><td>' +
          esc(r.serviceType) +
          '</td><td>' +
          esc(r.status) +
          '</td><td>' +
          esc(r.trackingState) +
          '</td><td class="mono">' +
          esc(r.createdAt ? String(r.createdAt).slice(0, 19) : '') +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn-ghost btn-sm btn-row" data-act="manage">Manage</button> ' +
          '<button type="button" class="btn-ghost btn-sm btn-row danger-text" data-act="delete">Delete</button>' +
          '</td></tr>'
        );
      })
      .join('');
  }

  tbody.addEventListener('click', async function (ev) {
    var btn = ev.target.closest('[data-act]');
    if (!btn || !tbody.contains(btn)) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var id = tr.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    var row = rowById[id];
    if (!row) return;
    if (act === 'manage') {
      openModal(row);
      return;
    }
    if (act === 'delete') {
      if (
        !confirm(
          'Delete this service request permanently? The user app will no longer find it.'
        )
      ) {
        return;
      }
      try {
        await AdminApp.apiDelete('/service-requests/' + encodeURIComponent(id));
        await loadTable();
      } catch (e) {
        errBox.textContent = e.message || 'Delete failed';
        errBox.style.display = 'block';
      }
    }
  });

  modalDarkMode.addEventListener('change', function () {
    if (modalDarkMode.value === 'set' && currentRow) {
      modalDarkId.value = currentRow.darkStoreId ? String(currentRow.darkStoreId) : '';
      modalDarkName.value = currentRow.darkStoreName ? String(currentRow.darkStoreName) : '';
    }
    syncDarkFieldsVisibility();
  });

  modalBackdrop.addEventListener('click', closeModal);
  document.getElementById('svcModalCancel').addEventListener('click', closeModal);
  document.getElementById('svcModalSave').addEventListener('click', async function () {
    if (!editingId) return;
    var btn = document.getElementById('svcModalSave');
    btn.disabled = true;
    try {
      var payload = { trackingState: modalState.value };
      var n = modalNote.value.trim();
      if (n) payload.note = n;

      var del = modalDelivery.value;
      if (del === '__CLEAR__') payload.deliveryPartnerId = null;
      else if (del) payload.deliveryPartnerId = del;

      var cob = modalCobbler.value;
      if (cob === '__CLEAR__') payload.cobblerId = null;
      else if (cob) payload.cobblerId = cob;

      var dm = modalDarkMode.value;
      if (dm === 'clear') payload.darkStoreId = null;
      else if (dm === 'set') {
        var did = modalDarkId.value.trim();
        if (!did) {
          errBox.textContent = 'Enter a dark store id or choose another dark store option.';
          errBox.style.display = 'block';
          return;
        }
        payload.darkStoreId = did;
        var dnm = modalDarkName.value.trim();
        if (dnm) payload.darkStoreName = dnm;
      }

      var rt = modalRouting.value;
      if (rt) payload.routingType = rt;

      await AdminApp.apiPatch('/service-requests/' + encodeURIComponent(editingId), payload);
      closeModal();
      await loadTable();
    } catch (e) {
      errBox.textContent = e.message || 'Update failed';
      errBox.style.display = 'block';
    } finally {
      btn.disabled = false;
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && modal.style.display === 'block') closeModal();
  });

  (async function () {
    try {
      await Promise.all([loadAssignLists(), loadTable()]);
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();
})();
