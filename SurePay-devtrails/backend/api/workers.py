"""
Worker API Routes
Worker profile management and risk scoring.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database import get_db
from models.worker import Worker
from models.policy import Policy
from models.claim import Claim
from services.pricing_service import pricing_service

router = APIRouter()


class WorkerProfileResponse(BaseModel):
    id: str
    name: str
    phone: str
    platform: str
    zone: Optional[str] = None
    status: str
    risk_score: float
    active_policies: int
    total_claims: int
    total_payouts: float

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    zone: Optional[str] = None


@router.get("/profile")
async def get_worker_profile(db: AsyncSession = Depends(get_db)):
    """
    Get current worker's profile with summary stats.
    For MVP, returns the first worker (no JWT auth yet).
    """
    result = await db.execute(select(Worker).limit(1))
    worker = result.scalars().first()

    if not worker:
        return {
            "id": "demo",
            "name": "Demo Worker",
            "phone": "9876543210",
            "platform": "Zomato",
            "zone": "Mumbai",
            "status": "ACTIVE",
            "risk_score": 50.0,
            "active_policies": 0,
            "total_claims": 0,
            "total_payouts": 0,
        }

    # Get stats
    policies_result = await db.execute(
        select(func.count(Policy.id))
        .where(Policy.worker_id == worker.id, Policy.status == "ACTIVE")
    )
    active_policies = policies_result.scalar() or 0

    claims_result = await db.execute(
        select(func.count(Claim.id))
        .join(Policy, Claim.policy_id == Policy.id)
        .where(Policy.worker_id == worker.id)
    )
    total_claims = claims_result.scalar() or 0

    payouts_result = await db.execute(
        select(func.sum(Claim.payout_amount))
        .join(Policy, Claim.policy_id == Policy.id)
        .where(Policy.worker_id == worker.id, Claim.status == "APPROVED")
    )
    total_payouts = float(payouts_result.scalar() or 0)

    return {
        "id": str(worker.id),
        "name": worker.name,
        "phone": worker.phone,
        "platform": worker.platform,
        "zone": worker.zone,
        "status": worker.status,
        "risk_score": worker.risk_score,
        "active_policies": active_policies,
        "total_claims": total_claims,
        "total_payouts": total_payouts,
    }


@router.put("/profile")
async def update_worker_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update worker profile fields."""
    result = await db.execute(select(Worker).limit(1))
    worker = result.scalars().first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if data.name is not None:
        worker.name = data.name
    if data.platform is not None:
        worker.platform = data.platform
    if data.zone is not None:
        worker.zone = data.zone

    db.add(worker)
    await db.commit()
    await db.refresh(worker)

    return {"message": "Profile updated successfully", "worker_id": str(worker.id)}


@router.get("/premium-quote")
async def get_premium_quote(
    zone: str = "Mumbai",
    platform: str = "Zomato",
    max_payout: float = 2000.0,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a dynamic premium quote based on worker profile and risk factors.
    Uses the pricing service for calculation.
    """
    # Try to get worker stats
    result = await db.execute(select(Worker).limit(1))
    worker = result.scalars().first()

    worker_deliveries = 100  # Default
    worker_claims = 0
    worker_fraud_flags = 0

    if worker:
        # Count claims
        claims_result = await db.execute(
            select(func.count(Claim.id))
            .join(Policy, Claim.policy_id == Policy.id)
            .where(Policy.worker_id == worker.id)
        )
        worker_claims = claims_result.scalar() or 0

    quote = pricing_service.calculate_premium(
        zone=zone,
        platform=platform,
        worker_experience_deliveries=worker_deliveries,
        worker_claim_history=worker_claims,
        worker_fraud_flags=worker_fraud_flags,
        max_payout_per_week=max_payout,
    )

    return quote
