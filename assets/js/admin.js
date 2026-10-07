/* ============================================================
   ADMIN.JS — QUẢN TRỊ HOÀN CHỈNH
   ============================================================ */

function openAdmin() {
  var s = getSession();
  if (!s) return alert('Chưa đăng nhập');
  var u = s.user;
  var isAdmin = (s.email === ADMIN_EMAIL) || (u && u.is_admin == 1);
  if (!isAdmin) return alert('Không có quyền Admin!');

  ['adminPendingView','adminUsersView','adminToolsView','adminKeysView','adminHistoryView'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">⏳ Đang tải...</p>';
  });

  openModal('adminPanel');
  renderAdminPending();
  renderAdminUsers();
  renderAdminTools();
  renderAdminKeys();
  renderAdminHistory();
}

function switchAdminTab(t) {
  document.querySelectorAll('.admin-tab').forEach(function(x) { x.classList.toggle('active', x.dataset.atab === t); });
  var map = { pending:'adminPendingView', users:'adminUsersView', tools:'adminToolsView', keys:'adminKeysView', history:'adminHistoryView' };
  Object.keys(map).forEach(function(k) {
    var el = document.getElementById(map[k]); if (el) el.style.display = 'none';
  });
  var target = document.getElementById(map[t]); if (target) target.style.display = '';
}

/* ============ NÉN ẢNH ============ */
function fileToBase64(file, maxSize, quality) {
  maxSize = maxSize || 800; quality = quality || 0.8;
  return new Promise(function(resolve) {
    if (!file) return resolve('');
    if (file.type.indexOf('image/') !== 0) return resolve('');
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        var result = canvas.toDataURL('image/jpeg', quality);
        if (result.length > 1024*1024) result = canvas.toDataURL('image/jpeg', 0.6);
        resolve(result);
      };
      img.onerror = function() { resolve(''); };
      img.src = e.target.result;
    };
    reader.onerror = function() { resolve(''); };
    reader.readAsDataURL(file);
  });
}

