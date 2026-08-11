from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Union
from uuid import UUID
from app.schemas.sucursal import SucursalOut

class ScraperTriggerRequest(BaseModel):
    sucursal: str # Puede ser el nombre (ej: "Trelew", "Rawson") o el codigo_sucursal ("RAWSON_01")
    limite_productos: Optional[int] = 50

class ScraperJobOut(BaseModel):
    id: UUID
    sucursal_id: Optional[int] = None
    estado: str
    total_scrapeados: int = 0
    total_errores: int = 0
    mensaje_error: Optional[str] = None
    iniciado_en: datetime
    finalizado_en: Optional[datetime] = None
    sucursal: Optional[SucursalOut] = None

    model_config = ConfigDict(from_attributes=True)
