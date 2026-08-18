from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Comercio(Base):
    __tablename__ = "comercios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    tipo = Column(String(50), nullable=False, default="supermercado")  # supermercado | hipermercado | mayorista
    base_url = Column(String(255), nullable=True)
    scraping_modo = Column(String(50), nullable=False, default="html")  # vtex | woocommerce | html
    color = Column(String(20), nullable=True)
    habilitado = Column(Boolean, default=True)
    creado_en = Column(DateTime, server_default=func.now())

    sucursales = relationship("Sucursal", back_populates="comercio")
    productos = relationship("Producto", back_populates="comercio")
    jobs = relationship("ScraperJob", back_populates="comercio")