/* ============ 1. DUYỆT TIỀN ============ */
function renderAdminPending() {
  var s = getSession(); if (!s) return;
  var el = document.getElementById('adminPendingView'); if (!el) return;

  api('deposit_pending', { email: s.email, password: s.password }).then(function(res) {
    var deps = (res && res.success) ? (res.deposits || []) : [];
    if (!deps.length) {
      el.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">🎉 Không có yêu cầu nào</p>';
      var b = document.getElementById('pendBadge'); if (b) b.style.display = 'none';
      return;
    }
    var html = '<p style="text-align:center;font-size:12px;color:#64748b;margin-bottom:8px">Có <b style="color:#dc2626">' + deps.length + '</b> yêu cầu</p>';
    deps.forEach(function(d) {
      var time = new Date(Number(d.created_at)).toLocaleString('vi-VN');
      html += '<div class="adm-row" style="border:2px solid #fde68a;background:#fffbeb">' +
        '<div><b>' + esc(d.email) + '</b>' + (d.user_name ? ' — ' + esc(d.user_name) : '') + '</div>' +
        '<div style="font-size:16px;color:#dc2626;font-weight:800;margin:4px 0">💵 ' + fmt(d.amount) + '</div>' +
        '<div class="info">🌐 IP: <code>' + esc(d.ip||'—') + '</code></div>' +
        '<div class="info">📝 ' + esc(d.note||'(không có)') + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:2px">🕐 ' + time + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px">' +
          '<button class="adm-btn" style="background:linear-gradient(135deg,#22c55e,#16a34a);flex:1;margin:0" onclick="approveDeposit(\'' + d.id + '\')">✅ DUYỆT</button>' +
          '<button class="adm-btn" style="background:linear-gradient(135deg,#ef4444,#dc2626);flex:1;margin:0" onclick="rejectDeposit(\'' + d.id + '\')">❌ TỪ CHỐI</button>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;
    var badge = document.getElementById('pendBadge');
    if (badge) { badge.textContent = deps.length; badge.style.display = 'inline-block'; }
  });
}

function approveDeposit(id) {
  if (!confirm('Xác nhận ĐÃ NHẬN ĐƯỢC TIỀN?')) return;
  var s = getSession();
  api('deposit_approve', { email: s.email, password: s.password, id: id }).then(function(res) {
    if (res && res.success) {
      alert('✅ Đã duyệt! Số dư mới: ' + fmt(res.new_balance));
      renderAdminPending(); renderAdminUsers();
    } else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

function rejectDeposit(id) {
  var reason = prompt('Lý do từ chối:', 'Không hợp lệ');
  if (reason === null) return;
  var s = getSession();
  api('deposit_reject', { email: s.email, password: s.password, id: id, reason: reason }).then(function(res) {
    if (res && res.success) { alert('❌ Đã từ chối'); renderAdminPending(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

/* ============ 2. USERS ============ */
function renderAdminUsers() {
  var s = getSession(); if (!s) return;
  var el = document.getElementById('adminUsersView'); if (!el) return;

  api('user_list', { email: s.email, password: s.password }).then(function(res) {
    var list = (res && res.success) ? (res.users || []) : [];
    if (!list.length) { el.innerHTML = '<p style="text-align:center;color:#94a3b8">Không có user</p>'; return; }

    var html = '<p style="text-align:center;font-size:12px;color:#64748b;margin-bottom:8px">Tổng: <b>' + list.length + '</b> user</p>';
    list.forEach(function(u) {
      var exp = (u.key_expiry && Number(u.key_expiry) > 0) ? new Date(Number(u.key_expiry)).toLocaleDateString('vi-VN') : '—';
      var isAdm = (u.is_admin == 1);
      var balance = Number(u.balance) || 0;

      html += '<div class="adm-row">' +
        '<div class="r1"><b>' + esc(u.name || 'User') + '</b><span class="badge ' + (isAdm?'badge-admin':'badge-vip') + '">' + (isAdm?'👑 ADMIN':'👤 USER') + '</span></div>' +
        '<div class="info">📧 ' + esc(u.email) + '</div>' +
        '<div class="info">🌐 IP: <code>' + esc(u.ip||'—') + '</code></div>' +
        '<div class="info">💰 Số dư: <b style="color:#16a34a">' + fmt(balance) + '</b></div>' +
        '<div class="info">⏰ VIP: ' + exp + '</div>' +
        '<div class="acts">' +
          '<button class="b3" onclick="adminResetIP(\'' + esc(u.email) + '\')">🔄 Reset IP</button>' +
          '<button class="b4" onclick="adminAdjustBalance(\'' + esc(u.email) + '\',' + balance + ')">💵 Cấp tiền</button>' +
          (!isAdm ? '<button class="b5" onclick="adminDeleteUser(\'' + esc(u.email) + '\')">🗑 Xoá</button>' : '') +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  });
}

function adminResetIP(email) {
  if (!confirm('Reset IP cho ' + email + '?')) return;
  var s = getSession();
  api('user_reset_ip', { email: s.email, password: s.password, target_email: email }).then(function(res) {
    if (res && res.success) { alert('✅ Đã reset'); renderAdminUsers(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

function adminAdjustBalance(email, currentBal) {
  var input = prompt('👤 ' + email + '\n💰 Số dư: ' + fmt(currentBal) + '\n\nNhập số tiền CẤP (âm để trừ):', '10000');
  if (input === null) return;
  var delta = Number(input);
  if (isNaN(delta) || delta === 0) return alert('Số không hợp lệ');
  if (currentBal + delta < 0) return alert('Số dư âm!');
  if (!confirm('CẤP ' + (delta>0?'+':'') + fmt(delta) + ' cho ' + email + '?')) return;

  var s = getSession();
  api('admin_set_balance', { email: s.email, password: s.password, target_email: email, amount: delta }).then(function(res) {
    if (res && res.success) { alert('✅ Đã cấp! Số dư mới: ' + fmt(res.new_balance)); renderAdminUsers(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

function adminDeleteUser(email) {
  if (!confirm('XOÁ user ' + email + '?')) return;
  var s = getSession();
  api('user_delete', { email: s.email, password: s.password, target_email: email }).then(function(res) {
    if (res && res.success) { alert('✅ Đã xoá'); renderAdminUsers(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

/* ============ 3. TOOLS ============ */
function renderAdminTools() {
  var el = document.getElementById('adminToolsView'); if (!el) return;
  var ports = window.CONFIG.ports || [];
  var bank = window.CONFIG.bank || {};
  var logo = window.CONFIG.logo || '';
  var avatar = window.CONFIG.avatar || '';

  var html = '<div class="adm-section" style="border-color:#93c5fd;background:#eff6ff">' +
    '<h4>⚙️ CẤU HÌNH</h4>' +
    '<label style="font-size:11px;font-weight:700">Tên Site</label>' +
    '<input class="adm-input" id="cfgSiteName" value="' + esc(window.CONFIG.site_name||'') + '">' +
    '<label style="font-size:11px;font-weight:700">Chữ chạy</label>' +
    '<input class="adm-input" id="cfgMarquee" value="' + esc(window.CONFIG.marquee||'') + '">' +
    '<label style="font-size:11px;font-weight:700">Footer</label>' +
    '<input class="adm-input" id="cfgFooter" value="' + esc(window.CONFIG.footer||'') + '">' +
    '<label style="font-size:11px;font-weight:700">🎵 URL nhạc nền</label>' +
    '<input class="adm-input" id="cfgMusicUrl" value="' + esc(window.CONFIG.music_url||'') + '" placeholder="https://.../music.mp3">' +
    '<button class="adm-btn" style="padding:6px;font-size:11px;background:#10b981;margin-top:6px" onclick="testMusic()">▶️ Nghe thử nhạc</button>' +
    '<div style="background:#fff;border-radius:10px;padding:10px;margin-top:10px;border:1px solid #bfdbfe">' +
      '<div style="font-size:12px;font-weight:800;color:#1e40af;margin-bottom:8px">🖼️ LOGO</div>' +
      '<input type="file" id="cfgLogoFile" accept="image/*" class="adm-input" style="padding:5px;font-size:11px">' +
      (logo ? '<div style="text-align:center;margin-top:6px"><img src="' + logo + '" style="max-width:80px;border-radius:50%"></div>' : '') +
    '</div>' +
    '<div style="background:#fff;border-radius:10px;padding:10px;margin-top:10px;border:1px solid #bfdbfe">' +
      '<div style="font-size:12px;font-weight:800;color:#1e40af;margin-bottom:8px">🏦 BANK + QR</div>' +
      '<label style="font-size:11px;font-weight:700">Tên NH</label>' +
      '<input class="adm-input" id="cfgBankName" value="' + esc(bank.name||'') + '">' +
      '<label style="font-size:11px;font-weight:700">STK</label>' +
      '<input class="adm-input" id="cfgBankAcc" value="' + esc(bank.account||'') + '">' +
      '<label style="font-size:11px;font-weight:700">Chủ TK</label>' +
      '<input class="adm-input" id="cfgBankOwner" value="' + esc(bank.owner||'') + '">' +
      '<label style="font-size:11px;font-weight:700">Ảnh QR</label>' +
      '<input type="file" id="cfgQRFile" accept="image/*" class="adm-input" style="padding:5px;font-size:11px">' +
      (bank.qr ? '<div style="text-align:center;margin-top:6px"><img src="' + bank.qr + '" style="max-width:100px;border-radius:8px"></div>' : '') +
    '</div>' +
    '<button class="adm-btn" style="background:linear-gradient(135deg,#22c55e,#16a34a);margin-top:12px;padding:14px;font-size:14px" onclick="saveSiteConfig()">💾 LƯU CẤU HÌNH</button>' +
  '</div>';

  html += '<div class="adm-section">' +
    '<h4>➕ THÊM TOOL MỚI</h4>' +
    '<input class="adm-input" id="ntName" placeholder="Tên tool">' +
    '<select class="adm-input" id="ntCat"><option value="taixiu">🎲 Tài Xỉu</option><option value="sicbo">🎰 Sicbo</option><option value="baccarat">🃏 Baccarat</option></select>' +
    '<select class="adm-input" id="ntKind"><option value="view">👁 View</option><option value="panel">📊 Panel</option></select>' +
    '<input class="adm-input" id="ntGameUrl" placeholder="URL Game">' +
    '<input class="adm-input" id="ntApiUrl" placeholder="API URL">' +
    '<input class="adm-input" id="ntSort" type="number" value="99" placeholder="Thứ tự">' +
    '<input type="file" id="ntImage" accept="image/*" class="adm-input" style="padding:5px">' +
    '<button class="adm-btn" style="background:linear-gradient(135deg,#22c55e,#16a34a)" onclick="addNewTool()">➕ THÊM</button>' +
  '</div>';

  html += '<p style="text-align:center;font-size:12px;color:#64748b;margin:14px 0 8px">📦 Tổng: <b>' + ports.length + '</b> tool</p>';

  ports.forEach(function(t, i) {
    var img = getToolImage(t);
    var badges = [];
    if (t.hot == 1) badges.push('🔥');
    if (t.is_new == 1) badges.push('✨');
    if (t.vip == 1) badges.push('👑');
    if (t.maintenance == 1) badges.push('🚧');
    if (!t.enabled) badges.push('❌');

    html += '<div class="adm-row" style="' + (t.maintenance==1?'opacity:.65':'') + '">' +
      '<div style="display:flex;gap:10px;align-items:center">' +
        '<div style="width:44px;height:44px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' +
          (img ? '<img src="' + img + '" style="width:100%;height:100%;object-fit:cover">' : '<i class="fa-solid fa-cube" style="color:#a855f7"></i>') +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:800;font-size:13px">' + esc(t.name) + ' ' + badges.join(' ') + '</div>' +
          '<div class="info" style="font-size:11px">📁 ' + esc(t.cat||'') + ' • ' + esc(t.kind||'') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="acts">' +
        '<button class="b2" onclick="editTool(' + i + ')">✏️ Sửa</button>' +
        '<button class="b3" onclick="toggleTool(' + i + ',\'enabled\')">' + (t.enabled?'🚫 Tắt':'✅ Bật') + '</button>' +
        '<button class="b4" onclick="toggleTool(' + i + ',\'maintenance\')">' + (t.maintenance?'🔧 Mở':'🚧 Bảo trì') + '</button>' +
        '<button class="b5" onclick="deleteTool(' + i + ')">🗑 Xoá</button>' +
      '</div>' +
    '</div>';
  });

  el.innerHTML = html;
}

function saveSiteConfig() {
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  window.CONFIG.site_name = val('cfgSiteName') || 'TOOL';
  window.CONFIG.marquee = val('cfgMarquee');
  window.CONFIG.footer = val('cfgFooter');
  window.CONFIG.music_url = val('cfgMusicUrl');

  window.CONFIG.bank = window.CONFIG.bank || {};
  window.CONFIG.bank.name = val('cfgBankName');
  window.CONFIG.bank.account = val('cfgBankAcc');
  window.CONFIG.bank.owner = val('cfgBankOwner');

  var logoFile = document.getElementById('cfgLogoFile').files[0];
  var qrFile = document.getElementById('cfgQRFile').files[0];

  var chain = Promise.resolve();
  if (logoFile) chain = chain.then(function() { return fileToBase64(logoFile, 300, 0.85).then(function(b64) { if (b64) window.CONFIG.logo = b64; }); });
  if (qrFile) chain = chain.then(function() { return fileToBase64(qrFile, 600, 0.85).then(function(b64) { if (b64) window.CONFIG.bank.qr = b64; }); });

  chain.then(function() {
    var s = getSession();
    api('config_save', { email: s.email, password: s.password, config: window.CONFIG }).then(function(res) {
      if (res && res.success) {
        alert('✅ ĐÃ LƯU CẤU HÌNH!');
        if (typeof applyLoginBranding === 'function') applyLoginBranding();
        if (typeof buildBankInfo === 'function') buildBankInfo();
        if (typeof applyMusic === 'function') applyMusic();
        renderAdminTools();
      } else alert('❌ ' + ((res && res.error) || 'Lỗi'));
    });
  });
}

function testMusic() {
  var urlEl = document.getElementById('cfgMusicUrl');
  var url = urlEl ? urlEl.value.trim() : '';
  if (!url) return alert('Nhập URL nhạc trước!');
  var audio = new Audio(url);
  audio.volume = 0.5;
  audio.play().then(function() {
    alert('▶️ Đang phát thử 10 giây...');
    setTimeout(function() { audio.pause(); }, 10000);
  }).catch(function(e) { alert('❌ Không phát được nhạc!'); });
}

function addNewTool() {
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  var name = val('ntName');
  if (!name) return alert('Nhập tên tool!');

  var imgFile = document.getElementById('ntImage').files[0];
  var chain = imgFile ? fileToBase64(imgFile, 200, 0.85) : Promise.resolve('');

  chain.then(function(image) {
    var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    var newTool = {
      name: name, slug: slug,
      cat: val('ntCat') || 'taixiu',
      kind: val('ntKind') || 'view',
      game_url: val('ntGameUrl'),
      api_url: val('ntApiUrl'),
      image: image || '',
      hot: 0, vip: 1, is_new: 1, enabled: 1, maintenance: 0,
      sort: parseInt(val('ntSort')) || 99
    };
    window.CONFIG.ports = window.CONFIG.ports || [];
    window.CONFIG.ports.push(newTool);

    var s = getSession();
    api('config_save', { email: s.email, password: s.password, config: window.CONFIG }).then(function(res) {
      if (res && res.success) {
        alert('✅ Đã thêm tool!');
        renderAdminTools();
        if (typeof buildCatTabs === 'function') buildCatTabs();
        if (typeof buildPorts === 'function') buildPorts();
      } else {
        window.CONFIG.ports.pop();
        alert('❌ ' + ((res && res.error) || 'Lỗi'));
      }
    });
  });
}

function editTool(idx) {
  var t = window.CONFIG.ports[idx];
  if (!t) return;
  var name = prompt('Tên:', t.name); if (name === null) return;
  var gameUrl = prompt('URL Game:', t.game_url || ''); if (gameUrl === null) return;
  var apiUrl = prompt('API URL:', t.api_url || ''); if (apiUrl === null) return;

  t.name = name.trim() || t.name;
  t.game_url = gameUrl.trim();
  t.api_url = apiUrl.trim();

  var s = getSession();
  api('config_save', { email: s.email, password: s.password, config: window.CONFIG }).then(function(res) {
    if (res && res.success) { alert('✅ Đã sửa'); renderAdminTools(); if (typeof buildPorts === 'function') buildPorts(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

function toggleTool(idx, field) {
  var t = window.CONFIG.ports[idx];
  if (!t) return;
  t[field] = t[field] ? 0 : 1;
  var s = getSession();
  api('config_save', { email: s.email, password: s.password, config: window.CONFIG }).then(function(res) {
    if (res && res.success) { renderAdminTools(); if (typeof buildPorts === 'function') buildPorts(); }
  });
}

function deleteTool(idx) {
  var t = window.CONFIG.ports[idx];
  if (!t) return;
  if (!confirm('Xoá tool "' + t.name + '"?')) return;
  window.CONFIG.ports.splice(idx, 1);
  var s = getSession();
  api('config_save', { email: s.email, password: s.password, config: window.CONFIG }).then(function(res) {
    if (res && res.success) { alert('✅ Đã xoá'); renderAdminTools(); if (typeof buildPorts === 'function') buildPorts(); }
  });
}

/* ============ 4. KEYS ============ */
function renderAdminKeys() {
  var s = getSession(); if (!s) return;
  var el = document.getElementById('adminKeysView'); if (!el) return;

  api('key_list', { email: s.email, password: s.password }).then(function(res) {
    var keys = (res && res.success) ? (res.keys || []) : [];

    var html = '<div class="adm-section">' +
      '<h4>🔑 TẠO KEY</h4>' +
      '<input class="adm-input" id="keyDays" type="number" value="30" placeholder="Số ngày">' +
      '<input class="adm-input" id="keyQty" type="number" value="1" placeholder="Số lượng">' +
      '<input class="adm-input" id="keyNote" placeholder="Ghi chú">' +
      '<button class="adm-btn" style="background:linear-gradient(135deg,#22c55e,#16a34a)" onclick="adminGenKeys()">➕ TẠO KEY</button>' +
    '</div>';

    html += '<p style="text-align:center;font-size:12px;color:#64748b;margin:14px 0 8px">📦 Tổng: <b>' + keys.length + '</b> key</p>';

    keys.forEach(function(k) {
      var used = (k.used == 1);
      html += '<div class="adm-row" style="border-left:3px solid ' + (used?'#ef4444':'#22c55e') + '">' +
        '<div style="display:flex;justify-content:space-between;gap:8px">' +
          '<b style="font-family:monospace;color:#0284c7;font-size:13px;word-break:break-all">' + esc(k.code) + '</b>' +
          '<span style="font-size:11px;color:' + (used?'#ef4444':'#16a34a') + '">' + (used?'🔴 ĐÃ DÙNG':'🟢 CHƯA DÙNG') + '</span>' +
        '</div>' +
        '<div class="info">⏱ ' + k.days + ' ngày</div>' +
        (k.used_by ? '<div class="info">👤 ' + esc(k.used_by) + '</div>' : '') +
        '<div class="acts"><button class="b5" onclick="adminDelKey(\'' + esc(k.code) + '\')">🗑 Xoá</button></div>' +
      '</div>';
    });
    el.innerHTML = html;
  });
}

function adminGenKeys() {
  var days = parseInt(document.getElementById('keyDays').value) || 30;
  var qty = Math.min(100, Math.max(1, parseInt(document.getElementById('keyQty').value) || 1));
  var note = document.getElementById('keyNote').value.trim();
  if (!confirm('Tạo ' + qty + ' key loại ' + days + ' ngày?')) return;
  var s = getSession();
  api('key_create', { email: s.email, password: s.password, days: days, qty: qty, note: note }).then(function(res) {
    if (res && res.success) {
      alert('✅ Đã tạo ' + (res.keys||[]).length + ' key:\n\n' + (res.keys||[]).join('\n'));
      renderAdminKeys();
    } else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

function adminDelKey(code) {
  if (!confirm('Xoá key ' + code + '?')) return;
  var s = getSession();
  api('key_delete', { email: s.email, password: s.password, code: code }).then(function(res) {
    if (res && res.success) { alert('✅ Đã xoá'); renderAdminKeys(); }
    else alert('❌ ' + ((res && res.error) || 'Lỗi'));
  });
}

/* ============ 5. LỊCH SỬ ============ */
function renderAdminHistory() {
  var s = getSession(); if (!s) return;
  var el = document.getElementById('adminHistoryView'); if (!el) return;

  api('history', { email: s.email, password: s.password }).then(function(res) {
    var hist = (res && res.success) ? (res.history || []) : [];
    if (!hist.length) { el.innerHTML = '<p style="text-align:center;color:#94a3b8">Chưa có giao dịch</p>'; return; }

    var html = '<p style="text-align:center;font-size:12px;color:#64748b;margin-bottom:8px">' + Math.min(hist.length, 100) + ' / ' + hist.length + '</p>';
    hist.slice(0, 100).forEach(function(h) {
      var amt = Number(h.amount) || 0;
      var color = amt > 0 ? '#16a34a' : (amt < 0 ? '#dc2626' : '#3b5bfd');
      var sign = amt > 0 ? '+' : '';
      var time = new Date(Number(h.at)).toLocaleString('vi-VN');
      html += '<div class="adm-row" style="border-left:3px solid ' + color + '">' +
        '<div><b>' + esc((h.type||'').toUpperCase()) + '</b> — ' + esc(h.note||'') + '</div>' +
        (amt ? '<div style="font-size:12px">Số tiền: <b style="color:' + color + '">' + sign + fmt(amt) + '</b></div>' : '') +
        '<div style="font-size:11px;color:#94a3b8">🕐 ' + time + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  });
}

/* ============ EXPOSE ============ */
window.openAdmin = openAdmin;
window.switchAdminTab = switchAdminTab;
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.adminResetIP = adminResetIP;
window.adminAdjustBalance = adminAdjustBalance;
window.adminDeleteUser = adminDeleteUser;
window.addNewTool = addNewTool;
window.editTool = editTool;
window.toggleTool = toggleTool;
window.deleteTool = deleteTool;
window.saveSiteConfig = saveSiteConfig;
window.testMusic = testMusic;
window.adminGenKeys = adminGenKeys;
window.adminDelKey = adminDelKey;
window.fileToBase64 = fileToBase64;
