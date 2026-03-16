/* ============================
   MIDDLEMAN VERIFY - script.js
   Terkoneksi ke Backend Railway
   ============================ */

const API_BASE = "https://middleman-verify1-production.up.railway.app";

let currentUser  = null;
let selectedStar = 0;
let allMiddlemen = []; // Store all middlemen for search suggestions
let debounceTimer;

/* ---- PAGE NAVIGATION ---- */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const navItems = document.querySelectorAll('.nav-item');
  const pages = ['landing','check','register','update'];
  const idx = pages.indexOf(name);
  if (idx >= 0 && navItems[idx]) navItems[idx].classList.add('active');
  closeSidebar();
  if (name === 'landing') loadStats();
}

/* ---- SIDEBAR (mobile) ---- */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ---- LOAD STATS ---- */
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/middlemen/`);
    if (res.ok) {
      const data = await res.json();
      allMiddlemen = data; // Store for search suggestions
      document.getElementById('statTotal').textContent = data.length;
    }
  } catch(e) {}
}

/* ---- SEARCH ---- */
async function searchMM() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;

  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('emptyState').style.display  = 'none';

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(q)}`);
    if (res.status === 404) {
      renderUnknown(q);
    } else if (res.ok) {
      const data = await res.json();
      renderProfileFromAPI(data);
    } else {
      renderUnknown(q);
    }
  } catch(err) {
    renderUnknown(q);
  }

  document.getElementById('mainContent').style.display = 'block';
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMM();
});

document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(showSuggestions, 300);
});

/* ---- SHOW SUGGESTIONS ---- */
function showSuggestions() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const suggestionsEl = document.getElementById('suggestions');
  if (!query) {
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = 'none';
    return;
  }

  const matches = allMiddlemen.filter(mm => mm.username.toLowerCase().includes(query)).slice(0, 5); // Limit to 5
  if (matches.length === 0) {
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = 'none';
    return;
  }

  suggestionsEl.innerHTML = matches.map(mm => `
    <div class="suggestion-item" onclick="selectSuggestion('${mm.username}')">
      <div class="suggestion-username">${mm.username}</div>
      <div class="suggestion-meta">${mm.platform} · Bergabung ${mm.joined_year}</div>
    </div>
  `).join('');
  suggestionsEl.style.display = 'block';
}

/* ---- SELECT SUGGESTION ---- */
function selectSuggestion(username) {
  document.getElementById('searchInput').value = username;
  document.getElementById('suggestions').style.display = 'none';
  searchMM();
}

/* ---- RENDER PROFILE ---- */
function renderProfileFromAPI(d) {
  currentUser = d;

  const trust        = d.trust || {};
  const score        = trust.score || 0;
  const totalReports = trust.total_reports || 0;

  document.getElementById('avatarEl').textContent    = d.username.substring(0,2).toUpperCase();
  document.getElementById('profileName').textContent = d.username;
  document.getElementById('profileMeta').textContent = d.platform + ' · Bergabung ' + d.joined_year;

  const badge = document.getElementById('profileBadge');
  if (score >= 80)      { badge.className = 'badge badge-safe';    badge.textContent = 'TRUSTED'; }
  else if (score >= 50) { badge.className = 'badge badge-warn';    badge.textContent = 'WASPADA'; }
  else                  { badge.className = 'badge badge-danger';  badge.textContent = 'BERBAHAYA'; }

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
  const col = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
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
  document.getElementById('barList').innerHTML = Object.entries(factors).map(([label, val]) => {
    const color = val >= 70 ? '#16a34a' : val >= 40 ? '#d97706' : '#dc2626';
    return `<div class="bar-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${val}%;background:${color};"></div></div>
      <div class="bar-val">${val}</div>
    </div>`;
  }).join('');

  loadReviews(d.username);
  switchTab('reviews');
}

/* ---- RENDER UNKNOWN ---- */
function renderUnknown(name) {
  currentUser = { username: name };

  document.getElementById('avatarEl').textContent     = '?';
  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileMeta').textContent  = 'Akun tidak terdaftar dalam database';

  const badge = document.getElementById('profileBadge');
  badge.className = 'badge badge-unknown';
  badge.textContent = 'TIDAK DIKENAL';

  document.getElementById('alertBox').style.display = 'flex';
  document.getElementById('alertText').textContent  =
    'Username ini belum terdaftar. Tidak ada data transaksi tersedia. Lanjutkan dengan sangat hati-hati.';

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

/* ---- LOAD & RENDER REVIEWS ---- */
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
    return `<div class="review-item">
      <div class="review-header">
        <span class="review-user">@${r.reviewer_name}</span>
        <span class="review-date">${date}</span>
      </div>
      <div class="review-stars">${stars}</div>
      <div class="review-text">${r.comment}</div>
    </div>`;
  }).join('');
}

