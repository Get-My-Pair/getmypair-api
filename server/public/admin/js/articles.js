(function () {
  'use strict';
  if (!AdminApp.requireAuth()) return;

  AdminApp.mountShell(
    'articles',
    'Articles',
    '<div id="pageErr" class="err" style="display:none"></div>' +
      '<p class="muted" style="margin:0 0 16px">Click an owner to see only their articles, or use <strong>All articles</strong>.</p>' +
      '<div class="owner-summary-wrap">' +
      '<div class="owner-summary-head"><span>By owner</span>' +
      '<button type="button" class="btn-ghost btn-sm" id="btnAllArticles">All articles</button></div>' +
      '<div id="ownerCards" class="owner-cards"><div class="loading">Loading owners…</div></div></div>' +
      '<div id="filterBanner" class="filter-banner" style="display:none"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Brand</th><th>Model</th><th>Category</th><th>Owner</th><th>Mobile</th><th>Created</th>' +
      '</tr></thead><tbody id="tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody></table></div>'
  );

  var tbody = document.getElementById('tbody');
  var errBox = document.getElementById('pageErr');
  var ownerCards = document.getElementById('ownerCards');
  var filterBanner = document.getElementById('filterBanner');
  var btnAll = document.getElementById('btnAllArticles');

  var selectedOwnerId = null;

  function esc(s) {
    return AdminApp.esc(s);
  }

  function setUrlOwner(id) {
    try {
      var u = new URL(window.location.href);
      if (id) u.searchParams.set('ownerId', id);
      else u.searchParams.delete('ownerId');
      window.history.replaceState({}, '', u.pathname + u.search);
    } catch (e) {
      /* ignore */
    }
  }

  function renderArticles(items) {
    if (!items.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="muted">No articles' +
        (selectedOwnerId ? ' for this owner' : '') +
        '</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (a) {
        var ownerName = a.owner && a.owner.name ? a.owner.name : '—';
        var mobile = a.owner && a.owner.mobile ? a.owner.mobile : '—';
        return (
          '<tr><td>' +
          esc(a.brand) +
          '</td><td>' +
          esc(a.model) +
          '</td><td>' +
          esc(a.category) +
          '</td><td>' +
          esc(ownerName) +
          '</td><td class="mono">' +
          esc(mobile) +
          '</td><td class="mono">' +
          esc(a.createdAt ? String(a.createdAt).slice(0, 19) : '') +
          '</td></tr>'
        );
      })
      .join('');
  }

  async function loadArticles() {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading…</td></tr>';
    var q = selectedOwnerId ? '?limit=100&ownerId=' + encodeURIComponent(selectedOwnerId) : '?limit=100';
    var j = await AdminApp.apiGet('/articles' + q);
    var items = (j.data && j.data.items) || [];
    renderArticles(items);
  }

  function updateFilterBanner(label, count) {
    if (!selectedOwnerId) {
      filterBanner.style.display = 'none';
      filterBanner.innerHTML = '';
      return;
    }
    filterBanner.style.display = 'block';
    filterBanner.innerHTML =
      '<span>Showing articles for <strong>' +
      esc(label) +
      '</strong> (' +
      count +
      ')</span> <button type="button" class="btn-ghost btn-sm" id="btnClearFilter">Clear filter</button>';
    document.getElementById('btnClearFilter').addEventListener('click', function () {
      selectOwner(null);
    });
  }

  function highlightCards() {
    var cards = ownerCards.querySelectorAll('.owner-card');
    cards.forEach(function (el) {
      var id = el.getAttribute('data-owner-id');
      if (selectedOwnerId && id === selectedOwnerId) el.classList.add('owner-card-active');
      else el.classList.remove('owner-card-active');
    });
  }

  async function selectOwner(ownerId, displayName, count) {
    selectedOwnerId = ownerId || null;
    setUrlOwner(selectedOwnerId);
    highlightCards();
    try {
      await loadArticles();
      if (selectedOwnerId) updateFilterBanner(displayName || 'Owner', count != null ? count : '…');
      else updateFilterBanner('', 0);
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load articles';
      errBox.style.display = 'block';
    }
  }

  async function loadOwnerSummary() {
    try {
      var j = await AdminApp.apiGet('/articles/by-owner');
      var items = (j.data && j.data.items) || [];
      if (!items.length) {
        ownerCards.innerHTML = '<p class="muted">No owners with articles yet.</p>';
        return;
      }
      ownerCards.innerHTML = items
        .map(function (row) {
          var oid = row.ownerId ? String(row.ownerId) : '';
          var name = row.name || 'Unknown user';
          var n = row.articleCount || 0;
          var sub = row.mobile ? esc(row.mobile) : esc(row.email || '');
          return (
            '<button type="button" class="owner-card" data-owner-id="' +
            esc(oid) +
            '" data-name="' +
            esc(name) +
            '" data-count="' +
            n +
            '">' +
            '<span class="owner-card-name">' +
            esc(name) +
            '</span>' +
            '<span class="owner-card-count">' +
            n +
            ' article' +
            (n === 1 ? '' : 's') +
            '</span>' +
            (sub ? '<span class="owner-card-sub muted">' + sub + '</span>' : '') +
            '</button>'
          );
        })
        .join('');

      ownerCards.querySelectorAll('.owner-card').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-owner-id');
          var name = btn.getAttribute('data-name') || '';
          var c = parseInt(btn.getAttribute('data-count'), 10);
          selectOwner(id, name, isNaN(c) ? null : c);
        });
      });

      highlightCards();
    } catch (e) {
      ownerCards.innerHTML = '<p class="muted">Could not load owner summary.</p>';
    }
  }

  btnAll.addEventListener('click', function () {
    errBox.style.display = 'none';
    selectOwner(null);
  });

  (async function init() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = params.get('ownerId');
      await loadOwnerSummary();
      if (fromUrl) {
        selectedOwnerId = fromUrl;
        var card = ownerCards.querySelector('.owner-card[data-owner-id="' + fromUrl + '"]');
        var label = card ? card.getAttribute('data-name') : 'Owner';
        var cnt = card ? parseInt(card.getAttribute('data-count'), 10) : null;
        setUrlOwner(fromUrl);
        highlightCards();
        await loadArticles();
        updateFilterBanner(label, isNaN(cnt) ? null : cnt);
      } else {
        await loadArticles();
      }
    } catch (e) {
      tbody.innerHTML = '';
      errBox.textContent = e.message || 'Failed to load';
      errBox.style.display = 'block';
    }
  })();
})();
