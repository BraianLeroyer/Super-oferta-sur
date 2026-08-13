from typing import List, Optional
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.producto import Producto
from app.models.precio_historial import PrecioHistorial
from app.models.sucursal import Sucursal
from app.schemas.producto import ProductoOut, ProductoDetailOut
from app.schemas.precio_historial import PrecioHistorialOut

router = APIRouter(prefix="/products", tags=["Products"])

_ACCENT_CLASSES = {
    'a': '[aáàâä]', 'e': '[eéèêë]', 'i': '[iíìîï]', 'o': '[oóòôõö]',
    'u': '[uúùûü]', 'n': '[nñ]', 'c': '[cç]', 'y': '[yýÿ]',
}


def _accent_insensitive_pattern(term: str) -> str:
    """Convierte el término en un patrón regex que ignora acentos (ej: 'jabon' -> 'j[a]bon')."""
    out = []
    for ch in (term or ''):
        lower = ch.lower()
        if lower in _ACCENT_CLASSES:
            out.append(_ACCENT_CLASSES[lower])
        else:
            out.append(re.escape(lower))
    return ''.join(out)

@router.get("", response_model=List[ProductoOut])
def get_products(
    search: Optional[str] = None,
    marca: Optional[str] = None,
    categoria: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sucursal_id: Optional[int] = None,
    sucursal: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products
    Filtra productos por texto (título/SKU), marca, categoría, rango de precio y sucursal/ubicación.
    """
    # Si viene nombre de sucursal por texto (ej: "Trelew"), resolvemos el ID
    selected_sucursal_id = sucursal_id
    if not selected_sucursal_id and sucursal:
        suc_obj = db.query(Sucursal).filter(
            (Sucursal.nombre.ilike(f"%{sucursal}%")) | (Sucursal.codigo_sucursal.ilike(f"%{sucursal}%"))
        ).first()
        if suc_obj:
            selected_sucursal_id = suc_obj.id

    query = db.query(Producto)

    if search:
        # Búsqueda GENERAL: por nombre, marca, categoría y SKU, ignorando
        # mayúsculas/minúsculas y acentos. Cada palabra del término debe
        # aparecer en alguno de los campos (ej: "vino tinto" trae tintos).
        tokens = [t for t in search.split() if t]
        for token in tokens:
            pattern = _accent_insensitive_pattern(token)
            query = query.filter(
                Producto.titulo.op('~*')(pattern)
                | Producto.marca.op('~*')(pattern)
                | Producto.categoria.op('~*')(pattern)
                | Producto.sku.op('~*')(re.escape(token))
            )

    if marca:
        query = query.filter(Producto.marca.ilike(f"%{marca}%"))

    if categoria:
        query = query.filter(Producto.categoria.ilike(f"%{categoria}%"))

    # Paginación
    offset = (page - 1) * limit
    productos = query.order_by(Producto.id.asc()).offset(offset).limit(limit).all()

    result = []
    for prod in productos:
        # Buscar el último precio registrado para este producto
        price_query = db.query(PrecioHistorial).filter(PrecioHistorial.producto_id == prod.id)
        if selected_sucursal_id:
            price_query = price_query.filter(PrecioHistorial.sucursal_id == selected_sucursal_id)

        latest_price = price_query.order_by(desc(PrecioHistorial.fecha_captura)).first()

        # Si hay filtro por precio
        if latest_price:
            effective_price = float(latest_price.precio_oferta or latest_price.precio_lista)
            if min_price is not None and effective_price < min_price:
                continue
            if max_price is not None and effective_price > max_price:
                continue

        prod_dict = {
            "id": prod.id,
            "sku": prod.sku,
            "titulo": prod.titulo,
            "marca": prod.marca,
            "descripcion": prod.descripcion,
            "imagen_url": prod.imagen_url,
            "unidad_medida": prod.unidad_medida,
            "url_producto": prod.url_producto,
            "categoria": prod.categoria,
            "creado_en": prod.creado_en,
            "actualizado_en": prod.actualizado_en,
            "precio_actual_lista": latest_price.precio_lista if latest_price else None,
            "precio_actual_oferta": latest_price.precio_oferta if latest_price else None,
            "es_oferta_club": latest_price.es_oferta_club if latest_price else False,
            "disponible": latest_price.disponible if latest_price else True,
            "sucursal_nombre": latest_price.sucursal.nombre if latest_price and latest_price.sucursal else None
        }
        result.append(prod_dict)

    return result

@router.get("/categories", response_model=List[str])
def get_categorias(db: Session = Depends(get_db)):
    """
    GET /api/v1/products/categories
    Retorna la lista de categorías disponibles en el catálogo.
    """
    rows = (
        db.query(Producto.categoria)
        .filter(Producto.categoria.isnot(None), Producto.categoria != "")
        .distinct()
        .order_by(Producto.categoria.asc())
        .all()
    )
    return [row[0] for row in rows]

@router.get("/{product_id}/price-history", response_model=ProductoDetailOut)
def get_product_price_history(
    product_id: int,
    sucursal_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products/{id}/price-history
    Retorna el historial de precios de un producto en una sucursal específica o global.
    """
    producto = db.query(Producto).filter(Producto.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    history_query = db.query(PrecioHistorial).filter(PrecioHistorial.producto_id == product_id)
    if sucursal_id:
        history_query = history_query.filter(PrecioHistorial.sucursal_id == sucursal_id)

    historial = history_query.order_by(desc(PrecioHistorial.fecha_captura)).all()

    latest_price = historial[0] if historial else None

    return {
        "id": producto.id,
        "sku": producto.sku,
        "titulo": producto.titulo,
        "marca": producto.marca,
        "descripcion": producto.descripcion,
        "imagen_url": producto.imagen_url,
        "unidad_medida": producto.unidad_medida,
        "url_producto": producto.url_producto,
        "categoria": producto.categoria,
        "creado_en": producto.creado_en,
        "actualizado_en": producto.actualizado_en,
        "precio_actual_lista": latest_price.precio_lista if latest_price else None,
        "precio_actual_oferta": latest_price.precio_oferta if latest_price else None,
        "es_oferta_club": latest_price.es_oferta_club if latest_price else False,
        "disponible": latest_price.disponible if latest_price else True,
        "sucursal_nombre": latest_price.sucursal.nombre if latest_price and latest_price.sucursal else None,
        "historial_precios": historial
    }
