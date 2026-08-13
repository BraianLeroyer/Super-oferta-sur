from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Sucursal(Base):
    __tablename__ = "sucursales"

    id = Column(Integer, primary_key=True, index=True)
    codigo_sucursal = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    provincia = Column(String(100), server_default="Chubut")
    creado_en = Column(DateTime, server_default=func.now())

    precios_historial = relationship("PrecioHistorial", back_populates="sucursal", cascade="all, delete-orphan")
    jobs = relationship("ScraperJob", back_populates="sucursal")
