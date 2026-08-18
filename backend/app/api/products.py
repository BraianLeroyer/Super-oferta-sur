from typing import List, Optional, Any
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.producto import Producto
from app.models.precio_historial import PrecioHistorial
from app.models.sucursal import Sucursal
from app.models.comercio import Comercio
from app.schemas.producto import ProductoOut, ProductoDetailOut
from app.schemas.precio_historial import PrecioHistorialOut
from app.scraper.ofertas_semanales import YAGUAR_OFERTA_SEMANAL_SKUS

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


def _latest_price_map(db: Session, product_ids: List[int], sucursal_id: Optional[int]) -> dict:
    """Último precio por producto en UNA sola consulta (DISTINCT ON), evitando el N+1."""
    if not product_ids:
        return {}
    price_query = db.query(PrecioHistorial).filter(PrecioHistorial.producto_id.in_(product_ids))
    if sucursal_id:
        price_query = price_query.filter(PrecioHistorial.sucursal_id == sucursal_id)
    latest_prices = (
        price_query
        .order_by(
            PrecioHistorial.producto_id,
            desc(PrecioHistorial.fecha_captura),
            desc(PrecioHistorial.id),
        )
        .distinct(PrecioHistorial.producto_id)
        .all()
    )
    return {ph.producto_id: ph for ph in latest_prices}


def _producto_out_dict(prod: Producto, latest_price) -> dict:
    comercio_nombre = prod.comercio.nombre if prod.comercio else None
    return {
        "id": prod.id,
        "sku": prod.sku,
        "titulo": prod.titulo,
        "marca": prod.marca,
        "descripcion": prod.descripcion,
        "imagen_url": prod.imagen_url,
        "unidad_medida": prod.unidad_medida,
        "url_producto": prod.url_producto,
        "categoria": prod.categoria,
        "comercio_id": prod.comercio_id,
        "creado_en": prod.creado_en,
        "actualizado_en": prod.actualizado_en,
        "precio_actual_lista": latest_price.precio_lista if latest_price else None,
        "precio_actual_oferta": latest_price.precio_oferta if latest_price else None,
        "precio_bulto": latest_price.precio_bulto if latest_price else None,
        "descripcion_bulto": latest_price.descripcion_bulto if latest_price else None,
        "es_oferta_club": latest_price.es_oferta_club if latest_price else False,
        "disponible": latest_price.disponible if latest_price else True,
        "sucursal_nombre": latest_price.sucursal.nombre if latest_price and latest_price.sucursal else None,
        "tipo_sucursal": latest_price.sucursal.tipo_sucursal if latest_price and latest_price.sucursal else None,
        "comercio_nombre": comercio_nombre,
    }


def _resolve_comercio_id(db: Session, comercio_id: Optional[int], comercio: Optional[str]) -> Optional[int]:
    if comercio_id:
        return comercio_id
    if comercio:
        c = db.query(Comercio).filter(
            (Comercio.nombre.ilike(f"%{comercio}%")) | (Comercio.slug.ilike(f"%{comercio}%"))
        ).first()
        if c:
            return c.id
    return None


def _resolve_sucursal_id(db: Session, sucursal_id: Optional[int], sucursal: Optional[str],
                         comercio_id: Optional[int]) -> Optional[int]:
    if sucursal_id:
        return sucursal_id
    if sucursal:
        q = db.query(Sucursal)
        if comercio_id:
            q = q.filter(Sucursal.comercio_id == comercio_id)
        suc_obj = q.filter(
            (Sucursal.nombre.ilike(f"%{sucursal}%")) | (Sucursal.codigo_sucursal.ilike(f"%{sucursal}%"))
        ).first()
        if suc_obj:
            return suc_obj.id
    return None


