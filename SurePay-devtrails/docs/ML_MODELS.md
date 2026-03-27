# ML Models & AI Integration Strategy

## Overview
GigGuard uses machine learning for dynamic pricing, fraud detection, and risk prediction. This document details each model.

> **Phase 2 Status:** Pricing and Fraud Detection models are now **IMPLEMENTED** and live.
> See `services/pricing_service.py` and `services/fraud_service.py`.

---

## 1. Bayesian Pricing Model — ✅ IMPLEMENTED

### Purpose
Calculate fair, dynamic weekly premiums based on worker and zone risk factors.

### Algorithm
**Bayesian Network** with hierarchical structure:

```
                         WEEKLY_PREMIUM
                              |
                    ┌─────────┼────────────┐
                    |         |            |
              ZONE_RISK  WORKER_RISK  SEASONAL
                    |         |            |
        ┌───────────┼────┐    |      ┌─────┴──────┐
        |           |    |    |      |            |
     RAIN_HIST  HEAT_HIST AQI_HIST CLAIMS  FRAUD MONSOON  SUMMER
```

### Input Features (Phase 2)
```python
Features:
├── Zone Features (40% weight)
│   ├── Historical rainfall (avg mm/year)
│   ├── Historical AQI (avg, max)
│   ├── Heatwave frequency (days >45°C)
│   └── Curfew/strike frequency (historical)
│
├── Worker Features (25% weight)
│   ├── Experience (delivery count)
│   ├── Claims history (count, approval rate)
│   ├── Fraud flags (count)
│   ├── Earnings level (proxy for volume)
│   └── KYC verification status
│
├── Temporal Features (20% weight)
│   ├── Current season (monsoon, summer, normal)
│   ├── Month of year
│   ├── Week of year
│   └── Day of week
│
└── Market Features (15% weight)
    ├── Competitor pricing
    ├── Platform surge pricing
    ├── Demand level
    └── Acquisition cohort
```

### Model Architecture
```python
# Simplified Bayesian formula

def calculate_premium(worker, zone, date):
    base = 100  # DC baseline
    
    # Zone Risk Component
    rain_risk = zone.historical_rainfall / 100 * 50  # Max +50
    heat_risk = zone.heat_days / 365 * 40            # Max +40
    aqi_risk = zone.avg_aqi / 500 * 30               # Max +30
    social_risk = zone.curfew_frequency / 52 * 20    # Max +20
    zone_risk = min(rain_risk + heat_risk + aqi_risk + social_risk, 100)
    
    # Worker Risk Component
    if worker.claims_count == 0:
        worker_risk = -10  # Honest worker discount
    elif worker.fraud_flags > 0:
        worker_risk = 20 * worker.fraud_flags
    else:
        worker_risk = worker.claims_count / 10  # Base claim frequency
    
    # Seasonal Component
    if is_monsoon_season(date):
        seasonal = 40
    elif is_summer_season(date):
        seasonal = 25
    else:
        seasonal = 0
    
    # Final Premium
    premium = base + zone_risk + worker_risk + seasonal
    return min(max(premium, 80), 220)  # Clamp between DC 80-220
```

### Training Data (Phase 2)
- **Source:** Historical weather + mock delivery data
- **Size:** 3,000+ worker-weeks, 6 months simulated history
- **Features:** 50+ engineered features
- **Validation:** 80-20 train-test split, 5-fold cross-validation

### Phase 2 Evaluation Metric
```
Root Mean Square Error (RMSE):
Target: < DC 15 (±15% accuracy)

Example:
Actual premium: DC 150
Model predicts: DC 160
RMSE contribution: (160-150)² = 100
Across 1000 predictions: sqrt(mean(errors²)) < 225
→ RMSE = √225 = 15 ✓
```

### Retraining Schedule
- **Initial:** Train once before Phase 2 launch
- **Weekly:** Retrain every Sunday with new real data
- **Monthly:** Full recalibration in Phase 3

---

