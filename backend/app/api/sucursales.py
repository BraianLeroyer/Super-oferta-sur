from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sucursal import Sucursal
from app.schemas.sucursal import SucursalOut, SucursalCreate

router = APIRouter(prefix="/sucursales", tags=["Sucursales"])

@router.get("", response_model=List[SucursalOut])
def get_sucursales(db: Session = Depends(get_db)):
    """
    GET /api/v1/sucursales
    Listado de todas las sucursales configuradas en el sistema.
    """
    return db.query(Sucursal).order_by(Sucursal.nombre.asc()).all()

@router.post("", response_model=SucursalOut)
def create_sucursal(payload: SucursalCreate, db: Session = Depends(get_db)):
    """
    POST /api/v1/sucursales
    Registra una nueva sucursal.
    """
    existing = db.query(Sucursal).filter(Sucursal.codigo_sucursal == payload.codigo_sucursal).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de sucursal ya existe")
    
    sucursal = Sucursal(**payload.model_dump())
    db.add(sucursal)
    db.commit()
    db.refresh(sucursal)
    return sucursal
