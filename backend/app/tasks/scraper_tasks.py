import asyncio
import logging
import threading
from datetime import datetime
from uuid import UUID
from celery import shared_task
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal

logger = logging.getLogger(__name__)
from app.models.comercio import Comercio
from app.models.sucursal import Sucursal
from app.models.producto import Producto
from app.models.precio_historial import PrecioHistorial
from app.models.scraper_job import ScraperJob
from app.scraper.registry import get_comercio_config, get_scraper
from app.scraper.comercios_data import get_sucursal_config


def _run_extraction_coro(scraper, limit, brands_to_search=None, precio_maximo=None):
    """Ejecuta la extracción async en un event loop propio dentro de un thread."""
    result = {}

    def runner():
        result["items"] = asyncio.run(
            scraper.run_extraction(
                limit=limit,
                brands_to_search=brands_to_search,
                precio_maximo=precio_maximo,
            )
        )

    t = threading.Thread(target=runner, daemon=True)
    t.start()
    t.join()
    return result["items"]


def _get_missing_brands(db: Session, comercio_slug: str) -> list:
    """Obtiene marcas que existen en otras cadenas VTEX pero no en la cadena actual."""
    vtex_slugs = ['carrefour', 'jumbo', 'vea', 'mas_online']

    # Marcas presentes en la cadena actual
    current_brands = set()
    result = db.query(Producto.marca).join(Comercio).filter(
        Comercio.slug == comercio_slug,
        Producto.marca.isnot(None),
        Producto.marca != '',
    ).distinct().all()
    for row in result:
        current_brands.add(row[0])

    # Marcas presentes en OTRAS cadenas VTEX
    other_brands = set()
    result = db.query(Producto.marca).join(Comercio).filter(
        Comercio.slug.in_([s for s in vtex_slugs if s != comercio_slug]),
        Producto.marca.isnot(None),
        Producto.marca != '',
    ).distinct().all()
    for row in result:
        other_brands.add(row[0])

    missing = sorted(other_brands - current_brands)
    # Filtrar marcas basura (solo caracteres especiales, muy cortas, etc.)
    missing = [b for b in missing if len(b) > 1 and any(c.isalpha() for c in b)]
    logger.info(f"[VTEX {comercio_slug}] Marcas faltantes de otras cadenas: {len(missing)}")
    return missing

