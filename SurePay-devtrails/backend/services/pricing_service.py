"""
Dynamic Premium Pricing Service
Calculates weekly insurance premium based on multiple risk factors.

Base premium: ₹100
Final range: ₹80 - ₹250
"""


class PricingService:
    """Bayesian-inspired dynamic pricing for gig worker insurance."""

    BASE_PREMIUM = 100.0
    MIN_PREMIUM = 80.0
    MAX_PREMIUM = 250.0

    # Zone risk multipliers
    ZONE_RISK = {
        # High risk (coastal/monsoon prone)
        "Mumbai": 1.4,
        "Mumbai North": 1.4,
        "Mumbai Central": 1.35,
        "Mumbai South": 1.35,
        "Chennai": 1.3,
        "Kolkata": 1.3,
        "Goa": 1.25,

        # Medium risk
        "Bangalore": 1.15,
        "Hyderabad": 1.1,
        "Pune": 1.15,

        # Low risk
        "Delhi": 1.05,
        "Jaipur": 1.0,
        "Lucknow": 1.0,
    }

    # Seasonal adjustments
    SEASON_ADJUSTMENT = {
        1: 0,      # January - Normal
        2: 0,      # February - Normal
        3: 5,      # March - Start of summer
        4: 25,     # April - Summer heat
        5: 35,     # May - Peak summer
        6: 45,     # June - Monsoon start
        7: 50,     # July - Peak monsoon
        8: 45,     # August - Monsoon
        9: 35,     # September - Monsoon end
        10: 10,    # October - Post-monsoon
        11: 15,    # November - Pollution season
        12: 10,    # December - Pollution + winter
    }

    # Platform adjustments
    PLATFORM_ADJUSTMENT = {
        "Zomato": 0,
        "Swiggy": 0,
        "Ola": 5,
        "Uber": 5,
        "Amazon": -5,
        "Flipkart": -5,
        "Zepto": 10,  # Quick commerce = more weather exposure
    }

    @staticmethod
    def calculate_premium(
        zone: str = "Mumbai",
        platform: str = "Zomato",
        worker_experience_deliveries: int = 0,
        worker_claim_history: int = 0,
        worker_fraud_flags: int = 0,
        month: int = None,
        max_payout_per_week: float = 2000.0,
    ) -> dict:
        """
        Calculate dynamic weekly premium with full breakdown.

        Returns:
            dict with 'final_premium', 'breakdown', 'risk_factors'
        """
        import datetime

        if month is None:
            month = datetime.datetime.now().month

        breakdown = {}

        # 1. Base premium
        base = PricingService.BASE_PREMIUM
        breakdown["base_premium"] = base

        # 2. Zone risk adjustment (40% weight)
        zone_multiplier = PricingService.ZONE_RISK.get(zone, 1.1)
        zone_adjustment = base * (zone_multiplier - 1.0)
        breakdown["zone_risk"] = round(zone_adjustment, 2)
        breakdown["zone_risk_detail"] = f"{zone} (multiplier: {zone_multiplier}x)"

        # 3. Seasonal adjustment (20% weight)
        seasonal = PricingService.SEASON_ADJUSTMENT.get(month, 0)
        breakdown["seasonal_adjustment"] = seasonal
        breakdown["seasonal_detail"] = f"Month {month}"

        # 4. Worker experience adjustment (25% weight)
        if worker_experience_deliveries < 50:
            experience_adj = 20  # New worker surcharge
            experience_detail = "New worker (<50 deliveries)"
        elif worker_experience_deliveries < 200:
            experience_adj = 10
            experience_detail = "Intermediate worker"
        elif worker_experience_deliveries < 500:
            experience_adj = 0
            experience_detail = "Experienced worker"
        else:
            experience_adj = -10  # Veteran discount
            experience_detail = "Veteran worker (500+ deliveries)"

        # Adjust for claim history
        if worker_claim_history == 0:
            experience_adj -= 5  # Clean history bonus
            experience_detail += " + clean record"
        elif worker_claim_history > 5:
            experience_adj += 10  # Frequent claimer surcharge
            experience_detail += " + frequent claims"

        # Fraud flag penalty
        if worker_fraud_flags > 0:
            experience_adj += worker_fraud_flags * 15
            experience_detail += f" + {worker_fraud_flags} fraud flag(s)"

        breakdown["worker_adjustment"] = experience_adj
        breakdown["worker_detail"] = experience_detail

        # 5. Platform adjustment (15% weight)
        platform_adj = PricingService.PLATFORM_ADJUSTMENT.get(platform, 0)
        breakdown["platform_adjustment"] = platform_adj
        breakdown["platform_detail"] = platform

        # 6. Coverage level adjustment
        if max_payout_per_week > 3000:
            coverage_adj = 20
        elif max_payout_per_week > 2000:
            coverage_adj = 10
        else:
            coverage_adj = 0
        breakdown["coverage_adjustment"] = coverage_adj

        # Calculate final premium
        final = base + zone_adjustment + seasonal + experience_adj + platform_adj + coverage_adj
        final = max(PricingService.MIN_PREMIUM, min(final, PricingService.MAX_PREMIUM))
        final = round(final, 2)

        # Risk assessment
        risk_score = (final - PricingService.MIN_PREMIUM) / (PricingService.MAX_PREMIUM - PricingService.MIN_PREMIUM) * 100
        if risk_score < 25:
            risk_level = "LOW"
        elif risk_score < 50:
            risk_level = "MEDIUM"
        elif risk_score < 75:
            risk_level = "HIGH"
        else:
            risk_level = "VERY_HIGH"

        # Construct SHAP-compatible waterfall for UI Explainability
        shap_waterfall = [
            {"feature": "Base Premium", "impact": round(base, 2), "description": "Standard market rate"},
            {"feature": "Zone Risk", "impact": round(zone_adjustment, 2), "description": breakdown["zone_risk_detail"]},
            {"feature": "Seasonality", "impact": round(seasonal, 2), "description": breakdown["seasonal_detail"]},
            {"feature": "Worker Profile", "impact": round(experience_adj, 2), "description": breakdown["worker_detail"]},
            {"feature": "Platform", "impact": round(platform_adj, 2), "description": breakdown["platform_detail"]},
        ]
        
        # Only add coverage adjustment if it exists
        if coverage_adj != 0:
            shap_waterfall.append({"feature": "Coverage Plan", "impact": round(coverage_adj, 2), "description": f"Up to ₹{max_payout_per_week}"})

        return {
            "final_premium": final,
            "breakdown": breakdown,
            "shap_waterfall": shap_waterfall,
            "risk_level": risk_level,
            "risk_score": round(risk_score, 1),
            "currency": "INR",
            "period": "weekly",
            "max_payout_per_week": max_payout_per_week,
        }


# Singleton
pricing_service = PricingService()
