"""
Weather API Routes
Provides weather conditions and disruption detection for zones.
"""

from fastapi import APIRouter, Query
from services.weather_service import weather_service

router = APIRouter()


@router.get("/current")
async def get_current_weather(zone: str = Query(..., description="Zone/city name")):
    """
    Get current weather conditions for a zone.
    Returns temperature, rain, AQI, and active disruptions.
    """
    conditions = weather_service.get_current_conditions(zone)
    return conditions


@router.get("/forecast")
async def get_weather_forecast(
    zone: str = Query(..., description="Zone/city name"),
    days: int = Query(7, ge=1, le=14, description="Number of forecast days"),
):
    """Get weather forecast for upcoming days."""
    forecast = weather_service.get_forecast(zone, days)
    return {"zone": zone, "forecast": forecast}


@router.get("/check-disruption")
async def check_disruption(zone: str = Query(..., description="Zone/city name")):
    """
    Check if current conditions exceed disruption thresholds.
    Used by the auto-trigger system to file claims automatically.
    """
    result = weather_service.check_disruption_threshold(zone)
    return result


@router.get("/zones")
async def get_available_zones():
    """Get list of zones with weather monitoring."""
    zones = list(weather_service.ZONE_PROFILES.keys())
    return {
        "zones": zones,
        "total": len(zones),
    }
