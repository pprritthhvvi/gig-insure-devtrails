import random
from typing import Dict, Any

class ChurnService:
    """
    Simulated implementation of a Random Forest predictive model to forecast
    which workers are likely to churn (abandon their policy) next week.
    
    Features used in model:
    - Premium affordability (premium amount / week's earnings)
    - Claim approval rate (satisfaction)
    - Recent earnings trends
    - Competitor prevalence in the zone
    """

    def __init__(self):
        # Base churn rate for the platform
        self.base_churn_probability = 0.15

    def predict_worker_churn(self, 
                             premium_paid: float, 
                             avg_weekly_earnings: float, 
                             total_claims_filed: int,
                             claims_approved: int,
                             zone: str) -> Dict[str, Any]:
        """
        Generate a churn risk score for a single worker.
        """
        churn_score = self.base_churn_probability

        # 1. Premium Affordability Feature (Random Forest Split 1)
        # If premium is > 8% of weekly earnings, high churn risk
        if avg_weekly_earnings > 0:
            affordability_ratio = premium_paid / avg_weekly_earnings
            if affordability_ratio > 0.08:
                churn_score += 0.35
            elif affordability_ratio > 0.05:
                churn_score += 0.15
            else:
                churn_score -= 0.05
                
        # 2. Claim Satisfaction Feature (Random Forest Split 2)
        # If worker has filed claims but they were mostly rejected
        if total_claims_filed > 0:
            approval_rate = claims_approved / total_claims_filed
            if approval_rate < 0.3:
                churn_score += 0.40  # Highly dissatisfied
            elif approval_rate == 1.0:
                churn_score -= 0.10  # Highly satisfied
        else:
            # Paying premium but never claimed (gradually increases churn)
            churn_score += 0.05
            
        # 3. Zone Competitor Feature
        highly_competitive_zones = ["Bangalore", "Delhi", "Mumbai"]
        if zone in highly_competitive_zones:
            churn_score += 0.05

        # Add ML noise/variance
        noise = random.uniform(-0.05, 0.05)
        final_probability = max(0.01, min(0.99, churn_score + noise))
        
        # Classify Risk Level
        if final_probability > 0.70:
            risk_level = "HIGH_RISK"
            recommended_action = "Offer ₹50 loyalty discount next week"
        elif final_probability > 0.40:
            risk_level = "MEDIUM_RISK"
            recommended_action = "Send personalized SMS about protection value"
        else:
            risk_level = "LOW_RISK"
            recommended_action = "Maintain regular comms"
            
        return {
            "churn_probability": round(final_probability, 3),
            "risk_level": risk_level,
            "recommended_action": recommended_action,
            "feature_contributions": {
                "base_rate": self.base_churn_probability,
                "affordability_impact": round(premium_paid / max(1, avg_weekly_earnings), 3),
                "satisfaction_impact": round(claims_approved / max(1, total_claims_filed) if total_claims_filed else 0, 3)
            }
        }

churn_service = ChurnService()
