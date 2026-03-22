(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var errEl = document.getElementById('loginErr');
  var btn = document.getElementById('btnSubmit');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errEl.style.display = 'none';
    btn.disabled = true;

    var email = (document.getElementById('email').value || '').trim();
    var password = document.getElementById('password').value || '';

    try {
      var r = await fetch('/api/sys-admin/auth/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      });
      var j = {};
      try {
        j = await r.json();
      } catch (x) {}

      if (!r.ok || j.success === false) {
        throw new Error(j.message || 'Login failed');
      }

      var token = j.data && j.data.accessToken;
      if (!token) throw new Error('No token in response');

      AdminApp.setToken(token);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errEl.textContent = err.message || 'Login failed';
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
    }
  });
})();
