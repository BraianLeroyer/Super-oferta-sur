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

        # 2. Ejecutar raspado inicial para popular la DB con productos y precios.
        #    La Anónima siembra el catálogo COMPLETO (16.165). Las demás cadenas
        #    también se siembran con su catálogo completo (limit=None) en el primer boot.
        for comercio in db.query(Comercio).order_by(Comercio.id).all():
            seed_limit = len(PRODUCTOS_CATALOGO_BASE) if comercio.slug == "la-anonima" else None
            for suc in comercio.sucursales:
                # Si la sucursal ya fue raspada con éxito (job FINISHED) no se
                # vuelve a scrapear en cada boot. Diarco, p.ej., termina con 0
                # productos (oculta precios a invitados) y quedaría repitiéndose.
                ya_raspada = db.query(ScraperJob).filter(
                    ScraperJob.sucursal_id == suc.id,
                    ScraperJob.estado == "FINISHED",
                ).first()
                if ya_raspada:
                    continue
                precios_count = db.query(PrecioHistorial).filter(PrecioHistorial.sucursal_id == suc.id).count()
                if precios_count == 0:
                    logger.info(f"Poblando datos de productos para {comercio.nombre} / {suc.nombre}...")
                    job_id = uuid.uuid4()
                    job = ScraperJob(
                        id=job_id,
                        comercio_id=comercio.id,
                        sucursal_id=suc.id,
                        estado="PENDING",
                        total_scrapeados=0,
                        total_errores=0,
                    )
                    db.add(job)
                    db.commit()
                    run_scraper_job_task(str(job_id), comercio.slug, suc.nombre, limit=seed_limit)

        logger.info("¡Seeding completado con éxito!")
    except Exception as e:
        logger.error(f"Error durante seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
