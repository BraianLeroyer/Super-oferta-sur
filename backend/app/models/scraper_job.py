import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class ScraperJob(Base):
    __tablename__ = "scraper_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=True)
    estado = Column(String(50), nullable=False, default="PENDING") # PENDING, RUNNING, FINISHED, FAILED
    total_scrapeados = Column(Integer, default=0)
    total_errores = Column(Integer, default=0)
    mensaje_error = Column(Text, nullable=True)
    iniciado_en = Column(DateTime, server_default=func.now())
    finalizado_en = Column(DateTime, nullable=True)

    sucursal = relationship("Sucursal", back_populates="jobs")
