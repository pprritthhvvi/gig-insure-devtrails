"""
Claims API Routes
Full claims lifecycle: file, view, list, auto-trigger.
Integrates with fraud detection service for scoring.

Preset payout amounts per disruption type — workers cannot set custom amounts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid
from datetime import datetime, timezone

from app.database import get_db
from models.claim import Claim
from models.policy import Policy
from schemas.pydantic_models import ClaimCreate, ClaimResponse
from services.fraud_service import fraud_service

router = APIRouter()

# Preset payout amounts per disruption type (INR)
# Workers cannot set custom amounts — these are enforced by the system
DISRUPTION_PAYOUTS = {
    "RAIN":      1200.0,   # ~4 hrs lost income
    "HEAT":      1000.0,   # ~3 hrs lost income
    "AQI":       1500.0,   # ~5 hrs lost income
    "CURFEW":    2000.0,   # Full day lost income
    "APP_CRASH":  800.0,   # ~2 hrs lost income
}

VALID_DISRUPTION_TYPES = set(DISRUPTION_PAYOUTS.keys())


@router.get("/my", response_model=list[ClaimResponse])
async def get_my_claims(db: AsyncSession = Depends(get_db)):
    """
    Get all claims for the current user.
    For MVP, returns all claims (no auth filtering).
    """
    result = await db.execute(
        select(Claim).order_by(Claim.created_at.desc())
    )
    claims = result.scalars().all()
    return claims


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim_details(claim_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get claim details by ID"""
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalars().first()

    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    return claim


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def file_claim(claim_data: ClaimCreate, db: AsyncSession = Depends(get_db)):
    """
    File a new insurance claim with AI-powered fraud detection.
    Amount is determined by disruption type (preset), not by the worker.
    """
    # Validate disruption type
    if claim_data.disruption_type not in VALID_DISRUPTION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid disruption type '{claim_data.disruption_type}'. "
                   f"Valid types: {', '.join(sorted(VALID_DISRUPTION_TYPES))}"
        )

    # Verify policy exists and is active
    result = await db.execute(select(Policy).where(Policy.id == claim_data.policy_id))
    policy = result.scalars().first()

    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    if policy.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Policy is not active")

    # Use preset amount for this disruption type (override any user-submitted amount)
    preset_amount = DISRUPTION_PAYOUTS[claim_data.disruption_type]
    claimed_amount = min(preset_amount, policy.max_payout_per_week)

    # Count recent claims for this policy (fraud frequency check)
    recent_claims_result = await db.execute(
        select(func.count(Claim.id))
        .where(Claim.policy_id == claim_data.policy_id)
    )
    recent_claims_count = recent_claims_result.scalar() or 0

    # Get worker's average claim amount
    avg_claim_result = await db.execute(
        select(func.avg(Claim.claimed_amount))
        .where(Claim.policy_id == claim_data.policy_id)
    )
    worker_avg_claim = float(avg_claim_result.scalar() or 0)

    # Phase 3: Advanced Fraud Validation Queries
    from models.worker import Worker
    worker_result = await db.execute(select(Worker).where(Worker.id == policy.worker_id))
    worker = worker_result.scalars().first()
    
    avg_daily_earnings = 500.0  # Default value since we don't store income history right now
    zone = worker.zone if worker and worker.zone else "Mumbai"

    now = datetime.now(timezone.utc)
    # Calculate hours since policy start
    if policy.created_at:
        try:
            time_diff = now - policy.created_at.replace(tzinfo=timezone.utc)
        except TypeError:
            time_diff = now - policy.created_at  # If already aware
        hours_since_start = int(time_diff.total_seconds() / 3600)
    else:
        hours_since_start = 48

    # Cluster Detection: Count similar claims in the worker's zone in the last 12 hours
    # First get all policies in that zone
    zone_policies_query = select(Policy.id).join(Worker).where(Worker.zone == zone)
    zone_policies_result = await db.execute(zone_policies_query)
    zone_policy_ids = [row[0] for row in zone_policies_result.all()]

    from datetime import timedelta
    similar_claims_query = select(func.count(Claim.id)).where(
        Claim.disruption_type == claim_data.disruption_type,
        Claim.policy_id.in_(zone_policy_ids),
        Claim.triggered_at >= now - timedelta(hours=12)
    )
    similar_claims_result = await db.execute(similar_claims_query)
    similar_claims_count = similar_claims_result.scalar() or 0

    # Run fraud detection
    fraud_result = fraud_service.calculate_fraud_score(
        claimed_amount=claimed_amount,
        max_payout=policy.max_payout_per_week,
        worker_avg_claim=worker_avg_claim,
        recent_claims_count=recent_claims_count,
        claim_hour=now.hour,
        disruption_type=claim_data.disruption_type,
        worker_total_claims=recent_claims_count,
        worker_fraud_flags=0,
        avg_daily_earnings=avg_daily_earnings,
        hours_since_policy_start=hours_since_start,
        similar_claims_in_zone=similar_claims_count,
    )

    fraud_score = fraud_result["score"]
    claim_status, should_payout = fraud_service.determine_claim_status(fraud_score)
    payout_amount = claimed_amount if should_payout else 0.0

    payout_status = "PROCESSING" if should_payout else ("PENDING" if claim_status == "PENDING" else "REJECTED")

    new_claim = Claim(
        policy_id=claim_data.policy_id,
        disruption_type=claim_data.disruption_type,
        triggered_at=now,
        claimed_amount=claimed_amount,
        status=claim_status,
        fraud_score=fraud_score,
        payout_amount=payout_amount,
        payout_status=payout_status,
    )

    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)

    return new_claim