## 2. Fraud Detection System — ✅ IMPLEMENTED (Phase 2 Layer)

### Phase 2: Rule-Based + Anomaly Detection

#### Layer 1: Rule-Based Checks
```python
class FraudDetector:
    def check_location_validity(claim):
        """Verify claim location matches worker's usual zone"""
        last_delivery_zone = worker.last_delivery_location
        claim_zone = claim.disruption_zone
        
        if distance(last_delivery_zone, claim_zone) > 50_km:
            return (FAIL, score=30)  # Suspicious
        return (PASS, score=0)
    
    def check_duplicate_claims(claim):
        """Detect duplicate or near-duplicate claims"""
        recent_claims = worker.claims_this_week()
        
        for other_claim in recent_claims:
            if (other_claim.disruption_type == claim.disruption_type and
                time_delta < 2_hours and
                distance(other_claim.location, claim.location) < 5_km):
                return (FAIL, score=40)  # Suspicious
        
        return (PASS, score=0)
    
    def check_earnings_consistency(claim):
        """Verify claimed loss matches historical earnings"""
        avg_hourly = worker.avg_hourly_earnings
        claimed_loss = claim.claimed_amount
        claimed_hours = claimed_loss / avg_hourly
        
        if claimed_hours > worker.max_daily_hours * 1.2:
            return (FAIL, score=35)  # Physically impossible
        
        return (PASS, score=0)
    
    def check_weather_consistency(claim):
        """Verify disruption claim matches actual weather"""
        weather = weather_api.get_for_zone(claim.zone, claim.time)
        
        if claim.disruption_type == 'RAIN':
            if weather.rainfall < 15_mm:  # Threshold
                return (FAIL, score=25)  # No heavy rain detected
        
        elif claim.disruption_type == 'HEAT':
            if weather.temp < 42:
                return (FAIL, score=25)
        
        elif claim.disruption_type == 'AQI':
            if weather.aqi < 250:
                return (FAIL, score=25)
        
        return (PASS, score=0)

def calculate_fraud_score_phase2(claim):
    """Combine rule-based checks"""
    scores = [
        check_location_validity(claim),
        check_duplicate_claims(claim),
        check_earnings_consistency(claim),
        check_weather_consistency(claim)
    ]
    
    final_score = max(score for _, score in scores)
    return final_score  # 0-40 range
```

#### Layer 2: Isolation Forest (Anomaly Detection)
```python
from sklearn.ensemble import IsolationForest

# Train on historical clean claims
X_train = [
    claim.claimed_amount,
    claim.hours_lost,
    claim.frequency_this_week,
    claim.geohash_entropy  # Location spread
]

iso_forest = IsolationForest(contamination=0.05)
iso_forest.fit(X_train)

# Score new claims
anomaly_score = iso_forest.decision_function(X_new)  # -1 to 1
fraud_score_ml = max(0, -anomaly_score * 50)  # Scale to 0-50
```

#### Phase 2 Final Fraud Score
```
fraud_score = combine(
    rule_based_score (0-40),  # Weather, location, duplicate
    ml_anomaly_score (0-50)   # Statistical outliers
)
range: 0-90

Decision:
├── 0-15: AUTO_APPROVE (low risk)
├── 15-40: HUMAN_REVIEW (medium risk, <2 hour SLA)
└── 40-90: AUTO_REJECT (high risk, with appeal option)
```

### Phase 3: Advanced Multi-Layer Detection

#### Layer 3A: GPS Spoofing Detection
```python
def detect_gps_spoofing(claim):
    """Check if GPS coordinates are physically feasible"""
    # Get last 5 delivery locations
    delivery_path = worker.recent_deliveries()
    claim_location = claim.location
    
    # Calculate max feasible distance in time elapsed
    time_delta = claim.time - last_delivery_time
    max_distance = max_speed * time_delta  # ~100 km/h
    
    actual_distance = distance(claim_location, last_location)
    
    if actual_distance > max_distance:
        return (SPOOF_DETECTED, score=50)
    
    return (LEGITIMATE, score=0)
```

