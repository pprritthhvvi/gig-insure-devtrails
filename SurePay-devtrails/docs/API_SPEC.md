# GigGuard API Specification

## Base URL
```
Development: http://localhost:8000
Production: https://api.gigguard.io
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## AUTH Endpoints

### POST /api/v1/auth/register
**Register a new worker**

Request:
```json
{
  "phone": "+919876543210",
  "name": "Raj Kumar",
  "platform": "ZOMATO",
  "zone": "Bandra, Mumbai"
}
```

Response (201):
```json
{
  "worker_id": "uuid-123",
  "phone": "+919876543210",
  "status": "OTP_SENT",
  "message": "OTP sent to registered phone"
}
```

---

### POST /api/v1/auth/verify-otp
**Verify OTP and create account**

Request:
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Response (200):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "worker": {
    "id": "uuid-123",
    "name": "Raj Kumar",
    "platform": "ZOMATO",
    "risk_score": 45.5
  }
}
```

---

### POST /api/v1/auth/login
**Login with phone + OTP**

Request:
```json
{
  "phone": "+919876543210"
}
```

Response (200):
```json
{
  "status": "OTP_SENT"
}
```

---

### POST /api/v1/auth/kyc/upload
**Upload KYC documents**

Request (multipart):
```
POST /api/v1/auth/kyc/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Document: <file>
Document_Type: AADHAR|PAN|DRIVING_LICENSE
```

Response (200):
```json
{
  "kyc_status": "UNDER_REVIEW",
  "document_url": "s3://gig-guard/kyc/uuid-123/aadhar.pdf",
  "estimated_review_time": "2-4 hours"
}
```

---

## POLICY Endpoints

### POST /api/v1/policies/create
**Create a new insurance policy (weekly subscription)**

Request:
```json
{
  "coverage_start": "2026-03-15",
  "coverage_end": "2026-03-22",
  "disruptions": ["RAIN", "HEAT", "AQI", "CURFEW", "OUTAGE"]
}
```

Response (201):
```json
{
  "policy_id": "policy-uuid-456",
  "worker_id": "uuid-123",
  "premium_amount": 150.00,
  "premium_breakdown": {
    "base": 100,
    "zone_rain_risk": 30,
    "seasonal_adjustment": 20,
    "worker_history": -10,
    "final": 150
  },
  "coverage_start": "2026-03-15",
  "coverage_end": "2026-03-22",
  "status": "ACTIVE",
  "max_payout_per_week": 2000.00
}
```

---

### GET /api/v1/policies/{policy_id}
**Get policy details**

Response (200):
```json
{
  "id": "policy-uuid-456",
  "worker_id": "uuid-123",
  "premium_amount": 150.00,
  "coverage_start": "2026-03-15",
  "coverage_end": "2026-03-22",
  "disruptions": ["RAIN", "HEAT", "AQI", "CURFEW", "OUTAGE"],
  "status": "ACTIVE",
  "claims_filed": 2,
  "total_claimed_amount": 2800.00,
  "days_remaining": 5
}
```

---

### GET /api/v1/policies/worker/{worker_id}
**Get all policies for a worker**

Response (200):
```json
{
  "active_policies": [
    { "policy_id": "...", "status": "ACTIVE", ... }
  ],
  "expired_policies": [
    { "policy_id": "...", "status": "EXPIRED", ... }
  ],
  "total": 5
}
```

---

### PUT /api/v1/policies/{policy_id}/update
**Update policy (add/remove disruption coverage)**

Request:
```json
{
  "disruptions": ["RAIN", "HEAT", "AQI"],
  "max_payout_per_week": 2500.00
}
```

Response (200):
```json
{
  "policy_id": "policy-uuid-456",
  "updated_disruptions": ["RAIN", "HEAT", "AQI"],
  "new_premium_amount": 165.00
}
```

---

### POST /api/v1/policies/{policy_id}/cancel
**Cancel an active policy**

Request:
```json
{
  "cancellation_reason": "Found cheaper alternative"
}
```

Response (200):
```json
{
  "policy_id": "policy-uuid-456",
  "status": "CANCELLED",
  "cancelled_at": "2026-03-15T10:30:00Z"
}
```

---

## CLAIM Endpoints

### POST /api/v1/claims/file
**File a new claim (worker-initiated)**

Request:
```json
{
  "policy_id": "policy-uuid-456",
  "disruption_type": "RAIN",
  "hours_lost": 4,
  "claim_reason": "Heavy rain made delivery impossible"
}
```

Response (201):
```json
{
  "claim_id": "claim-uuid-789",
  "policy_id": "policy-uuid-456",
  "disruption_type": "RAIN",
  "claimed_amount": 2000.00,
  "status": "FILED",
  "fraud_score": 12,
  "fraud_assessment": "LOW_RISK",
  "message": "Claim filed successfully. Review in progress."
}
```

