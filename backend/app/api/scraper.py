import uuid
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scraper_job import ScraperJob
from app.models.comercio import Comercio
from app.models.sucursal import Sucursal
from app.schemas.scraper_job import ScraperTriggerRequest, ScraperJobOut
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.registry import get_comercio_config
from app.scraper.comercios_data import get_sucursal_config

router = APIRouter(prefix="/scraper", tags=["Scraper"])


@router.post("/trigger", response_model=ScraperJobOut)
def trigger_scraper(
    payload: ScraperTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/scraper/trigger
    Inicia un proceso de extracción en segundo plano para un comercio y sucursal.
    Body: {"comercio": "carrefour", "sucursal": "Online", "limite_productos": 500}
    Si no se envía comercio, usa "la-anonima" (comportamiento original).
    """
    comercio_cfg = get_comercio_config(payload.comercio)
    suc_cfg = get_sucursal_config(comercio_cfg, payload.sucursal)

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

    # Buscar o crear sucursal dentro del comercio
    sucursal = db.query(Sucursal).filter(
        Sucursal.comercio_id == comercio.id,
        Sucursal.codigo_sucursal == suc_cfg["codigo"],
    ).first()
    if not sucursal:
        sucursal = Sucursal(
            comercio_id=comercio.id,
            codigo_sucursal=suc_cfg["codigo"],
            nombre=suc_cfg["nombre"],
            provincia=suc_cfg.get("provincia", "Chubut"),
            tipo_sucursal=suc_cfg.get("tipo_sucursal", "supermercado"),
        )
        db.add(sucursal)
        db.commit()
        db.refresh(sucursal)

    job_id = uuid.uuid4()
    job = ScraperJob(
        id=job_id,
        comercio_id=comercio.id,
        sucursal_id=sucursal.id,
        estado="PENDING",
        total_scrapeados=0,
        total_errores=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # limite_productos=null/0 → catálogo completo del comercio (None).
    limite = payload.limite_productos if payload.limite_productos is not None and payload.limite_productos > 0 else None

    # Intentar enviar la tarea a Celery. Si Celery/Redis no estuviera listo, se ejecuta via BackgroundTasks de FastAPI
    try:
        run_scraper_job_task.delay(str(job_id), comercio.slug, sucursal.nombre, limite)
    except Exception:
        background_tasks.add_task(run_scraper_job_task, str(job_id), comercio.slug, sucursal.nombre, limite)

    return job


@router.get("/jobs", response_model=List[ScraperJobOut])
def list_scraper_jobs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/scraper/jobs
    Retorna la lista de trabajos de raspado con su estado y desglose por comercio/sucursal.
    """
    jobs = db.query(ScraperJob).order_by(ScraperJob.iniciado_en.desc()).limit(limit).all()
    return jobs
