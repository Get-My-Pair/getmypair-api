(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  var SECTIONS = [
    { id: 'cost', label: 'Cost approval' },
    { id: 'status', label: 'Payment status' },
    { id: 'paid', label: 'Paid jobs' },
    { id: 'unpaid', label: 'Unpaid jobs' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'history', label: 'Job history' },
    { id: 'settlements', label: 'Settlements' },
    { id: 'reports', label: 'Reports' },
    { id: 'notifications', label: 'Alerts' },
  ];

  AdminApp.mountShell(
    'payments',
    'Payments',
    '<div id="payErr" class="err" style="display:none"></div>' +
      '<p class="muted pay-intro">Darkworkstore payment workflow — cost approval through settlements and monthly reports.</p>' +
      '<div class="pay-filters">' +
      '<label>Store filter <input type="text" id="payDarkStoreId" class="pay-input" placeholder="All stores" /></label>' +
      '<button type="button" class="btn primary btn-sm" id="payRefresh">Refresh</button>' +
      '</div>' +
      '<nav class="pay-tabs" id="payTabs"></nav>' +
      '<div id="payPanels"></div>' +
      '<div id="payModal" class="modal-root" style="display:none" aria-hidden="true">' +
      '<div class="modal-backdrop" id="payModalBackdrop"></div>' +
      '<div class="modal-panel modal-panel-wide" role="dialog">' +
      '<h3 class="modal-title" id="payModalTitle">Details</h3>' +
      '<div id="payModalBody" class="modal-scroll-body"></div>' +
      '<div class="modal-actions"><button type="button" class="btn-ghost btn-sm" id="payModalClose">Close</button></div>' +
      '</div></div>'
  );

  var errBox = document.getElementById('payErr');
  var tabsEl = document.getElementById('payTabs');
  var panelsEl = document.getElementById('payPanels');
  var darkStoreInput = document.getElementById('payDarkStoreId');
  var activeSection = 'cost';
  var modal = document.getElementById('payModal');
  var modalBody = document.getElementById('payModalBody');
  var modalTitle = document.getElementById('payModalTitle');

  function esc(s) {
    return AdminApp.esc(s);
  }

  function showErr(msg) {
    errBox.textContent = msg || 'Error';
    errBox.style.display = 'block';
  }

  function clearErr() {
    errBox.style.display = 'none';
    errBox.textContent = '';
  }

  function qs(extra) {
    var ds = (darkStoreInput && darkStoreInput.value.trim()) || '';
    var q = ds ? 'darkStoreId=' + encodeURIComponent(ds) : '';
    if (extra) q = q ? q + '&' + extra : extra;
    return q ? '?' + q : '';
  }

  function money(v) {
    if (v == null || v === '') return '—';
    return '₹' + Number(v).toLocaleString('en-IN');
  }

  function badge(status) {
    var s = String(status || 'unknown');
    var cls = 'pill';
    if (s.indexOf('SUCCESS') >= 0 || s === 'completed' || s === 'accepted') cls += ' pill-ok';
    else if (s.indexOf('FAIL') >= 0 || s === 'failed' || s === 'rejected') cls += ' pill-bad';
    else if (s.indexOf('PENDING') >= 0 || s === 'pending') cls += ' pill-warn';
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  function shortId(id) {
    if (!id) return '—';
    var s = String(id);
    return s.length > 10 ? s.slice(0, 8) + '…' : s;
  }

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
  }

  document.getElementById('payModalClose').addEventListener('click', closeModal);
  document.getElementById('payModalBackdrop').addEventListener('click', closeModal);

  function renderTabs() {
    tabsEl.innerHTML = SECTIONS.map(function (sec) {
      var cls = sec.id === activeSection ? 'pay-tab active' : 'pay-tab';
      return '<button type="button" class="' + cls + '" data-sec="' + sec.id + '">' + esc(sec.label) + '</button>';
    }).join('');
    tabsEl.querySelectorAll('.pay-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeSection = btn.getAttribute('data-sec');
        renderTabs();
        loadSection();
      });
    });
  }

  function panelHtml(id, inner) {
    return '<section class="pay-panel" id="panel-' + id + '" style="display:none">' + inner + '</section>';
  }

  function renderPanels() {
    panelsEl.innerHTML =
      panelHtml(
        'cost',
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Request</th><th>Store</th><th>Est / Act</th><th>User decision</th><th>Workflow</th><th>Update cost</th>' +
          '</tr></thead><tbody id="costTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml(
        'status',
        '<div class="pay-toolbar">' +
          '<select id="statusFilter" class="pay-input"><option value="">All statuses</option>' +
          '<option>PAYMENT_PENDING</option><option>PAYMENT_INITIATED</option>' +
          '<option>PAYMENT_SUCCESS</option><option>PAYMENT_FAILED</option></select>' +
          '<input type="text" id="statusOrderLookup" class="pay-input" placeholder="Lookup order id" />' +
          '<button type="button" class="btn btn-sm" id="statusLookupBtn">Lookup</button>' +
          '</div><div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Order</th><th>Amount</th><th>Status</th><th>Store</th><th>Updated</th><th></th>' +
          '</tr></thead><tbody id="statusTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml(
        'paid',
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Request</th><th>User</th><th>Amount</th><th>Store</th><th>Paid at</th><th></th>' +
          '</tr></thead><tbody id="paidTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml(
        'unpaid',
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Request</th><th>User</th><th>Actual cost</th><th>Payment state</th><th>Store</th><th></th>' +
          '</tr></thead><tbody id="unpaidTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml('revenue', '<div id="revenueContent" class="loading">Loading…</div>') +
      panelHtml(
        'transactions',
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Order</th><th>Amount</th><th>Status</th><th>Method</th><th>Paid</th><th></th>' +
          '</tr></thead><tbody id="txTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml(
        'history',
        '<div class="pay-toolbar">' +
          '<input type="text" id="historyRequestId" class="pay-input" placeholder="Service request id" />' +
          '<button type="button" class="btn btn-sm" id="historyLoadBtn">Load history</button>' +
          '</div><div id="historyContent" class="muted">Enter a service request id to view payment attempts.</div>'
      ) +
      panelHtml(
        'settlements',
        '<div class="pay-toolbar">' +
          '<select id="settlementFilter" class="pay-input"><option value="">All</option>' +
          '<option>pending</option><option>processing</option><option>completed</option><option>failed</option></select>' +
          '</div><div id="settlementSummary" class="pay-summary-row"></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Beneficiary</th><th>Amount</th><th>Status</th><th>Scheduled</th><th>Processed</th><th></th>' +
          '</tr></thead><tbody id="settleTbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
      ) +
      panelHtml(
        'reports',
        '<div class="pay-toolbar">' +
          '<input type="number" id="reportYear" class="pay-input pay-input-sm" placeholder="Year" />' +
          '<input type="number" id="reportMonth" class="pay-input pay-input-sm" placeholder="Month" min="1" max="12" />' +
          '<button type="button" class="btn btn-sm" id="reportLoadBtn">Generate</button>' +
          '</div><div id="reportContent" class="loading">Loading…</div>'
      ) +
      panelHtml(
        'notifications',
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Time</th><th>Action</th><th>Status</th><th>Resource</th><th>Details</th>' +
          '</tr></thead><tbody id="notifTbody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody></table></div>'
      );

    var now = new Date();
    var yEl = document.getElementById('reportYear');
    var mEl = document.getElementById('reportMonth');
    if (yEl) yEl.value = String(now.getFullYear());
    if (mEl) mEl.value = String(now.getMonth() + 1);

    document.getElementById('statusLookupBtn').addEventListener('click', lookupOrderStatus);
    document.getElementById('historyLoadBtn').addEventListener('click', loadHistory);
    document.getElementById('reportLoadBtn').addEventListener('click', loadReports);
    document.getElementById('statusFilter').addEventListener('change', loadStatus);
    document.getElementById('settlementFilter').addEventListener('change', loadSettlements);
  }

  function showPanel(id) {
    panelsEl.querySelectorAll('.pay-panel').forEach(function (p) {
      p.style.display = p.id === 'panel-' + id ? 'block' : 'none';
    });
  }

  async function loadSection() {
    clearErr();
    showPanel(activeSection);
    try {
      if (activeSection === 'cost') await loadCostApproval();
      else if (activeSection === 'status') await loadStatus();
      else if (activeSection === 'paid') await loadPaid();
      else if (activeSection === 'unpaid') await loadUnpaid();
      else if (activeSection === 'revenue') await loadRevenue();
      else if (activeSection === 'transactions') await loadTransactions();
      else if (activeSection === 'history') {
        /* manual */
      } else if (activeSection === 'settlements') await loadSettlements();
      else if (activeSection === 'reports') await loadReports();
      else if (activeSection === 'notifications') await loadNotifications();
    } catch (e) {
      showErr(e.message);
    }
  }

  async function loadCostApproval() {
    var tbody = document.getElementById('costTbody');
    var j = await AdminApp.apiGet('/payments/cost-approval' + qs('limit=50'));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No jobs awaiting cost approval.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (r) {
        var est = r.estimatedCost != null ? r.estimatedCost : '—';
        var act = r.actualCost != null ? r.actualCost : '';
        return (
          '<tr data-id="' +
          esc(r._id) +
          '"><td class="mono">' +
          shortId(r._id) +
          '</td><td>' +
          esc(r.darkStoreName || r.darkStoreId || '—') +
          '</td><td>' +
          esc(est) +
          ' / ' +
          esc(act || '—') +
          '</td><td>' +
          badge(r.actualCostUserDecision || '—') +
          '</td><td>' +
          badge(r.paymentState || r.workflowStatus) +
          '</td><td class="col-actions">' +
          '<input type="number" min="0" class="pay-input pay-input-sm cost-inp" value="' +
          esc(act) +
          '" placeholder="Amount" />' +
          '<button type="button" class="btn primary btn-sm cost-save">Save</button></td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('.cost-save').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var tr = btn.closest('tr');
        var id = tr.getAttribute('data-id');
        var inp = tr.querySelector('.cost-inp');
        var val = Number(inp.value);
        if (!Number.isFinite(val) || val < 0) {
          showErr('Enter a valid cost amount');
          return;
        }
        try {
          clearErr();
          await AdminApp.apiPatch('/payments/cost/' + id, { actualCost: val });
          await loadCostApproval();
        } catch (e) {
          showErr(e.message);
        }
      });
    });
  }

  async function loadStatus() {
    var tbody = document.getElementById('statusTbody');
    var st = document.getElementById('statusFilter').value;
    var extra = 'limit=50' + (st ? '&status=' + encodeURIComponent(st) : '');
    var j = await AdminApp.apiGet('/payments/status' + qs(extra));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No payments found.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (p) {
        var sr = p.serviceRequest || {};
        return (
          '<tr><td class="mono">' +
          esc(p.orderId) +
          '</td><td>' +
          money(p.amount) +
          '</td><td>' +
          badge(p.status) +
          '</td><td>' +
          esc(sr.darkStoreName || p.darkStoreId || '—') +
          '</td><td class="mono">' +
          esc(p.updatedAt ? String(p.updatedAt).slice(0, 19) : '—') +
          '</td><td><button type="button" class="btn-ghost btn-sm tx-view" data-order="' +
          esc(p.orderId) +
          '">View</button></td></tr>'
        );
      })
      .join('');
    bindOrderView(tbody);
  }

  async function lookupOrderStatus() {
    var orderId = document.getElementById('statusOrderLookup').value.trim();
    if (!orderId) return;
    try {
      clearErr();
      var j = await AdminApp.apiGet('/payments/status/' + encodeURIComponent(orderId));
      var d = j.data || {};
      openModal(
        'Order ' + orderId,
        '<pre class="pay-pre">' + esc(JSON.stringify(d, null, 2)) + '</pre>'
      );
    } catch (e) {
      showErr(e.message);
    }
  }

  async function loadPaid() {
    var tbody = document.getElementById('paidTbody');
    var j = await AdminApp.apiGet('/payments/jobs/paid' + qs('limit=50'));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No paid jobs.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (r) {
        var pay = r.payment || {};
        var user = (r.user && r.user.name) || '—';
        return (
          '<tr><td class="mono">' +
          shortId(r._id) +
          '</td><td>' +
          esc(user) +
          '</td><td>' +
          money(pay.amount || r.actualCost) +
          '</td><td>' +
          esc(r.darkStoreName || r.darkStoreId || '—') +
          '</td><td class="mono">' +
          esc(pay.paidAt ? String(pay.paidAt).slice(0, 19) : '—') +
          '</td><td><button type="button" class="btn-ghost btn-sm hist-btn" data-id="' +
          esc(r._id) +
          '">History</button></td></tr>'
        );
      })
      .join('');
    bindHistoryButtons(tbody);
  }

  async function loadUnpaid() {
    var tbody = document.getElementById('unpaidTbody');
    var j = await AdminApp.apiGet('/payments/jobs/unpaid' + qs('limit=50'));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No unpaid jobs.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (r) {
        var user = (r.user && r.user.name) || '—';
        return (
          '<tr><td class="mono">' +
          shortId(r._id) +
          '</td><td>' +
          esc(user) +
          '</td><td>' +
          money(r.actualCost) +
          '</td><td>' +
          badge(r.paymentState) +
          '</td><td>' +
          esc(r.darkStoreName || r.darkStoreId || '—') +
          '</td><td><button type="button" class="btn-ghost btn-sm hist-btn" data-id="' +
          esc(r._id) +
          '">History</button></td></tr>'
        );
      })
      .join('');
    bindHistoryButtons(tbody);
  }

  async function loadRevenue() {
    var el = document.getElementById('revenueContent');
    var j = await AdminApp.apiGet('/payments/revenue' + qs());
    var d = j.data || {};
    var s = d.summary || {};
    var cards =
      '<div class="ops-cards">' +
      overviewCard(money(s.totalRevenue), 'Total revenue', 'Collected') +
      overviewCard(String(s.transactionCount || 0), 'Transactions', 'Successful payments') +
      overviewCard(money(s.gmpShare), 'GMP share', 'Platform') +
      overviewCard(money(s.partnerShare), 'Partner share', 'Dark store') +
      '</div>';

    var statusRows = (d.byStatus || [])
      .map(function (row) {
        return (
          '<tr><td>' +
          badge(row._id) +
          '</td><td>' +
          esc(row.count) +
          '</td><td>' +
          money(row.amount) +
          '</td></tr>'
        );
      })
      .join('');

    var dailyRows = (d.dailyRevenue || [])
      .map(function (row) {
        return (
          '<tr><td>' +
          esc(row._id) +
          '</td><td>' +
          money(row.revenue) +
          '</td><td>' +
          esc(row.count) +
          '</td></tr>'
        );
      })
      .join('');

  var pending = d.pendingSettlements || {};
    el.innerHTML =
      cards +
      '<div class="pay-split">' +
      '<div class="ops-panel"><h3 class="ops-panel-title">By payment status</h3>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Status</th><th>Count</th><th>Amount</th></tr></thead><tbody>' +
      (statusRows || '<tr><td colspan="3" class="muted">No data</td></tr>') +
      '</tbody></table></div></div>' +
      '<div class="ops-panel"><h3 class="ops-panel-title">Last 14 days</h3>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Revenue</th><th>Count</th></tr></thead><tbody>' +
      (dailyRows || '<tr><td colspan="3" class="muted">No data</td></tr>') +
      '</tbody></table></div></div></div>' +
      '<p class="muted">Pending settlements: ' +
      esc(pending.count || 0) +
      ' (' +
      money(pending.amount) +
      ')</p>';
  }

  function overviewCard(val, lbl, hint) {
    return (
      '<div class="ops-card"><div class="ops-card-val">' +
      esc(val) +
      '</div><div class="ops-card-lbl">' +
      esc(lbl) +
      '</div><div class="ops-card-hint">' +
      esc(hint) +
      '</div></div>'
    );
  }

  async function loadTransactions() {
    var tbody = document.getElementById('txTbody');
    var j = await AdminApp.apiGet('/payments/transactions' + qs('limit=50'));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No transactions.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (p) {
        return (
          '<tr><td class="mono">' +
          esc(p.orderId) +
          '</td><td>' +
          money(p.amount) +
          '</td><td>' +
          badge(p.status) +
          '</td><td>' +
          esc(p.paymentMethod || '—') +
          '</td><td class="mono">' +
          esc(p.paidAt ? String(p.paidAt).slice(0, 19) : '—') +
          '</td><td><button type="button" class="btn-ghost btn-sm tx-detail" data-id="' +
          esc(p._id) +
          '">Details</button></td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('.tx-detail').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        try {
          clearErr();
          var j = await AdminApp.apiGet('/payments/transactions/' + btn.getAttribute('data-id'));
          openModal('Transaction', '<pre class="pay-pre">' + esc(JSON.stringify(j.data, null, 2)) + '</pre>');
        } catch (e) {
          showErr(e.message);
        }
      });
    });
  }

  function bindOrderView(tbody) {
    tbody.querySelectorAll('.tx-view').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        document.getElementById('statusOrderLookup').value = btn.getAttribute('data-order');
        await lookupOrderStatus();
      });
    });
  }

  function bindHistoryButtons(tbody) {
    tbody.querySelectorAll('.hist-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.getAttribute('data-id');
        document.getElementById('historyRequestId').value = id;
        activeSection = 'history';
        renderTabs();
        showPanel('history');
        await loadHistory();
      });
    });
  }

  async function loadHistory() {
    var id = document.getElementById('historyRequestId').value.trim();
    var el = document.getElementById('historyContent');
    if (!id) {
      el.innerHTML = '<p class="muted">Enter a service request id.</p>';
      return;
    }
    el.innerHTML = '<p class="loading">Loading…</p>';
    try {
      clearErr();
      var j = await AdminApp.apiGet('/payments/history/' + encodeURIComponent(id));
      var d = j.data || {};
      var pays = d.payments || [];
      var audits = d.audits || [];
      var payRows = pays
        .map(function (p) {
          return (
            '<tr><td class="mono">' +
            esc(p.orderId) +
            '</td><td>' +
            money(p.amount) +
            '</td><td>' +
            badge(p.status) +
            '</td><td class="mono">' +
            esc(p.createdAt ? String(p.createdAt).slice(0, 19) : '—') +
            '</td></tr>'
          );
        })
        .join('');
      var auditRows = audits
        .map(function (a) {
          return (
            '<tr><td class="mono">' +
            esc(a.timestamp ? String(a.timestamp).slice(0, 19) : '—') +
            '</td><td>' +
            esc(a.action) +
            '</td><td>' +
            badge(a.status) +
            '</td><td><pre class="pay-pre-inline">' +
            esc(JSON.stringify(a.details || {})) +
            '</pre></td></tr>'
          );
        })
        .join('');
      el.innerHTML =
        '<h4 class="modal-section">Request ' +
        shortId(id) +
        ' — ' +
        badge((d.request && d.request.paymentState) || '—') +
        '</h4>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Order</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>' +
        (payRows || '<tr><td colspan="4" class="muted">No payments</td></tr>') +
        '</tbody></table></div>' +
        '<h4 class="modal-section">Audit trail</h4>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Time</th><th>Action</th><th>Status</th><th>Details</th></tr></thead><tbody>' +
        (auditRows || '<tr><td colspan="4" class="muted">No audit entries</td></tr>') +
        '</tbody></table></div>';
    } catch (e) {
      el.innerHTML = '';
      showErr(e.message);
    }
  }

  async function loadSettlements() {
    var tbody = document.getElementById('settleTbody');
    var st = document.getElementById('settlementFilter').value;
    var extra = 'limit=50' + (st ? '&status=' + encodeURIComponent(st) : '');
    var j = await AdminApp.apiGet('/payments/settlements' + qs(extra));
    var d = j.data || {};
    var items = d.items || [];
    var summaryEl = document.getElementById('settlementSummary');
    summaryEl.innerHTML = (d.byStatus || [])
      .map(function (row) {
        return (
          '<span class="pill">' +
          esc(row._id) +
          ': ' +
          esc(row.count) +
          ' (' +
          money(row.amount) +
          ')</span> '
        );
      })
      .join('');

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No settlements.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (s) {
        return (
          '<tr data-sid="' +
          esc(s._id) +
          '"><td>' +
          esc(s.beneficiaryId) +
          '</td><td>' +
          money(s.amount) +
          '</td><td>' +
          badge(s.status) +
          '</td><td class="mono">' +
          esc(s.scheduledAt ? String(s.scheduledAt).slice(0, 19) : '—') +
          '</td><td class="mono">' +
          esc(s.processedAt ? String(s.processedAt).slice(0, 19) : '—') +
          '</td><td>' +
          (s.status === 'pending'
            ? '<button type="button" class="btn primary btn-sm settle-process">Process</button>'
            : '—') +
          '</td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('.settle-process').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var sid = btn.closest('tr').getAttribute('data-sid');
        try {
          clearErr();
          await AdminApp.apiPost('/payments/settlements/' + sid + '/process', {});
          await loadSettlements();
        } catch (e) {
          showErr(e.message);
        }
      });
    });
  }

  async function loadReports() {
    var el = document.getElementById('reportContent');
    var year = document.getElementById('reportYear').value;
    var month = document.getElementById('reportMonth').value;
    el.innerHTML = '<p class="loading">Generating report…</p>';
    var extra = 'year=' + encodeURIComponent(year) + '&month=' + encodeURIComponent(month);
    var j = await AdminApp.apiGet('/payments/reports/monthly' + qs(extra));
    var d = j.data || {};
    var t = d.totals || {};
    var dayRows = (d.byDay || [])
      .map(function (row) {
        return (
          '<tr><td>' +
          esc(row._id) +
          '</td><td>' +
          money(row.gross) +
          '</td><td>' +
          esc(row.count) +
          '</td></tr>'
        );
      })
      .join('');
    var period = d.period || {};
    el.innerHTML =
      '<div class="ops-cards">' +
      overviewCard(money(t.gross), 'Gross', 'Month total') +
      overviewCard(money(t.gmp), 'GMP', 'Commission') +
      overviewCard(money(t.partner), 'Partner', 'Dark store') +
      overviewCard(String(t.count || 0), 'Payments', period.month + '/' + period.year) +
      '</div>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Day</th><th>Gross</th><th>Count</th></tr></thead><tbody>' +
      (dayRows || '<tr><td colspan="3" class="muted">No payments this month</td></tr>') +
      '</tbody></table></div>';
  }

  async function loadNotifications() {
    var tbody = document.getElementById('notifTbody');
    var j = await AdminApp.apiGet('/payments/notifications' + qs('limit=50'));
    var items = (j.data && j.data.items) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">No payment alerts.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (n) {
        return (
          '<tr><td class="mono">' +
          esc(n.timestamp ? String(n.timestamp).slice(0, 19) : '—') +
          '</td><td>' +
          esc(n.action) +
          '</td><td>' +
          badge(n.status) +
          '</td><td class="mono">' +
          shortId(n.resourceId) +
          '</td><td><pre class="pay-pre-inline">' +
          esc(JSON.stringify(n.details || {})) +
          '</pre></td></tr>'
        );
      })
      .join('');
  }

  document.getElementById('payRefresh').addEventListener('click', loadSection);

  renderTabs();
  renderPanels();
  loadSection();
})();