/* ---- TABS ---- */
function switchTab(name) {
  const tabs = ['reviews','addreview','report'];
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

/* ---- STARS ---- */
function setStar(n) {
  selectedStar = n;
  document.querySelectorAll('.star-btn').forEach((b,i) => b.classList.toggle('active', i < n));
}

/* ---- SUBMIT REVIEW ---- */
async function submitReview() {
  const user    = document.getElementById('rvUser').value.trim();
  const comment = document.getElementById('rvComment').value.trim();
  if (!user || !selectedStar || !comment) { alert('Lengkapi semua field!'); return; }
  if (!currentUser?.username) { alert('Cari middleman dulu!'); return; }

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reviews`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ reviewer_name: user.replace('@',''), stars: selectedStar, comment })
    });
    if (res.ok) {
      showMsg('rvSuccess', '✅ Review berhasil ditambahkan!');
      loadReviews(currentUser.username);
      document.getElementById('rvUser').value = '';
      document.getElementById('rvComment').value = '';
      selectedStar = 0;
      document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    } else { alert('Gagal mengirim review.'); }
  } catch(e) { alert('Koneksi gagal.'); }
}

/* ---- SUBMIT REPORT ---- */
async function submitReport() {
  const user    = document.getElementById('rpUser').value.trim();
  const type    = document.getElementById('rpType').value;
  const nominal = document.getElementById('rpNominal').value;
  const detail  = document.getElementById('rpDetail').value.trim();
  if (!user || !type || !detail) { alert('Lengkapi semua field!'); return; }
  if (!currentUser?.username) { alert('Cari middleman dulu!'); return; }

  try {
    const body = { reporter_name: user.replace('@',''), report_type: type, detail };
    if (nominal) body.nominal_loss = parseFloat(nominal);
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reports`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    if (res.ok) {
      showMsg('rpSuccess', '✅ Laporan diterima. Tim kami akan meninjau dalam 24 jam.');
      document.getElementById('rpUser').value = '';
      document.getElementById('rpType').value = '';
      document.getElementById('rpNominal').value = '';
      document.getElementById('rpDetail').value = '';
    } else { alert('Gagal mengirim laporan.'); }
  } catch(e) { alert('Koneksi gagal.'); }
}

/* ---- REGISTER MM ---- */
async function registerMM() {
  const username    = document.getElementById('regUsername').value.trim();
  const platform    = document.getElementById('regPlatform').value.trim();
  const joined_year = document.getElementById('regYear').value.trim();
  const bio         = document.getElementById('regBio').value.trim();
  const contact     = document.getElementById('regContact').value.trim();

  if (!username || !platform || !joined_year) { alert('Lengkapi field yang wajib diisi (*)!'); return; }

  try {
    const res = await fetch(`${API_BASE}/middlemen/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, platform, joined_year, bio: bio || null, contact: contact || null })
    });
    if (res.status === 201) {
      showMsg('regSuccess', '✅ Middleman ' + username + ' berhasil didaftarkan!');
      hideMsg('regError');
      document.getElementById('regUsername').value = '';
      document.getElementById('regPlatform').value = '';
      document.getElementById('regYear').value = '';
      document.getElementById('regBio').value = '';
      document.getElementById('regContact').value = '';
    } else if (res.status === 409) {
      showMsg('regError', '❌ Username sudah terdaftar di database.');
      hideMsg('regSuccess');
    } else {
      showMsg('regError', '❌ Gagal mendaftarkan. Coba lagi.');
      hideMsg('regSuccess');
    }
  } catch(e) {
    showMsg('regError', '❌ Koneksi gagal. Coba lagi.');
    hideMsg('regSuccess');
  }
}

/* ---- LOAD MM FOR UPDATE ---- */
async function loadMMForUpdate() {
  const username = document.getElementById('updUsername').value.trim();
  if (!username) { alert('Masukkan username terlebih dahulu!'); return; }

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(username)}`);
    if (res.ok) {
      const d = await res.json();
      document.getElementById('updPlatform').value = d.platform || '';
      document.getElementById('updYear').value     = d.joined_year || '';
      document.getElementById('updBio').value      = d.bio || '';
      document.getElementById('updContact').value  = d.contact || '';
      document.getElementById('updateForm').style.display = 'block';
      hideMsg('updSuccess');
      hideMsg('updError');
    } else {
      alert('Middleman tidak ditemukan!');
      document.getElementById('updateForm').style.display = 'none';
    }
  } catch(e) { alert('Koneksi gagal.'); }
}

/* ---- UPDATE MM ---- */
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
      showMsg('updSuccess', '✅ Profil ' + username + ' berhasil diperbarui!');
      hideMsg('updError');
    } else {
      showMsg('updError', '❌ Gagal update. Coba lagi.');
      hideMsg('updSuccess');
    }
  } catch(e) {
    showMsg('updError', '❌ Koneksi gagal.');
    hideMsg('updSuccess');
  }
}

/* ---- HELPERS ---- */
function showMsg(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}
function hideMsg(id) {
  document.getElementById(id).style.display = 'none';
}

/* ---- INIT ---- */
loadStats();

// Close suggestions on click outside
document.addEventListener('click', e => {
  const searchBar = document.querySelector('.search-bar');
  if (!searchBar.contains(e.target)) {
    document.getElementById('suggestions').style.display = 'none';
  }
});
