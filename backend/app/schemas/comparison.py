from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.comercio import ComercioOut
from app.schemas.producto import ProductoOut

class ComercioComparacionOut(BaseModel):
    comercio: ComercioOut
    productos: List[ProductoOut] = []

    model_config = ConfigDict(from_attributes=True)