---

### POST /api/v1/claims/auto-trigger
**Automatic claim triggering (system detects disruption)**

*Internal endpoint, called by background job*

Request:
```json
{
  "worker_id": "uuid-123",
  "disruption_type": "RAIN",
  "trigger_source": "WEATHER_API",
  "trigger_data": {
    "rain_mm": 25,
    "zone": "Bandra, Mumbai",
    "timestamp": "2026-03-15T14:30:00Z"
  }
}
```

Response (201):
```json
{
  "claim_id": "claim-uuid-789",
  "status": "AUTO_FILED",
  "fraud_score": 8,
  "message": "Claim automatically filed based on heavy rain detection"
}
```

---

### GET /api/v1/claims/{claim_id}
**Get claim details**

Response (200):
```json
{
  "claim_id": "claim-uuid-789",
  "worker_id": "uuid-123",
  "policy_id": "policy-uuid-456",
  "disruption_type": "RAIN",
  "claimed_amount": 2000.00,
  "status": "APPROVED",
  "fraud_score": 12,
  "fraud_checks": [
    {
      "check_type": "LOCATION",
      "result": "PASS",
      "details": "Location matches last delivery zone"
    },
    {
      "check_type": "EARNINGS_CONSISTENCY",
      "result": "PASS",
      "details": "Claimed loss within 2σ of historical average"
    }
  ],
  "payout_status": "PROCESSING",
  "payout_amount": 2000.00,
  "payout_deadline": "2026-03-16T14:30:00Z",
  "created_at": "2026-03-15T14:35:00Z"
}
```

---

### GET /api/v1/claims/worker/{worker_id}
**Get all claims for a worker**

Query params:
- `status`: FILED|UNDER_REVIEW|APPROVED|REJECTED|PAID (optional)
- `month`: MM-YYYY (optional, defaults to current month)
- `limit`: 10 (default)

Response (200):
```json
{
  "claims": [
    {
      "claim_id": "...",
      "disruption_type": "RAIN",
      "claimed_amount": 2000.00,
      "status": "PAID",
      "payout_amount": 2000.00
    }
  ],
  "total": 45,
  "month": "03-2026",
  "total_claimed": 15000.00,
  "total_paid": 14500.00
}
```

---

### POST /api/v1/claims/{claim_id}/approve
**Approve a claim (admin-only)**

Request:
```json
{
  "approval_reason": "All fraud checks passed. Legit disruption."
}
```

Response (200):
```json
{
  "claim_id": "claim-uuid-789",
  "status": "APPROVED",
  "approval_reason": "All fraud checks passed...",
  "payout_initiated": true,
  "estimated_payout_time": "24 hours"
}
```

---

### POST /api/v1/claims/{claim_id}/reject
**Reject a claim (admin-only)**

Request:
```json
{
  "rejection_reason": "Fraudulent claim detected: GPS spoofing"
}
```

Response (200):
```json
{
  "claim_id": "claim-uuid-789",
  "status": "REJECTED",
  "rejection_reason": "GPS spoofing",
  "appeal_available": true,
  "appeal_deadline": "2026-03-22"
}
```

---

## PAYMENT Endpoints

### POST /api/v1/payments/initiate-payout
**Initiate payout for approved claim**

*Internal endpoint*

Request:
```json
{
  "claim_id": "claim-uuid-789",
  "payout_amount": 2000.00,
  "worker_payment_method": "UPI|BANK"
}
```

Response (201):
```json
{
  "payment_id": "payment-uuid-111",
  "gateway": "RAZORPAY",
  "gateway_transaction_id": "razorpay_txn_123",
  "status": "PROCESSING",
  "expected_completion": "2026-03-16T10:00:00Z"
}
```

---

### GET /api/v1/payments/{payment_id}
**Check payment status**

Response (200):
```json
{
  "payment_id": "payment-uuid-111",
  "claim_id": "claim-uuid-789",
  "amount": 2000.00,
  "status": "SUCCESS",
  "gateway": "RAZORPAY",
  "completed_at": "2026-03-16T09:45:00Z",
  "worker_notification_sent": true
}
```

---

## ADMIN Endpoints

### GET /api/v1/admin/dashboard
**Admin dashboard metrics**

Response (200):
```json
{
  "today_metrics": {
    "claims_filed": 342,
    "claims_approved": 298,
    "claims_rejected": 23,
    "claims_under_review": 21,
    "fraud_blocked": 15,
    "total_payout": 596000.00,
    "premium_collected": 52000.00
  },
  "week_metrics": {
    "active_policies": 5432,
    "new_policies": 342,
    "claims_filed": 2156,
    "loss_ratio": 0.32,
    "profitability": 0.18
  },
  "forecast_next_week": {
    "expected_disruptions": "MONSOON_APPROACHING",
    "forecast_claims": 1200,
    "forecast_payout": 1200000.00
  }
}
```

