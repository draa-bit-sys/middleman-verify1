/* ============================
   MIDDLECHECK - script.js
   Connected to Railway Backend
   ============================ */

const API_BASE = "https://middleman-verify1-production.up.railway.app";

let currentUser   = null;
let selectedStar  = 0;
let allMiddlemen  = [];
let debounceTimer = null;

/* ============================================================
   NAVIGATION
   ============================================================ */
function enterApp() {
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'flex';
  loadAllMiddlemen();
}

function backToLanding() {
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('landingPage').style.display = 'block';
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
}

/* ============================================================
   LOAD ALL MIDDLEMEN (untuk autocomplete)
   ============================================================ */
async function loadAllMiddlemen() {
  try {
    const res = await fetch(`${API_BASE}/middlemen/?limit=200`);
    if (res.ok) allMiddlemen = await res.json();
  } catch(e) {}
}

/* ============================================================
   AUTOCOMPLETE SUGGESTION
   ============================================================ */
function showSuggestions(q) {
  const box = document.getElementById('suggestionBox');
  if (!q || q.length < 1) { box.style.display = 'none'; return; }

  const matches = allMiddlemen
    .filter(m => m.username.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 6);

  if (!matches.length) { box.style.display = 'none'; return; }

  box.innerHTML = matches.map(m => {
    const trust    = m.trust || {};
    const score    = trust.score || 0;
    const label    = trust.label || '—';
    const badgeCls = score >= 80 ? 'sug-badge-safe' : score >= 50 ? 'sug-badge-warn' : 'sug-badge-danger';
    const hl = m.username.replace(new RegExp('(' + q + ')', 'gi'), '<strong>$1</strong>');
    return '<div class="sug-item" onclick="selectSuggestion(\'' + m.username + '\')">'
      + '<div class="sug-left">'
      + '<div class="sug-avatar">' + m.username.substring(0,2).toUpperCase() + '</div>'
      + '<div>'
      + '<div class="sug-name">' + hl + '</div>'
      + '<div class="sug-meta">' + m.platform + '</div>'
      + '</div></div>'
      + '<span class="sug-badge ' + badgeCls + '">' + label + '</span>'
      + '</div>';
  }).join('');

  box.style.display = 'block';
}

function selectSuggestion(username) {
  document.getElementById('searchInput').value = username;
  document.getElementById('suggestionBox').style.display = 'none';
  searchMM();
}

document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('searchInput');

  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    const q = this.value.trim();
    debounceTimer = setTimeout(() => showSuggestions(q), 200);
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('suggestionBox').style.display = 'none';
      searchMM();
    }
    if (e.key === 'Escape') {
      document.getElementById('suggestionBox').style.display = 'none';
    }
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrap')) {
      document.getElementById('suggestionBox').style.display = 'none';
    }
  });
});

/* ============================================================
   SEARCH
   ============================================================ */
