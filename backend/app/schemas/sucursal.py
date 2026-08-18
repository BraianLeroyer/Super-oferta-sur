from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class SucursalBase(BaseModel):
    codigo_sucursal: str
    nombre: str
    provincia: Optional[str] = "Chubut"
    tipo_sucursal: Optional[str] = "supermercado"
    comercio_id: Optional[int] = None

class SucursalCreate(SucursalBase):
    pass

class SucursalOut(SucursalBase):
    id: int
    comercio_id: Optional[int] = None
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)
