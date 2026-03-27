from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
import uuid
import random

from app.database import get_db
from models.policy import Policy
from models.claim import Claim
from schemas.pydantic_models import DemoTriggerRainRequest, ClaimResponse

router = APIRouter()

@router.post("/trigger-rain", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def trigger_rain_demo(request: DemoTriggerRainRequest, db: AsyncSession = Depends(get_db)):
    """
    DEMO ENDPOINT: Simulates a heavy rain event (>20mm) that automatically 
    triggers a claim for the specified policy.
    
    Flow:
    1. Rain detected (Mock)
    2. Claim auto-filed
    3. Fraud check passed (Mock Score < 10)
    4. Auto-Approved
    5. Payout generated
    """
    
    # Verify policy exists and is active
    result = await db.execute(select(Policy).where(Policy.id == request.policy_id))
    policy = result.scalars().first()
    
    if not policy or policy.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active policy not found")
    
    # Simulate lost income (say, 3 hours of lost work at DC 400/hr)
    lost_income = 1200.0
    
    # Create the claim automatically (No worker action required)
    new_claim = Claim(
        policy_id=policy.id,
        disruption_type="RAIN",
        triggered_at=datetime.now(timezone.utc),
        claimed_amount=lost_income,
        status="APPROVED", # Auto-approved for the demo
        fraud_score=random.randint(1, 10), # Low fraud score means legit
        payout_amount=lost_income,
        payout_status="PROCESSING" # Next step: sent to Razorpay
    )
    
    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)
    
    return new_claim
