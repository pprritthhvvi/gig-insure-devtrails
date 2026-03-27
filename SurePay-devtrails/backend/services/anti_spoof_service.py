"""
Anti-GPS Spoofing Service — Lightweight Sensor-Fusion Architecture
===================================================================
Designed to defeat coordinated GPS-spoofing attacks (e.g., 500-worker syndicate)
WITHOUT heavy ML models or cloud GPU resources.

Three detection layers:
1. Impossible Travel Matrix — Haversine distance between pings → speed check
2. Environmental Truths — Barometric pressure + battery state cross-reference
3. Geohash Collision Detection — Identify artificial clustering in same grid cell
"""

import math
import hashlib
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple
from collections import Counter

# ============================================================
# LAYER 1: IMPOSSIBLE TRAVEL MATRIX
# ============================================================

# Haversine formula constants
EARTH_RADIUS_KM = 6371.0

# Speed thresholds (km/h)
MAX_WALKING_SPEED = 7.0
MAX_CYCLING_SPEED = 35.0
MAX_MOTORCYCLE_SPEED = 120.0
MAX_POSSIBLE_SPEED = 150.0  # Absolute ceiling for any delivery worker
TELEPORTATION_SPEED = 500.0  # If exceeding this, definitely spoofed


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS coordinates
    using the Haversine formula.
    
    Returns distance in KILOMETERS.
    
    Mathematical proof: This formula derives from spherical trigonometry.
    A spoofed GPS cannot fake the mathematical relationship between
    sequential points without physically being there.
    """
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def calculate_speed_kmh(
    lat1: float, lon1: float, timestamp1: datetime,
    lat2: float, lon2: float, timestamp2: datetime
) -> float:
    """Calculate implied speed between two GPS pings in km/h"""
    distance_km = haversine_distance(lat1, lon1, lat2, lon2)
    time_delta = abs((timestamp2 - timestamp1).total_seconds())
    
    if time_delta < 1:  # Less than 1 second apart
        return float('inf') if distance_km > 0.001 else 0.0
    
    speed_kmh = (distance_km / time_delta) * 3600
    return round(speed_kmh, 2)


def detect_impossible_travel(location_history: List[dict]) -> dict:
    """
    Analyze a sequence of GPS pings to detect impossible travel.
    
    Input: List of {lat, lon, timestamp} dicts, sorted chronologically.
    
    Returns:
        {
            "is_suspicious": bool,
            "max_speed_detected": float,
            "impossible_jumps": [{from, to, speed, distance}],
            "score": int (0-35),
            "detail": str
        }
    """
    if len(location_history) < 2:
        return {
            "is_suspicious": False,
            "max_speed_detected": 0,
            "impossible_jumps": [],
            "score": 0,
            "detail": "Insufficient data points"
        }
    
    # Sort by timestamp
    sorted_pings = sorted(location_history, key=lambda x: x["timestamp"])
    
    impossible_jumps = []
    max_speed = 0.0
    
    for i in range(1, len(sorted_pings)):
        prev = sorted_pings[i - 1]
        curr = sorted_pings[i]
        
        speed = calculate_speed_kmh(
            prev["lat"], prev["lon"], prev["timestamp"],
            curr["lat"], curr["lon"], curr["timestamp"]
        )
        
        distance = haversine_distance(
            prev["lat"], prev["lon"],
            curr["lat"], curr["lon"]
        )
        
        max_speed = max(max_speed, speed)
        
        if speed > MAX_POSSIBLE_SPEED:
            impossible_jumps.append({
                "from": {"lat": prev["lat"], "lon": prev["lon"], "time": prev["timestamp"].isoformat()},
                "to": {"lat": curr["lat"], "lon": curr["lon"], "time": curr["timestamp"].isoformat()},
                "speed_kmh": speed,
                "distance_km": round(distance, 3),
                "is_teleportation": speed > TELEPORTATION_SPEED
            })
    
    # Scoring
    score = 0
    if len(impossible_jumps) > 0:
        score = min(35, 15 + len(impossible_jumps) * 5)
        if any(j["is_teleportation"] for j in impossible_jumps):
            score = 35  # Maximum penalty for teleportation
    elif max_speed > MAX_MOTORCYCLE_SPEED:
        score = 10  # Suspicious but not conclusive
    
    return {
        "is_suspicious": score > 0,
        "max_speed_detected": round(max_speed, 2),
        "impossible_jumps": impossible_jumps,
        "score": score,
        "detail": (
            f"TELEPORTATION DETECTED: {len(impossible_jumps)} impossible jumps, max {max_speed:.0f} km/h"
            if score >= 25 else
            f"Suspicious speed: {max_speed:.0f} km/h detected"
            if score > 0 else
            f"Travel pattern normal (max {max_speed:.0f} km/h)"
        )
    }


# ============================================================
# LAYER 2: ENVIRONMENTAL TRUTHS
# ============================================================

# Barometric pressure at sea level (hPa)
SEA_LEVEL_PRESSURE = 1013.25

# Approximate pressure decrease per 100m altitude gain
PRESSURE_PER_100M = 12.0  # hPa

# Known altitude ranges for Indian cities (meters above sea level)
CITY_ALTITUDE_RANGES = {
    "Mumbai": (0, 50),
    "Mumbai North": (0, 80),
    "Mumbai Central": (0, 40),
    "Mumbai South": (0, 30),
    "Delhi": (200, 300),
    "Bangalore": (900, 960),
    "Chennai": (0, 30),
    "Hyderabad": (500, 600),
    "Kolkata": (0, 20),
    "Pune": (550, 650),
    "Ahmedabad": (50, 100),
    "Jaipur": (400, 500),
}


def estimate_altitude_from_pressure(pressure_hpa: float) -> float:
    """
    Estimate altitude from barometric pressure using the barometric formula.
    
    This is a PHYSICAL TRUTH that GPS spoofers cannot fake:
    - If someone claims to be in Bangalore (920m elevation),
      their barometer MUST read ~903 hPa.
    - If it reads 1013 hPa (sea level), they're lying.
    """
    if pressure_hpa <= 0:
        return 0.0
    
    # Hypsometric formula (simplified)
    altitude = 44330 * (1 - (pressure_hpa / SEA_LEVEL_PRESSURE) ** 0.1903)
    return round(altitude, 1)


def validate_barometric_pressure(
    claimed_zone: str,
    barometric_pressure: float
) -> dict:
    """
    Cross-reference barometric reading against claimed zone's altitude.
    
    GPS can be spoofed. Barometric pressure CANNOT (without physical altitude change).
    """
    if barometric_pressure <= 0:
        return {
            "is_suspicious": False,
            "score": 0,
            "detail": "No barometric data available",
            "estimated_altitude": None,
            "expected_range": None
        }
    
    estimated_altitude = estimate_altitude_from_pressure(barometric_pressure)
    
    # Get expected altitude for the claimed zone
    zone_key = claimed_zone.strip()
    expected_range = CITY_ALTITUDE_RANGES.get(zone_key)
    
    if not expected_range:
        # Try partial match
        for city, alt_range in CITY_ALTITUDE_RANGES.items():
            if city.lower() in zone_key.lower() or zone_key.lower() in city.lower():
                expected_range = alt_range
                break
    
    if not expected_range:
        return {
            "is_suspicious": False,
            "score": 0,
            "detail": f"Unknown zone altitude for '{claimed_zone}'",
            "estimated_altitude": estimated_altitude,
            "expected_range": None
        }
    
    min_alt, max_alt = expected_range
    # Allow ±100m tolerance for weather variations
    tolerance = 100
    
    if estimated_altitude < (min_alt - tolerance) or estimated_altitude > (max_alt + tolerance):
        altitude_mismatch = min(
            abs(estimated_altitude - min_alt),
            abs(estimated_altitude - max_alt)
        )
        score = min(25, int(altitude_mismatch / 50) * 5 + 10)
        
        return {
            "is_suspicious": True,
            "score": score,
            "detail": (
                f"ALTITUDE MISMATCH: Barometer suggests {estimated_altitude:.0f}m, "
                f"but {claimed_zone} is at {min_alt}-{max_alt}m (diff: {altitude_mismatch:.0f}m)"
            ),
            "estimated_altitude": estimated_altitude,
            "expected_range": expected_range
        }
    
    return {
        "is_suspicious": False,
        "score": 0,
        "detail": f"Barometric altitude ({estimated_altitude:.0f}m) consistent with {claimed_zone} ({min_alt}-{max_alt}m)",
        "estimated_altitude": estimated_altitude,
        "expected_range": expected_range
    }


def validate_battery_state(
    battery_level: float,
    is_charging: bool,
    claimed_outdoors: bool,
    time_of_day_hour: int
) -> dict:
    """
    Cross-reference battery state with claimed activity.
    
    Environmental truth: A delivery worker actively working outdoors:
    - Typically has battery draining (not charging)
    - Working during delivery hours (6 AM - 11 PM)
    - Battery level correlates with activity duration
    
    Spoofers sitting at home tend to be:
    - Plugged in (charging while spoofing)
    - Active at unusual hours (automated scripts run 24/7)
    """
    score = 0
    flags = []
    
    # Flag: Charging while claiming outdoor delivery work
    if is_charging and claimed_outdoors:
        score += 8
        flags.append("Charging while claiming active outdoor delivery")
    
    # Flag: Full battery during multi-hour claimed work
    if battery_level > 95 and claimed_outdoors:
        score += 5
        flags.append(f"Battery at {battery_level}% during active delivery (unusually high)")
    
    # Flag: Activity at unusual hours (midnight to 5 AM)
    if time_of_day_hour >= 0 and time_of_day_hour < 5:
        score += 5
        flags.append(f"Activity at {time_of_day_hour}:00 (unusual delivery hours)")
    
    return {
        "is_suspicious": score > 0,
        "score": min(15, score),
        "detail": "; ".join(flags) if flags else "Battery state consistent with claimed activity",
        "flags": flags
    }


# ============================================================
# LAYER 3: GEOHASH COLLISION DETECTION
# ============================================================

# Geohash character set
GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def encode_geohash(lat: float, lon: float, precision: int = 9) -> str:
    """
    Encode GPS coordinates into a Geohash string.
    
    Precision levels:
    - 5 chars: ~4.9km x 4.9km grid
    - 7 chars: ~153m x 153m grid
    - 9 chars: ~4.77m x 4.77m grid  ← We use this
    
    KEY INSIGHT: If 500+ workers share the same 9-character geohash,
    they are ALL within the same ~4.77m x 4.77m square.
    That is PHYSICALLY IMPOSSIBLE for delivery workers.
    """
    lat_range = [-90.0, 90.0]
    lon_range = [-180.0, 180.0]
    
    geohash = []
    bit = 0
    ch = 0
    is_lon = True
    
    while len(geohash) < precision:
        if is_lon:
            mid = (lon_range[0] + lon_range[1]) / 2
            if lon >= mid:
                ch |= (1 << (4 - bit))
                lon_range[0] = mid
            else:
                lon_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if lat >= mid:
                ch |= (1 << (4 - bit))
                lat_range[0] = mid
            else:
                lat_range[1] = mid
        
        is_lon = not is_lon
        bit += 1
        
        if bit == 5:
            geohash.append(GEOHASH_BASE32[ch])
            bit = 0
            ch = 0
    
    return "".join(geohash)


def detect_geohash_collisions(
    worker_locations: List[dict],
    precision: int = 9,
    collision_threshold: int = 5
) -> dict:
    """
    Detect if multiple workers are artificially stacked in the same grid cell.
    
    Input: List of {worker_id, lat, lon, timestamp} for ALL workers in a zone/time window.
    
    KEY DEFENSE: Converting coordinates to 9-char Geohashes.
    - At precision=9: each cell is ~4.77m x 4.77m
    - If > threshold workers share the EXACT same cell → spoofing syndicate
    
    Even in the densest city areas, you won't have 5+ delivery workers
    within 4.77m² at the same time.
    """
    if len(worker_locations) < collision_threshold:
        return {
            "is_suspicious": False,
            "score": 0,
            "collisions": [],
            "detail": "Insufficient workers for collision analysis",
            "total_workers_analyzed": len(worker_locations)
        }
    
    # Encode all locations to geohashes
    geohash_map = {}
    for loc in worker_locations:
        gh = encode_geohash(loc["lat"], loc["lon"], precision)
        if gh not in geohash_map:
            geohash_map[gh] = []
        geohash_map[gh].append({
            "worker_id": loc["worker_id"],
            "lat": loc["lat"],
            "lon": loc["lon"],
            "geohash": gh
        })
    
    # Find collision clusters
    collisions = []
    for gh, workers in geohash_map.items():
        if len(workers) >= collision_threshold:
            collisions.append({
                "geohash": gh,
                "worker_count": len(workers),
                "workers": [w["worker_id"] for w in workers],
                "center_lat": sum(w["lat"] for w in workers) / len(workers),
                "center_lon": sum(w["lon"] for w in workers) / len(workers),
                "grid_size_meters": 4.77 if precision == 9 else 153 if precision == 7 else 4900,
                "severity": "CRITICAL" if len(workers) >= 50 else "HIGH" if len(workers) >= 20 else "MEDIUM"
            })
    
    # Also check at precision=7 (153m grid) for broader clusters
    geohash_map_7 = {}
    for loc in worker_locations:
        gh7 = encode_geohash(loc["lat"], loc["lon"], 7)
        if gh7 not in geohash_map_7:
            geohash_map_7[gh7] = set()
        geohash_map_7[gh7].add(loc["worker_id"])
    
    broad_clusters = []
    for gh7, worker_ids in geohash_map_7.items():
        if len(worker_ids) >= collision_threshold * 3:
            broad_clusters.append({
                "geohash_7": gh7,
                "worker_count": len(worker_ids),
                "grid_size_meters": 153,
                "severity": "HIGH" if len(worker_ids) >= 100 else "MEDIUM"
            })
    
    # Scoring
    score = 0
    if len(collisions) > 0:
        max_collision = max(c["worker_count"] for c in collisions)
        if max_collision >= 50:
            score = 35  # Maximum: syndicate confirmed
        elif max_collision >= 20:
            score = 30
        elif max_collision >= 10:
            score = 25
        else:
            score = 15
    elif len(broad_clusters) > 0:
        score = 10
    
    total_affected = sum(c["worker_count"] for c in collisions)
    
    return {
        "is_suspicious": score > 0,
        "score": score,
        "collisions": collisions,
        "broad_clusters": broad_clusters,
        "total_workers_analyzed": len(worker_locations),
        "total_workers_in_collisions": total_affected,
        "detail": (
            f"SYNDICATE DETECTED: {total_affected} workers in {len(collisions)} collision clusters "
            f"(same 4.77m² grid cell)"
            if score >= 25 else
            f"Suspicious clustering: {total_affected} workers in tight clusters"
            if score > 0 else
            "No geohash collisions detected"
        )
    }


# ============================================================
# SENSOR FUSION: Combined Anti-Spoof Score
# ============================================================

def compute_anti_spoof_score(
    location_history: List[dict] = None,
    claimed_zone: str = None,
    barometric_pressure: float = 0,
    battery_level: float = -1,
    is_charging: bool = False,
    is_outdoor_claim: bool = True,
    current_hour: int = 12,
    all_worker_locations: List[dict] = None
) -> dict:
    """
    MASTER FUNCTION: Fuse all three detection layers into a single anti-spoof assessment.
    
    Returns a comprehensive report with individual layer scores
    and a combined verdict.
    
    Score ranges (total 0-100):
    - Impossible Travel: 0-35
    - Environmental (barometer + battery): 0-40
    - Geohash Collision: 0-35
    
    Verdict:
    - 0-15: CLEAN (no evidence of spoofing)
    - 15-30: SUSPICIOUS (minor anomalies, flag for review)
    - 30-50: LIKELY_SPOOFED (strong evidence, auto-reject)
    - 50+: CONFIRMED_SPOOF (multiple layers confirm, block + report)
    """
    results = {
        "layers": {},
        "total_score": 0,
        "verdict": "CLEAN",
        "details": [],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Layer 1: Impossible Travel
    if location_history and len(location_history) >= 2:
        travel_result = detect_impossible_travel(location_history)
        results["layers"]["impossible_travel"] = travel_result
        results["total_score"] += travel_result["score"]
        if travel_result["is_suspicious"]:
            results["details"].append(travel_result["detail"])
    
    # Layer 2a: Barometric Pressure
    if barometric_pressure > 0 and claimed_zone:
        baro_result = validate_barometric_pressure(claimed_zone, barometric_pressure)
        results["layers"]["barometric_pressure"] = baro_result
        results["total_score"] += baro_result["score"]
        if baro_result["is_suspicious"]:
            results["details"].append(baro_result["detail"])
    
    # Layer 2b: Battery State
    if battery_level >= 0:
        battery_result = validate_battery_state(
            battery_level, is_charging, is_outdoor_claim, current_hour
        )
        results["layers"]["battery_state"] = battery_result
        results["total_score"] += battery_result["score"]
        if battery_result["is_suspicious"]:
            results["details"].append(battery_result["detail"])
    
    # Layer 3: Geohash Collisions
    if all_worker_locations and len(all_worker_locations) >= 5:
        collision_result = detect_geohash_collisions(all_worker_locations)
        results["layers"]["geohash_collision"] = collision_result
        results["total_score"] += collision_result["score"]
        if collision_result["is_suspicious"]:
            results["details"].append(collision_result["detail"])
    
    # Determine verdict
    score = results["total_score"]
    if score >= 50:
        results["verdict"] = "CONFIRMED_SPOOF"
    elif score >= 30:
        results["verdict"] = "LIKELY_SPOOFED"
    elif score >= 15:
        results["verdict"] = "SUSPICIOUS"
    else:
        results["verdict"] = "CLEAN"
    
    # Add recommended action
    if results["verdict"] == "CONFIRMED_SPOOF":
        results["recommended_action"] = "AUTO_REJECT + BLOCK_WORKER + REPORT_SYNDICATE"
    elif results["verdict"] == "LIKELY_SPOOFED":
        results["recommended_action"] = "AUTO_REJECT + FLAG_FOR_INVESTIGATION"
    elif results["verdict"] == "SUSPICIOUS":
        results["recommended_action"] = "MANUAL_REVIEW_REQUIRED"
    else:
        results["recommended_action"] = "PROCEED_NORMALLY"
    
    return results
