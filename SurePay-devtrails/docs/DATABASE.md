# Database Schema Design

## Overview
GigGuard uses PostgreSQL for persistent storage. This document defines all tables, relationships, and constraints.

---

## Entity-Relationship Diagram (ERD)

```
┌─────────────────────────┐
│      WORKERS            │
├─────────────────────────┤
│ id (UUID, PK)           │
│ phone (VARCHAR, UK)     │
│ name                    │
│ email                   │
│ kyc_verified (BOOL)     │
│ kyc_doc_url             │
│ zone_id (FK→ZONES)      │
│ platform (ENUM)         │◄──┐
│ avg_weekly_earnings     │   │
│ risk_score (FLOAT)      │   │
│ status (ENUM)           │   │
│ created_at              │   │
│ updated_at              │   │
└─────────────────────────┘   │
         │ 1                   │
         │ has many            │
         ▼ *                   │
┌─────────────────────────┐   │
│     POLICIES            │   │
├─────────────────────────┤   │
│ id (UUID, PK)           │   │
│ worker_id (FK)          │───┘
│ premium_amount (DECIMAL)│
│ coverage_start (DATE)   │
│ coverage_end (DATE)     │
│ disruptions (JSON[])    │
│ max_payout_per_week     │
│ status (ENUM)           │
│ created_at              │
└─────────────────────────┘
         │ 1
         │ has many
         ▼ *
┌─────────────────────────┐
│      CLAIMS             │
├─────────────────────────┤
│ id (UUID, PK)           │
│ policy_id (FK)          │
│ disruption_type (ENUM)  │
│ triggered_at            │
│ claimed_amount (DECIMAL)│
│ status (ENUM)           │
│ fraud_score (INT)       │
│ payout_gateway_id       │
│ created_at              │
│ updated_at              │
└─────────────────────────┘
         │ 1
         │ has many
         ▼ *
┌─────────────────────────┐
│    TRANSACTIONS         │
├─────────────────────────┤
│ id (UUID, PK)           │
│ worker_id (FK)          │
│ type (ENUM)             │
│ amount (DECIMAL)        │
│ balance_after (DECIMAL) │
│ created_at              │
└─────────────────────────┘

Additional Tables:
- ZONES (city, area, weather_risk_score)
- DISRUPTIONS (type, name, description)
- FRAUD_LOGS (claim_id, fraud_check_result, score)
- PAYMENTS (claim_id, gateway_transaction_id, status)
```

---

## Table Definitions

### 1. WORKERS Table
```sql
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    
    -- KYC Information
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_doc_url VARCHAR(255),
    kyc_verified_at TIMESTAMP,
    
    -- Delivery Profile
    zone_id UUID FOREIGN KEY REFERENCES zones(id),
    platform ENUM ('ZOMATO', 'SWIGGY', 'AMAZON', 'FLIPKART', 'ZEPTO') NOT NULL,
    platform_worker_id VARCHAR(100),
    
    -- Financial Data
    avg_weekly_earnings DECIMAL(10, 2),
    total_earnings_this_year DECIMAL(12, 2),
    
    -- Risk Assessment
    risk_score FLOAT DEFAULT 50.0,  -- 0-100, higher = riskier
    claim_count INT DEFAULT 0,
    fraud_flags INT DEFAULT 0,
    
    -- Status
    status ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED', 'INACTIVE') DEFAULT 'ACTIVE',
    last_active_at TIMESTAMP,
    
    -- Timestamping
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT phone_format CHECK (phone ~ '^\+?[0-9]{10,15}$'),
    CONSTRAINT risk_score_range CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_zone_id ON workers(zone_id);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_platform ON workers(platform);
```

### 2. POLICIES Table
```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    
    -- Premium Information
    premium_amount DECIMAL(10, 2) NOT NULL,  -- DC per week
    premium_calculation_model JSON,  -- Stores Bayesian model output
    
    -- Coverage Period
    coverage_start DATE NOT NULL,
    coverage_end DATE NOT NULL,
    
    -- Coverage Details
    disruptions ENUM[] DEFAULT ARRAY['RAIN', 'HEAT', 'AQI', 'CURFEW', 'OUTAGE'],
    max_payout_per_week DECIMAL(12, 2) DEFAULT 2000.00,
    
    -- Status
    status ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED') DEFAULT 'ACTIVE',
    cancellation_reason VARCHAR(255),
    cancelled_at TIMESTAMP,
    
    -- Tracking
    claims_filed INT DEFAULT 0,
    total_claimed_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE (worker_id, coverage_start)
);

CREATE INDEX idx_policies_worker_id ON policies(worker_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_coverage_start ON policies(coverage_start);
```

