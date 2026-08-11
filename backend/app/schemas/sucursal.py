from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class SucursalBase(BaseModel):
    codigo_sucursal: str
    nombre: str
    provincia: Optional[str] = "Chubut"

class SucursalCreate(SucursalBase):
    pass

class SucursalOut(SucursalBase):
    id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)
