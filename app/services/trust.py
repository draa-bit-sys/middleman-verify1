"""
Trust Score Engine
==================
Score 0–100 dihitung dari 5 faktor:
  1. Histori Transaksi  (30 poin) — berdasarkan jumlah review
  2. Rating Rata-rata   (25 poin) — dari bintang review
  3. Laporan Negatif    (25 poin) — dikurangi per laporan
  4. Usia Akun          (10 poin) — dari joined_year
  5. Kelengkapan Profil (10 poin) — bio & contact terisi
"""

from datetime import datetime
from typing import List
from app.models.models import Review, Report
from app.schemas.schemas import TrustScore


def calculate_trust(
    reviews   : List[Review],
    reports   : List[Report],
    joined_year: str,
    bio       : str | None,
    contact   : str | None,
) -> TrustScore:

    total_reviews = len(reviews)
    total_reports = len(reports)

    # ── Faktor 1: Histori Transaksi (0–30) ──────────────
    if total_reviews == 0:
        tx_score = 0
    elif total_reviews < 5:
        tx_score = 10
    elif total_reviews < 20:
        tx_score = 20
    elif total_reviews < 50:
        tx_score = 25
    else:
        tx_score = 30

    # ── Faktor 2: Rating Rata-rata (0–25) ────────────────
    if total_reviews == 0:
        avg_stars  = 0.0
        star_score = 0
    else:
        avg_stars  = round(sum(r.stars for r in reviews) / total_reviews, 2)
        star_score = round((avg_stars / 5) * 25)

    # ── Faktor 3: Laporan Negatif (0–25) ─────────────────
    # Mulai dari 25, kurangi 5 per laporan, minimum 0
    report_score = max(0, 25 - (total_reports * 5))

    # ── Faktor 4: Usia Akun (0–10) ───────────────────────
    current_year = datetime.utcnow().year
    try:
        age = current_year - int(joined_year)
    except ValueError:
        age = 0

    if age >= 4:
        age_score = 10
    elif age >= 2:
        age_score = 7
    elif age >= 1:
        age_score = 4
    else:
        age_score = 1

    # ── Faktor 5: Kelengkapan Profil (0–10) ──────────────
    profile_score = 0
    if bio and bio.strip():
        profile_score += 5
    if contact and contact.strip():
        profile_score += 5

    # ── Total ─────────────────────────────────────────────
    total = tx_score + star_score + report_score + age_score + profile_score
    total = max(0, min(100, total))

    # ── Label ─────────────────────────────────────────────
    if total >= 80:
        label = "TRUSTED"
    elif total >= 50:
        label = "WASPADA"
    else:
        label = "BERBAHAYA"

    # ── Success rate proxy ────────────────────────────────
    # Estimasi: (review bintang >= 4) / total review * 100
    good_reviews  = sum(1 for r in reviews if r.stars >= 4)
    success_rate  = round((good_reviews / total_reviews * 100) if total_reviews else 0, 1)

    return TrustScore(
        score        = round(total, 1),
        label        = label,
        total_tx     = total_reviews,
        success_rate = success_rate,
        total_reports= total_reports,
        avg_stars    = avg_stars,
        factors      = {
            "Histori Transaksi"   : tx_score,
            "Rating Rata-rata"    : star_score,
            "Laporan Negatif"     : report_score,
            "Usia Akun"           : age_score,
            "Kelengkapan Profil"  : profile_score,
        }
    )
