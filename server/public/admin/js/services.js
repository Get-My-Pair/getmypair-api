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
      '<p class="muted" style="margin:0 0 16px">View full request (proof media, address, costs) or manage workflow & assignments. Amounts are stored in minor units (e.g. paise) like the app.</p>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>User</th><th>Article</th><th>Type</th><th>Costs (est / act)</th><th>User on cost</th><th>Status</th><th>Tracking</th><th>Created</th><th class="col-actions">Actions</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="9" class="loading">Loading…</td></tr></tbody></table></div>' +
      '<div id="svcDetailModal" class="modal-root modal-root-high" style="display:none" aria-hidden="true">' +
      '<div class="modal-backdrop" id="svcDetailBackdrop"></div>' +
      '<div class="modal-panel modal-panel-xlarge" role="dialog" aria-labelledby="svcDetailTitle">' +
      '<h3 id="svcDetailTitle" class="modal-title">Service request details</h3>' +
      '<div id="svcDetailBody" class="modal-scroll-body"></div>' +
      '<div class="modal-actions modal-actions-spread">' +
      '<button type="button" class="btn-ghost btn-sm" id="svcDetailClose">Close</button>' +
      '<button type="button" class="btn primary btn-modal-primary" id="svcDetailManage">Manage workflow</button>' +
      '</div></div></div>' +
      '<div id="svcModal" class="modal-root" style="display:none" aria-hidden="true">' +
      '<div class="modal-backdrop" id="svcModalBackdrop"></div>' +
      '<div class="modal-panel modal-panel-wide" role="dialog" aria-labelledby="svcModalTitle">' +
      '<h3 id="svcModalTitle" class="modal-title">Request control</h3>' +
      '<p id="svcModalSubtitle" class="muted modal-sub"></p>' +
      '<div class="modal-scroll-body modal-scroll-body-sm">' +
      '<h4 class="modal-section">Workflow</h4>' +
      '<div class="form-group"><label for="svcModalState">Tracking stage</label>' +
      '<select id="svcModalState" class="modal-select"></select></div>' +
      '<div class="form-group"><label for="svcModalNote">Note (optional)</label>' +
      '<textarea id="svcModalNote" class="modal-textarea" rows="2" placeholder="Shown in app timeline"></textarea></div>' +
      '<h4 class="modal-section">Costs (minor units)</h4>' +
      '<div class="form-group cost-row"><label for="svcModalEst">Estimated</label>' +
      '<input type="number" min="0" step="1" id="svcModalEst" class="modal-select" placeholder="e.g. 500" />' +
      '<label for="svcModalAct">Actual</label>' +
      '<input type="number" min="0" step="1" id="svcModalAct" class="modal-select" placeholder="e.g. 450" /></div>' +
      '<h4 class="modal-section">Assignments</h4>' +
      '<div class="form-group"><label for="svcModalDelivery">Delivery partner</label>' +
      '<select id="svcModalDelivery" class="modal-select"></select>' +
      '<p class="muted" style="font-size:0.75rem;margin:6px 0 0">Verified profiles only.</p></div>' +
      '<div class="form-group"><label for="svcModalCobbler">Cobbler</label>' +
      '<select id="svcModalCobbler" class="modal-select"></select></div>' +
      '<div class="form-group"><label for="svcModalDarkMode">Darkworkstore</label>' +
      '<select id="svcModalDarkMode" class="modal-select">' +
      '<option value="keep">No change</option>' +
      '<option value="clear">Clear Darkworkstore</option>' +
      '<option value="set">Set id + name below</option>' +
      '</select></div>' +
      '<div id="svcDarkFields" class="form-group" style="display:none">' +
      '<input type="text" id="svcModalDarkId" class="modal-select" placeholder="Darkworkstore id" />' +
      '<input type="text" id="svcModalDarkName" class="modal-select" style="margin-top:8px" placeholder="Display name (optional)" />' +
      '</div>' +
      '<div class="form-group"><label for="svcModalRouting">Routing</label>' +
      '<select id="svcModalRouting" class="modal-select">' +
      '<option value="">No change</option>' +
      '<option value="dark_store">dark_store</option>' +
      '<option value="direct">direct</option>' +
      '</select></div></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn-ghost btn-sm" id="svcModalCancel">Cancel</button>' +
      '<button type="button" class="btn primary btn-modal-primary" id="svcModalSave">Save</button>' +
      '</div></div></div>'
  );

  var tbody = document.getElementById('tbody');
  var errBox = document.getElementById('pageErr');
  var detailModal = document.getElementById('svcDetailModal');
  var detailBody = document.getElementById('svcDetailBody');
  var detailBackdrop = document.getElementById('svcDetailBackdrop');
  var detailRow = null;
  var detailCostInitial = { est: '', act: '' };

  var modal = document.getElementById('svcModal');
  var modalBackdrop = document.getElementById('svcModalBackdrop');
  var modalSubtitle = document.getElementById('svcModalSubtitle');
  var modalState = document.getElementById('svcModalState');
  var modalNote = document.getElementById('svcModalNote');
  var modalEst = document.getElementById('svcModalEst');
  var modalAct = document.getElementById('svcModalAct');
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
  var manageCostInitial = { est: '', act: '' };

  function esc(s) {
    return AdminApp.esc(s);
  }

  function humanStage(s) {
    return String(s || '')
      .split('_')
      .join(' ');
  }

  function moneyCell(r) {
    var e = r.estimatedCost != null && r.estimatedCost !== '' ? String(r.estimatedCost) : '—';
    var a = r.actualCost != null && r.actualCost !== '' ? String(r.actualCost) : '—';
    return '<span class="mono">' + esc(e) + '</span> / <span class="mono">' + esc(a) + '</span>';
  }

  function userCostDecisionCell(r) {
    if (r.actualCost == null || r.actualCost === '') {
      return '<span class="muted">—</span>';
    }
    var d = r.actualCostUserDecision;
    if (d === 'pending') {
      return '<strong style="color:#b45309">Awaiting user</strong>';
    }
    if (d === 'accepted') {
      return '<strong style="color:#15803d">Accepted — start work</strong>';
    }
    if (d === 'rejected') {
      return '<strong style="color:#b91c1c">Rejected</strong>';
    }
    return '<span class="muted">Legacy</span>';
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
      (row.darkStoreId ? ' · DS ' + String(row.darkStoreId).slice(0, 12) : '') +
      (row.actualCost != null &&
      row.actualCost !== '' &&
      row.actualCostUserDecision === 'pending'
        ? ' · Awaiting user accept/reject on final cost — workflow locked until then.'
        : '') +
      (row.actualCostUserDecision === 'accepted'
        ? ' · User accepted final cost — OK to advance workflow.'
        : '');
    fillStateSelect(row.trackingState || 'request_created');
    modalNote.value = '';
    manageCostInitial.est =
      row.estimatedCost != null && row.estimatedCost !== '' ? String(row.estimatedCost) : '';
    manageCostInitial.act =
      row.actualCost != null && row.actualCost !== '' ? String(row.actualCost) : '';
    modalEst.value = manageCostInitial.est;
    modalAct.value = manageCostInitial.act;
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

  function closeDetail() {
    detailRow = null;
    detailBody.innerHTML = '';
    detailModal.style.display = 'none';
    detailModal.setAttribute('aria-hidden', 'true');
  }

  function dlRow(k, v) {
    return (
      '<div class="detail-dt">' +
      esc(k) +
      '</div><div class="detail-dd">' +
      v +
      '</div>'
    );
  }

  function renderDetail(r) {
    var parts = [];
    var uid = r.user && r.user.id ? r.user.id : r.userId || '';
    parts.push('<h4 class="modal-section">Customer</h4>');
    parts.push('<div class="detail-grid">');
    parts.push(dlRow('Name', esc((r.user && r.user.name) || '—')));
    parts.push(dlRow('Mobile', '<span class="mono">' + esc((r.user && r.user.mobile) || '—') + '</span>'));
    parts.push(dlRow('Email', esc((r.user && r.user.email) || '—')));
    parts.push(dlRow('User ID', '<span class="mono">' + esc(uid) + '</span>'));
    parts.push('</div>');

    parts.push('<h4 class="modal-section">Article</h4>');
    parts.push('<div class="detail-grid">');
    var art = r.article || {};
    parts.push(dlRow('Brand / model', esc((art.brand || '') + (art.model ? ' · ' + art.model : ''))));
    parts.push(dlRow('Category', esc(art.category || '—')));
    parts.push(dlRow('Color', esc(art.color || '—')));
    parts.push(dlRow('Article ID', '<span class="mono">' + esc(r.articleId || art.id || '') + '</span>'));
    parts.push('</div>');

    parts.push('<h4 class="modal-section">Service</h4>');
    parts.push('<div class="detail-grid">');
    parts.push(dlRow('Request ID', '<span class="mono">' + esc(r._id ? String(r._id) : '') + '</span>'));
    parts.push(dlRow('Type', esc(r.serviceType || '—')));
    parts.push(dlRow('Status', esc(r.status || '—')));
    parts.push(dlRow('Tracking', esc(r.trackingState || '—')));
    parts.push(dlRow('Address ID', '<span class="mono">' + esc(r.addressId || '') + '</span>'));
    parts.push(dlRow('Delivery partner', '<span class="mono">' + esc(r.deliveryPartnerId || '—') + '</span>'));
    parts.push(dlRow('Cobbler', '<span class="mono">' + esc(r.cobblerId || '—') + '</span>'));
    parts.push(dlRow('Darkworkstore', esc(r.darkStoreName || r.darkStoreId || '—')));
    parts.push(dlRow('Routing', esc(r.routingType || '—')));
    parts.push('</div>');

    parts.push('<h4 class="modal-section">Pickup address</h4>');
    if (r.address) {
      parts.push(
        '<p class="detail-address">' +
          esc(r.address.addressLine1) +
          '<br/>' +
          esc(r.address.city) +
          ', ' +
          esc(r.address.state) +
          ' — ' +
          esc(r.address.pincode) +
          '</p>'
      );
    } else {
      parts.push('<p class="muted">No matching address on profile (check addressId).</p>');
    }

    parts.push('<h4 class="modal-section">Costs</h4>');
    parts.push('<p class="muted" style="font-size:0.8rem;margin:0 0 8px">Minor currency units (same as API / app).</p>');
    parts.push('<div class="cost-edit-row">');
    parts.push(
      '<label>Estimated <input type="number" min="0" step="1" id="detailEst" class="modal-select cost-input" /></label>'
    );
    parts.push(
      '<label>Actual <input type="number" min="0" step="1" id="detailAct" class="modal-select cost-input" /></label>'
    );
    parts.push(
      '<button type="button" class="btn-ghost btn-sm" id="detailSaveCosts">Save costs only</button>'
    );
    parts.push('</div>');

    parts.push('<h4 class="modal-section">Customer final cost</h4>');
    parts.push('<div class="detail-grid">');
    var ucd = r.actualCostUserDecision;
    var ucdLabel = '—';
    if (r.actualCost == null || r.actualCost === '') {
      ucdLabel = '<span class="muted">No actual cost set</span>';
    } else if (ucd === 'pending') {
      ucdLabel =
        '<strong style="color:#b45309">Awaiting accept/reject in user app</strong> — workflow updates are blocked.';
    } else if (ucd === 'accepted') {
      ucdLabel =
        '<strong style="color:#15803d">User accepted</strong> — you may start / continue work.';
    } else if (ucd === 'rejected') {
      ucdLabel = '<strong style="color:#b91c1c">User rejected</strong> — request cancelled.';
    } else {
      ucdLabel = '<span class="muted">Legacy record (no approval state)</span>';
    }
    parts.push(dlRow('User response', ucdLabel));
    parts.push(
      dlRow(
        'Accepted at',
        r.actualCostAcceptedAt
          ? '<span class="mono">' + esc(String(r.actualCostAcceptedAt).slice(0, 19)) + '</span>'
          : '—'
      )
    );
    parts.push('</div>');

    var photos = Array.isArray(r.photos) ? r.photos : [];
    var videos = Array.isArray(r.videos) ? r.videos : [];
    parts.push('<h4 class="modal-section">Proof photos (' + photos.length + ')</h4>');
    if (!photos.length) {
      parts.push('<p class="muted">None</p>');
    } else {
      parts.push('<div class="proof-grid">');
      photos.forEach(function (url) {
        if (!url) return;
        var u = String(url);
        parts.push(
          '<a href="' +
            esc(u) +
            '" target="_blank" rel="noopener" class="proof-link"><img class="proof-thumb" src="' +
            esc(u) +
            '" alt="Proof" loading="lazy" /></a>'
        );
      });
      parts.push('</div>');
    }

    parts.push('<h4 class="modal-section">Proof videos (' + videos.length + ')</h4>');
    if (!videos.length) {
      parts.push('<p class="muted">None</p>');
    } else {
      videos.forEach(function (url) {
        if (!url) return;
        var u = String(url);
        parts.push(
          '<div class="proof-video-wrap"><video class="proof-video" controls preload="metadata" src="' +
            esc(u) +
            '"></video><div><a href="' +
            esc(u) +
            '" target="_blank" rel="noopener" class="muted">Open link</a></div></div>'
        );
      });
    }

    parts.push('<h4 class="modal-section">Timeline (lifecycle)</h4>');
    var evs = Array.isArray(r.lifecycleEvents) ? r.lifecycleEvents.slice() : [];
    evs.sort(function (a, b) {
      var at = new Date(a.timestamp || 0).getTime();
      var bt = new Date(b.timestamp || 0).getTime();
      return at - bt;
    });
    if (!evs.length) {
      parts.push('<p class="muted">No events yet.</p>');
    } else {
      parts.push('<ul class="timeline-list">');
      evs.forEach(function (e) {
        parts.push(
          '<li><span class="mono">' +
            esc(String(e.timestamp || '').slice(0, 19)) +
            '</span> — <strong>' +
            esc(humanStage(e.state)) +
            '</strong> (' +
            esc(e.actorType || '') +
            ')' +
            (e.note ? '<br/><span class="muted">' + esc(e.note) + '</span>' : '') +
            '</li>'
        );
      });
      parts.push('</ul>');
    }

    return parts.join('');
  }

  function wireDetailCosts(rid) {
    var estEl = document.getElementById('detailEst');
    var actEl = document.getElementById('detailAct');
    if (!estEl || !actEl) return;
    estEl.value = detailCostInitial.est;
    actEl.value = detailCostInitial.act;
    document.getElementById('detailSaveCosts').onclick = async function () {
      var est = estEl.value.trim();
      var act = actEl.value.trim();
      var payload = {};
      if (est !== detailCostInitial.est) {
        payload.estimatedCost = est === '' ? null : Number(est);
        if (payload.estimatedCost !== null && !Number.isFinite(payload.estimatedCost)) {
          errBox.textContent = 'Estimated must be a number';
          errBox.style.display = 'block';
          return;
        }
      }
      if (act !== detailCostInitial.act) {
        payload.actualCost = act === '' ? null : Number(act);
        if (payload.actualCost !== null && !Number.isFinite(payload.actualCost)) {
          errBox.textContent = 'Actual must be a number';
          errBox.style.display = 'block';
          return;
        }
      }
      if (Object.keys(payload).length === 0) {
        errBox.textContent = 'Change estimated or actual to save.';
        errBox.style.display = 'block';
        return;
      }
      errBox.style.display = 'none';
      try {
        var j = await AdminApp.apiPatch('/service-requests/' + encodeURIComponent(rid), payload);
        var req = j.data && j.data.request;
        if (req && req._id) rowById[String(req._id)] = req;
        detailCostInitial.est =
          req.estimatedCost != null && req.estimatedCost !== '' ? String(req.estimatedCost) : '';
        detailCostInitial.act =
          req.actualCost != null && req.actualCost !== '' ? String(req.actualCost) : '';
        estEl.value = detailCostInitial.est;
        actEl.value = detailCostInitial.act;
        if (detailRow && req) detailRow = req;
        await loadTable();
      } catch (e) {
        errBox.textContent = e.message || 'Save failed';
        errBox.style.display = 'block';
      }
    };
  }

  async function openDetail(id) {
    errBox.style.display = 'none';
    detailBody.innerHTML = '<p class="loading">Loading…</p>';
    detailModal.style.display = 'block';
    detailModal.setAttribute('aria-hidden', 'false');
    try {
      var j = await AdminApp.apiGet('/service-requests/' + encodeURIComponent(id));
      var r = j.data && j.data.request;
      if (!r) throw new Error('Not found');
      detailRow = r;
      if (r._id) rowById[String(r._id)] = r;
      detailCostInitial.est =
        r.estimatedCost != null && r.estimatedCost !== '' ? String(r.estimatedCost) : '';
      detailCostInitial.act = r.actualCost != null && r.actualCost !== '' ? String(r.actualCost) : '';
      detailBody.innerHTML = renderDetail(r);
      wireDetailCosts(String(r._id));
    } catch (e) {
      detailBody.innerHTML = '<p class="err">' + esc(e.message || 'Failed') + '</p>';
    }
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
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading…</td></tr>';
    errBox.style.display = 'none';
    var j = await AdminApp.apiGet('/service-requests?limit=100');
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="muted">No service requests</td></tr>';
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
          '</td><td class="mono">' +
          moneyCell(r) +
          '</td><td>' +
          userCostDecisionCell(r) +
          '</td><td>' +
          esc(r.status) +
          '</td><td>' +
          esc(r.trackingState) +
          '</td><td class="mono">' +
          esc(r.createdAt ? String(r.createdAt).slice(0, 19) : '') +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn-ghost btn-sm btn-row" data-act="view">View</button> ' +
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
    if (act === 'view') {
      openDetail(id);
      return;
    }
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

  detailBackdrop.addEventListener('click', closeDetail);
  document.getElementById('svcDetailClose').addEventListener('click', closeDetail);
  document.getElementById('svcDetailManage').addEventListener('click', function () {
    if (!detailRow) return;
    closeDetail();
    openModal(detailRow);
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

      var estVal = modalEst.value.trim();
      var actVal = modalAct.value.trim();
      if (estVal !== manageCostInitial.est) {
        payload.estimatedCost = estVal === '' ? null : Number(estVal);
        if (payload.estimatedCost !== null && !Number.isFinite(payload.estimatedCost)) {
          errBox.textContent = 'Estimated cost must be a number';
          errBox.style.display = 'block';
          return;
        }
      }
      if (actVal !== manageCostInitial.act) {
        payload.actualCost = actVal === '' ? null : Number(actVal);
        if (payload.actualCost !== null && !Number.isFinite(payload.actualCost)) {
          errBox.textContent = 'Actual cost must be a number';
          errBox.style.display = 'block';
          return;
        }
      }

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
          errBox.textContent = 'Enter a Darkworkstore id or choose another option.';
          errBox.style.display = 'block';
          return;
        }
        payload.darkStoreId = did;
        var dnm = modalDarkName.value.trim();
        if (dnm) payload.darkStoreName = dnm;
      }

      var rt = modalRouting.value;
      if (rt) payload.routingType = rt;

      var j = await AdminApp.apiPatch('/service-requests/' + encodeURIComponent(editingId), payload);
      var req = j.data && j.data.request;
      if (req && req._id) rowById[String(req._id)] = req;
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
    if (ev.key !== 'Escape') return;
    if (modal.style.display === 'block') {
      closeModal();
      return;
    }
    if (detailModal.style.display === 'block') {
      closeDetail();
    }
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
