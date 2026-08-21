from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Para SQLAlchemy en Neon, la conexión directa (sin PgBouncer -pooler) evita errores de SSL EOF en operaciones por lote
db_url = settings.DATABASE_URL.replace("-pooler.", ".")

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=120,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