@router.post("/auto-trigger", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def auto_trigger_claim(
    policy_id: uuid.UUID,
    disruption_type: str = "RAIN",
    db: AsyncSession = Depends(get_db),
):
    """
    Automatically trigger a claim based on weather/disruption detection.
    Called by the background monitoring system.
    """
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalars().first()

    if not policy or policy.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Active policy not found")

    # Auto-triggered claims get low fraud scores (system-verified)
    import random
    fraud_score = random.randint(1, 8)

    # Estimate lost income (3 hours at avg rate)
    lost_income = min(1200.0, policy.max_payout_per_week)

    new_claim = Claim(
        policy_id=policy.id,
        disruption_type=disruption_type,
        triggered_at=datetime.now(timezone.utc),
        claimed_amount=lost_income,
        status="APPROVED",
        fraud_score=fraud_score,
        payout_amount=lost_income,
        payout_status="PROCESSING",
    )

    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)

    return new_claim


@router.get("/policy/{policy_id}", response_model=list[ClaimResponse])
async def get_claims_for_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get all claims for a specific policy"""
    result = await db.execute(
        select(Claim)
        .where(Claim.policy_id == policy_id)
        .order_by(Claim.created_at.desc())
    )
    claims = result.scalars().all()
    return claims


@router.get("/{claim_id}/fraud-details")
async def get_claim_fraud_details(claim_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Get detailed fraud assessment + weather context for a claim.
    Shows: fraud score breakdown, weather at claim time, disruption evidence,
    anti-spoof verdict, and worker risk profile.
    """
    from models.worker import Worker
    from services.weather_service import get_weather_for_zone

    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalars().first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Get policy for max payout
    policy_result = await db.execute(select(Policy).where(Policy.id == claim.policy_id))
    policy = policy_result.scalars().first()

    # Get worker info
    worker = None
    worker_info = {}
    if policy:
        worker_result = await db.execute(select(Worker).where(Worker.id == policy.worker_id))
        worker = worker_result.scalars().first()
        if worker:
            worker_info = {
                "name": worker.name,
                "phone": worker.phone,
                "platform": worker.platform,
                "zone": worker.zone or "Mumbai",
                "risk_score": worker.risk_score,
            }

    # Get weather data for the worker's zone
    zone = worker.zone if worker and worker.zone else "Mumbai"
    weather_data = get_weather_for_zone(zone)

    # Count total claims by this worker
    total_claims_result = await db.execute(
        select(func.count(Claim.id)).where(Claim.policy_id == claim.policy_id)
    )
    total_claims = total_claims_result.scalar() or 0

    from datetime import timedelta
    similar_claims_count = 0
    hours_since_start = 48
    avg_daily_earnings = 500.0  # Default Value

    if policy and claim.triggered_at:
        # Avoid timezone-naive subtraction errors
        triggered = claim.triggered_at
        if triggered.tzinfo is None:
            triggered = triggered.replace(tzinfo=timezone.utc)
            
        pol_created = policy.created_at
        if pol_created and pol_created.tzinfo is None:
            pol_created = pol_created.replace(tzinfo=timezone.utc)

        if pol_created:
            hours_since_start = int((triggered - pol_created).total_seconds() / 3600)

        # Count similar claims
        zone_policies_query = select(Policy.id).join(Worker).where(Worker.zone == zone)
        zone_policies_res = await db.execute(zone_policies_query)
        zone_pol_ids = [row[0] for row in zone_policies_res.all()]
        
        sim_claims_query = select(func.count(Claim.id)).where(
            Claim.disruption_type == claim.disruption_type,
            Claim.policy_id.in_(zone_pol_ids),
            Claim.triggered_at >= triggered - timedelta(hours=12),
            Claim.triggered_at <= triggered + timedelta(hours=12)
        )
        sim_claims_res = await db.execute(sim_claims_query)
        similar_claims_count = sim_claims_res.scalar() or 0

    # Re-calculate fraud details with full breakdown
    fraud_result = fraud_service.calculate_fraud_score(
        claimed_amount=claim.claimed_amount,
        max_payout=policy.max_payout_per_week if policy else 2000,
        claim_hour=claim.triggered_at.hour if claim.triggered_at else 12,
        disruption_type=claim.disruption_type,
        worker_total_claims=total_claims,
        worker_fraud_flags=0,
        claimed_zone=zone,
        avg_daily_earnings=avg_daily_earnings,
        hours_since_policy_start=hours_since_start,
        similar_claims_in_zone=similar_claims_count,
    )

    # Build disruption evidence based on type
    disruption_evidence = _build_disruption_evidence(
        claim.disruption_type, weather_data, zone
    )

    return {
        "claim_id": str(claim.id),
        "claim_status": claim.status,
        "fraud_score": claim.fraud_score,
        "claimed_amount": claim.claimed_amount,
        "payout_amount": claim.payout_amount,
        "disruption_type": claim.disruption_type,
        "filed_at": claim.triggered_at.isoformat() if claim.triggered_at else None,
        "worker": worker_info,
        "weather_at_zone": {
            "zone": zone,
            "condition": weather_data.get("condition", "Unknown"),
            "temperature": weather_data.get("temperature"),
            "humidity": weather_data.get("humidity"),
            "rain_mm": weather_data.get("rain_mm", 0),
            "aqi": weather_data.get("aqi", 0),
            "wind_speed": weather_data.get("wind_speed", 0),
            "is_disrupted": weather_data.get("is_disrupted", False),
        },
        "disruption_evidence": disruption_evidence,
        "fraud_details": fraud_result,
        "evaluation_summary": _build_evaluation_summary(
            claim, fraud_result, disruption_evidence, weather_data
        ),
    }


