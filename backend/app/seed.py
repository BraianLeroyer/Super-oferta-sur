import logging
from datetime import datetime
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
        # 1. Limpiar sucursal Jumbo Trelew si existía previamente
        jumbo_trelew_suc = db.query(Sucursal).filter(Sucursal.codigo_sucursal == "JUMBO_TRELEW").first()
        if jumbo_trelew_suc:
            logger.info("Eliminando sucursal obsoleta JUMBO_TRELEW...")
            db.query(PrecioHistorial).filter(PrecioHistorial.sucursal_id == jumbo_trelew_suc.id).delete()
            db.query(ScraperJob).filter(ScraperJob.sucursal_id == jumbo_trelew_suc.id).delete()
            db.delete(jumbo_trelew_suc)
            db.commit()

        # 2. Crear Comercios y sus Sucursales por defecto
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

        # 3. Agrupar sucursales por comercio para siembra ultra-rápida y completa
        comercios_list = db.query(Comercio).order_by(Comercio.id).all()
        comercios_data = []
        for com in comercios_list:
            suc_list = []
            for suc in com.sucursales:
                cnt = db.query(PrecioHistorial).filter(PrecioHistorial.sucursal_id == suc.id).count()
                suc_list.append({
                    "id": suc.id,
                    "nombre": suc.nombre,
                    "codigo": suc.codigo_sucursal,
                    "precios_count": cnt
                })
            comercios_data.append({
                "id": com.id,
                "slug": com.slug,
                "nombre": com.nombre,
                "sucursales": suc_list
            })
        db.close()

        def _min_expected(slug: str) -> int:
            if slug == "la-anonima":
                return 10000
            elif slug in ("carrefour", "jumbo", "vea", "mas-online"):
                return 1000
            else:  # yaguar
                return 150

        # 4. Poblar cada comercio
        for cdata in comercios_data:
            cslug = cdata["slug"]
            cnombre = cdata["nombre"]
            min_exp = _min_expected(cslug)
            sucs_necesitan = [s for s in cdata["sucursales"] if s["precios_count"] < min_exp]

            if not sucs_necesitan:
                logger.info(f"[{cnombre}] Todas las sucursales ya tienen catálogo cargado.")
                continue

            logger.info(f"[{cnombre}] Poblando {len(sucs_necesitan)} sucursales (umbral mínimo: {min_exp} productos)...")

            # Primero poblamos la sucursal principal con run_scraper_job_task
            first_suc = sucs_necesitan[0]
            db_job = SessionLocal()
            try:
                job_id = uuid.uuid4()
                job = ScraperJob(
                    id=job_id,
                    comercio_id=cdata["id"],
                    sucursal_id=first_suc["id"],
                    estado="PENDING",
                    total_scrapeados=0,
                    total_errores=0,
                )
                db_job.add(job)
                db_job.commit()
            finally:
                db_job.close()

            limit = len(PRODUCTOS_CATALOGO_BASE) if cslug == "la-anonima" else None
            try:
                res = run_scraper_job_task(str(job_id), cslug, first_suc["nombre"], limit=limit)
                logger.info(f"[{cnombre} / {first_suc['nombre']}] Tarea finalizada: {res}")
            except Exception as e:
                logger.error(f"[{cnombre} / {first_suc['nombre']}] Error en scraper: {e}")
                continue

            # Para las demás sucursales del mismo comercio que aún no tengan precios,
            # propagamos los precios en lote en 0.5s desde la sucursal principal
            otras_sucs = sucs_necesitan[1:]
            if otras_sucs:
                db_sync = SessionLocal()
                try:
                    now_dt = datetime.utcnow()
                    base_prices = [
                        {
                            "producto_id": row[0],
                            "precio_lista": row[1],
                            "precio_oferta": row[2],
                            "precio_bulto": row[3],
                            "descripcion_bulto": row[4],
                            "es_oferta_club": row[5],
                            "disponible": row[6],
                        }
                        for row in db_sync.query(
                            PrecioHistorial.producto_id,
                            PrecioHistorial.precio_lista,
                            PrecioHistorial.precio_oferta,
                            PrecioHistorial.precio_bulto,
                            PrecioHistorial.descripcion_bulto,
                            PrecioHistorial.es_oferta_club,
                            PrecioHistorial.disponible
                        ).filter(PrecioHistorial.sucursal_id == first_suc["id"]).all()
                    ]

                    if base_prices:
                        import gc
                        for other_suc in otras_sucs:
                            other_job = ScraperJob(
                                id=uuid.uuid4(),
                                comercio_id=cdata["id"],
                                sucursal_id=other_suc["id"],
                                estado="FINISHED",
                                total_scrapeados=len(base_prices),
                                total_errores=0,
                                iniciado_en=now_dt,
                                finalizado_en=now_dt,
                            )
                            db_sync.add(other_job)
                            db_sync.commit()

                            CHUNK_SZ = 300
                            for ci in range(0, len(base_prices), CHUNK_SZ):
                                chunk_data = base_prices[ci : ci + CHUNK_SZ]
                                chunk_models = [
                                    PrecioHistorial(
                                        producto_id=bp["producto_id"],
                                        sucursal_id=other_suc["id"],
                                        precio_lista=bp["precio_lista"],
                                        precio_oferta=bp["precio_oferta"],
                                        precio_bulto=bp["precio_bulto"],
                                        descripcion_bulto=bp["descripcion_bulto"],
                                        es_oferta_club=bp["es_oferta_club"],
                                        disponible=bp["disponible"],
                                        fecha_captura=now_dt
                                    )
                                    for bp in chunk_data
                                ]
                                db_sync.add_all(chunk_models)
                                db_sync.commit()
                                for m in chunk_models:
                                    try:
                                        db_sync.expunge(m)
                                    except Exception:
                                        pass
                                gc.collect()
                            logger.info(f"[{cnombre} / {other_suc['nombre']}] Sincronizados {len(base_prices)} precios.")
                except Exception as sync_err:
                    db_sync.rollback()
                    logger.error(f"[{cnombre}] Error sincronizando sucursales: {sync_err}")
                finally:
                    db_sync.close()

        logger.info("¡Seeding completado con éxito para todas las sucursales!")
    except Exception as e:
        logger.error(f"Error durante seeding: {e}")


if __name__ == "__main__":
    seed_database()