### 3. CLAIMS Table
```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    -- Disruption Details
    disruption_type ENUM ('RAIN', 'HEAT', 'AQI', 'CURFEW', 'OUTAGE') NOT NULL,
    disruption_severity INT,  -- 1-10 scale
    
    -- Trigger Information
    triggered_at TIMESTAMP NOT NULL,
    trigger_source VARCHAR(100),  -- 'WEATHER_API', 'MANUAL', 'SOCIAL_MEDIA', etc
    trigger_data JSON,  -- Raw data from trigger source (weather readings, etc)
    
    -- Claim Details
    claimed_amount DECIMAL(12, 2) NOT NULL,
    hours_lost INT,  -- Estimated hours delivery worker lost
    
    -- Fraud Assessment
    fraud_score INT DEFAULT 0,  -- 0-100, higher = more suspicious
    fraud_checks_applied JSON,  -- Which fraud checks were run
    
    -- Approval Workflow
    status ENUM ('FILED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'FILED',
    approval_reason VARCHAR(500),
    approved_at TIMESTAMP,
    approved_by UUID,  -- Admin user ID if manually approved
    
    -- Payout
    payout_amount DECIMAL(12, 2),  -- Amount actually paid
    payout_gateway_id VARCHAR(100),  -- Razorpay/Stripe transaction ID
    payout_status ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    payout_completed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_fraud_score CHECK (fraud_score BETWEEN 0 AND 100),
    CONSTRAINT claimed_amount_positive CHECK (claimed_amount > 0)
);

CREATE INDEX idx_claims_policy_id ON claims(policy_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_disruption_type ON claims(disruption_type);
CREATE INDEX idx_claims_triggered_at ON claims(triggered_at);
CREATE INDEX idx_claims_fraud_score ON claims(fraud_score);
CREATE INDEX idx_claims_payout_status ON claims(payout_status);
```

### 4. TRANSACTIONS Table (Financial Ledger)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    
    -- Transaction Type
    type ENUM (
        'PREMIUM_PAID',
        'CLAIM_APPROVED',
        'CLAIM_REJECTED',
        'PAYOUT_ISSUED',
        'REFERRAL_BONUS',
        'LOYALTY_DISCOUNT',
        'PENALTY_LATE_SUBMISSION',
        'PENALTY_FRAUD',
        'ADJUSTMENT'
    ) NOT NULL,
    
    -- Amount & Balance
    amount DECIMAL(12, 2) NOT NULL,  -- Amount in DC
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    
    -- Related Records
    claim_id UUID REFERENCES claims(id),
    policy_id UUID REFERENCES policies(id),
    
    -- Description
    description VARCHAR(500),
    metadata JSON,
    
    -- Timestamping
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT amount_non_zero CHECK (amount != 0)
);

CREATE INDEX idx_transactions_worker_id ON transactions(worker_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 5. ZONES Table (Geographic Risk Data)
```sql
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Geographic
    city VARCHAR(100) NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    polygon GEOMETRY,  -- PostGIS polygon for zone boundaries
    
    -- Risk Metrics
    avg_annual_rainfall DECIMAL(8, 2),
    rain_disruption_risk_score FLOAT,  -- 0-100
    heat_disruption_risk_score FLOAT,
    pollution_disruption_risk_score FLOAT,
    social_disruption_risk_score FLOAT,
    
    -- Historical Data
    historical_claims_count INT,
    historical_avg_claim_amount DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_rainfall CHECK (avg_annual_rainfall >= 0)
);

CREATE INDEX idx_zones_city ON zones(city);
CREATE INDEX idx_zones_location ON zones USING GIST(polygon);
```

### 6. FRAUD_LOGS Table (Audit Trail)
```sql
CREATE TABLE fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    
    -- Fraud Check Details
    check_type VARCHAR(100),  -- 'LOCATION', 'EARNINGS', 'DUPLICATE', 'BEHAVIORAL'
    check_result ENUM ('PASS', 'FAIL', 'SUSPICIOUS') NOT NULL,
    confidence_score FLOAT,  -- Probability of fraud
    
    -- Details
    details JSON,  -- Specific evidence (e.g., "Location mismatch: claim zone != last delivery zone")
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fraud_logs_claim_id ON fraud_logs(claim_id);
CREATE INDEX idx_fraud_logs_check_type ON fraud_logs(check_type);
```

### 7. PAYMENTS Table (Payment Gateway Tracking) — ✅ IMPLEMENTED
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI',  -- 'UPI', 'BANK', 'WALLET'
    gateway VARCHAR(50) DEFAULT 'RAZORPAY',
    gateway_transaction_id VARCHAR(200),
    
    -- Status
    status VARCHAR(50) DEFAULT 'INITIATED',  -- 'INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED'
    completed_at TIMESTAMP,
    failure_reason VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_claim_id ON payments(claim_id);
CREATE INDEX idx_payments_worker_id ON payments(worker_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## Data Types Reference

| Type | Use Case |
|------|----------|
| UUID | Primary keys, foreign keys (better than auto-increment) |
| DECIMAL(10, 2) | Monetary values (DC amounts) |
| ENUM | Status fields (ACTIVE, INACTIVE, etc) |
| TIMESTAMP | Audit functions (created_at, updated_at) |
| JSON | Flexible metadata (model outputs, API responses) |
| GEOMETRY | Geographic data (zone polygons) |

---

## Indexes Strategy

- **Foreign Keys:** Automatic indexes for joins
- **Status Columns:** Indexed for filtering (WHERE status = 'ACTIVE')
- **Date Ranges:** Indexed for time-based queries (queries covering a week)
- **Combination Indexes:** For complex queries (worker_id + status + created_at)

---

## Sample Data (Seeding)

See `backend/seeds/init_zones.sql` and `backend/seeds/init_workers.sql` for sample data insertion scripts.

---

**Last Updated:** March 25, 2026 (Phase 2 — Payment model implemented)
