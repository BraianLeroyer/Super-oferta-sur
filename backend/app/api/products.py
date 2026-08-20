from typing import List, Optional, Any
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.database import get_db
from app.models.producto import Producto
from app.models.precio_historial import PrecioHistorial
from app.models.sucursal import Sucursal
from app.models.comercio import Comercio
from app.schemas.producto import ProductoOut, ProductoDetailOut
from app.schemas.precio_historial import PrecioHistorialOut
from app.schemas.comparison import ComparacionComercioOut, ComparacionItemOut, ComparacionOriginalOut, ComparacionResponseOut
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
        yaguar_ofertas_subquery = (
            db.query(PrecioHistorial.producto_id)
            .join(Sucursal, Sucursal.id == PrecioHistorial.sucursal_id)
            .join(Comercio, Comercio.id == Sucursal.comercio_id)
            .filter(
                Comercio.slug == "yaguar",
                or_(
                    Producto.sku.in_(YAGUAR_OFERTA_SEMANAL_SKUS),
                    PrecioHistorial.precio_oferta.isnot(None),
                )
            )
            .distinct()
        )
        query = query.filter(Producto.id.in_(yaguar_ofertas_subquery))

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

        if selected_sucursal_id and latest_price is None:
            continue

        if latest_price:
            effective_price = float(latest_price.precio_oferta or latest_price.precio_lista or latest_price.precio_bulto or 0)
            if effective_price <= 0:
                continue
            if min_price is not None and effective_price < min_price:
                continue
            if max_price is not None and effective_price > max_price:
                continue

        d = _producto_out_dict(prod, latest_price)
        d["es_oferta_semanal"] = str(prod.sku) in YAGUAR_OFERTA_SEMANAL_SKUS or (
            prod.comercio is not None and prod.comercio.slug == "yaguar" and bool(latest_price and latest_price.precio_oferta)
        )
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


import unicodedata

_STOPWORDS = {'de', 'del', 'la', 'el', 'las', 'los', 'un', 'una', 'unos', 'unas',
              'x', 'con', 'por', 'para', 'en', 'al', 'a', 'y', 'o', 'e', 'the',
              'ml', 'cc', 'lt', 'lts', 'kg', 'gr', 'grs', 'g', 'zs', 'zz'}


def _normalize_title_tokens(title: str) -> List[str]:
    """Extrae tokens significativos de un título (sin acentos, sin stopwords, ≥ 3 chars).
    Divide en no-alfanuméricos para manejar 'c/Palo' -> 'palo', '500g' -> '500'."""
    if not title:
        return []
    nfkd = unicodedata.normalize('NFKD', title.lower())
    clean = ''.join(c for c in nfkd if not unicodedata.combining(c))
    words = re.split(r'[^a-z0-9]+', clean)
    tokens = []
    for w in words:
        if len(w) >= 3 and w not in _STOPWORDS:
            tokens.append(w)
    return tokens


def _match_score(original_tokens: List[str], candidate_tokens: List[str]) -> float:
    """Calcula el % de tokens originales que aparecen en el candidato."""
    if not original_tokens:
        return 0.0
    candidate_set = set(candidate_tokens)
    matched = sum(1 for t in original_tokens if t in candidate_set)
    return matched / len(original_tokens)


