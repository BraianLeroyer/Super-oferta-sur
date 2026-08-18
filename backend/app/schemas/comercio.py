from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class ComercioBase(BaseModel):
    nombre: str
    slug: str
    tipo: Optional[str] = "supermercado"
    base_url: Optional[str] = None
    scraping_modo: Optional[str] = "html"
    color: Optional[str] = None
    habilitado: Optional[bool] = True

class ComercioCreate(ComercioBase):
    pass

class ComercioOut(ComercioBase):
    id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)

class ComercioDetailOut(ComercioOut):
    sucursales: List["SucursalOut"] = []

from app.schemas.sucursal import SucursalOut  # noqa: E402
ComercioDetailOut.model_rebuild()
