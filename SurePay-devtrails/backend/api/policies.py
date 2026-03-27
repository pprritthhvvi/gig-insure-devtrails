from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from app.database import get_db
from models.policy import Policy
from models.worker import Worker
from schemas.pydantic_models import PolicyCreate, PolicyResponse

router = APIRouter()


@router.get("/my", response_model=list[PolicyResponse])
async def get_my_policies(db: AsyncSession = Depends(get_db)):
    """
    Get all policies for the current user.
    For MVP, returns all policies (no auth filtering).
    """
    result = await db.execute(
        select(Policy).order_by(Policy.created_at.desc())
    )
    policies = result.scalars().all()
    return policies


@router.post("/create", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(policy_data: PolicyCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new insurance policy for a worker.
    Uses dynamic pricing engine based on zone, platform, and risk.
    """
    from services.pricing_service import pricing_service

    # Verify worker exists
    if str(policy_data.worker_id) == "worker-001":
        # Handle demo user by returning the first active demo worker
        result = await db.execute(select(Worker).limit(1))
    else:
        try:
            w_uuid = uuid.UUID(str(policy_data.worker_id))
            result = await db.execute(select(Worker).where(Worker.id == w_uuid))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid worker ID format")
            
    worker = result.scalars().first()
    
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    # Calculate dynamic premium
    quote = pricing_service.calculate_premium(
        zone=worker.zone or "Mumbai",
        platform=worker.platform or "Zomato",
        worker_experience_deliveries=100,
        worker_claim_history=0,
        worker_fraud_flags=0,
        max_payout_per_week=policy_data.max_payout_per_week,
    )
    dynamic_premium = quote.get("final_premium", 150.0)

    new_policy = Policy(
        worker_id=worker.id,
        premium_amount=dynamic_premium,
        coverage_start=policy_data.coverage_start,
        coverage_end=policy_data.coverage_end,
        max_payout_per_week=policy_data.max_payout_per_week,
        status="ACTIVE"
    )
    
    db.add(new_policy)
    await db.commit()
    await db.refresh(new_policy)
    
    return new_policy

@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get policy details"""
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalars().first()
    
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")
        
    return policy
