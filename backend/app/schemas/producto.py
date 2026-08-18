from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
from app.schemas.precio_historial import PrecioHistorialOut

class ProductoBase(BaseModel):
    sku: str
    titulo: str
    marca: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    unidad_medida: Optional[str] = None
    url_producto: Optional[str] = None
    categoria: Optional[str] = None
    comercio_id: Optional[int] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoOut(ProductoBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime
    # Precios actuales / último precio en la sucursal seleccionada
    precio_actual_lista: Optional[Decimal] = None
    precio_actual_oferta: Optional[Decimal] = None
    precio_bulto: Optional[Decimal] = None
    descripcion_bulto: Optional[str] = None
    es_oferta_club: Optional[bool] = False
    disponible: Optional[bool] = True
    sucursal_nombre: Optional[str] = None
    tipo_sucursal: Optional[str] = None
    comercio_nombre: Optional[str] = None
    es_oferta_semanal: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class ProductoDetailOut(ProductoOut):
    historial_precios: List[PrecioHistorialOut] = []
