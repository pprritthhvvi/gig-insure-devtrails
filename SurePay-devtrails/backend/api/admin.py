from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from models.policy import Policy
from models.claim import Claim
from models.worker import Worker

router = APIRouter()

# Response Models
class DashboardStats(BaseModel):
    total_workers: int
    active_policies: int
    total_claims: int
    approved_claims: int
    pending_claims: int
    total_payouts: float
    total_premium: float
    approval_rate: float

class ClaimSummary(BaseModel):
    id: str
    policy_id: str
    amount: float
    status: str
    fraud_score: int
    created_at: str

class PolicySummary(BaseModel):
    id: str
    worker_id: str
    premium: float
    status: str
    coverage_start: str
    coverage_end: str

class WorkerSummary(BaseModel):
    id: str
    name: str
    phone: str
    platform: str
    risk_score: float

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get admin dashboard statistics"""
    try:
        # Total workers
        workers_result = await db.execute(select(func.count(Worker.id)))
        total_workers = workers_result.scalar() or 0
        
        # Active policies
        policies_result = await db.execute(
            select(func.count(Policy.id)).where(Policy.status == "ACTIVE")
        )
        active_policies = policies_result.scalar() or 0
        
        # Claims stats
        all_claims_result = await db.execute(select(func.count(Claim.id)))
        total_claims = all_claims_result.scalar() or 0
        
        approved_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.status == "APPROVED")
        )
        approved_claims = approved_result.scalar() or 0
        
        pending_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.status == "PENDING")
        )
        pending_claims = pending_result.scalar() or 0
        
        # Payouts
        payouts_result = await db.execute(
            select(func.sum(Claim.payout_amount)).where(Claim.status == "APPROVED")
        )
        total_payouts = float(payouts_result.scalar() or 0)
        
        # Premium
        premium_result = await db.execute(
            select(func.sum(Policy.premium_amount))
        )
        total_premium = float(premium_result.scalar() or 0)
        
        # Approval rate
        approval_rate = (approved_claims / total_claims * 100) if total_claims > 0 else 0
        
        return DashboardStats(
            total_workers=total_workers,
            active_policies=active_policies,
            total_claims=total_claims,
            approved_claims=approved_claims,
            pending_claims=pending_claims,
            total_payouts=total_payouts,
            total_premium=total_premium,
            approval_rate=round(approval_rate, 2)
        )
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.get("/analytics/forecast")
async def get_claim_forecast(db: AsyncSession = Depends(get_db)):
    """
    Get ML-simulated 7-day forecast of expected claims and liquidity required.
    """
    from services.forecasting_service import forecasting_service
    import httpx

    # Get active policies count
    policies_result = await db.execute(
        select(func.count(Policy.id)).where(Policy.status == "ACTIVE")
    )
    active_policies = policies_result.scalar() or 0

    # Get unique zones of active policies to fetch weather
    zones_result = await db.execute(
        select(Worker.zone).join(Policy).where(Policy.status == "ACTIVE").distinct()
    )
    zones = [row[0] or "Mumbai" for row in zones_result.all()]
    if not zones:
        zones = ["Mumbai", "Delhi", "Bangalore"]

    zone_forecasts = {}
    
    # In a real app we'd call openweather 5-day forecast. For demo, we mock it.
    import random
    conditions = ["Clear", "Clouds", "Rain", "Drizzle", "Clear", "Thunderstorm", "Extreme Heat"]
    
    for zone in zones:
        # Mock 7 day forecast for each zone based on basic probabilities
        zone_weather = []
        for i in range(7):
            if "mumbai" in zone.lower() and i in [2, 3]:
                zone_weather.append("Rain")
            elif "delhi" in zone.lower() and i in [5, 6]:
                zone_weather.append("Extreme Heat")
            else:
                zone_weather.append(random.choice(["Clear", "Clouds", "Clear"]))
        zone_forecasts[zone] = zone_weather

    return forecasting_service.generate_next_7_days_forecast(active_policies, zone_forecasts)

@router.get("/analytics/churn")
async def get_churn_predictions(db: AsyncSession = Depends(get_db)):
    """
    Get worker churn predictions to identify who might abandon the platform.
    """
    from services.churn_service import churn_service

    # Get all active policies with their workers
    query = select(Policy, Worker).join(Worker).where(Policy.status == "ACTIVE")
    result = await db.execute(query)
    policies_workers = result.all()

    predictions = []
    
    for policy, worker in policies_workers:
        # Get claims for this policy
        claims_result = await db.execute(select(Claim).where(Claim.policy_id == policy.id))
        claims = claims_result.scalars().all()
        
        total_claims = len(claims)
        approved_claims = sum(1 for c in claims if c.status == "APPROVED")
        
        # We don't have historical earnings, so assume a weekly earning based on zone/risk
        simulated_weekly_earnings = 3000.0 if worker.zone == "Mumbai" else 2500.0
        
        churn_pred = churn_service.predict_worker_churn(
            premium_paid=policy.premium_amount,
            avg_weekly_earnings=simulated_weekly_earnings,
            total_claims_filed=total_claims,
            claims_approved=approved_claims,
            zone=worker.zone or "Mumbai"
        )
        
        predictions.append({
            "worker_id": str(worker.id),
            "worker_name": worker.name,
            "worker_phone": worker.phone,
            "zone": worker.zone,
            "premium": policy.premium_amount,
            "insights": churn_pred
        })
        
    # Sort by highest probability
    predictions.sort(key=lambda x: x["insights"]["churn_probability"], reverse=True)
    
    return {
        "summary": {
            "total_evaluated": len(predictions),
            "high_risk_count": sum(1 for p in predictions if p["insights"]["risk_level"] == "HIGH_RISK"),
            "medium_risk_count": sum(1 for p in predictions if p["insights"]["risk_level"] == "MEDIUM_RISK"),
        },
        "predictions": predictions
    }

@router.get("/claims", response_model=dict)
async def get_claims(status: str = None, skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Get list of claims with optional filtering"""
    query = select(Claim)
    
    if status:
        query = query.where(Claim.status == status)
    
    # Get total count
    count_result = await db.execute(select(func.count(Claim.id)).select_from(Claim))
    total = count_result.scalar() or 0
    
    # Get paginated results
    result = await db.execute(query.offset(skip).limit(limit))
    claims = result.scalars().all()
    
    return {
        "claims": [
            {
                "claim_id": str(claim.id),
                "id": str(claim.id),
                "policy_id": str(claim.policy_id),
                "amount": claim.claimed_amount,
                "claimed_amount": claim.claimed_amount,
                "status": claim.status,
                "fraud_score": claim.fraud_score,
                "created_at": claim.triggered_at.isoformat() if claim.triggered_at else None,
                "triggered_at": claim.triggered_at.isoformat() if claim.triggered_at else None,
                "payout_amount": claim.payout_amount,
                "disruption_type": claim.disruption_type
            }
            for claim in claims
        ],
        "total": total
    }