#### Layer 3B: Behavioral Anomaly Detection (HMM)
```python
from hmmlearn import hmm

# Hidden Markov Model to detect claim behavior shifts
states = ['NORMAL', 'SUSPICIOUS', 'FRAUDULENT']

# Train HMM on 6 weeks of historical claims
X = [
    claims.claimed_amount,
    claims.disruption_type,
    claims.day_of_week,
    claims.fraud_score
]

model = hmm.GaussianHMM(n_components=3)
model.fit(X)

# Predict if new claim sequence is anomalous
hidden_state = model.predict(new_claim_sequence)
if hidden_state == FRAUDULENT:
    return (BEHAVIORAL_ANOMALY, score=45)
```

#### Layer 3C: Network Analysis (Fraud Ring Detection)
```python
def detect_fraud_rings(claim):
    """Identify if worker is part of coordinated fraud ring"""
    # Get all claims from same zone by different workers
    # in same hour
    concurrent_claims = claims.get_same_zone_hour(
        claim.zone,
        claim.time
    )
    
    # If >5 workers claim same disruption at same time:
    # Could be legitimate but might indicate coordination
    if len(concurrent_claims) > 8:
        # Check if claims are identical (suspicious)
        amounts = [c.claimed_amount for c in concurrent_claims]
        if std_dev(amounts) < 100:  # Very similar amounts
            return (RING_DETECTED, score=35)
    
    return (NO_RING, score=0)
```

### Phase 3 Fraud Score (Comprehensive)
```
fraud_score = combine(
    rule_based (0-40),
    ml_anomaly (0-50),
    gps_spoofing (0-50),
    behavioral_hmm (0-45),
    network_analysis (0-35)
)
Final range: 0-100

Decision:
├── 0-10: AUTO_APPROVE
├── 10-30: AUTO_APPROVE (light review queue)
├── 30-50: HUMAN_REVIEW (3-hour SLA, low priority)
├── 50-70: HUMAN_REVIEW (1-hour SLA, high priority)
└── 70-100: AUTO_REJECT (block + escalate to compliance)
```

---

## 3. Claim Prediction Model (Phase 3)

### Purpose
Predict which workers will file claims next week to optimize cash reserves and staffing.

### Algorithm
LightGBM Classifier (gradient boosting)

### Features (50+)
```python
Features = {
    'historical_claims': [
        'claims_last_4_weeks',
        'claims_this_month',
        'claims_this_year'
    ],
    'weather_forecast': [
        'rain_probability_next_7days',
        'max_temp_forecast',
        'aqi_forecast',
        'heatwave_probability'
    ],
    'worker_behavior': [
        'active_orders_last_7days',
        'avg_daily_earnings_last_4weeks',
        'activity_trend'
    ],
    'seasonal': [
        'day_of_week',
        'week_of_year',
        'is_holiday_week',
        'is_payday_adjacent'
    ]
}
```

### Model Training
```python
import lightgbm as lgb

# Training data: 6 months × 5000 workers = 30K samples
X_train = load_features('2025-09-01', '2026-03-01')
y_train = load_labels('did_claim_next_week')  # Binary: 0/1

# Class imbalance handling
class_weights = compute_class_weight(
    'balanced',
    classes=[0, 1],
    y=y_train
)

model = lgb.LGBMClassifier(
    n_estimators=1000,
    max_depth=7,
    learning_rate=0.05,
    class_weight=class_weights
)

model.fit(X_train, y_train)

# Evaluation
from sklearn.metrics import roc_auc_score, confusion_matrix
y_pred = model.predict_proba(X_test)
auc = roc_auc_score(y_test, y_pred[:, 1])
print(f"AUC: {auc:.3f}")  # Target: > 0.75
```

