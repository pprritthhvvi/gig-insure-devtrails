from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import uuid

# --- Worker Schemas ---

class WorkerBase(BaseModel):
    phone: str
    name: str
    platform: str
    zone: Optional[str] = None

class WorkerCreate(WorkerBase):
    pass

class WorkerResponse(WorkerBase):
    id: uuid.UUID
    status: str
    risk_score: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Policy Schemas ---

class PolicyBase(BaseModel):
    coverage_start: date
    coverage_end: date
    max_payout_per_week: float = 2000.0

class PolicyCreate(PolicyBase):
    worker_id: str
    # For MVP, we'll hardcode premium to DC 150 on backend, but could be passed here

class PolicyResponse(PolicyBase):
    id: uuid.UUID
    worker_id: uuid.UUID
    premium_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Claim Schemas ---

class ClaimBase(BaseModel):
    policy_id: uuid.UUID
    disruption_type: str
    claimed_amount: float

class ClaimCreate(ClaimBase):
    pass

class ClaimResponse(ClaimBase):
    id: uuid.UUID
    triggered_at: datetime
    status: str
    fraud_score: int
    payout_amount: Optional[float] = None
    payout_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Demo Specific Schemas ---

class DemoTriggerRainRequest(BaseModel):
    policy_id: uuid.UUID

# --- Premium Quote Schemas ---

class PremiumQuoteRequest(BaseModel):
    zone: str = "Mumbai"
    platform: str = "Zomato"
    max_payout_per_week: float = 2000.0

class PremiumBreakdown(BaseModel):
    base_premium: float
    zone_risk: float
    seasonal_adjustment: float
    worker_adjustment: float
    platform_adjustment: float
    coverage_adjustment: float

class PremiumQuoteResponse(BaseModel):
    final_premium: float
    breakdown: dict
    shap_waterfall: list
    risk_level: str
    risk_score: float
    currency: str = "INR"
    period: str = "weekly"

# --- Payment Schemas ---

class PaymentCreate(BaseModel):
    claim_id: uuid.UUID
    payment_method: str = "UPI"

class PaymentResponse(BaseModel):
    id: uuid.UUID
    claim_id: uuid.UUID
    worker_id: uuid.UUID
    amount: float
    payment_method: str
    gateway: str
    gateway_transaction_id: Optional[str] = None
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auto Trigger Schemas ---

class AutoTriggerRequest(BaseModel):
    policy_id: uuid.UUID
    disruption_type: str = "RAIN"
    trigger_source: str = "WEATHER_API"
