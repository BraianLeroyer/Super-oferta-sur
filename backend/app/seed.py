import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Comercio, Sucursal, Producto, PrecioHistorial, ScraperJob
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.comercios_data import COMERCIOS
from app.scraper.catalogo import PRODUCTOS_CATALOGO_BASE
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database():
    logger.info("Iniciando creación de tablas e inoculación inicial (Seeding)...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Crear Comercios y sus Sucursales por defecto
        for slug, data in COMERCIOS.items():
            comercio = db.query(Comercio).filter(Comercio.slug == slug).first()
            if not comercio:
                comercio = Comercio(
                    slug=slug,
                    nombre=data["nombre"],
                    tipo=data.get("tipo", "supermercado"),
                    base_url=data.get("base_url"),
                    scraping_modo=data.get("scraping_modo", "html"),
                    color=data.get("color"),
                    habilitado=True,
                )
                db.add(comercio)
                db.flush()
                logger.info(f"Comercio creado: {data['nombre']} ({slug})")

            for s in data.get("sucursales", []):
                existing = db.query(Sucursal).filter(
                    Sucursal.comercio_id == comercio.id,
                    Sucursal.codigo_sucursal == s["codigo"],
                ).first()
                if not existing:
                    db.add(Sucursal(
                        comercio_id=comercio.id,
                        codigo_sucursal=s["codigo"],
                        nombre=s["nombre"],
                        provincia=s.get("provincia", "Chubut"),
                        tipo_sucursal=s.get("tipo_sucursal", "supermercado"),
                    ))
                    logger.info(f"Sucursal creada: {s['nombre']} ({s['codigo']})")
        db.commit()

        # Extraer lista de sucursales para no mantener una sesión abierta durante las descargas de red
        targets = []
        for comercio in db.query(Comercio).order_by(Comercio.id).all():
            for suc in comercio.sucursales:
                targets.append({
                    "comercio_id": comercio.id,
                    "comercio_slug": comercio.slug,
                    "comercio_nombre": comercio.nombre,
                    "sucursal_id": suc.id,
                    "sucursal_nombre": suc.nombre,
                    "seed_limit": len(PRODUCTOS_CATALOGO_BASE) if comercio.slug == "la-anonima" else None
                })
        db.close()

        # 2. Ejecutar raspado inicial con sesiones independientes por sucursal
        for t in targets:
            job_id = None
            db_job: Session = SessionLocal()
            try:
                ya_raspada = db_job.query(ScraperJob).filter(
                    ScraperJob.sucursal_id == t["sucursal_id"],
                    ScraperJob.estado == "FINISHED",
                ).first()
                if ya_raspada:
                    continue

                precios_count = db_job.query(PrecioHistorial).filter(
                    PrecioHistorial.sucursal_id == t["sucursal_id"]
                ).count()

                if precios_count == 0:
                    logger.info(f"Poblando datos para {t['comercio_nombre']} / {t['sucursal_nombre']}...")
                    job_id = uuid.uuid4()
                    job = ScraperJob(
                        id=job_id,
                        comercio_id=t["comercio_id"],
                        sucursal_id=t["sucursal_id"],
                        estado="PENDING",
                        total_scrapeados=0,
                        total_errores=0,
                    )
                    db_job.add(job)
                    db_job.commit()
            finally:
                db_job.close()

            # Ejecutar la tarea de scraping fuera de la sesión de base de datos
            if job_id:
                try:
                    run_scraper_job_task(str(job_id), t["comercio_slug"], t["sucursal_nombre"], limit=t["seed_limit"])
                except Exception as e:
                    logger.error(f"Error ejecutando scraper para {t['sucursal_nombre']}: {e}")

        logger.info("¡Seeding completado con éxito!")
    except Exception as e:
        logger.error(f"Error durante seeding: {e}")


if __name__ == "__main__":
    seed_database()
