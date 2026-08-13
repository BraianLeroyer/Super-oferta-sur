import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Sucursal, Producto, PrecioHistorial, ScraperJob
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.sucursal_session import SUCURSALES_DATA
from app.scraper.catalogo import PRODUCTOS_CATALOGO_BASE
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
        #    Se siembra el catálogo COMPLETO (todas las categorías) por sucursal.
        seed_limit = len(PRODUCTOS_CATALOGO_BASE)
        logger.info(f"Seeding del catálogo completo: {seed_limit} productos por sucursal.")
        sucursales = db.query(Sucursal).all()
        for suc in sucursales:
            # Comprobar si ya existen productos para esta sucursal
            precios_count = db.query(PrecioHistorial).filter(PrecioHistorial.sucursal_id == suc.id).count()
            if precios_count == 0:
                logger.info(f"Poblando datos de productos para sucursal {suc.nombre}...")
                job_id = uuid.uuid4()
                job = ScraperJob(
                    id=job_id,
                    sucursal_id=suc.id,
                    estado="PENDING",
                    total_scrapeados=0,
                    total_errores=0
                )
                db.add(job)
                db.commit()
                run_scraper_job_task(str(job_id), suc.nombre, limit=seed_limit)

        logger.info("¡Seeding completado con éxito!")
    except Exception as e:
        logger.error(f"Error durante seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
