from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.comercio import Comercio
from app.schemas.comercio import ComercioOut, ComercioDetailOut

router = APIRouter(prefix="/comercios", tags=["Comercios"])


@router.get("", response_model=List[ComercioOut])
def get_comercios(db: Session = Depends(get_db)):
    """
    GET /api/v1/comercios
    Listado de las cadenas (comercios) configuradas y habilitadas.
    """
    return db.query(Comercio).filter(Comercio.habilitado == True).order_by(Comercio.nombre).all()


@router.get("/{slug}", response_model=ComercioDetailOut)
def get_comercio(slug: str, db: Session = Depends(get_db)):
    """
    GET /api/v1/comercios/{slug}
    Detalle de un comercio con sus sucursales.
    """
    comercio = db.query(Comercio).filter(Comercio.slug == slug).first()
    if not comercio:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
    return comercio
