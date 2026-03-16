from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import middlemen, reviews, reports

# Buat semua tabel otomatis saat startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Middleman Verify API",
    description="Backend untuk deteksi trust jasa middleman",
    version="1.0.0",
)

# CORS — izinkan frontend mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ganti dengan domain frontend saat production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register semua router
app.include_router(middlemen.router)
app.include_router(reviews.router)
app.include_router(reports.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Middleman Verify API is running"}
