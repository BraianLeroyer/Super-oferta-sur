from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class Sucursal(Base):
    __tablename__ = "sucursales"
    __table_args__ = (
        UniqueConstraint("comercio_id", "codigo_sucursal", name="uq_sucursal_comercio_codigo"),
    )

    id = Column(Integer, primary_key=True, index=True)
    comercio_id = Column(Integer, ForeignKey("comercios.id"), nullable=True, index=True)
    codigo_sucursal = Column(String(50), nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    provincia = Column(String(100), server_default="Chubut")
    tipo_sucursal = Column(String(50), server_default="supermercado")  # supermercado | mayorista
    extra_config = Column(Text, nullable=True)
    creado_en = Column(DateTime, server_default=func.now())

    comercio = relationship("Comercio", back_populates="sucursales")
    precios_historial = relationship("PrecioHistorial", back_populates="sucursal", cascade="all, delete-orphan")
    jobs = relationship("ScraperJob", back_populates="sucursal")
