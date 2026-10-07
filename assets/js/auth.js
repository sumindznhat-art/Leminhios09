/* ============================================================
   AUTH.JS — ĐĂNG KÝ / ĐĂNG NHẬP / KEY / NẠP TIỀN
   ============================================================ */

function _$(id) { return document.getElementById(id); }

function _setLoading(spinnerId, btnTextId, text, loading) {
  var sp = _$(spinnerId), bt = _$(btnTextId);
  if (sp) sp.style.display = loading ? 'inline-block' : 'none';
  if (bt) bt.innerHTML = text;
}
function _setError(msg) { var b = _$('loginError'); if (b) b.textContent = msg || ''; }
function _setKeyError(msg) { var b = _$('keyErr'); if (b) b.textContent = msg || ''; }

var _cachedIP = null;
function getIP() {
  if (_cachedIP) return Promise.resolve(_cachedIP);
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.ipify.org?format=json', true);
    xhr.timeout = 3000;
    xhr.onload = function() {
      try {
        var d = JSON.parse(xhr.responseText);
        if (d.ip) { _cachedIP = d.ip; return resolve(d.ip); }
      } catch(e) {}
      resolve('unknown');
    };
    xhr.onerror = function() { resolve('unknown'); };
    xhr.ontimeout = function() { resolve('unknown'); };
    xhr.send();
  });
}

function switchTab(tab) {
  _setError('');
  var tl = _$('tabLogin'), tr = _$('tabReg');
  var fl = _$('formLogin'), fr = _$('formReg');
  if (tab === 'login') {
    if (tl) tl.classList.add('active');
    if (tr) tr.classList.remove('active');
    if (fl) fl.style.display = '';
    if (fr) fr.style.display = 'none';
  } else {
    if (tr) tr.classList.add('active');
    if (tl) tl.classList.remove('active');
    if (fr) fr.style.display = '';
    if (fl) fl.style.display = 'none';
  }
}

/* ==================== ĐĂNG KÝ ==================== */
function doRegister() {
  _setError('');
  var name  = (_$('regName')  ? _$('regName').value  : '').trim();
  var email = (_$('regEmail') ? _$('regEmail').value : '').trim().toLowerCase();
  var p1    = _$('regPass')   ? _$('regPass').value  : '';
  var p2    = _$('regPass2')  ? _$('regPass2').value : '';

  if (!name || !email || !p1 || !p2)  return _setError('⚠️ Vui lòng nhập đầy đủ!');
  if (name.length < 2)                return _setError('⚠️ Tên từ 2 ký tự!');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return _setError('⚠️ Email không hợp lệ!');
  if (p1.length < 6)                  return _setError('⚠️ Mật khẩu từ 6 ký tự!');
  if (p1 !== p2)                      return _setError('⚠️ Mật khẩu nhập lại không khớp!');

  _setLoading('regSpinner', 'btnRegText', '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XỬ LÝ...', true);

  api('register', { name: name, email: email, password: p1 })
    .then(function(data) {
      if (data && data.success) {
        if (_$('regName'))  _$('regName').value  = '';
        if (_$('regEmail')) _$('regEmail').value = '';
        if (_$('regPass'))  _$('regPass').value  = '';
        if (_$('regPass2')) _$('regPass2').value = '';
        alert('✅ ĐĂNG KÝ THÀNH CÔNG!\n\n📧 ' + email + '\n\nVui lòng đăng nhập.');
        switchTab('login');
      } else {
        _setError('❌ ' + ((data && data.error) || 'Đăng ký thất bại!'));
      }
    })
    .catch(function(err) { _setError('❌ ' + err.message); })
    .then(function() {
      _setLoading('regSpinner', 'btnRegText', '<i class="fa-solid fa-user-plus"></i> ĐĂNG KÝ', false);
    });
}

/* ==================== ĐĂNG NHẬP ==================== */
function doLogin() {
  _setError('');
  var email = (_$('loginEmail') ? _$('loginEmail').value : '').trim().toLowerCase();
  var pass  = _$('loginPass') ? _$('loginPass').value : '';

  if (!email || !pass) return _setError('⚠️ Nhập Email và Mật khẩu!');

  _setLoading('loginSpinner', 'btnLoginText', '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG ĐĂNG NHẬP...', true);

  api('login', { email: email, password: pass })
    .then(function(data) {
      if (data && data.success && data.user) {
        if (email === ADMIN_EMAIL) data.user.is_admin = 1;
        setSessionData(email, pass, data.user);
        if (typeof enterApp === 'function') enterApp();
      } else {
        _setError('❌ ' + ((data && data.error) || 'Sai email hoặc mật khẩu!'));
      }
    })
    .catch(function(err) { _setError('❌ ' + err.message); })
    .then(function() {
      _setLoading('loginSpinner', 'btnLoginText', '<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP', false);
    });
}

/* ==================== ĐĂNG XUẤT ==================== */
function doLogout() {
  if (!confirm('Bạn chắc chắn muốn đăng xuất?')) return;
  clearSession();
  localStorage.removeItem('bs_current');
  location.reload();
}

/* ==================== KÍCH HOẠT KEY ==================== */
function activateKey() {
  _setKeyError('');
  var keyInput = _$('keyInput');
  var key = (keyInput ? keyInput.value : '').trim().toUpperCase();
  if (!key) return _setKeyError('⚠️ Vui lòng nhập Key!');

  var s = getSession();
  if (!s) return _setKeyError('⚠️ Vui lòng đăng nhập lại!');

  api('key_activate', { email: s.email, password: s.password, code: key })
    .then(function(data) {
      if (data && data.success) {
        alert('✅ KÍCH HOẠT THÀNH CÔNG!\n\n🔑 Key: ' + key +
          (data.days ? '\n⏱ +' + data.days + ' ngày' : ''));
        if (typeof closeModal === 'function') closeModal('keyModal');
        apiGetUser().then(function() { if (typeof renderAll === 'function') renderAll(); });
      } else {
        _setKeyError('❌ ' + ((data && data.error) || 'Key không hợp lệ!'));
      }
    })
    .catch(function(err) { _setKeyError('❌ ' + err.message); });
}

/* ==================== NẠP TIỀN ==================== */
function submitDeposit() {
  var amount = Number(_$('depAmount') ? _$('depAmount').value : 0);
  var note   = _$('depNote') ? _$('depNote').value.trim() : '';
  if (!amount || amount < 10000) return alert('Số tiền tối thiểu 10.000đ');

  var s = getSession();
  if (!s) return alert('Vui lòng đăng nhập lại!');

  api('deposit_create', { email: s.email, password: s.password, amount: amount, note: note })
    .then(function(data) {
      if (data && data.success) {
        alert('✅ ' + (data.message || 'Đã gửi yêu cầu nạp tiền!'));
        if (typeof closeModal === 'function') closeModal('depositModal');
        if (typeof renderAll === 'function') renderAll();
      } else {
        alert('❌ ' + ((data && data.error) || 'Lỗi gửi yêu cầu'));
      }
    })
    .catch(function(err) { alert('❌ ' + err.message); });
}

window.getIP = getIP;
window.switchTab = switchTab;
window.doRegister = doRegister;
window.doLogin = doLogin;
window.doLogout = doLogout;
window.activateKey = activateKey;
window.submitDeposit = submitDeposit;