@shared_task(name="run_scraper_job_task")
def run_scraper_job_task(job_id_str: str, comercio_query: str, sucursal_query: str, limit: int = 100, precio_maximo: float = None):
    """
    Tarea Celery asíncrona para ejecutar el raspado de productos por comercio y sucursal.
    Si precio_maximo se indica, filtra productos con precio mayor a ese valor.
    Si la cadena es VTEX, ejecuta búsqueda complementaria por marcas faltantes.
    """
    logger = logging.getLogger(__name__)
    db: Session = SessionLocal()
    job_id = UUID(job_id_str)

    job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
    if not job:
        db.close()
        return {"status": "error", "message": f"Job {job_id_str} no encontrado"}

    try:
        job.estado = "RUNNING"
        job.iniciado_en = datetime.utcnow()
        db.commit()

        comercio_cfg = get_comercio_config(comercio_query)
        suc_cfg = get_sucursal_config(comercio_cfg, sucursal_query)

        # Buscar o crear comercio
        comercio = db.query(Comercio).filter(Comercio.slug == comercio_cfg["slug"]).first()
        if not comercio:
            comercio = Comercio(
                slug=comercio_cfg["slug"],
                nombre=comercio_cfg["nombre"],
                tipo=comercio_cfg.get("tipo", "supermercado"),
                base_url=comercio_cfg.get("base_url"),
                scraping_modo=comercio_cfg.get("scraping_modo", "html"),
                color=comercio_cfg.get("color"),
                habilitado=True,
            )
            db.add(comercio)
            db.commit()
            db.refresh(comercio)

        job.comercio_id = comercio.id

        # Buscar o crear sucursal
        sucursal = db.query(Sucursal).filter(
            Sucursal.comercio_id == comercio.id,
            Sucursal.codigo_sucursal == suc_cfg["codigo"],
        ).first()
        if not sucursal:
            sucursal = Sucursal(
                comercio_id=comercio.id,
                codigo_sucursal=suc_cfg["codigo"],
                nombre=suc_cfg["nombre"],
                provincia=suc_cfg.get("provincia", ""),
                tipo_sucursal=suc_cfg.get("tipo_sucursal", "supermercado"),
            )
            db.add(sucursal)
            db.commit()
            db.refresh(sucursal)

        job.sucursal_id = sucursal.id
        db.commit()

        # Ejecutar extracción asíncrona en bucle
        scraper = get_scraper(comercio_query, sucursal_query)

        # Para cadenas VTEX, buscar marcas faltantes de otras cadenas
        brands_to_search = None
        scraping_modo = comercio_cfg.get("scraping_modo", "")
        if scraping_modo == "vtex" and limit is None:
            brands_to_search = _get_missing_brands(db, comercio_cfg["slug"])
            logger.info(f"[{comercio_cfg['slug']}] Expansion por marcas: {len(brands_to_search)} marcas a buscar.")

        extracted_items = _run_extraction_coro(scraper, limit, brands_to_search, precio_maximo)

        # Refrescar sesión para evitar desconexiones SSL por inactividad durante la extracción de red
        db.close()
        db = SessionLocal()
        job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
        comercio = db.query(Comercio).filter(Comercio.id == job.comercio_id).first()
        sucursal = db.query(Sucursal).filter(Sucursal.id == job.sucursal_id).first()

        total_scraped = 0
        total_errors = 0
        commit_every = 200

        for item in extracted_items:
            try:
                # Upsert de Producto por (comercio_id, SKU)
                producto = db.query(Producto).filter(
                    Producto.comercio_id == comercio.id,
                    Producto.sku == item["sku"],
                ).first()
                if not producto:
                    producto = Producto(
                        comercio_id=comercio.id,
                        sku=item["sku"],
                        titulo=item["titulo"],
                        marca=item.get("marca"),
                        descripcion=item.get("descripcion"),
                        imagen_url=item.get("imagen_url"),
                        unidad_medida=item.get("unidad_medida"),
                        url_producto=item.get("url_producto"),
                        categoria=item.get("categoria")
                    )
                    db.add(producto)
                    db.flush()
                else:
                    # Actualizar info si cambió
                    producto.titulo = item["titulo"]
                    if item.get("marca"):
                        producto.marca = item.get("marca")
                    if item.get("descripcion"):
                        producto.descripcion = item.get("descripcion")
                    if item.get("imagen_url"):
                        producto.imagen_url = item.get("imagen_url")
                    if item.get("url_producto"):
                        producto.url_producto = item.get("url_producto")
                    if item.get("categoria"):
                        producto.categoria = item.get("categoria")

                # Crear nuevo registro de historial de precio
                precio_hist = PrecioHistorial(
                    producto_id=producto.id,
                    sucursal_id=sucursal.id,
                    precio_lista=item["precio_lista"],
                    precio_oferta=item.get("precio_oferta"),
                    precio_bulto=item.get("precio_bulto"),
                    descripcion_bulto=item.get("descripcion_bulto"),
                    es_oferta_club=item.get("es_oferta_club", False),
                    disponible=item.get("disponible", True),
                    fecha_captura=datetime.utcnow()
                )
                db.add(precio_hist)

                total_scraped += 1
                if total_scraped % commit_every == 0:
                    db.commit()
            except Exception as item_err:
                db.rollback()
                total_errors += 1

        db.commit()

        job.estado = "FINISHED"
        job.total_scrapeados = total_scraped
        job.total_errores = total_errors
        job.finalizado_en = datetime.utcnow()
        db.commit()

        return {
            "job_id": job_id_str,
            "status": "FINISHED",
            "total_scrapeados": total_scraped,
            "total_errores": total_errors
        }

    except Exception as e:
        db.rollback()
        job.estado = "FAILED"
        job.mensaje_error = str(e)
        job.finalizado_en = datetime.utcnow()
        db.commit()
        return {"job_id": job_id_str, "status": "FAILED", "error": str(e)}
    finally:
        db.close()
