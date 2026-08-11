from app.schemas.sucursal import SucursalBase, SucursalCreate, SucursalOut
from app.schemas.producto import ProductoBase, ProductoCreate, ProductoOut, ProductoDetailOut
from app.schemas.precio_historial import PrecioHistorialBase, PrecioHistorialCreate, PrecioHistorialOut
from app.schemas.scraper_job import ScraperTriggerRequest, ScraperJobOut

__all__ = [
    "SucursalBase", "SucursalCreate", "SucursalOut",
    "ProductoBase", "ProductoCreate", "ProductoOut", "ProductoDetailOut",
    "PrecioHistorialBase", "PrecioHistorialCreate", "PrecioHistorialOut",
    "ScraperTriggerRequest", "ScraperJobOut"
]