### Output & Use Case
```python
# Predict for all active workers
predictions = model.predict_proba(workers_next_week)
# Output: [worker_id, claim_probability]

# Example:
# Worker 123: 75% chance of claim (very high)
# Worker 456: 25% chance of claim (low)

# Admin dashboard shows:
# "Expected 1,200 claims next week (±5%)"
# "Peak disruption: Heavy rain in 34 zones"
# "Recommended reserve: DC 2.4M"
```

---

## 4. Churn Prediction Model (Phase 3)

### Purpose
Predict which workers will cancel their policies to enable targeted retention.

### Model
Random Forest Classifier

### Features
```python
Features = {
    'affordability': [
        'premium_as_percent_of_income',
        'can_afford_without_debt'
    ],
    'satisfaction': [
        'claim_approval_rate',
        'days_to_payout',
        'app_rating'
    ],
    'engagement': [
        'app_opens_per_week',
        'policy_view_count',
        'claims_filed'
    ],
    'competition': [
        'competitor_in_zone',
        'undercut_count'
    ],
    'income': [
        'earnings_trend',
        'seasonal_variability'
    ]
}
```

### Retention Strategy
```python
def retention_intervention(worker):
    churn_prob = churn_model.predict_proba(worker)
    
    if churn_prob > 0.8:
        # High churn risk
        offer_loyalty_discount(worker, 20)  # 20% discount
    
    elif churn_prob > 0.6:
        # Medium churn risk
        send_engagement_email(worker)
        offer_loyalty_discount(worker, 10)
    
    else:
        # Low churn risk
        monitor_only()
```

---

## 5. Explainability with SHAP (Phase 3)

### Purpose
Show workers WHY their premium is DC 150, building trust.

### Implementation
```python
import shap

# Create explainer
explainer = shap.TreeExplainer(pricing_model)

# Get SHAP values for one worker
shap_values = explainer.shap_values(worker_features)

# Plot: Feature importance for this specific worker
shap.waterfall_plot(
    shap.Explanation(
        values=shap_values,
        base_values=base_premium,
        data=worker_features
    )
)
```

### Example Output
```
Your Premium: DC 150

Factors pushing premium UP (+):
├── Zone: Coastal (high rain history): +DC 50
├── Season: Monsoon (June onwards): +DC 40
├── New worker (low credibility): +DC 15
└── Platform surge pricing: +DC 10

Factors pushing premium DOWN (-):
├── Your track record (0 fraud flags): -DC 5
├── Off-peak hours (nighttime delivery): -DC 10
└── Loyalty bonus (3+ weeks active): -DC 5

BASELINE (DC 100) + UP (DC 115) - DOWN (DC 20) = DC 150 ✓
```

---

## Model Performance Targets

| Model | Phase | Target Metric | Target Value | Status |
|-------|-------|---------------|--------------|--------|
| Pricing (Multi-factor) | P2 | Premium range | ₹80-₹250/week | ✅ LIVE |
| Fraud Detection (Rule-based) | P2 | Precision | >85% | ✅ LIVE |
| Fraud Detection (ML-enhanced) | P3 | Recall | >90% | 🟡 Planned |
| Claim Prediction | P3 | AUC-ROC | >0.75 | 🟡 Planned |
| Churn Prediction | P3 | AUC-ROC | >0.70 | 🟡 Planned |

---

## Data Pipeline (Phase 1 Setup)

```
Raw Data Sources:
├── Weather API (OpenWeatherMap)
├── Worker activity (Zomato/Swiggy mock APIs)
├── Claims filed (GigGuard database)
└── Payments (Razorpay logs)
         │
         ▼
┌─────────────────────────┐
│  Data Ingestion Layer   │
│  (Scheduled jobs)       │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Feature Engineering     │
│ (Jupyter notebooks)     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ ML Model Training       │
│ (scikit-learn, TF)      │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Model Evaluation        │
│ (Cross-validation)      │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Deployment              │
│ (FastAPI endpoint)      │
└─────────────────────────┘
```

---

**Last Updated:** March 25, 2026 (Phase 2 — Pricing + Fraud models implemented)
