"""
Weather Service — Mock + Real weather data integration
Provides current weather conditions for claim auto-triggering.

For MVP: Uses mock data simulating real weather patterns.
For Production: Integrates with OpenWeatherMap API.
"""

import random
from datetime import datetime, timezone


class WeatherService:
    """Weather data provider for disruption detection."""

    # Zone weather profiles (base probabilities)
    ZONE_PROFILES = {
        "Mumbai": {"rain_prob": 0.35, "heat_prob": 0.2, "aqi_base": 120},
        "Mumbai North": {"rain_prob": 0.35, "heat_prob": 0.2, "aqi_base": 130},
        "Mumbai Central": {"rain_prob": 0.30, "heat_prob": 0.2, "aqi_base": 140},
        "Mumbai South": {"rain_prob": 0.30, "heat_prob": 0.2, "aqi_base": 135},
        "Delhi": {"rain_prob": 0.15, "heat_prob": 0.3, "aqi_base": 250},
        "Bangalore": {"rain_prob": 0.25, "heat_prob": 0.1, "aqi_base": 90},
        "Chennai": {"rain_prob": 0.30, "heat_prob": 0.25, "aqi_base": 100},
        "Kolkata": {"rain_prob": 0.25, "heat_prob": 0.2, "aqi_base": 150},
        "Pune": {"rain_prob": 0.20, "heat_prob": 0.15, "aqi_base": 95},
        "Hyderabad": {"rain_prob": 0.15, "heat_prob": 0.25, "aqi_base": 110},
    }

    # Seasonal multipliers for rain probability
    MONTH_RAIN_MULTIPLIER = {
        1: 0.1, 2: 0.1, 3: 0.2, 4: 0.3, 5: 0.4,
        6: 1.5, 7: 2.0, 8: 1.8, 9: 1.5, 10: 0.8,
        11: 0.3, 12: 0.1,
    }

    MONTH_HEAT_MULTIPLIER = {
        1: 0.3, 2: 0.5, 3: 0.8, 4: 1.5, 5: 2.0,
        6: 1.2, 7: 0.8, 8: 0.7, 9: 0.8, 10: 0.6,
        11: 0.3, 12: 0.2,
    }

    @staticmethod
    def get_current_conditions(zone: str) -> dict:
        """
        Get current weather conditions for a zone (mock).

        Returns realistic weather data with disruption flags.
        """
        now = datetime.now(timezone.utc)
        month = now.month
        hour = now.hour

        profile = WeatherService.ZONE_PROFILES.get(
            zone, {"rain_prob": 0.2, "heat_prob": 0.15, "aqi_base": 100}
        )

        # Calculate rain conditions
        rain_multiplier = WeatherService.MONTH_RAIN_MULTIPLIER.get(month, 0.5)
        rain_prob = min(profile["rain_prob"] * rain_multiplier, 0.9)
        is_raining = random.random() < rain_prob
        rain_mm = round(random.uniform(5, 45), 1) if is_raining else 0

        # Calculate temperature
        heat_multiplier = WeatherService.MONTH_HEAT_MULTIPLIER.get(month, 0.5)
        base_temp = 28 + (heat_multiplier * 10)
        # Add time-of-day variation
        if 10 <= hour <= 16:
            base_temp += random.uniform(2, 6)
        else:
            base_temp -= random.uniform(2, 5)
        temperature = round(base_temp + random.uniform(-3, 3), 1)

        # Calculate AQI
        aqi = int(profile["aqi_base"] + random.uniform(-30, 50))
        if month in [11, 12, 1]:  # Pollution season
            aqi = int(aqi * 1.5)

        # Determine condition string
        if rain_mm > 20:
            condition = "Heavy Rain"
        elif rain_mm > 5:
            condition = "Light Rain"
        elif temperature > 42:
            condition = "Extreme Heat"
        elif temperature > 35:
            condition = "Hot"
        elif aqi > 300:
            condition = "Severe Pollution"
        elif aqi > 200:
            condition = "Poor Air Quality"
        else:
            condition = "Clear"

        # Determine disruptions
        disruptions = []
        if rain_mm > 20:
            disruptions.append({
                "type": "RAIN",
                "severity": "HIGH" if rain_mm > 30 else "MEDIUM",
                "detail": f"Heavy rainfall: {rain_mm}mm/hr",
                "auto_trigger": True,
            })
        if temperature > 45:
            disruptions.append({
                "type": "HEAT",
                "severity": "HIGH",
                "detail": f"Extreme heat: {temperature}°C",
                "auto_trigger": True,
            })
        elif temperature > 42:
            disruptions.append({
                "type": "HEAT",
                "severity": "MEDIUM",
                "detail": f"High temperature: {temperature}°C",
                "auto_trigger": False,
            })
        if aqi > 300:
            disruptions.append({
                "type": "AQI",
                "severity": "HIGH",
                "detail": f"Severe pollution: AQI {aqi}",
                "auto_trigger": True,
            })

        return {
            "zone": zone,
            "timestamp": now.isoformat(),
            "condition": condition,
            "temperature": temperature,
            "humidity": random.randint(40, 95),
            "rain_mm": rain_mm,
            "aqi": aqi,
            "wind_speed": round(random.uniform(5, 35), 1),
            "disruptions": disruptions,
            "is_disrupted": len(disruptions) > 0,
            "auto_trigger_active": any(d["auto_trigger"] for d in disruptions),
        }

    @staticmethod
    def get_forecast(zone: str, days: int = 7) -> list:
        """Get weather forecast for upcoming days (mock)."""
        forecasts = []
        for day in range(days):
            conditions = WeatherService.get_current_conditions(zone)
            conditions["day_offset"] = day
            forecasts.append(conditions)
        return forecasts

    @staticmethod
    def check_disruption_threshold(zone: str) -> dict:
        """
        Check if current conditions exceed disruption thresholds.
        Used by auto-trigger system.
        """
        conditions = WeatherService.get_current_conditions(zone)

        should_trigger = False
        trigger_reasons = []

        if conditions["rain_mm"] > 20:
            should_trigger = True
            trigger_reasons.append(f"Heavy rain: {conditions['rain_mm']}mm")

        if conditions["temperature"] > 45:
            should_trigger = True
            trigger_reasons.append(f"Extreme heat: {conditions['temperature']}°C")

        if conditions["aqi"] > 300:
            should_trigger = True
            trigger_reasons.append(f"Severe AQI: {conditions['aqi']}")

        return {
            "zone": zone,
            "should_trigger": should_trigger,
            "trigger_reasons": trigger_reasons,
            "conditions": conditions,
        }


# Singleton
weather_service = WeatherService()


def get_weather_for_zone(zone: str) -> dict:
    """Convenience function for use by other services."""
    return weather_service.get_current_conditions(zone)
