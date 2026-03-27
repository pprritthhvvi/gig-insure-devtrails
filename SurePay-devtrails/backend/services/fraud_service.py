"""
Fraud Detection Service — Multi-rule scoring engine
Scores claims 0-100 based on multiple risk factors.
Now includes GPS anti-spoofing checks via sensor-fusion.

Scoring Bands:
  0-10:  Low risk → Auto-approve
  10-25: Medium risk → Light review
  25-40: High risk → Flag for manual review
  40+:   Very high risk → Auto-reject
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional


class FraudDetectionService:
    """Rule-based fraud detection with multi-factor scoring."""

    # Weights for each check (must sum to ~100)
    WEIGHTS = {
        "amount_anomaly": 15,
        "frequency_check": 15,
        "time_check": 5,
        "type_consistency": 5,
        "history_check": 10,
        "gps_anti_spoof": 20,
        "earnings_consistency": 10,
        "behavior_analysis": 10,
        "cluster_detection": 10,
    }

    @staticmethod
    def calculate_fraud_score(
        claimed_amount: float,
        max_payout: float,
        worker_avg_claim: float = 0,
        recent_claims_count: int = 0,
        claim_hour: int = 12,
        disruption_type: str = "RAIN",
        worker_total_claims: int = 0,
        worker_fraud_flags: int = 0,
        # NEW: Anti-spoof sensor data
        location_history: Optional[List[dict]] = None,
        claimed_zone: str = "Mumbai",
        barometric_pressure: float = 0,
        battery_level: float = -1,
        is_charging: bool = False,
        # Phase 3: Advanced Fraud Features
        avg_daily_earnings: float = 500.0,
        hours_since_policy_start: int = 48,
        similar_claims_in_zone: int = 0,
    ) -> dict:
        """
        Calculate comprehensive fraud score for a claim.

        Returns:
            dict with 'score', 'risk_level', 'checks' (detailed breakdown)
        """
        checks = []
        total_score = 0

        # 1. Amount Anomaly Check (0-30 points)
        amount_score = FraudDetectionService._check_amount_anomaly(
            claimed_amount, max_payout, worker_avg_claim
        )
        total_score += amount_score
        checks.append({
            "check_type": "AMOUNT_ANOMALY",
            "score": amount_score,
            "max_score": 30,
            "result": "PASS" if amount_score < 15 else "FLAG",
            "details": f"Claimed ₹{claimed_amount:.0f} vs max ₹{max_payout:.0f}"
        })

        # 2. Frequency Check (0-25 points)
        freq_score = FraudDetectionService._check_frequency(recent_claims_count)
        total_score += freq_score
        checks.append({
            "check_type": "FREQUENCY",
            "score": freq_score,
            "max_score": 25,
            "result": "PASS" if freq_score < 12 else "FLAG",
            "details": f"{recent_claims_count} claims in last 7 days"
        })

        # 3. Time-of-Day Check (0-15 points)
        time_score = FraudDetectionService._check_time(claim_hour)
        total_score += time_score
        checks.append({
            "check_type": "TIME_OF_DAY",
            "score": time_score,
            "max_score": 15,
            "result": "PASS" if time_score < 8 else "FLAG",
            "details": f"Claim filed at {claim_hour}:00"
        })

        # 4. Disruption Type Consistency (0-15 points)
        type_score = FraudDetectionService._check_type_consistency(
            disruption_type, claim_hour
        )
        total_score += type_score
        checks.append({
            "check_type": "TYPE_CONSISTENCY",
            "score": type_score,
            "max_score": 15,
            "result": "PASS" if type_score < 8 else "FLAG",
            "details": f"Disruption: {disruption_type}"
        })

        # 5. History Check (0-15 points)
        history_score = FraudDetectionService._check_history(
            worker_total_claims, worker_fraud_flags
        )
        total_score += history_score
        checks.append({
            "check_type": "WORKER_HISTORY",
            "score": history_score,
            "max_score": 15,
            "result": "PASS" if history_score < 8 else "FLAG",
            "details": f"{worker_total_claims} total claims, {worker_fraud_flags} fraud flags"
        })

        # 6. GPS Anti-Spoof Check (0-20 points) — NEW
        spoof_score = FraudDetectionService._check_gps_spoofing(
            location_history=location_history,
            claimed_zone=claimed_zone,
            barometric_pressure=barometric_pressure,
            battery_level=battery_level,
            is_charging=is_charging,
            claim_hour=claim_hour,
        )
        total_score += spoof_score["score"]
        checks.append({
            "check_type": "GPS_ANTI_SPOOF",
            "score": spoof_score["score"],
            "max_score": 20,
            "result": "PASS" if spoof_score["score"] < 10 else "FLAG",
            "details": spoof_score["detail"],
            "verdict": spoof_score.get("verdict", "CLEAN"),
            "layers": spoof_score.get("layers", {})
        })

        # 7. Earnings Consistency Check (0-10 points)
        earnings_score = FraudDetectionService._check_earnings_consistency(
            claimed_amount, avg_daily_earnings
        )
        total_score += earnings_score
        checks.append({
            "check_type": "EARNINGS_CONSISTENCY",
            "score": earnings_score,
            "max_score": 10,
            "result": "PASS" if earnings_score < 7 else "FLAG",
            "details": f"Claim vs Avg Daily Earnings (₹{avg_daily_earnings:.0f})"
        })

        # 8. Behavioral Analysis (0-10 points)
        behavior_score = FraudDetectionService._check_behavioral_pattern(
            hours_since_policy_start, claim_hour
        )
        total_score += behavior_score
        checks.append({
            "check_type": "BEHAVIOR_ANALYSIS",
            "score": behavior_score,
            "max_score": 10,
            "result": "PASS" if behavior_score < 6 else "FLAG",
            "details": f"Policy timing & submission pattern"
        })

        # 9. Cluster Detection (0-10 points)
        cluster_score = FraudDetectionService._check_claim_clusters(
            similar_claims_in_zone, disruption_type
        )
        total_score += cluster_score
        checks.append({
            "check_type": "CLUSTER_ANOMALY",
            "score": cluster_score,
            "max_score": 10,
            "result": "PASS" if cluster_score < 6 else "FLAG",
            "details": f"{similar_claims_in_zone} similar claims in zone"
        })

        # Cap score at 100
        total_score = min(total_score, 100)

        # Determine risk level
        if total_score < 10:
            risk_level = "LOW"
        elif total_score < 25:
            risk_level = "MEDIUM"
        elif total_score < 40:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "score": total_score,
            "risk_level": risk_level,
            "checks": checks,
            "recommendation": FraudDetectionService._get_recommendation(total_score),
            "anti_spoof_verdict": spoof_score.get("verdict", "NO_DATA"),
        }

    @staticmethod
    def _check_amount_anomaly(claimed: float, max_payout: float, avg_claim: float) -> int:
        """Score based on how the claimed amount compares to limits and history."""
        score = 0

        # Check against max payout
        ratio = claimed / max_payout if max_payout > 0 else 1.0
        if ratio > 1.0:
            score += 25  # Exceeds max payout
        elif ratio > 0.9:
            score += 15  # Very close to max
        elif ratio > 0.7:
            score += 8   # Moderately high
        elif ratio > 0.5:
            score += 3   # Reasonable

        # Check against worker average (if available)
        if avg_claim > 0:
            deviation = claimed / avg_claim
            if deviation > 3.0:
                score += 5  # 3x higher than average
            elif deviation > 2.0:
                score += 3  # 2x higher

        return min(score, 30)

    @staticmethod
    def _check_frequency(recent_claims_count: int) -> int:
        """Score based on claim frequency in recent period."""
        if recent_claims_count >= 5:
            return 25  # Very suspicious
        elif recent_claims_count >= 3:
            return 18  # Suspicious
        elif recent_claims_count >= 2:
            return 10  # Elevated
        elif recent_claims_count >= 1:
            return 4   # Normal
        return 0

    @staticmethod
    def _check_time(hour: int) -> int:
        """Score based on time of day (unusual hours are suspicious)."""
        if 0 <= hour < 5:
            return 12  # Very unusual time
        elif 5 <= hour < 7:
            return 6   # Early but possible
        elif 22 <= hour <= 23:
            return 8   # Late night
        return 0  # Normal hours

    @staticmethod
    def _check_type_consistency(disruption_type: str, hour: int) -> int:
        """Check if disruption type makes sense with the time."""
        score = 0

        # Heat at night doesn't make sense
        if disruption_type == "HEAT" and (hour < 8 or hour > 20):
            score += 10

        # App crash is always plausible, low score
        if disruption_type == "APP_CRASH":
            score += 0

        return min(score, 15)

    @staticmethod
    def _check_history(total_claims: int, fraud_flags: int) -> int:
        """Score based on worker's historical behavior."""
        score = 0

        if fraud_flags >= 3:
            score += 15  # Multiple fraud flags
        elif fraud_flags >= 1:
            score += 8   # Has fraud history

        # Very high claim count in short period
        if total_claims > 20:
            score += 5

        return min(score, 10)

    @staticmethod
    def _check_earnings_consistency(claimed: float, avg_daily_earnings: float) -> int:
        """Reject claims where 'lost income' is significantly higher than historical average."""
        if avg_daily_earnings <= 0:
            return 3  # No history to compare
            
        ratio = claimed / avg_daily_earnings
        if ratio > 5.0:
            return 10  # Claim is 5x historical daily average
        elif ratio > 3.0:
            return 6
        elif ratio > 1.5:
            return 2
        return 0

    @staticmethod
    def _check_behavioral_pattern(hours_since_policy_start: int, hour: int) -> int:
        """Detect unexpected behavior shifts, e.g., claims immediately after policy starts."""
        score = 0
        if hours_since_policy_start < 2:
            score += 8  # Claim within 2 hours of buying policy
        elif hours_since_policy_start < 12:
            score += 4
            
        # Unusual timing behavior
        if 2 <= hour <= 4:
            score += 3
            
        return min(score, 10)

    @staticmethod
    def _check_claim_clusters(similar_claims: int, disruption_type: str) -> int:
        """Cross-reference with other workers to detect coordinated syndicate attacks."""
        if disruption_type == "APP_CRASH":
            if similar_claims < 2:
                # App crash with no other workers affected? Very suspicious!
                return 8
            return 0
            
        # For non-weather events, hyper-clustering can indicate telegram groups
        if "telegram_syndicate_detected" in disruption_type.lower():
            return 10
            
        if similar_claims > 50:
            # Massive sudden cluster might need review
            return 5
            
        return 0

    @staticmethod
    def _get_recommendation(score: int) -> str:
        """Get action recommendation based on score."""
        if score < 10:
            return "AUTO_APPROVE"
        elif score < 25:
            return "APPROVE_WITH_NOTE"
        elif score < 40:
            return "MANUAL_REVIEW"
        else:
            return "AUTO_REJECT"

    @staticmethod
    def determine_claim_status(score: int) -> tuple:
        """
        Given a fraud score, determine claim status and payout.

        Returns:
            (status, should_payout)
        """
        if score < 10:
            return ("APPROVED", True)
        elif score < 25:
            return ("APPROVED", True)
        elif score < 40:
            return ("PENDING", False)
        else:
            return ("REJECTED", False)

    @staticmethod
    def _check_gps_spoofing(
        location_history: Optional[List[dict]] = None,
        claimed_zone: str = "Mumbai",
        barometric_pressure: float = 0,
        battery_level: float = -1,
        is_charging: bool = False,
        claim_hour: int = 12,
    ) -> dict:
        """
        Run lightweight sensor-fusion anti-spoof checks.
        Scales the anti-spoof score (0-100) down to 0-25 for this fraud dimension.
        """
        from services.anti_spoof_service import compute_anti_spoof_score
        
        result = compute_anti_spoof_score(
            location_history=location_history,
            claimed_zone=claimed_zone,
            barometric_pressure=barometric_pressure,
            battery_level=battery_level,
            is_charging=is_charging,
            is_outdoor_claim=True,
            current_hour=claim_hour,
        )
        
        # Scale the 0-100 anti-spoof score to 0-25 for fraud scoring
        raw_score = result.get("total_score", 0)
        scaled_score = min(25, int(raw_score * 0.25))
        
        return {
            "score": scaled_score,
            "detail": "; ".join(result.get("details", [])) or "No spoofing indicators",
            "verdict": result.get("verdict", "NO_DATA"),
            "layers": result.get("layers", {})
        }


# Singleton instance
fraud_service = FraudDetectionService()
