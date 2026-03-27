import uuid
from datetime import date
from sqlalchemy import Column, String, Float, ForeignKey, Date, ARRAY
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import BaseModel, GUID

class Policy(BaseModel):
    __tablename__ = "policies"

    worker_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("workers.id", ondelete="CASCADE"), index=True, nullable=False)
    
    premium_amount: Mapped[float] = mapped_column(Float, nullable=False)
    coverage_start: Mapped[date] = mapped_column(Date, nullable=False)
    coverage_end: Mapped[date] = mapped_column(Date, nullable=False)
    max_payout_per_week: Mapped[float] = mapped_column(Float, default=2000.0)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)

    # Relationships
    worker = relationship("Worker", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", cascade="all, delete-orphan")