@router.get("", response_model=List[ProductoOut])
def get_products(
    search: Optional[str] = None,
    marca: Optional[str] = None,
    categoria: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sucursal_id: Optional[int] = None,
    sucursal: Optional[str] = None,
    comercio_id: Optional[int] = None,
    comercio: Optional[str] = None,
    bulto_cerrado: Optional[bool] = None,
    oferta_semanal: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products
    Filtra productos por texto (título/SKU/marca/categoría), rango de precio,
    sucursal/ubicación y comercio (cadena: la-anonima, carrefour, jumbo, vea,
    mas-online, diarco, yaguar). El parámetro bulto_cerrado=true devuelve solo
    productos con precio_bulto (mayoristas / bulto cerrado).
    """
    selected_comercio_id = _resolve_comercio_id(db, comercio_id, comercio)
    selected_sucursal_id = _resolve_sucursal_id(db, sucursal_id, sucursal, selected_comercio_id)

    query = db.query(Producto)

    if selected_comercio_id:
        query = query.filter(Producto.comercio_id == selected_comercio_id)

    if bulto_cerrado:
        bulto_product_ids = (
            db.query(PrecioHistorial.producto_id)
            .join(Sucursal, Sucursal.id == PrecioHistorial.sucursal_id)
            .join(Comercio, Comercio.id == Sucursal.comercio_id)
            .filter(
                PrecioHistorial.precio_bulto.isnot(None),
                Comercio.slug == "yaguar",
            )
            .distinct()
        )
        query = query.filter(Producto.id.in_(bulto_product_ids))
        for _kw in ('TAPA', 'EMPANADA', 'SALCHICHA', 'HAMBURG'):
            query = query.filter(Producto.titulo.notilike(f"%{_kw}%"))

    if oferta_semanal:
        query = query.filter(Producto.sku.in_(YAGUAR_OFERTA_SEMANAL_SKUS))

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
    product_ids = [prod.id for prod in productos]

    latest_by_product = _latest_price_map(db, product_ids, selected_sucursal_id)

    result = []
    for prod in productos:
        latest_price = latest_by_product.get(prod.id)

        # Si hay filtro por precio
        if latest_price:
            effective_price = float(latest_price.precio_oferta or latest_price.precio_lista)
            if min_price is not None and effective_price < min_price:
                continue
            if max_price is not None and effective_price > max_price:
                continue

        d = _producto_out_dict(prod, latest_price)
        d["es_oferta_semanal"] = str(prod.sku) in YAGUAR_OFERTA_SEMANAL_SKUS
        result.append(d)

    return result


@router.get("/suggestions", response_model=List[ProductoOut])
def get_product_suggestions(
    q: Optional[str] = Query(None, min_length=2, description="Texto a sugerir (rubro Almacén)"),
    sucursal_id: Optional[int] = None,
    comercio_id: Optional[int] = None,
    limit: int = Query(8, ge=1, le=15),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products/suggestions
    Sugerencias de autocompletado. En La Anónima solo del rubro Almacén
    (categoría empieza con "Almacén"); en el resto de cadenas busca en todo
    el catálogo del comercio. Cada fila trae título, marca, unidad de medida,
    imagen y último precio (por sucursal si se pasa).
    """
    query = db.query(Producto)

    es_anonima = True
    if comercio_id:
        comercio = db.query(Comercio).filter(Comercio.id == comercio_id).first()
        es_anonima = comercio.slug == "la-anonima" if comercio else False
        query = query.filter(Producto.comercio_id == comercio_id)

    if es_anonima:
        query = query.filter(Producto.categoria.ilike("Almacén%"))

    if q:
        tokens = [t for t in q.split() if t]
        for token in tokens:
            pattern = _accent_insensitive_pattern(token)
            query = query.filter(
                Producto.titulo.op('~*')(pattern)
                | Producto.marca.op('~*')(pattern)
                | Producto.sku.op('~*')(re.escape(token))
            )

    # Prioriza productos cuyo TÍTULO EMPIEZA con el término (ej: "arroz" -> "Arroz ..." antes que "Chocoarroz")
    if q:
        first_token = [t for t in q.split() if t][0]
        starts_with = Producto.titulo.op('~*')('^' + _accent_insensitive_pattern(first_token))
        productos = query.order_by(
            starts_with.desc(),
            Producto.titulo.asc()
        ).limit(limit).all()
    else:
        productos = query.order_by(Producto.titulo.asc()).limit(limit).all()
    product_ids = [prod.id for prod in productos]
    latest_by_product = _latest_price_map(db, product_ids, sucursal_id)

    results = []
    for prod in productos:
        d = _producto_out_dict(prod, latest_by_product.get(prod.id))
        results.append(d)
    return results


@router.get("/categories", response_model=List[str])
def get_categorias(
    comercio_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    GET /api/v1/products/categories
    Retorna la lista de categorías disponibles en el catálogo (opcional por comercio).
    """
    q = (
        db.query(Producto.categoria)
        .filter(Producto.categoria.isnot(None), Producto.categoria != "")
    )
    if comercio_id:
        q = q.filter(Producto.comercio_id == comercio_id)
    rows = q.distinct().order_by(Producto.categoria.asc()).all()
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

    result = _producto_out_dict(producto, latest_price)
    result["historial_precios"] = historial
    return result
