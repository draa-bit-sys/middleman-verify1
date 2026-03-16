from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Middleman, Review
from app.schemas.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/middlemen", tags=["Reviews"])


# ── GET semua review milik 1 middleman ───────────────────
@router.get("/{username}/reviews", response_model=List[ReviewOut])
def list_reviews(username: str, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")
    return mm.reviews


# ── POST tambah review ────────────────────────────────────
@router.post("/{username}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def add_review(username: str, payload: ReviewCreate, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    review = Review(middleman_id=mm.id, **payload.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# ── DELETE review ─────────────────────────────────────────
@router.delete("/{username}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(username: str, review_id: int, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    review = db.query(Review).filter(
        Review.id == review_id, Review.middleman_id == mm.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")

    db.delete(review)
    db.commit()
