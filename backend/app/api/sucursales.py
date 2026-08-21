from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sucursal import Sucursal
from app.models.comercio import Comercio
from app.schemas.sucursal import SucursalOut, SucursalCreate

router = APIRouter(prefix="/sucursales", tags=["Sucursales"])


@router.get("", response_model=List[SucursalOut])
@router.get("/", response_model=List[SucursalOut], include_in_schema=False)
def get_sucursales(
    comercio_id: Optional[int] = None,
    comercio: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/sucursales
    Listado de sucursales. Se puede filtrar por comercio_id o nombre/slug de comercio.
    """
    query = db.query(Sucursal)
    if comercio_id:
        query = query.filter(Sucursal.comercio_id == comercio_id)
    elif comercio:
        c = db.query(Comercio).filter(
            (Comercio.nombre.ilike(f"%{comercio}%")) | (Comercio.slug.ilike(f"%{comercio}%"))
        ).first()
        if c:
            query = query.filter(Sucursal.comercio_id == c.id)
    return query.order_by(Sucursal.nombre.asc()).all()


@router.post("", response_model=SucursalOut)
def create_sucursal(payload: SucursalCreate, db: Session = Depends(get_db)):
    """
    POST /api/v1/sucursales
    Registra una nueva sucursal (código único dentro de su comercio).
    """
    existing = db.query(Sucursal).filter(
        Sucursal.codigo_sucursal == payload.codigo_sucursal,
        Sucursal.comercio_id == payload.comercio_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de sucursal ya existe en ese comercio")

    sucursal = Sucursal(**payload.model_dump())
    db.add(sucursal)
    db.commit()
    db.refresh(sucursal)
    return sucursal
