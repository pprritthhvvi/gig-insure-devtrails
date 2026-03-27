import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import BaseModel, GUID


class Payment(BaseModel):
    __tablename__ = "payments"

    claim_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("claims.id", ondelete="CASCADE"), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("workers.id", ondelete="CASCADE"), index=True, nullable=False)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="UPI")  # UPI, BANK, WALLET
    gateway: Mapped[str] = mapped_column(String(50), default="RAZORPAY")
    gateway_transaction_id: Mapped[str] = mapped_column(String(200), nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="INITIATED", index=True)  # INITIATED, PROCESSING, SUCCESS, FAILED
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    claim = relationship("Claim", backref="payments")
    worker = relationship("Worker", backref="payments")