@router.get("/policies", response_model=dict)
async def get_policies(status: str = None, skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Get list of policies with optional filtering"""
    query = select(Policy)
    
    if status:
        query = query.where(Policy.status == status)
    
    # Get total count
    count_result = await db.execute(select(func.count(Policy.id)).select_from(Policy))
    total = count_result.scalar() or 0
    
    # Get paginated results
    result = await db.execute(query.offset(skip).limit(limit))
    policies = result.scalars().all()
    
    return {
        "policies": [
            {
                "id": str(policy.id),
                "policy_id": str(policy.id),
                "worker_id": str(policy.worker_id),
                "premium": policy.premium_amount,
                "premium_amount": policy.premium_amount,
                "status": policy.status,
                "coverage_start": policy.coverage_start.isoformat() if policy.coverage_start else None,
                "coverage_end": policy.coverage_end.isoformat() if policy.coverage_end else None
            }
            for policy in policies
        ],
        "total": total
    }

@router.get("/workers", response_model=dict)
async def get_workers(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Get list of workers"""
    # Get total count
    count_result = await db.execute(select(func.count(Worker.id)))
    total = count_result.scalar() or 0
    
    result = await db.execute(select(Worker).offset(skip).limit(limit))
    workers = result.scalars().all()
    
    return {
        "workers": [
            {
                "id": str(worker.id),
                "name": worker.name,
                "phone": worker.phone,
                "platform": worker.platform,
                "risk_score": worker.risk_score
            }
            for worker in workers
        ],
        "total": total
    }

@router.post("/claims/{claim_id}/approve")
async def approve_claim(claim_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Approve a claim"""
    import uuid
    try:
        claim_uuid = uuid.UUID(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid claim ID")
    
    result = await db.execute(select(Claim).where(Claim.id == claim_uuid))
    claim = result.scalars().first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = "APPROVED"
    db.add(claim)
    await db.commit()
    
    return {"message": "Claim approved successfully"}

@router.post("/claims/{claim_id}/reject")
async def reject_claim(claim_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Reject a claim"""
    import uuid
    try:
        claim_uuid = uuid.UUID(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid claim ID")
    
    result = await db.execute(select(Claim).where(Claim.id == claim_uuid))
    claim = result.scalars().first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = "REJECTED"
    db.add(claim)
    await db.commit()
    
    return {"message": "Claim rejected successfully"}

@router.post("/init-database")
async def init_database(db: AsyncSession = Depends(get_db)):
    """Initialize database tables"""
    from app.database import init_db
    try:
        await init_db()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize database: {str(e)}")

@router.post("/clear-data")
async def clear_all_data(db: AsyncSession = Depends(get_db)):
    """Clear all data from the database (payments, claims, policies, workers)"""
    from sqlalchemy import delete
    from models.payment import Payment
    
    await db.execute(delete(Payment))
    await db.execute(delete(Claim))
    await db.execute(delete(Policy))
    await db.execute(delete(Worker))
    await db.commit()
    
    return {"message": "All data cleared successfully"}

@router.post("/seed-demo-data")
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    """Initialize database with demo data"""
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import delete
    
    # Clear existing data
    await db.execute(delete(Claim))
    await db.execute(delete(Policy))
    await db.execute(delete(Worker))
    await db.commit()
    
    # Create demo workers
    workers_data = [
        {"name": "Raj Kumar", "phone": "9876543210", "platform": "Ola", "zone": "Mumbai North"},
        {"name": "Priya Singh", "phone": "9876543211", "platform": "Uber", "zone": "Mumbai Central"},
        {"name": "Amit Patel", "phone": "9876543212", "platform": "Ola", "zone": "Mumbai South"},
        {"name": "Neha Sharma", "phone": "9876543213", "platform": "Uber", "zone": "Bangalore"},
        {"name": "David Jose", "phone": "9876543214", "platform": "Ola", "zone": "Bangalore"},
    ]
    
    workers = []
    for w_data in workers_data:
        worker = Worker(
            name=w_data["name"],
            phone=w_data["phone"],
            platform=w_data["platform"],
            zone=w_data["zone"],
            risk_score=45.0
        )
        workers.append(worker)
        db.add(worker)
    
    await db.commit()
    
    # Create demo policies
    policies = []
    for i, worker in enumerate(workers):
        policy = Policy(
            worker_id=worker.id,
            premium_amount=150.0 + (i * 10),
            coverage_start=datetime.now(timezone.utc).date(),
            coverage_end=(datetime.now(timezone.utc) + timedelta(days=365)).date(),
            max_payout_per_week=5000.0,
            status="ACTIVE"
        )
        policies.append(policy)
        db.add(policy)
    
    await db.commit()
    
    # Create demo claims
    claim_statuses = ["PENDING", "APPROVED", "REJECTED", "APPROVED"]
    for i, policy in enumerate(policies):
        for j in range(2):
            claim = Claim(
                policy_id=policy.id,
                disruption_type="RAIN" if j == 0 else "HEAT",
                triggered_at=datetime.now(timezone.utc) - timedelta(days=j+1),
                claimed_amount=1200.0 + (j * 500),
                status=claim_statuses[i % len(claim_statuses)],
                fraud_score=5 + (i % 10),
                payout_amount=1200.0 + (j * 500) if claim_statuses[i % len(claim_statuses)] == "APPROVED" else 0,
                payout_status="PROCESSING" if claim_statuses[i % len(claim_statuses)] == "APPROVED" else "PENDING"
            )
            db.add(claim)
    
    await db.commit()
    
    return {"message": "Demo data seeded successfully"}


@router.get("/analytics/loss-ratio")
async def get_loss_ratio(db: AsyncSession = Depends(get_db)):
    """
    Get loss ratio analytics — premium collected vs claims paid.
    Grouped by zone for geographic insight.
    """
    # Get all policies with worker info
    result = await db.execute(
        select(
            Worker.zone,
            func.sum(Policy.premium_amount).label("premium"),
            func.count(Policy.id).label("policy_count"),
        )
        .join(Worker, Policy.worker_id == Worker.id)
        .group_by(Worker.zone)
    )
    zone_premiums = result.all()

    # Get claims paid by zone
    claims_result = await db.execute(
        select(
            Worker.zone,
            func.sum(Claim.payout_amount).label("payouts"),
            func.count(Claim.id).label("claim_count"),
        )
        .join(Policy, Claim.policy_id == Policy.id)
        .join(Worker, Policy.worker_id == Worker.id)
        .where(Claim.status == "APPROVED")
        .group_by(Worker.zone)
    )
    zone_payouts = {row.zone: {"payouts": float(row.payouts or 0), "claims": row.claim_count} for row in claims_result.all()}

    loss_ratios = []
    total_premium = 0
    total_payouts = 0

    for row in zone_premiums:
        premium = float(row.premium or 0)
        payout_data = zone_payouts.get(row.zone, {"payouts": 0, "claims": 0})
        payouts = payout_data["payouts"]
        ratio = payouts / premium if premium > 0 else 0

        total_premium += premium
        total_payouts += payouts

        loss_ratios.append({
            "zone": row.zone or "Unknown",
            "premium_collected": premium,
            "claims_paid": payouts,
            "loss_ratio": round(ratio, 4),
            "policy_count": row.policy_count,
            "claim_count": payout_data["claims"],
        })

    overall_ratio = total_payouts / total_premium if total_premium > 0 else 0

    return {
        "loss_ratios": loss_ratios,
        "overall_loss_ratio": round(overall_ratio, 4),
        "total_premium": total_premium,
        "total_payouts": total_payouts,
        "profitability_margin": round(1 - overall_ratio, 4),
    }


@router.get("/analytics/claims-trend")
async def get_claims_trend(days: int = 30, db: AsyncSession = Depends(get_db)):
    """
    Get daily claims trend for charting.
    Returns filed/approved/rejected counts per day.
    """
    from datetime import timedelta

    result = await db.execute(
        select(Claim).order_by(Claim.triggered_at.desc())
    )
    claims = result.scalars().all()

    # Aggregate by date
    trend = {}
    for claim in claims:
        if claim.triggered_at:
            date_key = claim.triggered_at.strftime("%Y-%m-%d")
            if date_key not in trend:
                trend[date_key] = {"date": date_key, "filed": 0, "approved": 0, "rejected": 0, "pending": 0, "total_amount": 0}
            trend[date_key]["filed"] += 1
            trend[date_key]["total_amount"] += claim.claimed_amount or 0
            if claim.status == "APPROVED":
                trend[date_key]["approved"] += 1
            elif claim.status == "REJECTED":
                trend[date_key]["rejected"] += 1
            elif claim.status == "PENDING":
                trend[date_key]["pending"] += 1

    # Sort by date
    sorted_trend = sorted(trend.values(), key=lambda x: x["date"])

    return {
        "trend": sorted_trend,
        "period_days": days,
    }


@router.get("/analytics/revenue")
async def get_revenue_analytics(db: AsyncSession = Depends(get_db)):
    """
    Revenue analytics — premium income vs claim payouts.
    """
    # Total premium collected
    premium_result = await db.execute(select(func.sum(Policy.premium_amount)))
    total_premium = float(premium_result.scalar() or 0)

    # Total payouts
    payout_result = await db.execute(
        select(func.sum(Claim.payout_amount)).where(Claim.status == "APPROVED")
    )
    total_payouts = float(payout_result.scalar() or 0)

    # Claims by disruption type
    type_result = await db.execute(
        select(
            Claim.disruption_type,
            func.count(Claim.id).label("count"),
            func.sum(Claim.claimed_amount).label("total_claimed"),
            func.sum(Claim.payout_amount).label("total_paid"),
        )
        .group_by(Claim.disruption_type)
    )

    by_type = [
        {
            "type": row.disruption_type,
            "count": row.count,
            "total_claimed": float(row.total_claimed or 0),
            "total_paid": float(row.total_paid or 0),
        }
        for row in type_result.all()
    ]

    # Average fraud score
    fraud_result = await db.execute(select(func.avg(Claim.fraud_score)))
    avg_fraud = float(fraud_result.scalar() or 0)

    return {
        "total_premium_collected": total_premium,
        "total_payouts": total_payouts,
        "net_revenue": total_premium - total_payouts,
        "loss_ratio": round(total_payouts / total_premium, 4) if total_premium > 0 else 0,
        "profit_margin": round((total_premium - total_payouts) / total_premium, 4) if total_premium > 0 else 0,
        "claims_by_type": by_type,
        "avg_fraud_score": round(avg_fraud, 1),
    }


@router.post("/fraud/override")
async def override_fraud_score(data: dict, db: AsyncSession = Depends(get_db)):
    """
    Admin override of a claim's fraud score.
    Used when admin determines the AI score was wrong.
    """
    import uuid as uuid_mod

    claim_id = data.get("claim_id")
    new_score = data.get("new_fraud_score")
    reason = data.get("override_reason", "")

    if claim_id is None or new_score is None:
        raise HTTPException(status_code=400, detail="claim_id and new_fraud_score are required")

    try:
        claim_uuid = uuid_mod.UUID(claim_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    result = await db.execute(select(Claim).where(Claim.id == claim_uuid))
    claim = result.scalars().first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_score = claim.fraud_score
    claim.fraud_score = new_score

    # Re-determine status based on new score
    from services.fraud_service import fraud_service
    new_status, should_payout = fraud_service.determine_claim_status(new_score)
    claim.status = new_status

    if should_payout and claim.payout_amount == 0:
        claim.payout_amount = claim.claimed_amount
        claim.payout_status = "PROCESSING"

    db.add(claim)
    await db.commit()

    return {
        "claim_id": str(claim.id),
        "fraud_score_old": old_score,
        "fraud_score_new": new_score,
        "new_status": new_status,
        "override_reason": reason,
    }

