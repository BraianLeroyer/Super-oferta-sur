from sqlalchemy import Column, BigInteger, Integer, Numeric, Boolean, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.database import Base

class PrecioHistorial(Base):
    __tablename__ = "precios_historial"
    __table_args__ = (
        Index("idx_precios_producto_fecha", "producto_id", "fecha_captura"),
    )

    id = Column(BigInteger, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id", ondelete="CASCADE"), nullable=False)
    precio_lista = Column(Numeric(12, 2), nullable=False)
    precio_oferta = Column(Numeric(12, 2), nullable=True)
    es_oferta_club = Column(Boolean, default=False)
    disponible = Column(Boolean, default=True)
    fecha_captura = Column(DateTime, server_default=func.now(), index=True)

    producto = relationship("Producto", back_populates="precios_historial")
    sucursal = relationship("Sucursal", back_populates="precios_historial")

Index("idx_precios_sucursal", PrecioHistorial.sucursal_id)
Index("idx_precios_fecha", PrecioHistorial.fecha_captura)
