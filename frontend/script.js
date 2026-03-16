/* ============================
   MIDDLEMAN VERIFY - script.js
   ============================ */

/* ---------- DATABASE (sample data) ---------- */
const DB = {
  "RajaMiddle99": {
    name: "RajaMiddle99",
    platform: "Tokopedia / Discord",
    joined: "2021",
    tx: 312,
    successRate: 98,
    reports: 1,
    score: 94,
    factors: [
      { label: "Histori Transaksi",   val: 97, color: "#00ff88" },
      { label: "Kecepatan Respons",   val: 91, color: "#00ff88" },
      { label: "Verifikasi Identitas",val: 88, color: "#00d4ff" },
      { label: "Laporan Negatif",     val: 96, color: "#00ff88" },
      { label: "Usia Akun",           val: 100,color: "#00ff88" },
    ],
    reviews: [
      { user: "@bintang_jaya",  date: "10 Mar 2026", stars: 5, text: "Cepat, aman, dan profesional. Sudah 5x pakai jasa ini." },
      { user: "@gamer_sultan",  date: "3 Mar 2026",  stars: 5, text: "Transaksi item game lancar banget. Recommended!" },
      { user: "@taufiq_id",     date: "20 Feb 2026", stars: 4, text: "Prosesnya sedikit lama tapi aman dan terpercaya." },
    ]
  },
  "MM_Gelap123": {
    name: "MM_Gelap123",
    platform: "Instagram / Telegram",
    joined: "2024",
    tx: 18,
    successRate: 61,
    reports: 7,
    score: 21,
    factors: [
      { label: "Histori Transaksi",   val: 30, color: "#ff3366" },
      { label: "Kecepatan Respons",   val: 55, color: "#ffaa00" },
      { label: "Verifikasi Identitas",val: 15, color: "#ff3366" },
      { label: "Laporan Negatif",     val: 12, color: "#ff3366" },
      { label: "Usia Akun",           val: 20, color: "#ff3366" },
    ],
    reviews: [
      { user: "@korban_01",   date: "8 Mar 2026", stars: 1, text: "SCAMMER! Uang 500rb dibawa kabur. Hati-hati!" },
      { user: "@anon_buyer",  date: "1 Mar 2026", stars: 1, text: "Tidak bisa dihubungi setelah transfer." },
    ]
  },
  "TrustMM_Budi": {
    name: "TrustMM_Budi",
    platform: "Kaskus / WhatsApp",
    joined: "2019",
    tx: 541,
    successRate: 99,
    reports: 0,
    score: 99,
    factors: [
      { label: "Histori Transaksi",   val: 99,  color: "#00ff88" },
      { label: "Kecepatan Respons",   val: 97,  color: "#00ff88" },
      { label: "Verifikasi Identitas",val: 100, color: "#00ff88" },
      { label: "Laporan Negatif",     val: 100, color: "#00ff88" },
      { label: "Usia Akun",           val: 100, color: "#00ff88" },
    ],
    reviews: [
      { user: "@seller_handal",  date: "12 Mar 2026", stars: 5, text: "Legend. Sudah 30+ transaksi. Tidak pernah mengecewakan." },
      { user: "@trusted_buyer",  date: "9 Mar 2026",  stars: 5, text: "Proses jelas, komunikasi lancar. Terbaik!" },
      { user: "@buyer_oke",      date: "5 Mar 2026",  stars: 5, text: "MM paling aman yang pernah saya pakai." },
    ]
  }
};

/* ---------- STATE ---------- */
let currentUser  = null;
let selectedStar = 0;

/* ---------- SEARCH ---------- */
function searchMM() {
  const q   = document.getElementById('searchInput').value.trim();
  if (!q) return;

  const key = Object.keys(DB).find(k => k.toLowerCase() === q.toLowerCase());
  if (key) {
    renderProfile(DB[key]);
  } else {
    renderUnknown(q);
  }

  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('emptyState').style.display  = 'none';
}

/* Enter key on search input */
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchMM();
});