---

### GET /api/v1/admin/claims
**List all claims with filters**

Query params:
- `status`: FILED|UNDER_REVIEW|APPROVED|REJECTED|PAID
- `disruption_type`: RAIN|HEAT|AQI|CURFEW|OUTAGE
- `fraud_score_min`: 0-100
- `fraud_score_max`: 0-100
- `date_from`: YYYY-MM-DD
- `date_to`: YYYY-MM-DD
- `limit`: 50 (default)
- `offset`: 0 (default)

Response (200):
```json
{
  "claims": [
    {
      "claim_id": "...",
      "worker_id": "...",
      "disruption_type": "RAIN",
      "claimed_amount": 2000.00,
      "fraud_score": 12,
      "status": "APPROVED",
      "created_at": "2026-03-15T14:35:00Z"
    }
  ],
  "total": 5432,
  "fraud_blocked_count": 123
}
```

---

### GET /api/v1/admin/workers
**List all workers with profiling**

Query params:
- `status`: ACTIVE|PAUSED|SUSPENDED|INACTIVE
- `risk_score_min`: 0-100
- `risk_score_max`: 0-100
- `platform`: ZOMATO|SWIGGY|AMAZON|FLIPKART|ZEPTO
- `zone`: Optional city/area filter
- `limit`: 50
- `offset`: 0

Response (200):
```json
{
  "workers": [
    {
      "worker_id": "uuid-123",
      "name": "Raj Kumar",
      "platform": "ZOMATO",
      "status": "ACTIVE",
      "risk_score": 45.5,
      "active_policies": 1,
      "total_claims": 5,
      "total_claimed": 8000.00,
      "claim_approval_rate": 0.95,
      "fraud_flags": 0
    }
  ],
  "total": 5432,
  "avg_risk_score": 48.3
}
```

---

### GET /api/v1/admin/analytics/loss-ratio
**Loss ratio by zone, disruption type, time period**

Query params:
- `groupby`: zone|disruption_type|date|worker_cohort
- `date_from`: YYYY-MM-DD
- `date_to`: YYYY-MM-DD

Response (200):
```json
{
  "loss_ratios": [
    {
      "zone": "Bandra, Mumbai",
      "premium_collected": 50000.00,
      "claims_paid": 16000.00,
      "loss_ratio": 0.32,
      "claim_count": 12,
      "fraud_prevented": 2
    }
  ],
  "overall_loss_ratio": 0.28,
  "profitability_margin": 0.22
}
```

---

### POST /api/v1/admin/fraud/override
**Override fraud score for a claim**

Request:
```json
{
  "claim_id": "claim-uuid-789",
  "new_fraud_score": 5,
  "override_reason": "Legitimate disruption, weather API data confirms"
}
```

Response (200):
```json
{
  "claim_id": "claim-uuid-789",
  "fraud_score_old": 45,
  "fraud_score_new": 5,
  "status": "APPROVED"
}
```

---

## WEATHER Endpoints (Phase 2 — ✅ IMPLEMENTED)

### GET /api/v1/weather/current
**Get current weather conditions for a zone**

Query params:
- `zone`: City/area name (required)

Response (200):
```json
{
  "zone": "Mumbai",
  "timestamp": "2026-03-25T10:00:00Z",
  "condition": "Heavy Rain",
  "temperature": 28.5,
  "humidity": 85,
  "rain_mm": 25.3,
  "aqi": 120,
  "wind_speed": 15.2,
  "disruptions": [
    {
      "type": "RAIN",
      "severity": "HIGH",
      "detail": "Heavy rainfall: 25.3mm/hr",
      "auto_trigger": true
    }
  ],
  "is_disrupted": true,
  "auto_trigger_active": true
}
```

### GET /api/v1/weather/zones
**Get list of monitored zones**

Response (200):
```json
{
  "zones": ["Mumbai", "Mumbai North", "Delhi", "Bangalore", ...],
  "total": 10
}
```

---

## WORKER Endpoints (Phase 2 — ✅ IMPLEMENTED)

### GET /api/v1/workers/profile
**Get worker profile with summary stats**

Response (200):
```json
{
  "id": "uuid-123",
  "name": "Raj Kumar",
  "phone": "9876543210",
  "platform": "Zomato",
  "zone": "Mumbai",
  "status": "ACTIVE",
  "risk_score": 45.0,
  "active_policies": 1,
  "total_claims": 5,
  "total_payouts": 6000.0
}
```

### GET /api/v1/workers/premium-quote
**Get dynamic premium quote based on risk factors**

Query params:
- `zone`: City name (default: Mumbai)
- `platform`: Platform name (default: Zomato)
- `max_payout`: Max weekly payout (default: 2000)

