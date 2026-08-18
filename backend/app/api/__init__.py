from fastapi import APIRouter
from app.api.scraper import router as scraper_router
from app.api.products import router as products_router
from app.api.sucursales import router as sucursales_router
from app.api.comercios import router as comercios_router
from app.api.comparison import router as comparison_router

api_router = APIRouter()
api_router.include_router(scraper_router)
api_router.include_router(products_router)
api_router.include_router(sucursales_router)
api_router.include_router(comercios_router)
api_router.include_router(comparison_router)
