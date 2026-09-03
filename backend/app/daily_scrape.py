"""
Script de Scraping Diario para GitHub Actions / Cron
Ejecuta la actualización de precios para todas las cadenas (La Anónima, Carrefour,
Jumbo, Vea, Mas Online, Yaguar) y propaga a las sucursales de Chubut.
"""
import os
import sys
import uuid
import logging
from datetime import datetime

# Asegurar que el directorio backend esté en sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Comercio, Sucursal, Producto, PrecioHistorial, ScraperJob
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.comercios_data import COMERCIOS
from app.scraper.catalogo import PRODUCTOS_CATALOGO_BASE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("daily_scraper")


def run_daily_scraping():
    start_time = datetime.utcnow()
    logger.info("==================================================")
    logger.info("Iniciando Scraping Diario Automatizado (6:00 AM ART)")
    logger.info("==================================================")

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Asegurar comercios y sucursales
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
        db.commit()

        comercios_list = db.query(Comercio).filter(Comercio.habilitado == True).order_by(Comercio.id).all()
        comercios_info = []
        for com in comercios_list:
            sucs = [
                {"id": s.id, "nombre": s.nombre, "codigo": s.codigo_sucursal}
                for s in com.sucursales
            ]
            comercios_info.append({
                "id": com.id,
                "slug": com.slug,
                "nombre": com.nombre,
                "sucursales": sucs
            })
    finally:
        db.close()

    total_comercios_ok = 0

    for cdata in comercios_info:
        cslug = cdata["slug"]
        cnombre = cdata["nombre"]
        sucs = cdata["sucursales"]

        if not sucs:
            continue

        first_suc = sucs[0]
        logger.info(f"--- Actualizando {cnombre} (Sucursal base: {first_suc['nombre']}) ---")

        db_job = SessionLocal()
        job_id = uuid.uuid4()
        try:
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
            logger.info(f"[{cnombre}] Scraping completado: {res}")
            total_comercios_ok += 1
        except Exception as e:
            logger.error(f"[{cnombre}] Error raspando catálogo: {e}")
            continue

        # Propagar precios a las demás sucursales de la cadena en Chubut
        otras_sucs = sucs[1:]
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
                logger.error(f"[{cnombre}] Error propagando precios: {sync_err}")
            finally:
                db_sync.close()

    elapsed = (datetime.utcnow() - start_time).total_seconds()
    logger.info("==================================================")
    logger.info(f"Scraping finalizado en {elapsed:.1f}s. Exitosos: {total_comercios_ok}/{len(comercios_info)}")
    logger.info("==================================================")


if __name__ == "__main__":
    run_daily_scraping()
