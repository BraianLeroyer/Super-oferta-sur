import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scraper_job import ScraperJob
from app.models.sucursal import Sucursal
from app.schemas.scraper_job import ScraperTriggerRequest, ScraperJobOut
from app.tasks.scraper_tasks import run_scraper_job_task
from app.scraper.sucursal_session import get_sucursal_session_config

router = APIRouter(prefix="/scraper", tags=["Scraper"])

@router.post("/trigger", response_model=ScraperJobOut)
def trigger_scraper(
    payload: ScraperTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/scraper/trigger
    Inicia un proceso de extracción en segundo plano para una sucursal dada.
    """
    sucursal_info = get_sucursal_session_config(payload.sucursal)
    
    # Buscar o crear registro de sucursal
    sucursal = db.query(Sucursal).filter(Sucursal.codigo_sucursal == sucursal_info["codigo"]).first()
    if not sucursal:
        sucursal = Sucursal(
            codigo_sucursal=sucursal_info["codigo"],
            nombre=sucursal_info["nombre"],
            provincia=sucursal_info.get("provincia", "Chubut")
        )
        db.add(sucursal)
        db.commit()
        db.refresh(sucursal)

    job_id = uuid.uuid4()
    job = ScraperJob(
        id=job_id,
        sucursal_id=sucursal.id,
        estado="PENDING",
        total_scrapeados=0,
        total_errores=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Intentar enviar la tarea a Celery. Si Celery/Redis no estuviera listo, se ejecuta via BackgroundTasks de FastAPI
    try:
        run_scraper_job_task.delay(str(job_id), payload.sucursal, payload.limite_productos or 100)
    except Exception:
        background_tasks.add_task(run_scraper_job_task, str(job_id), payload.sucursal, payload.limite_productos or 100)

    return job

@router.get("/jobs", response_model=List[ScraperJobOut])
def list_scraper_jobs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/scraper/jobs
    Retorna la lista de trabajos de raspado con su estado y desglose por sucursal.
    """
    jobs = db.query(ScraperJob).order_by(ScraperJob.iniciado_en.desc()).limit(limit).all()
    return jobs
