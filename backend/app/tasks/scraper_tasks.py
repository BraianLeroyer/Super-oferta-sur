import asyncio
from datetime import datetime
from uuid import UUID
from celery import shared_task
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.sucursal import Sucursal
from app.models.producto import Producto
from app.models.precio_historial import PrecioHistorial
from app.models.scraper_job import ScraperJob
from app.scraper.engine import LaAnonimaScraper

@shared_task(name="run_scraper_job_task")
def run_scraper_job_task(job_id_str: str, sucursal_query: str, limit: int = 30):
    """
    Tarea Celery asíncrona para ejecutar el raspado de productos por sucursal.
    """
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

        # Buscar o crear sucursal en DB
        scraper = LaAnonimaScraper(sucursal_query)
        sec_config = scraper.sucursal_config
        
        sucursal = db.query(Sucursal).filter(Sucursal.codigo_sucursal == sec_config["codigo"]).first()
        if not sucursal:
            sucursal = Sucursal(
                codigo_sucursal=sec_config["codigo"],
                nombre=sec_config["nombre"],
                provincia=sec_config.get("provincia", "Chubut")
            )
            db.add(sucursal)
            db.commit()
            db.refresh(sucursal)
            
        job.sucursal_id = sucursal.id
        db.commit()

        # Ejecutar extracción asíncrona en bucle
        extracted_items = asyncio.run(scraper.run_extraction(limit=limit))

        total_scraped = 0
        total_errors = 0
        commit_every = 200

        for item in extracted_items:
            try:
                # Upsert de Producto por SKU
                producto = db.query(Producto).filter(Producto.sku == item["sku"]).first()
                if not producto:
                    producto = Producto(
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
