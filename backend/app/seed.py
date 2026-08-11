import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Sucursal, Producto, PrecioHistorial, ScraperJob
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.sucursal_session import SUCURSALES_DATA
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database():
    logger.info("Iniciando creación de tablas e inoculación inicial (Seeding)...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Crear Sucursales por defecto
        for key, data in SUCURSALES_DATA.items():
            existing = db.query(Sucursal).filter(Sucursal.codigo_sucursal == data["codigo"]).first()
            if not existing:
                suc = Sucursal(
                    codigo_sucursal=data["codigo"],
                    nombre=data["nombre"],
                    provincia=data["provincia"]
                )
                db.add(suc)
                logger.info(f"Sucursal creada: {data['nombre']}")
        db.commit()

        # 2. Ejecutar raspado inicial para popular la DB con productos y precios
        sucursales = db.query(Sucursal).all()
        for suc in sucursales:
            # Comprobar si ya existen productos para esta sucursal
            precios_count = db.query(PrecioHistorial).filter(PrecioHistorial.sucursal_id == suc.id).count()
            if precios_count == 0:
                logger.info(f"Poblando datos de productos para sucursal {suc.nombre}...")
                job_id = str(uuid.uuid4())
                run_scraper_job_task(job_id, suc.nombre, limit=15)

        logger.info("¡Seeding completado con éxito!")
    except Exception as e:
        logger.error(f"Error durante seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
