from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, func, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = (
        UniqueConstraint("comercio_id", "sku", name="uq_producto_comercio_sku"),
    )

    id = Column(Integer, primary_key=True, index=True)
    comercio_id = Column(Integer, ForeignKey("comercios.id"), nullable=True, index=True)
    sku = Column(String(100), nullable=False, index=True)
    titulo = Column(String(255), nullable=False)
    marca = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    imagen_url = Column(Text, nullable=True)
    unidad_medida = Column(String(50), nullable=True)
    url_producto = Column(Text, nullable=True)
    categoria = Column(String(200), nullable=True)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    comercio = relationship("Comercio", back_populates="productos")
    precios_historial = relationship("PrecioHistorial", back_populates="producto", cascade="all, delete-orphan")

Index("idx_productos_comercio_sku", Producto.comercio_id, Producto.sku)