/* ---------- RENDER PROFILE ---------- */
function renderProfile(d) {
  currentUser = d;

  /* avatar & info */
  document.getElementById('avatarEl').textContent  = d.name.substring(0, 2).toUpperCase();
  document.getElementById('profileName').textContent = d.name;
  document.getElementById('profileMeta').textContent = d.platform + ' · Bergabung ' + d.joined;

  /* badge */
  const badge = document.getElementById('profileBadge');
  if (d.score >= 80)      { badge.className = 'profile-badge badge-safe';    badge.textContent = 'TRUSTED'; }
  else if (d.score >= 50) { badge.className = 'profile-badge badge-warn';    badge.textContent = 'WASPADA'; }
  else                    { badge.className = 'profile-badge badge-danger';  badge.textContent = 'BERBAHAYA'; }

  /* alert box */
  const alertBox = document.getElementById('alertBox');
  alertBox.style.display = d.reports > 3 ? 'flex' : 'none';
  if (d.reports > 3) {
    document.getElementById('alertText').textContent =
      'Akun ini memiliki ' + d.reports + ' laporan penipuan aktif. Sangat disarankan untuk TIDAK melakukan transaksi.';
  }

  /* trust arc */
  const arc    = 289;
  const offset = arc - (arc * d.score / 100);
  const arcEl  = document.getElementById('trustArc');
  arcEl.style.strokeDashoffset = offset;
  const col = d.score >= 80 ? '#00ff88' : d.score >= 50 ? '#ffaa00' : '#ff3366';
  arcEl.setAttribute('stroke', col);
  document.getElementById('trustNumber').textContent = d.score;
  document.getElementById('trustNumber').style.color = col;

  /* trust label */
  const desc = d.score >= 80
    ? 'Aman untuk bertransaksi'
    : d.score >= 50
      ? 'Perlu kehati-hatian ekstra'
      : 'Risiko sangat tinggi';
  document.getElementById('trustDesc').textContent = desc;

  /* metrics */
  document.getElementById('metTx').textContent      = d.tx + 'x';
  document.getElementById('metSuccess').textContent = d.successRate + '%';
  document.getElementById('metReports').textContent = d.reports + ' laporan';
  document.getElementById('metJoined').textContent  = d.joined;

  /* factor bars */
  const bl = document.getElementById('barList');
  bl.innerHTML = d.factors.map(function(f) {
    return '<div class="bar-row">'
      + '<div class="bar-label">' + f.label + '</div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + f.val + '%;background:' + f.color + ';"></div></div>'
      + '<div class="bar-val">' + f.val + '</div>'
      + '</div>';
  }).join('');

  renderReviews(d.reviews);
  switchTab('reviews');
}

/* ---------- RENDER UNKNOWN ---------- */
function renderUnknown(name) {
  currentUser = { name: name, reviews: [] };

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

/* ---------- RENDER REVIEWS ---------- */
function renderReviews(reviews) {
  const rl = document.getElementById('reviewsList');
  if (!reviews.length) {
    rl.innerHTML = '<div style="font-size:12px;color:#555566;padding:8px 0;">Belum ada review.</div>';
    return;
  }
  rl.innerHTML = reviews.map(function(r) {
    const stars   = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    return '<div class="review-item">'
      + '<div class="review-header">'
      +   '<span class="review-user">' + r.user + '</span>'
      +   '<span class="review-date">' + r.date + '</span>'
      + '</div>'
      + '<div class="review-stars">' + stars + '</div>'
      + '<div class="review-text">' + r.text + '</div>'
      + '</div>';
  }).join('');
}

/* ---------- TABS ---------- */
function switchTab(name) {
  const tabs  = ['reviews', 'addreview', 'report'];
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

/* ---------- SUBMIT REVIEW ---------- */
function submitReview() {
  const user    = document.getElementById('rvUser').value.trim();
  const comment = document.getElementById('rvComment').value.trim();

  if (!user || !selectedStar || !comment) {
    alert('Lengkapi semua field terlebih dahulu.');
    return;
  }

  /* add to DB if known account */
  if (currentUser && DB[currentUser.name]) {
    const today   = new Date();
    const months  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const dateStr = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();
    DB[currentUser.name].reviews.unshift({
      user:  '@' + user.replace('@', ''),
      date:  dateStr,
      stars: selectedStar,
      text:  comment
    });
    renderReviews(DB[currentUser.name].reviews);
  }

  /* show success */
  const successEl = document.getElementById('rvSuccess');
  successEl.style.display = 'block';
  setTimeout(function() { successEl.style.display = 'none'; }, 2500);

  /* reset form */
  document.getElementById('rvUser').value    = '';
  document.getElementById('rvComment').value = '';
  selectedStar = 0;
  document.querySelectorAll('.star-btn').forEach(function(b) {
    b.classList.remove('active');
  });
}

/* ---------- SUBMIT REPORT ---------- */
function submitReport() {
  const user   = document.getElementById('rpUser').value.trim();
  const type   = document.getElementById('rpType').value;
  const detail = document.getElementById('rpDetail').value.trim();

  if (!user || !type || !detail) {
    alert('Lengkapi semua field terlebih dahulu.');
    return;
  }

  /* show success */
  const successEl = document.getElementById('rpSuccess');
  successEl.style.display = 'block';
  setTimeout(function() { successEl.style.display = 'none'; }, 3000);

  /* reset form */
  document.getElementById('rpUser').value    = '';
  document.getElementById('rpType').value    = '';
  document.getElementById('rpNominal').value = '';
  document.getElementById('rpDetail').value  = '';
}