@router.get("/{product_id}/compare-prices", response_model=ComparacionResponseOut)
def compare_product_prices(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/products/{id}/compare-prices
    Compara el precio de un producto entre DIFERENTES comercios.
    Matching estricto: requiere TODOS los tokens significativos + misma categoría.
    Devuelve el producto original + todos los matches por comercio ordenados de menor a mayor.
    """
    producto = db.query(Producto).filter(Producto.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Obtener precio del original
    latest_original = (
        db.query(PrecioHistorial)
        .filter(PrecioHistorial.producto_id == product_id)
        .order_by(desc(PrecioHistorial.fecha_captura), desc(PrecioHistorial.id))
        .first()
    )

    original_out = ComparacionOriginalOut(
        producto_id=producto.id,
        titulo=producto.titulo,
        marca=producto.marca,
        imagen_url=producto.imagen_url,
        unidad_medida=producto.unidad_medida,
        comercio_nombre=producto.comercio.nombre if producto.comercio else "Desconocido",
        precio_lista=latest_original.precio_lista if latest_original else None,
        precio_oferta=latest_original.precio_oferta if latest_original else None,
    )

    # Tokens significativos del título original
    original_tokens = _normalize_title_tokens(producto.titulo)
    if not original_tokens:
        return ComparacionResponseOut(producto_original=original_out, comercios=[])

    # Buscar en OTROS comercios: TODOS los tokens del título deben aparecer
    query = db.query(Producto).filter(
        Producto.comercio_id != producto.comercio_id,
    )
    for token in original_tokens:
        pattern = _accent_insensitive_pattern(token)
        query = query.filter(Producto.titulo.op('~*')(pattern))

    other_products = query.all()
    if not other_products:
        return ComparacionResponseOut(producto_original=original_out, comercios=[])

    # Calcular score de overlap para cada producto
    scored_products = []
    for prod in other_products:
        cand_tokens = _normalize_title_tokens(prod.titulo)
        score = _match_score(original_tokens, cand_tokens)
        if score >= 0.6:
            scored_products.append((prod, score))

    if not scored_products:
        return ComparacionResponseOut(producto_original=original_out, comercios=[])

    product_ids = [p.id for p, _ in scored_products]

    # Subquery: último PrecioHistorial por (producto, sucursal)
    subq = (
        db.query(
            PrecioHistorial.producto_id,
            PrecioHistorial.sucursal_id,
            func.max(PrecioHistorial.id).label("max_id"),
        )
        .filter(PrecioHistorial.producto_id.in_(product_ids))
        .group_by(PrecioHistorial.producto_id, PrecioHistorial.sucursal_id)
        .subquery()
    )
    latest_prices = (
        db.query(PrecioHistorial)
        .join(
            subq,
            (PrecioHistorial.producto_id == subq.c.producto_id)
            & (PrecioHistorial.sucursal_id == subq.c.sucursal_id)
            & (PrecioHistorial.id == subq.c.max_id),
        )
        .all()
    )

    # Indexar: producto_id -> list(ph) de todas las sucursales
    prices_by_product = {}
    for ph in latest_prices:
        prices_by_product.setdefault(ph.producto_id, []).append(ph)

    # Agrupar por comercio
    comercios_data = {}
    for prod, score in scored_products:
        cid = prod.comercio_id
        ph_list = prices_by_product.get(prod.id, [])
        best_ph = None
        best_price = float('inf')
        for ph in ph_list:
            p = float(ph.precio_oferta or ph.precio_lista or 0)
            if 0 < p < best_price:
                best_price = p
                best_ph = ph
        if not best_ph or best_price <= 0:
            continue
        if cid not in comercios_data:
            comercios_data[cid] = {"productos": [], "mejor_precio": best_price}
        comercios_data[cid]["productos"].append((prod, best_ph, best_price, score))
        if best_price < comercios_data[cid]["mejor_precio"]:
            comercios_data[cid]["mejor_precio"] = best_price

    # Construir resultado: ordenar comercios por mejor precio
    result_comercios = []
    for cid, data in sorted(comercios_data.items(), key=lambda x: x[1]["mejor_precio"]):
        comercio = db.query(Comercio).filter(Comercio.id == cid).first()
        if not comercio:
            continue
        # Ordenar productos de este comercio por precio (menor a mayor)
        prods_sorted = sorted(data["productos"], key=lambda x: x[2])
        items = []
        for prod, ph, price, score in prods_sorted:
            items.append(ComparacionItemOut(
                producto_id=prod.id,
                sku=prod.sku,
                titulo=prod.titulo,
                marca=prod.marca,
                imagen_url=prod.imagen_url,
                unidad_medida=prod.unidad_medida,
                precio_lista=ph.precio_lista,
                precio_oferta=ph.precio_oferta,
                disponible=ph.disponible,
            ))
        result_comercios.append(ComparacionComercioOut(
            comercio_nombre=comercio.nombre,
            comercio_slug=comercio.slug,
            comercio_color=comercio.color,
            mejor_precio=data["mejor_precio"],
            productos=items,
        ))

    return ComparacionResponseOut(
        producto_original=original_out,
        comercios=result_comercios,
    )


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
