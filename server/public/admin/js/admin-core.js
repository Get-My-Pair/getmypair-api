/**
 * Darkworkstore Admin – shared API + layout helpers
 */
(function () {
  'use strict';

  var API_BASE = '/api/sys-admin';
  var TOKEN_KEY = 'gmp_master_admin_token';

  window.AdminApp = {
    API_BASE: API_BASE,
    TOKEN_KEY: TOKEN_KEY,

    getToken: function () {
      try {
        return localStorage.getItem(TOKEN_KEY) || '';
      } catch (e) {
        return '';
      }
    },

    setToken: function (t) {
      try {
        localStorage.setItem(TOKEN_KEY, t);
      } catch (e) {}
    },

    clearToken: function () {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    },

    logout: function () {
      this.clearToken();
      window.location.href = '/admin/';
    },

    requireAuth: function () {
      if (!this.getToken()) {
        window.location.replace('/admin/');
        return false;
      }
      return true;
    },

    authHeaders: function () {
      return {
        Authorization: 'Bearer ' + this.getToken(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
    },

    apiGet: async function (path) {
      var r = await fetch(API_BASE + path, { headers: this.authHeaders() });
      var j = {};
      try {
        j = await r.json();
      } catch (e) {}
      if (!r.ok) {
        throw new Error(j.message || 'Request failed (' + r.status + ')');
      }
      if (j.success === false) {
        throw new Error(j.message || 'Request failed');
      }
      return j;
    },

    apiPost: async function (path, body) {
      var r = await fetch(API_BASE + path, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body || {}),
      });
      var j = {};
      try {
        j = await r.json();
      } catch (e) {}
      if (!r.ok) {
        throw new Error(j.message || 'Request failed (' + r.status + ')');
      }
      if (j.success === false) {
        throw new Error(j.message || 'Request failed');
      }
      return j;
    },

    apiPatch: async function (path, body) {
      var r = await fetch(API_BASE + path, {
        method: 'PATCH',
        headers: this.authHeaders(),
        body: JSON.stringify(body || {}),
      });
      var j = {};
      try {
        j = await r.json();
      } catch (e) {}
      if (!r.ok) {
        throw new Error(j.message || 'Request failed (' + r.status + ')');
      }
      if (j.success === false) {
        throw new Error(j.message || 'Request failed');
      }
      return j;
    },

    apiDelete: async function (path) {
      var r = await fetch(API_BASE + path, { method: 'DELETE', headers: this.authHeaders() });
      var j = {};
      try {
        j = await r.json();
      } catch (e) {}
      if (!r.ok) {
        throw new Error(j.message || 'Request failed (' + r.status + ')');
      }
      if (j.success === false) {
        throw new Error(j.message || 'Request failed');
      }
      return j;
    },

    esc: function (s) {
      if (s == null || s === undefined) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    sidebarHtml: function (active) {
      active = active || '';
      /* Inline SVG only — avoids Material font / CSP so ligature text never shows */
      var s =
        'class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
      var items = [
        {
          href: 'dashboard.html',
          key: 'dashboard',
          label: 'Dashboard',
          svg:
            '<svg ' +
            s +
            '><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        },
        {
          href: 'users.html',
          key: 'users',
          label: 'Users',
          svg:
            '<svg ' +
            s +
            '><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        },
        {
          href: 'articles.html',
          key: 'articles',
          label: 'Articles',
          svg:
            '<svg ' +
            s +
            '><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        },
        {
          href: 'services.html',
          key: 'services',
          label: 'Service requests',
          svg:
            '<svg ' +
            s +
            '><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
        },
        {
          href: 'cobblers.html',
          key: 'cobblers',
          label: 'Cobblers',
          svg:
            '<svg ' +
            s +
            '><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        },
        {
          href: 'delivery.html',
          key: 'delivery',
          label: 'Delivery',
          svg:
            '<svg ' +
            s +
            '><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
        },
      ];
      var nav = items
        .map(function (it) {
          var cls = it.key === active ? 'nav-link active' : 'nav-link';
          return (
            '<a class="' +
            cls +
            '" href="' +
            it.href +
            '">' +
            it.svg +
            '<span class="nav-label">' +
            AdminApp.esc(it.label) +
            '</span></a>'
          );
        })
        .join('');
      return (
        '<aside class="sidebar">' +
        '<div class="brand"><span class="brand-mark">D</span> Darkworkstore <small>Admin</small></div>' +
        '<nav class="nav">' +
        nav +
        '</nav>' +
        '<div class="sidebar-foot">' +
        '<button type="button" class="btn btn-ghost full" id="btnLogout">Logout</button>' +
        '</div>' +
        '</aside>'
      );
    },

    mountShell: function (activePage, title, innerHtml) {
      var wrap = document.getElementById('admin-root');
      if (!wrap) return;
      wrap.innerHTML =
        this.sidebarHtml(activePage) +
        '<div class="main">' +
        '<header class="topbar">' +
        '<h1 class="page-title">' +
        this.esc(title) +
        '</h1>' +
        '<div class="topbar-meta"><span class="pill">Darkworkstore</span></div>' +
        '</header>' +
        '<div class="content">' +
        innerHtml +
        '</div>' +
        '</div>';
      var btn = document.getElementById('btnLogout');
      if (btn) btn.addEventListener('click', function () { AdminApp.logout(); });
    },
  };
})();
