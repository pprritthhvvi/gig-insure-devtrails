import uuid
from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import BaseModel

class Worker(BaseModel):
    __tablename__ = "workers"

    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False) # 'ZOMATO', 'SWIGGY', etc.
    zone: Mapped[str] = mapped_column(String(100), nullable=True) # E.g. "Bandra, Mumbai"
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)
    risk_score: Mapped[float] = mapped_column(Float, default=50.0)

    # Relationships
    policies = relationship("Policy", back_populates="worker", cascade="all, delete-orphan")
