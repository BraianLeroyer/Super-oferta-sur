from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal
from app.schemas.sucursal import SucursalOut

class PrecioHistorialBase(BaseModel):
    precio_lista: Decimal
    precio_oferta: Optional[Decimal] = None
    es_oferta_club: bool = False
    disponible: bool = True

class PrecioHistorialCreate(PrecioHistorialBase):
    producto_id: int
    sucursal_id: int

class PrecioHistorialOut(PrecioHistorialBase):
    id: int
    producto_id: int
    sucursal_id: int
    fecha_captura: datetime
    sucursal: Optional[SucursalOut] = None

    model_config = ConfigDict(from_attributes=True)
