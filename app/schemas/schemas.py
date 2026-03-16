from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.models import ReportType


# ─── Middleman ───────────────────────────────────────────

class MiddlemanCreate(BaseModel):
    username   : str = Field(..., min_length=3, max_length=100)
    platform   : str = Field(..., min_length=2, max_length=200)
    joined_year: str = Field(..., min_length=4, max_length=10)
    bio        : Optional[str] = None
    contact    : Optional[str] = None


class MiddlemanUpdate(BaseModel):
    platform   : Optional[str] = None
    joined_year: Optional[str] = None
    bio        : Optional[str] = None
    contact    : Optional[str] = None


class TrustScore(BaseModel):
    score          : float
    label          : str          # "TRUSTED" | "WASPADA" | "BERBAHAYA" | "TIDAK DIKENAL"
    total_tx       : int
    success_rate   : float
    total_reports  : int
    avg_stars      : float
    factors        : dict


class MiddlemanOut(BaseModel):
    id          : int
    username    : str
    platform    : str
    joined_year : str
    bio         : Optional[str]
    contact     : Optional[str]
    created_at  : datetime
    trust       : Optional[TrustScore] = None

    class Config:
        from_attributes = True


# ─── Review ──────────────────────────────────────────────

class ReviewCreate(BaseModel):
    reviewer_name: str = Field(..., min_length=2, max_length=100)
    stars        : int = Field(..., ge=1, le=5)
    comment      : str = Field(..., min_length=5)


class ReviewOut(BaseModel):
    id            : int
    middleman_id  : int
    reviewer_name : str
    stars         : int
    comment       : str
    created_at    : datetime

    class Config:
        from_attributes = True


# ─── Report ──────────────────────────────────────────────

class ReportCreate(BaseModel):
    reporter_name: str = Field(..., min_length=2, max_length=100)
    report_type  : ReportType
    nominal_loss : Optional[float] = Field(None, ge=0)
    detail       : str = Field(..., min_length=10)


class ReportOut(BaseModel):
    id            : int
    middleman_id  : int
    reporter_name : str
    report_type   : ReportType
    nominal_loss  : Optional[float]
    detail        : str
    created_at    : datetime

    class Config:
        from_attributes = True
