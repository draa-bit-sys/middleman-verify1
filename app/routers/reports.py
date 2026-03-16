from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Middleman, Report
from app.schemas.schemas import ReportCreate, ReportOut

router = APIRouter(prefix="/middlemen", tags=["Reports"])


# ── GET semua laporan milik 1 middleman ───────────────────
@router.get("/{username}/reports", response_model=List[ReportOut])
def list_reports(username: str, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")
    return mm.reports


# ── POST kirim laporan penipuan ───────────────────────────
@router.post("/{username}/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def submit_report(username: str, payload: ReportCreate, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    report = Report(middleman_id=mm.id, **payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# ── DELETE laporan ────────────────────────────────────────
@router.delete("/{username}/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(username: str, report_id: int, db: Session = Depends(get_db)):
    mm = db.query(Middleman).filter(Middleman.username.ilike(username)).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Middleman tidak ditemukan")

    report = db.query(Report).filter(
        Report.id == report_id, Report.middleman_id == mm.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    db.delete(report)
    db.commit()
