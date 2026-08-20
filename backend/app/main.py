from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import api_router
from app.database import engine, Base
from app.seed import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuración CORS amplia para portales Astro (4321) y Next.js (3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import threading

@app.on_event("startup")
def startup_db_and_seed():
    Base.metadata.create_all(bind=engine)
    
    # Ejecutar el seeding en segundo plano para que FastAPI levante en 1 segundo
    # y Render complete el deploy inmediatamente sin dar 'Timed Out'
    def bg_seed():
        try:
            seed_database()
        except Exception as e:
            print(f"Advertencia durante seeding en segundo plano: {e}")

    thread = threading.Thread(target=bg_seed, daemon=True)
    thread.start()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(api_router, prefix=settings.API_V1_STR)
