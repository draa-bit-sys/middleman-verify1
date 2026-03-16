from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Middleman
from app.schemas.schemas import MiddlemanCreate, MiddlemanUpdate, MiddlemanOut
from app.services.trust import calculate_trust

router = APIRouter(prefix="/middlemen", tags=["Middlemen"])


# ── GET semua middleman ───────────────────────────────────
@router.get("/", response_model=List[MiddlemanOut])
def list_middlemen(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    rows = db.query(Middleman).offset(skip).limit(limit).all()
    result = []
    for mm in rows:
        trust = calculate_trust(mm.reviews, mm.reports, mm.joined_year, mm.bio, mm.contact)
        out   = MiddlemanOut.model_validate(mm)
        out.trust = trust
        result.append(out)
    return result


# ── GET satu middleman by username ────────────────────────
@router.get("/{username}", response_model=MiddlemanOut)
def get_middleman(username: str, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(
        Middleman.username.ilike(username)
    ).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    trust = calculate_trust(mm.reviews, mm.reports, mm.joined_year, mm.bio, mm.contact)
    out   = MiddlemanOut.model_validate(mm)
    out.trust = trust
    return out


# ── POST buat middleman baru ──────────────────────────────
@router.post("/", response_model=MiddlemanOut, status_code=status.HTTP_201_CREATED)
def create_middleman(payload: MiddlemanCreate, db: Session = Depends(get_db)):
    existing = db.query(Middleman).filter(
        Middleman.username.ilike(payload.username)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username sudah terdaftar")

    mm = Middleman(**payload.model_dump())
    db.add(mm)
    db.commit()
    db.refresh(mm)

    trust = calculate_trust(mm.reviews, mm.reports, mm.joined_year, mm.bio, mm.contact)
    out   = MiddlemanOut.model_validate(mm)
    out.trust = trust
    return out


# ── PATCH update middleman ────────────────────────────────
@router.patch("/{username}", response_model=MiddlemanOut)
def update_middleman(username: str, payload: MiddlemanUpdate, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(
        Middleman.username.ilike(username)
    ).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mm, field, value)

    db.commit()
    db.refresh(mm)

    trust = calculate_trust(mm.reviews, mm.reports, mm.joined_year, mm.bio, mm.contact)
    out   = MiddlemanOut.model_validate(mm)
    out.trust = trust
    return out


# ── DELETE middleman ──────────────────────────────────────
@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
def delete_middleman(username: str, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(
        Middleman.username.ilike(username)
    ).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    db.delete(mm)
    db.commit()
