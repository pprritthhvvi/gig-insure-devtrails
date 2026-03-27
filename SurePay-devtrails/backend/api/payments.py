"""
Payment API Routes
Handles payout initiation, status tracking, and payment history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database import get_db
from models.claim import Claim
from models.policy import Policy
from models.payment import Payment

router = APIRouter()


# Request/Response Models
class InitiatePayoutRequest(BaseModel):
    claim_id: uuid.UUID
    payment_method: str = "UPI"  # UPI, BANK, WALLET


class PaymentResponse(BaseModel):
    payment_id: str
    claim_id: str
    amount: float
    gateway: str
    gateway_transaction_id: Optional[str] = None
    status: str
    payment_method: str
    created_at: str
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/initiate-payout", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def initiate_payout(request: InitiatePayoutRequest, db: AsyncSession = Depends(get_db)):
    """
    Initiate a payout for an approved claim.
    In production, this would integrate with Razorpay.
    For MVP, we simulate the payment processing.
    """
    # Verify claim exists and is approved
    result = await db.execute(select(Claim).where(Claim.id == request.claim_id))
    claim = result.scalars().first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Claim is not approved (status: {claim.status})")

    if not claim.payout_amount or claim.payout_amount <= 0:
        raise HTTPException(status_code=400, detail="No payout amount set for this claim")

    # Check if payout already initiated
    existing = await db.execute(
        select(Payment).where(Payment.claim_id == request.claim_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Payout already initiated for this claim")

    # Get worker_id from policy
    policy_result = await db.execute(select(Policy).where(Policy.id == claim.policy_id))
    policy = policy_result.scalars().first()

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Create payment record (simulated gateway)
    gateway_txn_id = f"razorpay_txn_{uuid.uuid4().hex[:12]}"

    payment = Payment(
        claim_id=claim.id,
        worker_id=policy.worker_id,
        amount=claim.payout_amount,
        payment_method=request.payment_method,
        gateway="RAZORPAY",
        gateway_transaction_id=gateway_txn_id,
        status="PROCESSING",
    )

    db.add(payment)

    # Update claim payout status
    claim.payout_status = "PROCESSING"
    db.add(claim)

    await db.commit()
    await db.refresh(payment)

    return PaymentResponse(
        payment_id=str(payment.id),
        claim_id=str(payment.claim_id),
        amount=payment.amount,
        gateway=payment.gateway,
        gateway_transaction_id=payment.gateway_transaction_id,
        status=payment.status,
        payment_method=payment.payment_method,
        created_at=payment.created_at.isoformat() if payment.created_at else "",
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_status(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get payment status by ID."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return PaymentResponse(
        payment_id=str(payment.id),
        claim_id=str(payment.claim_id),
        amount=payment.amount,
        gateway=payment.gateway,
        gateway_transaction_id=payment.gateway_transaction_id,
        status=payment.status,
        payment_method=payment.payment_method,
        created_at=payment.created_at.isoformat() if payment.created_at else "",
        completed_at=payment.completed_at.isoformat() if payment.completed_at else None,
    )


@router.post("/{payment_id}/complete")
async def complete_payment(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Mark a payment as completed (simulates Razorpay webhook callback).
    In production, this would be triggered by Razorpay webhook.
    """
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = "SUCCESS"
    payment.completed_at = datetime.now(timezone.utc)
    db.add(payment)

    # Update claim payout status
    claim_result = await db.execute(select(Claim).where(Claim.id == payment.claim_id))
    claim = claim_result.scalars().first()
    if claim:
        claim.payout_status = "COMPLETED"
        db.add(claim)

    await db.commit()

    return {
        "message": "Payment completed successfully",
        "payment_id": str(payment.id),
        "status": "SUCCESS",
        "completed_at": payment.completed_at.isoformat(),
    }


@router.get("/worker/{worker_id}", response_model=dict)
async def get_worker_payments(worker_id: str, db: AsyncSession = Depends(get_db)):
    """Get payment history for a worker."""
    try:
        worker_uuid = uuid.UUID(worker_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid worker ID")

    result = await db.execute(
        select(Payment)
        .where(Payment.worker_id == worker_uuid)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    total_paid = sum(p.amount for p in payments if p.status == "SUCCESS")

    return {
        "payments": [
            {
                "payment_id": str(p.id),
                "claim_id": str(p.claim_id),
                "amount": p.amount,
                "status": p.status,
                "payment_method": p.payment_method,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
            }
            for p in payments
        ],
        "total_paid": total_paid,
        "total_transactions": len(payments),
    }