async function searchMM() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;

  document.getElementById('suggestionBox').style.display = 'none';
  document.getElementById('mainContent').style.display   = 'none';
  document.getElementById('emptyState').style.display    = 'none';

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(q)}`);
    if (res.status === 404) {
      renderUnknown(q);
    } else if (res.ok) {
      renderProfileFromAPI(await res.json());
    } else {
      renderUnknown(q);
    }
  } catch(err) {
    renderUnknown(q);
  }

  document.getElementById('mainContent').style.display = 'block';
}

/* ============================================================
   RENDER PROFILE
   ============================================================ */
function renderProfileFromAPI(d) {
  currentUser = d;

  const trust        = d.trust || {};
  const score        = trust.score || 0;
  const totalReports = trust.total_reports || 0;

  document.getElementById('avatarEl').textContent    = d.username.substring(0,2).toUpperCase();
  document.getElementById('profileName').textContent = d.username;
  document.getElementById('profileMeta').textContent = d.platform + ' · Bergabung ' + d.joined_year;

  const badge = document.getElementById('profileBadge');
  if (score >= 80)      { badge.className = 'badge badge-safe';   badge.textContent = 'TRUSTED'; }
  else if (score >= 50) { badge.className = 'badge badge-warn';   badge.textContent = 'WASPADA'; }
  else                  { badge.className = 'badge badge-danger'; badge.textContent = 'BERBAHAYA'; }

  const alertBox = document.getElementById('alertBox');
  alertBox.style.display = totalReports > 3 ? 'flex' : 'none';
  if (totalReports > 3) {
    document.getElementById('alertText').textContent =
      'Akun ini memiliki ' + totalReports + ' laporan penipuan aktif. Sangat disarankan untuk TIDAK melakukan transaksi.';
  }

  const arc    = 289;
  const offset = arc - (arc * score / 100);
  const arcEl  = document.getElementById('trustArc');
  arcEl.style.strokeDashoffset = offset;
  const col = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  arcEl.setAttribute('stroke', col);
  document.getElementById('trustNumber').textContent = score;
  document.getElementById('trustNumber').style.color = col;

  const desc = score >= 80 ? 'Aman untuk bertransaksi'
    : score >= 50 ? 'Perlu kehati-hatian ekstra' : 'Risiko sangat tinggi';
  document.getElementById('trustDesc').textContent = desc;

  document.getElementById('metTx').textContent      = (trust.total_tx || 0) + 'x';
  document.getElementById('metSuccess').textContent = (trust.success_rate || 0) + '%';
  document.getElementById('metReports').textContent = totalReports + ' laporan';
  document.getElementById('metJoined').textContent  = d.joined_year;

  const factors = trust.factors || {};
  document.getElementById('barList').innerHTML = Object.entries(factors).map(function([label, val]) {
    const color = val >= 70 ? '#22c55e' : val >= 40 ? '#f59e0b' : '#ef4444';
    return '<div class="bar-row">'
      + '<div class="bar-label">' + label + '</div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + val + '%;background:' + color + ';"></div></div>'
      + '<div class="bar-val">' + val + '</div>'
      + '</div>';
  }).join('');

  loadReviews(d.username);
  switchTab('reviews');
}

/* ============================================================
   RENDER UNKNOWN
   ============================================================ */
function renderUnknown(name) {
  currentUser = { username: name };

  document.getElementById('avatarEl').textContent     = '?';
  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileMeta').textContent  = 'Akun tidak terdaftar dalam database';

  const badge = document.getElementById('profileBadge');
  badge.className   = 'badge badge-unknown';
  badge.textContent = 'TIDAK DIKENAL';

  document.getElementById('alertBox').style.display = 'flex';
  document.getElementById('alertText').textContent  =
    'Username ini belum terdaftar. Lanjutkan dengan sangat hati-hati.';

  const arcEl = document.getElementById('trustArc');
  arcEl.style.strokeDashoffset = 289;
  arcEl.setAttribute('stroke', '#94a3b8');
  document.getElementById('trustNumber').textContent = '?';
  document.getElementById('trustNumber').style.color = '#94a3b8';
  document.getElementById('trustDesc').textContent   = 'Data tidak tersedia';

  ['metTx','metSuccess','metReports','metJoined'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });

  document.getElementById('barList').innerHTML =
    '<p style="font-size:13px;color:#94a3b8;">Tidak ada data histori untuk akun ini.</p>';

  renderReviews([]);
}

/* ============================================================
   REVIEWS
   ============================================================ */
async function loadReviews(username) {
  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(username)}/reviews`);
    if (res.ok) renderReviews(await res.json());
  } catch(e) { renderReviews([]); }
}

function renderReviews(reviews) {
  const rl = document.getElementById('reviewsList');
  if (!reviews.length) {
    rl.innerHTML = '<p style="font-size:13px;color:#94a3b8;padding:8px 0;">Belum ada review.</p>';
    return;
  }
  rl.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    const date  = r.created_at
      ? new Date(r.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})
      : '';
    return '<div class="review-item">'
      + '<div class="review-header">'
      + '<span class="review-user">@' + r.reviewer_name + '</span>'
      + '<span class="review-date">' + date + '</span>'
      + '</div>'
      + '<div class="review-stars">' + stars + '</div>'
      + '<div class="review-text">' + r.comment + '</div>'
      + '</div>';
  }).join('');
}

/* ============================================================
   TABS & STARS
   ============================================================ */
