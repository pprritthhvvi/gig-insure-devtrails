"""
Anti-Spoof API — GPS Spoofing Detection Endpoints
===================================================
Exposes the Sensor-Fusion Anti-Spoofing engine via REST API.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from services.anti_spoof_service import (
    compute_anti_spoof_score,
    detect_impossible_travel,
    detect_geohash_collisions,
    validate_barometric_pressure,
    haversine_distance,
    encode_geohash,
)

router = APIRouter()


# ── Request/Response Models ──────────────────────────────────

class LocationPing(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-90, le=180)
    timestamp: datetime
    worker_id: Optional[str] = None

class SensorData(BaseModel):
    barometric_pressure: float = Field(0, description="hPa reading from device barometer")
    battery_level: float = Field(-1, ge=-1, le=100, description="Battery percentage (0-100)")
    is_charging: bool = False
    altitude_gps: Optional[float] = None

class AntiSpoofRequest(BaseModel):
    worker_id: str
    claimed_zone: str = "Mumbai"
    location_history: List[LocationPing] = []
    sensor_data: Optional[SensorData] = None
    is_outdoor_claim: bool = True

class BulkLocationRequest(BaseModel):
    """For checking geohash collisions across multiple workers"""
    locations: List[LocationPing]
    precision: int = Field(9, ge=5, le=12)
    collision_threshold: int = Field(5, ge=2)

class GeohashRequest(BaseModel):
    lat: float
    lon: float
    precision: int = Field(9, ge=1, le=12)

class DistanceRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float


# ── Endpoints ────────────────────────────────────────────────

@router.post("/verify")
async def verify_location(request: AntiSpoofRequest):
    """
    🛡️ MAIN ENDPOINT: Run full sensor-fusion anti-spoof check on a worker.
    
    Combines all 3 layers:
    1. Impossible Travel Matrix (Haversine speed check)
    2. Environmental Truths (barometric pressure + battery)
    3. Geohash Collision Detection (if bulk data provided)
    
    Returns: Anti-spoof score (0-100) with verdict and recommended action.
    """
    location_dicts = [
        {"lat": p.lat, "lon": p.lon, "timestamp": p.timestamp}
        for p in request.location_history
    ]
    
    baro = request.sensor_data.barometric_pressure if request.sensor_data else 0
    battery = request.sensor_data.battery_level if request.sensor_data else -1
    charging = request.sensor_data.is_charging if request.sensor_data else False
    
    result = compute_anti_spoof_score(
        location_history=location_dicts,
        claimed_zone=request.claimed_zone,
        barometric_pressure=baro,
        battery_level=battery,
        is_charging=charging,
        is_outdoor_claim=request.is_outdoor_claim,
        current_hour=datetime.now(timezone.utc).hour,
    )
    
    result["worker_id"] = request.worker_id
    result["claimed_zone"] = request.claimed_zone
    
    return result


@router.post("/check-travel")
async def check_impossible_travel(locations: List[LocationPing]):
    """
    🚀 Layer 1: Check if a sequence of GPS pings contains impossible travel.
    
    Calculates Haversine distance between sequential pings and flags
    speeds exceeding 150 km/h (physically impossible for delivery workers).
    
    Detects teleportation (>500 km/h) — clear GPS spoofing indicator.
    """
    if len(locations) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 location pings")
    
    location_dicts = [
        {"lat": p.lat, "lon": p.lon, "timestamp": p.timestamp}
        for p in locations
    ]
    
    return detect_impossible_travel(location_dicts)


@router.post("/check-barometer")
async def check_barometric_pressure(
    zone: str,
    pressure_hpa: float,
):
    """
    🌡️ Layer 2a: Validate barometric pressure against claimed zone.
    
    Uses the barometric formula to estimate altitude from pressure.
    Cross-references against known altitude for the claimed city.
    
    GPS can be spoofed. Barometric pressure CANNOT.
    """
    return validate_barometric_pressure(zone, pressure_hpa)


@router.post("/check-collisions")
async def check_geohash_collisions(request: BulkLocationRequest):
    """
    📍 Layer 3: Detect geohash collision clusters.
    
    Converts all worker locations to 9-character geohashes (4.77m² grids).
    If 5+ workers share the EXACT same grid cell, it's a spoofing syndicate.
    
    Designed to catch the 500-worker Telegram group attack.
    """
    location_dicts = [
        {
            "worker_id": loc.worker_id or f"unknown-{i}",
            "lat": loc.lat,
            "lon": loc.lon,
            "timestamp": loc.timestamp
        }
        for i, loc in enumerate(request.locations)
    ]
    
    return detect_geohash_collisions(
        location_dicts,
        precision=request.precision,
        collision_threshold=request.collision_threshold
    )


@router.post("/encode-geohash")
async def get_geohash(request: GeohashRequest):
    """
    🔢 Utility: Convert GPS coordinates to a geohash string.
    
    Precision 9 = 4.77m × 4.77m grid cell.
    """
    gh = encode_geohash(request.lat, request.lon, request.precision)
    return {
        "geohash": gh,
        "precision": request.precision,
        "approximate_cell_size_meters": {
            5: 4900, 6: 1200, 7: 153, 8: 38, 9: 4.77, 10: 1.19, 11: 0.149, 12: 0.037
        }.get(request.precision, "unknown"),
        "lat": request.lat,
        "lon": request.lon
    }


@router.post("/haversine")
async def calculate_distance(request: DistanceRequest):
    """
    📐 Utility: Calculate Haversine distance between two GPS points.
    """
    dist = haversine_distance(request.lat1, request.lon1, request.lat2, request.lon2)
    return {
        "distance_km": round(dist, 4),
        "distance_meters": round(dist * 1000, 2),
        "from": {"lat": request.lat1, "lon": request.lon1},
        "to": {"lat": request.lat2, "lon": request.lon2}
    }


@router.get("/demo-syndicate")
async def demo_syndicate_detection():
    """
    🎬 DEMO: Simulates the 500-worker GPS-spoofing syndicate attack.
    
    Creates 500 fake workers all spoofing the same location in Mumbai,
    then runs the geohash collision detector to catch them.
    """
    import random
    
    # Simulate 500 workers all spoofing to the same Mumbai location
    # (with tiny variations from the spoofing tool's precision limits)
    base_lat = 19.0760
    base_lon = 72.8777
    
    spoofed_locations = []
    for i in range(500):
        spoofed_locations.append({
            "worker_id": f"spoofer-{i:03d}",
            "lat": base_lat + random.uniform(-0.00002, 0.00002),  # ~2m variation
            "lon": base_lon + random.uniform(-0.00002, 0.00002),
            "timestamp": datetime.now(timezone.utc)
        })
    
    # Add 20 legitimate workers spread across Mumbai
    legitimate_locations = []
    for i in range(20):
        legitimate_locations.append({
            "worker_id": f"legit-{i:03d}",
            "lat": base_lat + random.uniform(-0.05, 0.05),  # ~5km spread
            "lon": base_lon + random.uniform(-0.05, 0.05),
            "timestamp": datetime.now(timezone.utc)
        })
    
    all_locations = spoofed_locations + legitimate_locations
    
    # Run detection
    collision_result = detect_geohash_collisions(all_locations, precision=9, collision_threshold=5)
    
    # Also run impossible travel on a spoofed worker's path
    # (simulating someone who "teleported" from Delhi to Mumbai in 1 minute)
    spoof_travel = [
        {"lat": 28.6139, "lon": 77.2090, "timestamp": datetime(2026, 3, 25, 10, 0, 0, tzinfo=timezone.utc)},
        {"lat": 19.0760, "lon": 72.8777, "timestamp": datetime(2026, 3, 25, 10, 1, 0, tzinfo=timezone.utc)},
    ]
    travel_result = detect_impossible_travel(spoof_travel)
    
    # Barometric check (spoofer claims Mumbai but their phone reads Bangalore altitude)
    baro_result = validate_barometric_pressure("Mumbai", 903.0)  # ~900m altitude = Bangalore
    
    # Combined sensor fusion
    fusion_result = compute_anti_spoof_score(
        location_history=spoof_travel,
        claimed_zone="Mumbai",
        barometric_pressure=903.0,
        battery_level=98,
        is_charging=True,
        is_outdoor_claim=True,
        current_hour=3,
        all_worker_locations=all_locations
    )
    
    return {
        "scenario": "500-Worker Telegram GPS-Spoofing Syndicate Attack",
        "attack_description": (
            "500 delivery workers used a Telegram group to coordinate GPS spoofing. "
            "All workers set their fake GPS to the same Mumbai location during a "
            "rain event to file fraudulent claims simultaneously."
        ),
        "detection_results": {
            "geohash_collisions": collision_result,
            "impossible_travel": travel_result,
            "barometric_validation": baro_result,
            "sensor_fusion_verdict": fusion_result
        },
        "defense_summary": {
            "syndicate_workers_caught": collision_result["total_workers_in_collisions"],
            "legitimate_workers_cleared": 20,
            "verdict": fusion_result["verdict"],
            "recommended_action": fusion_result["recommended_action"],
            "total_anti_spoof_score": fusion_result["total_score"],
        }
    }
