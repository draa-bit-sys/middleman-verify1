/* ============================
   MIDDLEMAN VERIFY - script.js
   Terkoneksi ke Backend Railway
   ============================ */

const API_BASE = "https://middleman-verify1-production.up.railway.app";

/* ---------- STATE ---------- */
let currentUser  = null;
let selectedStar = 0;

/* ---------- SEARCH ---------- */
async function searchMM() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;

  document.getElementById('mainContent').style.display = 'block';
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
  } catch (err) {
    renderUnknown(q);
  }
}

document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchMM();
});

/* ---------- RENDER PROFILE DARI API ---------- */
function renderProfileFromAPI(d) {
  currentUser = d;

  const trust        = d.trust || {};
  const score        = trust.score || 0;
  const totalReports = trust.total_reports || 0;

  document.getElementById('avatarEl').textContent    = d.username.substring(0, 2).toUpperCase();
  document.getElementById('profileName').textContent = d.username;
  document.getElementById('profileMeta').textContent = d.platform + ' · Bergabung ' + d.joined_year;

  const badge = document.getElementById('profileBadge');
  if (score >= 80)      { badge.className = 'profile-badge badge-safe';   badge.textContent = 'TRUSTED'; }
  else if (score >= 50) { badge.className = 'profile-badge badge-warn';   badge.textContent = 'WASPADA'; }
  else                  { badge.className = 'profile-badge badge-danger'; badge.textContent = 'BERBAHAYA'; }

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
  const col = score >= 80 ? '#00ff88' : score >= 50 ? '#ffaa00' : '#ff3366';
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
  const bl = document.getElementById('barList');
  bl.innerHTML = Object.entries(factors).map(function([label, val]) {
    const color = val >= 70 ? '#00ff88' : val >= 40 ? '#ffaa00' : '#ff3366';
    return '<div class="bar-row">'
      + '<div class="bar-label">' + label + '</div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + val + '%;background:' + color + ';"></div></div>'
      + '<div class="bar-val">' + val + '</div>'
      + '</div>';
  }).join('');

  loadReviews(d.username);
  switchTab('reviews');
}

/* ---------- RENDER UNKNOWN ---------- */
function renderUnknown(name) {
  currentUser = { username: name };

  document.getElementById('avatarEl').textContent     = '?';
  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileMeta').textContent  = 'Akun tidak terdaftar dalam database';

  const badge = document.getElementById('profileBadge');
  badge.className = 'profile-badge badge-unknown';
  badge.textContent = 'TIDAK DIKENAL';

  document.getElementById('alertBox').style.display = 'flex';
  document.getElementById('alertText').textContent  =
    'Username ini belum terdaftar. Tidak ada data transaksi tersedia. Lanjutkan dengan sangat hati-hati.';

  const arcEl = document.getElementById('trustArc');
  arcEl.style.strokeDashoffset = 289;
  arcEl.setAttribute('stroke', '#555566');
  document.getElementById('trustNumber').textContent = '?';
  document.getElementById('trustNumber').style.color = '#555566';
  document.getElementById('trustDesc').textContent   = 'Data tidak tersedia';

  ['metTx', 'metSuccess', 'metReports', 'metJoined'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });

  document.getElementById('barList').innerHTML =
    '<div style="font-size:12px;color:#555566;padding:8px 0;">Tidak ada data histori untuk akun ini.</div>';

  renderReviews([]);
}

/* ---------- LOAD REVIEWS DARI API ---------- */
async function loadReviews(username) {
  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(username)}/reviews`);
    if (res.ok) {
      const reviews = await res.json();
      renderReviews(reviews);
    }
  } catch (err) {
    renderReviews([]);
  }
}

/* ---------- RENDER REVIEWS ---------- */
function renderReviews(reviews) {
  const rl = document.getElementById('reviewsList');
  if (!reviews.length) {
    rl.innerHTML = '<div style="font-size:12px;color:#555566;padding:8px 0;">Belum ada review.</div>';
    return;
  }
  rl.innerHTML = reviews.map(function(r) {
    const stars = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    const date  = r.created_at
      ? new Date(r.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
      : '';
    return '<div class="review-item">'
      + '<div class="review-header">'
      +   '<span class="review-user">@' + r.reviewer_name + '</span>'
      +   '<span class="review-date">' + date + '</span>'
      + '</div>'
      + '<div class="review-stars">' + stars + '</div>'
      + '<div class="review-text">' + r.comment + '</div>'
      + '</div>';
  }).join('');
}

/* ---------- TABS ---------- */
function switchTab(name) {
  const tabs = ['reviews', 'addreview', 'report'];
  document.querySelectorAll('.tab').forEach(function(t, i) {
    t.classList.toggle('active', tabs[i] === name);
  });
  document.querySelectorAll('.panel').forEach(function(p) {
    p.classList.remove('active');
  });
  document.getElementById('panel-' + name).classList.add('active');
}

/* ---------- STAR RATING ---------- */
function setStar(n) {
  selectedStar = n;
  document.querySelectorAll('.star-btn').forEach(function(b, i) {
    b.classList.toggle('active', i < n);
  });
}

/* ---------- SUBMIT REVIEW ke API ---------- */
async function submitReview() {
  const user    = document.getElementById('rvUser').value.trim();
  const comment = document.getElementById('rvComment').value.trim();

  if (!user || !selectedStar || !comment) {
    alert('Lengkapi semua field terlebih dahulu.');
    return;
  }
  if (!currentUser || !currentUser.username) {
    alert('Cari middleman dulu sebelum memberi review.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_name: user.replace('@',''), stars: selectedStar, comment: comment })
    });
    if (res.ok) {
      document.getElementById('rvSuccess').style.display = 'block';
      setTimeout(function() { document.getElementById('rvSuccess').style.display = 'none'; }, 2500);
      loadReviews(currentUser.username);
    } else {
      alert('Gagal mengirim review. Coba lagi.');
    }
  } catch (err) {
    alert('Koneksi gagal. Coba lagi.');
  }

  document.getElementById('rvUser').value    = '';
  document.getElementById('rvComment').value = '';
  selectedStar = 0;
  document.querySelectorAll('.star-btn').forEach(function(b) { b.classList.remove('active'); });
}

/* ---------- SUBMIT REPORT ke API ---------- */
async function submitReport() {
  const user    = document.getElementById('rpUser').value.trim();
  const type    = document.getElementById('rpType').value;
  const nominal = document.getElementById('rpNominal').value;
  const detail  = document.getElementById('rpDetail').value.trim();

  if (!user || !type || !detail) {
    alert('Lengkapi semua field terlebih dahulu.');
    return;
  }
  if (!currentUser || !currentUser.username) {
    alert('Cari middleman dulu sebelum melaporkan.');
    return;
  }

  try {
    const body = { reporter_name: user.replace('@',''), report_type: type, detail: detail };
    if (nominal) body.nominal_loss = parseFloat(nominal);

    const res = await fetch(`${API_BASE}/middlemen/${encodeURIComponent(currentUser.username)}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      document.getElementById('rpSuccess').style.display = 'block';
      setTimeout(function() { document.getElementById('rpSuccess').style.display = 'none'; }, 3000);
    } else {
      alert('Gagal mengirim laporan. Coba lagi.');
    }
  } catch (err) {
    alert('Koneksi gagal. Coba lagi.');
  }

  document.getElementById('rpUser').value    = '';
  document.getElementById('rpType').value    = '';
  document.getElementById('rpNominal').value = '';
  document.getElementById('rpDetail').value  = '';
}
