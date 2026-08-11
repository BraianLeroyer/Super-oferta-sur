from app.tasks.celery_app import celery_app
from app.tasks.scraper_tasks import run_scraper_job_task

__all__ = ["celery_app", "run_scraper_job_task"]
