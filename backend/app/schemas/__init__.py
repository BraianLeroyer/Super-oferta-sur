from app.schemas.comercio import ComercioBase, ComercioCreate, ComercioOut, ComercioDetailOut
from app.schemas.sucursal import SucursalBase, SucursalCreate, SucursalOut
from app.schemas.producto import ProductoBase, ProductoCreate, ProductoOut, ProductoDetailOut
from app.schemas.precio_historial import PrecioHistorialBase, PrecioHistorialCreate, PrecioHistorialOut
from app.schemas.scraper_job import ScraperTriggerRequest, ScraperJobOut
from app.schemas.comparison import ComercioComparacionOut

__all__ = [
    "ComercioBase", "ComercioCreate", "ComercioOut", "ComercioDetailOut",
    "SucursalBase", "SucursalCreate", "SucursalOut",
    "ProductoBase", "ProductoCreate", "ProductoOut", "ProductoDetailOut",
    "PrecioHistorialBase", "PrecioHistorialCreate", "PrecioHistorialOut",
    "ScraperTriggerRequest", "ScraperJobOut",
    "ComercioComparacionOut"
]
