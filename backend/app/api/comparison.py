import re
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.comercio import Comercio
from app.models.producto import Producto
from app.api.products import _accent_insensitive_pattern, _latest_price_map, _producto_out_dict
from app.schemas.comparison import ComercioComparacionOut

router = APIRouter(prefix="/comparison", tags=["Comparison"])


@router.get("", response_model=List[ComercioComparacionOut])
def compare_products(
    q: str = Query(..., min_length=1, description="Producto a comparar entre comercios"),
    limite_por_comercio: int = Query(5, ge=1, le=20, description="Máx. productos por comercio"),
    db: Session = Depends(get_db),
):
    """
    GET /api/v1/comparison?q=leche&limite_por_comercio=5
    Comparación multi-tienda: busca el término (sin acentos / mayúsculas) en
    cada comercio habilitado y devuelve sus productos con el último precio.
    """
    tokens = [t for t in q.split() if t]
    resultado = []

    comercios = db.query(Comercio).filter(Comercio.habilitado == True).order_by(Comercio.nombre).all()
    for comercio in comercios:
        query = db.query(Producto).filter(Producto.comercio_id == comercio.id)
        for token in tokens:
            pattern = _accent_insensitive_pattern(token)
            query = query.filter(
                Producto.titulo.op('~*')(pattern)
                | Producto.marca.op('~*')(pattern)
                | Producto.categoria.op('~*')(pattern)
                | Producto.sku.op('~*')(re.escape(token))
            )
        productos = query.limit(limite_por_comercio).all()
        sucursal = comercio.sucursales[0] if comercio.sucursales else None
        latest = _latest_price_map(db, [p.id for p in productos], sucursal.id if sucursal else None)
        items = [_producto_out_dict(p, latest.get(p.id)) for p in productos]
        resultado.append({"comercio": comercio, "productos": items})

    return resultado