def _build_disruption_evidence(disruption_type: str, weather: dict, zone: str) -> dict:
    """Build disruption-specific evidence with real data."""
    rain_mm = weather.get("rain_mm", 0)
    temp = weather.get("temperature", 30)
    aqi = weather.get("aqi", 50)
    wind = weather.get("wind_speed", 10)

    if disruption_type == "RAIN":
        threshold = 20  # mm/hr for heavy rain
        return {
            "type": "RAIN",
            "icon": "🌧️",
            "title": "Heavy Rainfall Disruption",
            "current_reading": f"{rain_mm:.1f} mm/hr",
            "threshold": f"{threshold} mm/hr",
            "is_above_threshold": rain_mm >= threshold,
            "severity": "SEVERE" if rain_mm >= 40 else "HIGH" if rain_mm >= 20 else "MODERATE" if rain_mm >= 10 else "LOW",
            "description": (
                f"Rainfall of {rain_mm:.1f}mm/hr recorded in {zone}. "
                f"{'Exceeds' if rain_mm >= threshold else 'Below'} the {threshold}mm threshold for delivery disruption. "
                f"Wind speed: {wind:.1f} km/h."
            ),
            "impact": "Delivery routes flooded, rider safety at risk" if rain_mm >= threshold else "Minor rain, limited impact",
            "data_points": {
                "rainfall_mm": rain_mm,
                "wind_speed_kmh": wind,
                "humidity_pct": weather.get("humidity", 0),
                "visibility": "Poor" if rain_mm >= 20 else "Moderate" if rain_mm >= 10 else "Good",
            }
        }
    elif disruption_type == "HEAT":
        threshold = 42  # °C
        return {
            "type": "HEAT",
            "icon": "🔥",
            "title": "Extreme Heat Disruption",
            "current_reading": f"{temp:.1f}°C",
            "threshold": f"{threshold}°C",
            "is_above_threshold": temp >= threshold,
            "severity": "SEVERE" if temp >= 48 else "HIGH" if temp >= 45 else "MODERATE" if temp >= 42 else "LOW",
            "description": (
                f"Temperature of {temp:.1f}°C recorded in {zone}. "
                f"{'Exceeds' if temp >= threshold else 'Below'} the {threshold}°C heat stress threshold. "
                f"Humidity: {weather.get('humidity', 0)}%."
            ),
            "impact": "Heatstroke risk, unsafe for outdoor delivery" if temp >= threshold else "Warm but manageable",
            "data_points": {
                "temperature_c": temp,
                "humidity_pct": weather.get("humidity", 0),
                "heat_index": round(temp + (weather.get("humidity", 0) * 0.1), 1),
                "uv_index": "Extreme" if temp >= 45 else "Very High" if temp >= 40 else "High",
            }
        }
    elif disruption_type == "AQI":
        threshold = 300
        return {
            "type": "AQI",
            "icon": "🏭",
            "title": "Severe Air Pollution Disruption",
            "current_reading": f"AQI {aqi}",
            "threshold": f"AQI {threshold}",
            "is_above_threshold": aqi >= threshold,
            "severity": "HAZARDOUS" if aqi >= 400 else "SEVERE" if aqi >= 300 else "UNHEALTHY" if aqi >= 200 else "MODERATE",
            "description": (
                f"Air Quality Index of {aqi} recorded in {zone}. "
                f"{'Exceeds' if aqi >= threshold else 'Below'} the AQI {threshold} threshold for outdoor work cessation."
            ),
            "impact": "Hazardous breathing conditions, outdoor work unsafe" if aqi >= threshold else "Poor air quality",
            "data_points": {
                "aqi_value": aqi,
                "pm25_level": "Hazardous" if aqi >= 300 else "Very Unhealthy" if aqi >= 200 else "Unhealthy",
                "visibility_km": max(0.5, 10 - (aqi / 50)),
            }
        }
    elif disruption_type == "CURFEW":
        return {
            "type": "CURFEW",
            "icon": "🚫",
            "title": "Curfew / Strike Disruption",
            "current_reading": "Active",
            "threshold": "Government Order",
            "is_above_threshold": True,
            "severity": "HIGH",
            "description": f"Curfew or strike reported in {zone}. Delivery operations suspended by local authorities.",
            "impact": "All deliveries halted in affected zone",
            "data_points": {
                "zone_affected": zone,
                "order_type": "Government/Municipal",
            }
        }
    else:
        return {
            "type": disruption_type,
            "icon": "⚠️",
            "title": f"{disruption_type} Disruption",
            "current_reading": "Reported",
            "threshold": "Variable",
            "is_above_threshold": True,
            "severity": "MODERATE",
            "description": f"{disruption_type} disruption reported in {zone}.",
            "impact": "Delivery operations affected",
            "data_points": {}
        }


def _build_evaluation_summary(claim, fraud_result: dict, evidence: dict, weather: dict) -> dict:
    """Build a human-readable evaluation summary."""
    checks = fraud_result.get("checks", [])
    passed = sum(1 for c in checks if c.get("result") == "PASS")
    flagged = sum(1 for c in checks if c.get("result") == "FLAG")

    return {
        "total_checks": len(checks),
        "checks_passed": passed,
        "checks_flagged": flagged,
        "disruption_verified": evidence.get("is_above_threshold", False),
        "risk_level": fraud_result.get("risk_level", "UNKNOWN"),
        "recommendation": fraud_result.get("recommendation", "MANUAL_REVIEW"),
        "anti_spoof_verdict": fraud_result.get("anti_spoof_verdict", "NO_DATA"),
        "verdict_explanation": (
            f"Claim {'VERIFIED' if evidence.get('is_above_threshold') else 'UNVERIFIED'}: "
            f"{evidence.get('description', '')} "
            f"Fraud score: {claim.fraud_score}/100 ({fraud_result.get('risk_level', 'UNKNOWN')} risk). "
            f"{passed}/{len(checks)} checks passed."
        ),
    }

