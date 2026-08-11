from typing import List, Optional
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

@router.get("", response_model=List[ProductoOut])
def get_products(
    search: Optional[str] = None,
    marca: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sucursal_id: Optional[int] = None,
    sucursal: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products
    Filtra productos por texto (título/SKU), marca, rango de precio y sucursal/ubicación.
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
        query = query.filter(
            (Producto.titulo.ilike(f"%{search}%")) | (Producto.sku.ilike(f"%{search}%"))
        )

    if marca:
        query = query.filter(Producto.marca.ilike(f"%{marca}%"))

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
            "imagen_url": prod.imagen_url,
            "unidad_medida": prod.unidad_medida,
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
        "imagen_url": producto.imagen_url,
        "unidad_medida": producto.unidad_medida,
        "creado_en": producto.creado_en,
        "actualizado_en": producto.actualizado_en,
        "precio_actual_lista": latest_price.precio_lista if latest_price else None,
        "precio_actual_oferta": latest_price.precio_oferta if latest_price else None,
        "es_oferta_club": latest_price.es_oferta_club if latest_price else False,
        "disponible": latest_price.disponible if latest_price else True,
        "sucursal_nombre": latest_price.sucursal.nombre if latest_price and latest_price.sucursal else None,
        "historial_precios": historial
    }
