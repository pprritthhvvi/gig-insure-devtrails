import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import BaseModel, GUID

class Claim(BaseModel):
    __tablename__ = "claims"

    policy_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("policies.id", ondelete="CASCADE"), index=True, nullable=False)
    
    disruption_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # 'RAIN', 'HEAT', etc.
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    claimed_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="FILED", index=True)
    
    fraud_score: Mapped[int] = mapped_column(Integer, default=0)
    
    payout_amount: Mapped[float] = mapped_column(Float, nullable=True)
    payout_status: Mapped[str] = mapped_column(String(50), default="PENDING")

    # Relationships
    policy = relationship("Policy", back_populates="claims")
