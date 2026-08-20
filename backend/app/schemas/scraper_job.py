from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class ScraperTriggerRequest(BaseModel):
    comercio: str = "la-anonima"  # slug o nombre (ej: "la-anonima", "Carrefour")
    sucursal: str  # Puede ser el nombre (ej: "Trelew", "Online") o el codigo_sucursal ("RAWSON_01")
    limite_productos: Optional[int] = 100
    precio_maximo: Optional[float] = None  # Filtra productos con precio > este valor (ej: 50000)

class ScraperJobOut(BaseModel):
    id: UUID
    comercio_id: Optional[int] = None
    sucursal_id: Optional[int] = None
    estado: str
    total_scrapeados: int = 0
    total_errores: int = 0
    mensaje_error: Optional[str] = None
    iniciado_en: datetime
    finalizado_en: Optional[datetime] = None
    comercio: Optional["ComercioOut"] = None
    sucursal: Optional["SucursalOut"] = None

    model_config = ConfigDict(from_attributes=True)

from app.schemas.comercio import ComercioOut  # noqa: E402
from app.schemas.sucursal import SucursalOut  # noqa: E402
ScraperJobOut.model_rebuild()
