from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from decimal import Decimal
from app.schemas.comercio import ComercioOut
from app.schemas.producto import ProductoOut


class ComercioComparacionOut(BaseModel):
    comercio: ComercioOut
    productos: List[ProductoOut] = []

    model_config = ConfigDict(from_attributes=True)


class ComparacionItemOut(BaseModel):
    producto_id: int
    sku: str
    titulo: str
    marca: Optional[str] = None
    imagen_url: Optional[str] = None
    unidad_medida: Optional[str] = None
    precio_lista: Optional[Decimal] = None
    precio_oferta: Optional[Decimal] = None
    disponible: bool = True


class ComparacionOriginalOut(BaseModel):
    producto_id: int
    titulo: str
    marca: Optional[str] = None
    imagen_url: Optional[str] = None
    unidad_medida: Optional[str] = None
    comercio_nombre: str
    precio_lista: Optional[Decimal] = None
    precio_oferta: Optional[Decimal] = None


class ComparacionComercioOut(BaseModel):
    comercio_nombre: str
    comercio_slug: str
    comercio_color: Optional[str] = None
    mejor_precio: float
    productos: List[ComparacionItemOut] = []


class ComparacionResponseOut(BaseModel):
    producto_original: ComparacionOriginalOut
    comercios: List[ComparacionComercioOut] = []