function switchTab(name) {
  const tabs = ['reviews','addreview','report'];
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

function setStar(n) {
  selectedStar = n;
  document.querySelectorAll('.star-btn').forEach((b,i) => b.classList.toggle('active', i < n));
}

/* ============================================================
   SUBMIT REVIEW
   ============================================================ */
async function submitReview() {
  const user    = document.getElementById('rvUser').value.trim();
  const comment = document.getElementById('rvComment').value.trim();
  if (!user || !selectedStar || !comment) { alert('Lengkapi semua field!'); return; }
  if (!currentUser || !currentUser.username) { alert('Cari middleman dulu!'); return; }

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reviews`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ reviewer_name: user.replace('@',''), stars: selectedStar, comment })
    });
    if (res.ok) {
      showMsg('rvSuccess', '✓ Review berhasil dikirim!');
      loadReviews(currentUser.username);
      document.getElementById('rvUser').value    = '';
      document.getElementById('rvComment').value = '';
      selectedStar = 0;
      document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    } else { alert('Gagal mengirim review.'); }
  } catch(e) { alert('Koneksi gagal.'); }
}

/* ============================================================
   SUBMIT REPORT
   ============================================================ */
async function submitReport() {
  const user    = document.getElementById('rpUser').value.trim();
  const type    = document.getElementById('rpType').value;
  const nominal = document.getElementById('rpNominal').value;
  const detail  = document.getElementById('rpDetail').value.trim();
  if (!user || !type || !detail) { alert('Lengkapi semua field!'); return; }
  if (!currentUser || !currentUser.username) { alert('Cari middleman dulu!'); return; }

  try {
    const body = { reporter_name: user.replace('@',''), report_type: type, detail };
    if (nominal) body.nominal_loss = parseFloat(nominal);
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reports`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    if (res.ok) {
      showMsg('rpSuccess', '✓ Laporan diterima. Tim kami akan meninjau dalam 24 jam.');
      document.getElementById('rpUser').value    = '';
      document.getElementById('rpType').value    = '';
      document.getElementById('rpNominal').value = '';
      document.getElementById('rpDetail').value  = '';
    } else { alert('Gagal mengirim laporan.'); }
  } catch(e) { alert('Koneksi gagal.'); }
}

/* ============================================================
   REGISTER MM
   ============================================================ */
async function registerMM() {
  const username    = document.getElementById('regUsername').value.trim();
  const platform    = document.getElementById('regPlatform').value.trim();
  const joined_year = document.getElementById('regYear').value.trim();
  const bio         = document.getElementById('regBio').value.trim();
  const contact     = document.getElementById('regContact').value.trim();

  if (!username || !platform || !joined_year) {
    showMsg('regError', '✗ Username, platform, dan tahun wajib diisi.'); return;
  }

  try {
    const res = await fetch(`${API_BASE}/middlemen/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, platform, joined_year, bio: bio || null, contact: contact || null })
    });
    if (res.status === 201) {
      showMsg('regSuccess', '✓ Middleman ' + username + ' berhasil didaftarkan!');
      document.getElementById('regUsername').value = '';
      document.getElementById('regPlatform').value = '';
      document.getElementById('regYear').value     = '';
      document.getElementById('regBio').value      = '';
      document.getElementById('regContact').value  = '';
      loadAllMiddlemen();
    } else if (res.status === 409) {
      showMsg('regError', '✗ Username sudah terdaftar di database.');
    } else {
      showMsg('regError', '✗ Gagal mendaftarkan. Coba lagi.');
    }
  } catch(e) {
    showMsg('regError', '✗ Koneksi gagal.');
  }
}

/* ============================================================
   UPDATE MM
   ============================================================ */
async function fetchForUpdate() {
  const username = document.getElementById('updUsername').value.trim();
  if (!username) { alert('Masukkan username dulu.'); return; }

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(username)}`);
    if (res.ok) {
      const d = await res.json();
      document.getElementById('updPlatform').value = d.platform || '';
      document.getElementById('updYear').value     = d.joined_year || '';
      document.getElementById('updBio').value      = d.bio || '';
      document.getElementById('updContact').value  = d.contact || '';
      document.getElementById('updateFields').style.display = 'block';
    } else {
      showMsg('updError', '✗ Username tidak ditemukan.');
      document.getElementById('updateFields').style.display = 'none';
    }
  } catch(e) { showMsg('updError', '✗ Koneksi gagal.'); }
}

async function updateMM() {
  const username = document.getElementById('updUsername').value.trim();
  const platform = document.getElementById('updPlatform').value.trim();
  const year     = document.getElementById('updYear').value.trim();
  const bio      = document.getElementById('updBio').value.trim();
  const contact  = document.getElementById('updContact').value.trim();

  const body = {};
  if (platform) body.platform    = platform;
  if (year)     body.joined_year = year;
  if (bio)      body.bio         = bio;
  if (contact)  body.contact     = contact;

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    if (res.ok) {
      showMsg('updSuccess', '✓ Profil ' + username + ' berhasil diperbarui!');
      document.getElementById('updateFields').style.display = 'none';
      document.getElementById('updUsername').value = '';
      loadAllMiddlemen();
    } else {
      showMsg('updError', '✗ Gagal update. Coba lagi.');
    }
  } catch(e) { showMsg('updError', '✗ Koneksi gagal.'); }
}

/* ============================================================
   HELPERS
   ============================================================ */
function showMsg(id, text) {
  const el = document.getElementById(id);
  el.textContent   = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
