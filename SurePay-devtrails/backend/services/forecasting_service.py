import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

class ForecastingService:
    """
    Simulated implementation of a LightGBM/Random Forest predictive model to forecast
    future claims over the next week. This helps admin anticipate liquidity requirements.
    
    In a true production environment, this would:
    1. Load a pre-trained pickle/joblib model built with lightgbm
    2. Extract historical features (recent_claims_per_day, worker_count)
    3. Feed weather forecast data into the model inference step
    """

    def __init__(self):
        # Base multipliers for the simulation
        self.weather_multipliers = {
            "Clear": 1.0,
            "Clouds": 1.1,
            "Rain": 2.5,
            "Drizzle": 1.5,
            "Thunderstorm": 3.0,
            "Extreme Heat": 1.8
        }
        self.weekend_multiplier = 1.3

    def generate_next_7_days_forecast(self, active_policies_count: int, zone_weather_forecasts: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Generate a 7-day forecast of expected claims and required liquidity.
        
        Args:
            active_policies_count: Current number of active protected workers
            zone_weather_forecasts: Dictionary mapping zone -> list of 7 daily weather conditions
                                    e.g. {"Mumbai": ["Clear", "Rain", "Rain", ...]}
        """
        base_daily_claims = active_policies_count * 0.05  # Assume 5% baseline claim rate per day normally
        
        forecast = []
        total_expected_claims = 0
        total_expected_payout = 0
        
        now = datetime.now()
        
        for i in range(7):
            day_date = now + timedelta(days=i)
            is_weekend = day_date.weekday() >= 5
            
            daily_claims = 0
            
            # Aggregate risk across zones
            for zone, weather_days in zone_weather_forecasts.items():
                if i < len(weather_days):
                    condition = weather_days[i]
                else:
                    condition = "Clear"
                    
                w_mult = self.weather_multipliers.get(condition, 1.0)
                zone_base = base_daily_claims / max(1, len(zone_weather_forecasts))
                
                # Formula: Base * Weather Risk * (Weekend Risk if applicable) + Some Noise
                zone_claims = zone_base * w_mult
                if is_weekend:
                    zone_claims *= self.weekend_multiplier
                    
                daily_claims += zone_claims
                
            # Add random noise for ML simulation (-10% to +10%)
            noise = random.uniform(0.9, 1.1)
            daily_claims = int(daily_claims * noise)
            
            # Simulate ML Confidence Interval
            lower_bound = int(daily_claims * 0.8)
            upper_bound = int(daily_claims * 1.2)
            
            # Average payout per claim is simulated at ~₹1000
            daily_payout = daily_claims * 1000
            
            forecast.append({
                "date": day_date.strftime("%Y-%m-%d"),
                "day_of_week": day_date.strftime("%A"),
                "expected_claims": daily_claims,
                "confidence_interval": [lower_bound, upper_bound],
                "expected_payout_required": daily_payout,
                "dominant_weather": list(zone_weather_forecasts.values())[0][i] if zone_weather_forecasts else "Clear"
            })
            
            total_expected_claims += daily_claims
            total_expected_payout += daily_payout
            
        return {
            "forecast_generated_at": now.isoformat(),
            "active_policies": active_policies_count,
            "7_day_summary": {
                "total_expected_claims": total_expected_claims,
                "total_liquidity_required": total_expected_payout,
            },
            "daily_forecasts": forecast
        }

forecasting_service = ForecastingService()