Response (200):
```json
{
  "final_premium": 155.0,
  "breakdown": {
    "base_premium": 100,
    "zone_risk": 40.0,
    "seasonal_adjustment": 25,
    "worker_adjustment": -5,
    "platform_adjustment": 0,
    "coverage_adjustment": 0
  },
  "risk_level": "MEDIUM",
  "risk_score": 44.1,
  "currency": "INR",
  "period": "weekly"
}
```

---

## ANALYTICS Endpoints (Phase 2 — ✅ IMPLEMENTED)

### GET /api/v1/admin/analytics/loss-ratio
**Loss ratio analytics grouped by zone**

Response (200):
```json
{
  "loss_ratios": [
    {
      "zone": "Mumbai North",
      "premium_collected": 750.0,
      "claims_paid": 3900.0,
      "loss_ratio": 5.2,
      "policy_count": 5,
      "claim_count": 4
    }
  ],
  "overall_loss_ratio": 0.32,
  "total_premium": 750.0,
  "total_payouts": 3900.0,
  "profitability_margin": 0.68
}
```

### GET /api/v1/admin/analytics/revenue
**Revenue summary with claims by type**

Response (200):
```json
{
  "total_premium_collected": 750.0,
  "total_payouts": 3900.0,
  "net_revenue": -3150.0,
  "loss_ratio": 5.2,
  "profit_margin": -4.2,
  "claims_by_type": [
    {"type": "RAIN", "count": 5, "total_claimed": 8500.0, "total_paid": 3900.0}
  ],
  "avg_fraud_score": 7.4
}
```

### POST /api/v1/admin/fraud/override
**Override a claim's fraud score (admin)**

Request:
```json
{
  "claim_id": "claim-uuid-789",
  "new_fraud_score": 5,
  "override_reason": "Legitimate disruption confirmed by weather data"
}
```

Response (200):
```json
{
  "claim_id": "claim-uuid-789",
  "fraud_score_old": 45,
  "fraud_score_new": 5,
  "new_status": "APPROVED",
  "override_reason": "Legitimate disruption confirmed"
}
```

---

## ERROR Responses

### 400 Bad Request
```json
{
  "error": "INVALID_REQUEST",
  "message": "Missing required field: phone",
  "details": {
    "field": "phone",
    "requirement": "Valid phone number with country code"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Only admins can approve claims"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Claim not found",
  "claim_id": "claim-uuid-789"
}
```

### 429 Rate Limited
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please retry after 60 seconds",
  "retry_after": 60
}
```

### 500 Server Error
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Unexpected error occurred",
  "trace_id": "trace-123"
}
```

---

## Rate Limits
- Worker endpoints: 100 requests/hour
- Admin endpoints: 1000 requests/hour
- Public endpoints: 10 requests/minute

---

## Pagination
All list endpoints support:
- `limit`: 1-100 (default: 10)
- `offset`: 0+ (default: 0)
- `sort_by`: field name (default: created_at)
- `sort_order`: ASC|DESC (default: DESC)

---

---

## Anti-GPS Spoofing Endpoints

### GET /api/v1/anti-spoof/demo-syndicate
**Simulate 500-worker GPS spoofing syndicate attack**

Response:
```json
{
  "scenario": "500-Worker Telegram GPS-Spoofing Syndicate Attack",
  "detection_results": {
    "geohash_collisions": { "is_suspicious": true, "score": 35 },
    "impossible_travel": { "is_suspicious": true, "score": 50 },
    "environmental_truth": { "is_suspicious": true, "score": 25 }
  },
  "defense_summary": {
    "syndicate_workers_caught": 500,
    "legitimate_workers_cleared": 20,
    "verdict": "CONFIRMED_SPOOF"
  }
}
```

---

## Preset Claim Amounts

Workers cannot set custom claim amounts. The system enforces preset payouts:

| Disruption Type | Preset Amount | Est. Lost Hours |
|----------------|--------------|-----------------|
| RAIN           | ₹1,200       | ~4 hrs          |
| HEAT           | ₹1,000       | ~3 hrs          |
| AQI            | ₹1,500       | ~5 hrs          |
| CURFEW         | ₹2,000       | Full day        |
| APP_CRASH      | ₹800         | ~2 hrs          |

> **Note:** ACCIDENT claims are no longer supported. Invalid disruption types return 400 Bad Request.

---

## Enhanced Fraud Details

### GET /api/v1/claims/{claim_id}/fraud-details
Now returns:
- `disruption_evidence` — weather readings vs thresholds with severity
- `weather_at_zone` — live weather conditions
- `fraud_details.checks` — 6 individual checks including GPS_ANTI_SPOOF
- `evaluation_summary` — recommendation + anti_spoof_verdict

---

**Last Updated:** March 27, 2026 (Phase 2.5 — Anti-Spoof, Preset Amounts, Dynamic Pricing, Policy Purchase)
