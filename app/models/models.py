from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ReportType(str, enum.Enum):
    kabur          = "Kabur dengan uang / barang"
    tidak_sesuai   = "Barang tidak sesuai deskripsi"
    tidak_responsif= "Tidak responsif setelah pembayaran"
    identitas_palsu= "Identitas palsu"
    double_deal    = "Double deal / scam ganda"
    lainnya        = "Lainnya"


class Middleman(Base):
    __tablename__ = "middlemen"

    id           = Column(Integer, primary_key=True, index=True)
    username     = Column(String(100), unique=True, nullable=False, index=True)
    platform     = Column(String(200), nullable=False)
    joined_year  = Column(String(10), nullable=False)
    bio          = Column(Text, nullable=True)
    contact      = Column(String(200), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews  = relationship("Review",  back_populates="middleman", cascade="all, delete")
    reports  = relationship("Report",  back_populates="middleman", cascade="all, delete")


class Review(Base):
    __tablename__ = "reviews"

    id             = Column(Integer, primary_key=True, index=True)
    middleman_id   = Column(Integer, ForeignKey("middlemen.id"), nullable=False)
    reviewer_name  = Column(String(100), nullable=False)
    stars          = Column(Integer, nullable=False)   # 1-5
    comment        = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    middleman = relationship("Middleman", back_populates="reviews")


class Report(Base):
    __tablename__ = "reports"

    id             = Column(Integer, primary_key=True, index=True)
    middleman_id   = Column(Integer, ForeignKey("middlemen.id"), nullable=False)
    reporter_name  = Column(String(100), nullable=False)
    report_type    = Column(Enum(ReportType), nullable=False)
    nominal_loss   = Column(Float, nullable=True)
    detail         = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    middleman = relationship("Middleman", back_populates="reports")
