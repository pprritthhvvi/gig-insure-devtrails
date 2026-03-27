# GigGuard: AI-Powered Parametric Insurance for Food Delivery Workers

## 📋 Phase 1: Ideation & Foundation (March 4-20, 2026) ✅ COMPLETE
## 📋 Phase 2: Full Implementation (March 20-25, 2026) ✅ COMPLETE

---

## 🎯 Executive Summary

**GigGuard** is an AI-powered, parametric insurance platform designed to protect food delivery workers (Zomato, Swiggy) in India from income loss caused by external disruptions. Using real-time weather data, anomaly detection, and automated claims processing, GigGuard provides instant financial protection when disruptions occur—without the bureaucratic delays of traditional insurance.

**Vision:** Become the lifeline for India's 2+ million gig workers, ensuring their livelihoods are protected every week.

---

## 🚨 The Problem We're Solving

### Context: India's Delivery Economy Crisis
- **5 million+ platform-based delivery workers** operate in India (Zomato, Swiggy, Amazon, Flipkart, Zepto)
- **Income volatility:** External disruptions (rain, extreme heat, pollution, curfews, app crashes) cause workers to lose **20-30% of monthly earnings**
- **No safety net:** Workers currently bear the full financial loss from these uncontrollable events
- **Frequency of disruptions:** 
  - Monsoon season (Jun-Sep): Heavy rain causes 15-25 days of lost work/month
  - Summer (Apr-May): Extreme heat (45°C+) forces workers offline
  - Pollution spike (Nov-Dec): AQI >300 makes outdoor work hazardous
  - Social disruptions: Unexpected strikes, curfews, market closures
  - App crashes: Platform outages render workers unable to work

### Real Impact on Workers
```
Weekly earnings (normal): ₹4,000 - ₹6,000
Week with heavy rain: ₹2,800 - ₹4,200 (30% loss)
Annual income loss from disruptions: ₹35,000 - ₹52,000
→ That's 7-10% of annual income, wiping out savings or forcing debt
```

### Why Existing Solutions Fail
1. **Traditional insurance too slow:** Claims take 30-60 days
2. **Parametric insurance doesn't exist for gig workers** in India
3. **Manual claims process:** Workers must prove disruption manually
4. **No weekly pricing:** Most insurance products target salaried workers, not week-to-week gig cycles
5. **Complexity:** Delivery workers can't navigate policy documents

---

## 💡 Our Solution: GigGuard Platform

### Core Proposition
**Automatic, instant income protection for gig workers during disruptions.**

- **Weekly subscription model:** DC 120-200/week (aligned with gig worker payment cycles)
- **Parametric automation:** Disruption detected → instant claim → automatic payout (within 24 hours)
- **AI-powered:** Dynamic pricing, intelligent fraud detection, predictive alerts
- **Mobile-first:** Built for workers who live on phones
- **Zero friction:** 1-tap claim filing; let the system do the work

### What GigGuard Covers (Loss of Income ONLY)
✅ Income loss from **heavy rain** (>20mm/hour blocking deliveries)  
✅ Income loss from **extreme heat** (>45°C making outdoor work impossible)  
✅ Income loss from **severe air pollution** (AQI >300)  
✅ Income loss from **social disruptions** (curfews, strikes, zone closures)  
✅ Income loss from **platform outages** (app unreachable >30 min)  

❌ NOT covered: Vehicle repairs, health costs, medical emergencies, accidents

---

## 👤 Our Persona: The Delivery Partner

### Meet Raj (Zomato Delivery Partner, Mumbai)
- **Age:** 28, has smartphone
- **Works:** 6 days/week, 8-10 hours/day
- **Earnings:** ₹4,500/week (~₹18K/month)
- **Risk:** Monsoon season (Jun-Sept) causes 50% of his work to vanish when it rains
- **Pain point:** When it rains, he loses ₹1,200-1,500 that week, no buffer
- **Tech comfort:** Uses WhatsApp daily, opens Zomato app 50+ times/day
- **Smart phone:** Has basic Android, poor data sometimes, trades off battery life vs app usage

### Why Raj Needs GigGuard
```
Current Reality:
Mon-Fri (normal): ₹1,000/day × 5 = ₹5,000
Saturday (rain): Can't work, loses ₹1,000
→ Week total: ₹4,000 (20% loss)

With GigGuard (DC 150/week premium):
Mon-Fri (normal): ₹5,000 + premium cost (DC 150 ÷ 80 = ~₹2)
Saturday (rain): Rain >20mm detected → Auto-claim filed → DC 1,500 payout (≈₹1,200)
→ Week total: ₹5,000 - ₹2 + ₹1,200 = ₹6,198 (3% gain despite rain!)
```

### User Segments (for Phase 1 focus)
1. **Young solo riders** (25-35, new to delivery) → High disruption sensitivity
2. **Experienced parts-time riders** (30-50, also have salaried jobs) → Value time savings
3. **Family-supporting riders** (35-50, primary income) → Maximum financial anxiety

---

## 🏗️ Solution Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                    GigGuard Platform                        │
├──────────────────┬──────────────────┬──────────────────┤
│  Mobile App      │  Admin Dashboard │  Backend API     │
│  (React Native)  │  (React)         │  (FastAPI)       │
└────────┬─────────┴────────┬─────────┴────────┬────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐      ┌─────▼──────┐    ┌────▼──────┐
    │ML Engine │      │ Real-time  │    │ Payment   │
    │(Pricing, │      │ Triggers   │    │ Gateway   │
    │ Fraud)   │      │(Weather,   │    │(Razorpay) │
    │          │      │ Traffic)   │    │           │
    └────┬─────┘      └─────┬──────┘    └────┬──────┘
         │                  │                │
    ┌────▼──────────────────▼────────────────▼──────┐
    │   PostgreSQL Database                          │
    │  (Workers, Policies, Claims, Transactions)     │
    └────────────────────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────────────┐
    │   External Integrations                       │
    │ • Weather APIs (OpenWeatherMap)               │
    │ • Traffic APIs (Google Maps / Mock)           │
    │ • Delivery Platform APIs (Zomato/Swiggy mock) │
    │ • Notifications (Twilio, Firebase)            │
    └──────────────────────────────────────────────┘
```

---

## 💰 Weekly Pricing Model (The Financial Heart)

### Pricing Philosophy
**Traditional insurance charges annual premiums. GigGuard charges weekly because gig workers earn weekly.**

### Base Premium Calculation Formula

```
WEIGHTED PREMIUM FORMULA:

base_premium = DC 100  (baseline for DC 2,000 weekly income)

Risk Adjustments:
├── Zone Weather Risk (40% weight)
│   ├── High rain history (monsoon zones, coastal): +DC 40-60
│   ├── Medium rain (occasional): +DC 20-30
│   └── Low rain: DC 0
│
├── Worker Risk Profile (25% weight)
│   ├── New worker (<100 deliveries): +DC 15
│   ├── Honest claim history (0 fraud flags): -DC 10
│   ├── Multiple fraud flags: +DC 20
│   └── Experienced (500+ deliveries, clean): -DC 5
│
├── Seasonal Adjustment (20% weight)
│   ├── Monsoon season (Jun-Sep): +DC 30-50
│   ├── Summer heat (Apr-May): +DC 20-40
│   ├── Pollution season (Nov-Dec): +DC 10-20
│   └── Normal season: DC 0
│
└── Platform Surge Pricing (15% weight)
    ├── Peak hours surcharged: +DC 10-15
    ├── Off-peak discounted: -DC 5-10
    └── Normal hours: DC 0

FINAL WEEKLY PREMIUM = base_premium + all adjustments
Range: DC 80 (safest workers, best zones) → DC 220 (riskiest)
```

### Example Weekly Premiums

| Worker Profile | Zone | Season | Base | Adjustments | **Final Premium** |
|---|---|---|---|---|---|
| New, Mumbai | Coastal (high rain) | Monsoon | 100 | +60+15+40+10 | **DC 225/week** |
| Experienced, Delhi | Urban (low rain) | Winter | 100 | +0-10+0+0 | **DC 90/week** |
| Medium, Bangalore | Suburban | Summer | 100 | +25+5+25+5 | **DC 160/week** |
| Expert, Mumbai | Zone-safe | Normal | 100 | -10-5+0-5 | **DC 80/week** |

### Coverage & Payouts

```
CLAIM PAYOUT STRUCTURE:

Weekly Premium Paid: DC 150 (example)

IF Disruption Detected (e.g., Heavy Rain >20mm):
├── Claim Auto-filed (no manual action)
├── Fraud Check (AI scoring <100ms)
├── If Approved:
│   ├── Lost income estimated: Worker's avg hourly × hours lost
│   ├── Payout: min(lost_income, max_weekly_payout)
│   └── Max payout/week: DC 2,000 (capped to prevent moral hazard)
│
├── Payout Timeline:
│   ├── Claim filed: Immediately when disruption detected
│   ├── Approval: <2 hours (AI + light human review)
│   └── Money in wallet: <24 hours (via Razorpay)
│
└── Example Payout:
    Worker's avg hourly: DC 500/hour
    Disruption duration: 4 hours (rain blocks deliveries)
    Lost income: DC 500 × 4 = DC 2,000
    Max payout/week: DC 2,000
    → PAYOUT: DC 2,000 ✅

BREAK-EVEN ANALYSIS:
Premium paid (weekly): DC 150
Expected claim value (with 30% disruption probability): DC 150
→ Break-even at 30% disruptions
→ Profitable after 20% (most profitable after 2+ claims/month)
```

---

## 🤖 AI/ML Integration — ✅ IMPLEMENTED (Phase 2)

### 1. Dynamic Premium Calculation (Implemented: `services/pricing_service.py`)
**Goal:** Price fairly based on true risk, not one-size-fits-all

**Status:** ✅ LIVE — Endpoint: `GET /api/v1/workers/premium-quote`
```
Algorithm: Multi-factor rule-based pricing with Bayesian-inspired weighting
Input Factors:
├── Zone risk: 10+ Indian cities with custom multipliers (Mumbai=1.4x, Delhi=1.05x)
├── Seasonal adjustment: Monthly risk factors (jul monsoon=+₹50, jan=+₹0)
├── Worker experience: Veteran discounts (-₹10), new worker surcharge (+₹20)
├── Platform type: Quick commerce (Zepto=+₹10) vs standard delivery
├── Coverage level: Higher payouts = higher premiums
└── Fraud history: Each flag adds ₹15 surcharge

Output: Full premium breakdown for transparency
├── Final premium: ₹80-₹250/week
├── Breakdown showing each factor's contribution
├── Risk level (LOW/MEDIUM/HIGH/VERY_HIGH)
└── Comparable to SHAP explainability

Premium Range: ₹80 (safest) to ₹250 (riskiest)
```

### 2. Intelligent Fraud Detection (Implemented: `services/fraud_service.py`)
**Goal:** Detect and block fraudulent claims while approving legitimate ones

**Status:** ✅ LIVE — Integrated into `POST /api/v1/claims/` flow
```
Algorithm: Multi-rule scoring engine (5 dimensions, weighted to 100)
Scoring Dimensions:
├── Amount Anomaly (30pts): Claimed vs max payout + historical average
├── Frequency Check (25pts): Recent claims count in 7-day window  
├── Time-of-Day (15pts): Unusual hours (midnight-5am = suspicious)
├── Type Consistency (15pts): Disruption type vs time logic (heat at night = flag)
└── Worker History (15pts): Total claims count + prior fraud flags

Scoring Bands:
├── 0-10: LOW → Auto-approve
├── 10-25: MEDIUM → Approve with note
├── 25-40: HIGH → Manual review (PENDING status)
└── 40-100: CRITICAL → Auto-reject

Admin Override: POST /api/v1/admin/fraud/override
```

**Layer 2 - Advanced Validation (Phase 3):**
```
GPS Spoofing Detection:
├── Verify claim location matches worker's last delivery location
├── Check if location feasible given weather conditions
└── Cross-reference with delivery platform GPS logs

Earnings Consistency Check:
├── Compare claimed "lost income" with worker's historical daily average
├── Flag if claimed loss is 5x higher than normal
└── Adjust for seasonal variations

Behavioral Analysis:
├── Track worker's claim submission patterns over weeks
├── Use Hidden Markov Model to detect sudden behavior shifts
└── Alert on statistically unlikely claim sequences

Duplicate Prevention:
├── Check if identical claims submitted multiple times
├── Validate claim against weather API (was there actually heavy rain?)
└── Cross-reference with other workers' claims (cluster detection)
```

### 3. Predictive Claim Forecasting (Phase 3)
**Goal:** Forecast which workers will file claims next week to optimize payouts

```
Algorithm: LightGBM Classifier
Prediction: P(claim next week) for each worker

Features:
├── Historical claim frequency
├── Weather forecast for next week
├── Worker's activity level (orders/week)
├── Seasonal patterns
└── Recent claim patterns

Output: Claim prediction score per worker
├── High risk (70%+ claim probability): +DC 30 reserve
├── Medium risk (30-70%): +DC 15 reserve
└── Low risk (<30%): No reserve

Use case: Admin dashboard shows "Expected 500 claims next week due to monsoon"
→ Adjust cash reserves, plan payout staffing, negotiate reinsurance
```

### 4. Worker Churn & Retention Prediction (Phase 3)
```
Algorithm: Random Forest Classifier
Prediction: Which workers will abandon the policy?

Features:
├── Premium affordability (premium as % of income)
├── Claim approval rate (satisfaction)
├── Competitor prevalence in zone
├── Recent earnings trends
└── Engagement (app opens per week)

Output: Churn risk score
├── High risk (80%+): Proactive intervention (loyalty discount)
├── Medium risk (40-80%): Monitor and nudge
└── Low risk (<40%): Maintain

Goal: 90%+ retention rate (vs industry 60%)
```

### 5. Explainability with SHAP (Phase 3)
**Goal:** Show workers WHY their premium is DC 150, not DC 200

```
Using SHAP (SHapley Additive exPlanations):
├── Per-worker feature importance
├── Waterfall plot: Shows how each feature pushed premium up/down
│
Example output shown to worker:
"Your premium this week is DC 150

Main factors:
├── Your zone (coastal Mumbai): +DC 50 (high historical rain)
├── This season (monsoon): +DC 40 (heavy rainfall expected)
├── Your experience (1,000+ deliveries): -DC 10 (trusted)
├── Your claims (0 fraud flags): -DC 5 (honest history)
└── Base premium: DC 100
→ TOTAL: DC 150

Next week, if you move to inland zone: Estimate DC 110"

⇒ Workers understand they're being priced fairly
⇒ Builds trust, increases retention
```

---

## 🛠️ Tech Stack & Architecture

### Backend
```
Framework:       FastAPI (Python 3.10+)
├── Async support for real-time triggers
├── Built-in Swagger API documentation
├── High performance (near Node.js speeds)

Database:        PostgreSQL 13+ (primary)
├── ACID compliance for financial transactions
├── JSON support for policy documents
├── TimescaleDB extension for time-series (claims over time)

Cache:           Redis
├── Session storage
├── Real-time leaderboard
├── ML model caching

ML/AI Libraries: 
├── scikit-learn: Anomaly detection (Isolation Forest)
├── LightGBM: Predictive modeling
├── TensorFlow: Optional deep learning
├── SHAP: Explainability
└── pandas + numpy: Data processing

Auth:            JWT + OAuth2
├── Worker login via phone + OTP
├── Admin login via email + 2FA
└── API keys for integrations

Task Queue:      Celery + RabbitMQ
├── Async claim processing
├── Scheduled jobs (daily fraud reports)
├── Email/SMS notifications

Testing:         pytest + pytest-asyncio
├── Unit tests for each service
├── Integration tests (mocked APIs)
├── Load testing (k6 or Locust)
```

### Frontend - Worker Mobile App
```
Framework:       React Native
├── Single codebase for iOS + Android
├── Trade-off: Can't use platform-specific features, but faster dev

Navigation:      React Navigation
├── Bottom tab navigator (Home, Claims, History, Profile)
├── Stack navigation for flows

State Management: Redux Toolkit
├── Global state: Auth, user profile, policies, claims
├── Local state: Form inputs

Offline Support: WatermelonDB
├── SQLite local database
├── Auto-sync when online
├── Critical for poor connectivity areas

Notifications:   Firebase Cloud Messaging (FCM)
├── Push alerts for claim approval
├── Real-time payout notifications

UI Components:   React Native Paper
├── Material Design pre-built components
├── Consistent with Zomato/Swiggy UX

API Client:      Axios + Redux Thunk
├── Interceptors for token refresh
├── Automatic retry on network failure

Testing:         Jest + Detox
├── Unit tests (components, reducers)
├── E2E tests (user flows)
```

### Frontend - Admin Dashboard (Insurer)
```
Framework:       React 18
├── Modern hooks-based architecture
├── Server-side rendering for SEO (if needed)

UI Library:      Material-UI (MUI v5)
├── Professional, enterprise look
├── Rich component library

Charts:          Recharts + ECharts
├── Real-time claim trends
├── Geographic heatmaps
├── Profit/loss dashboards

Tables:          TanStack Table (React Table)
├── Large datasets (10K+ claims)
├── Sorting, filtering, pagination
├── Export to CSV/PDF

State Mgmt:      Zustand (lightweight) or Redux
├── Authentication state
├── Dashboard filters
├── Real-time data subscriptions

Real-time:       WebSocket via Socket.io or native WebSocket
├── Live claim updates
├── Fraud alerts
└── Dashboard metrics refresh

Testing:         Jest + React Testing Library
├── Component tests
├── Integration tests
```

### Infrastructure
```
Containerization: Docker
├── Dockerfile for backend
├── Dockerfile for frontend
├── Docker Compose for local development

Orchestration:    Docker Compose (Phase 1-2)
└─ Transition to Kubernetes (Phase 3 if scaling)

Cloud:            AWS or GCP
├── EC2 / Compute Engine: App servers
├── RDS / Cloud SQL: PostgreSQL
├── S3 / Cloud Storage: Document uploads (KYC)
├── CloudFront / CDN: Static assets
├── Lambda / Cloud Functions: Serverless tasks

CI/CD:            GitHub Actions
├── Automated tests on PR
├── Deploy to staging on push to dev
├── Manual approval for production

Monitoring:       Prometheus + Grafana (Phase 2)
├── API response times
├── Database query performance
├── Error rates
└── Custom metrics (claims/hour, fraud scores)

Logging:          ELK Stack (Elasticsearch + Logstash + Kibana) or CloudWatch
├── Centralized logs
├── Full-text search
├── Alerting on error spikes
```

---

## 📊 Development Roadmap (Weeks 1-2)

### Week 1: Foundation & Architecture (March 4-10)

**Days 1-2: Project Setup**
- [ ] GitHub repository initialized + `.gitignore` configured
- [ ] Docker Compose environment working locally
- [ ] Database schema designed + created in PostgreSQL
- [ ] Slack/Discord team channel setup
- [ ] Daily standup scheduled (10 AM IST)

**Days 2-3: Architecture Design**
- [ ] System architecture diagram (Miro/Excalidraw)
- [ ] Database ERD (Entity-Relationship Diagram)
- [ ] API endpoint specifications (Swagger)
- [ ] Mobile app flow diagrams (Figma wireframes)
- [ ] Admin dashboard layout sketches

**Days 4-5: Backend Skeleton**
- [ ] FastAPI project structure setup
- [ ] PostgreSQL models defined (User, Policy, Claim, Transaction)
- [ ] Service layer architecture designed
- [ ] API endpoint stubs created (auth, policy, claims)
- [ ] Database connection pooling configured

**Day 6: ML Pipeline Setup**
- [ ] Jupyter notebooks for data exploration
- [ ] Mock datasets created (100 workers, 500 claims for testing)
- [ ] Bayesian pricing model skeleton
- [ ] Fraud detection model skeleton
- [ ] Feature engineering pipeline outlined

**Day 7: Documentation & Planning**
- [ ] README.md (Phase 1 Idea Document) draft
- [ ] API documentation (Swagger) auto-generated
- [ ] MLModels.md explaining each model
- [ ] Database.md with schema + relationships
- [ ] Week 2 detailed task breakdown

---

### Week 2: MVP & Demo Prep (March 11-17)

**Days 1-2: Worker Onboarding**
- [ ] Registration endpoint implemented (POST /auth/register)
- [ ] KYC document upload endpoint
- [ ] Risk profiling basic logic
- [ ] Mobile app: Onboarding screens designed + wired
- [ ] Admin dashboard: Worker management screen

**Days 2-3: Policy Management**
- [ ] Policy creation endpoint (POST /policies)
- [ ] Premium calculation (basic formula, no ML yet)
- [ ] Policy retrieval endpoint (GET /policies/{worker_id})
- [ ] Mobile app: Display active policy + premium breakdown
- [ ] Admin: Policy lifecycle dashboard

**Days 3-4: Claim Mechanism**
- [ ] Claim creation endpoint (POST /claims)
- [ ] Mock weather API integration (hardcoded for demo)
- [ ] Claim status endpoint (GET /claims/{claim_id})
- [ ] Mobile app: File claim button (hardcoded disruption for demo)
- [ ] Admin: Claims list view with filters

**Days 4-5: Basic Fraud Detection**
- [ ] Fraud scoring endpoint (0-100 scale, rule-based)
- [ ] Claim approval workflow (score <20 → auto-approve)
- [ ] Email notifications on claim status
- [ ] Admin: Fraud score visible on claim details

**Day 6: Payment Gateway Mock**
- [ ] Razorpay sandbox environment setup
- [ ] Mock payout endpoint (POST /payouts)
- [ ] Transaction history endpoint
- [ ] Mobile app: Show payout status + amount

**Days 6-7: Demo Preparation**
- [ ] Record 2-minute demo video
  - Show worker registration
  - Create policy (DC 150/week)
  - File claim (simulate rain trigger)
  - See auto-approval + payout
  - Check admin dashboard
- [ ] Refine README with real screenshots
- [ ] Prepare GitHub repo for public view
- [ ] Create beautiful project layout

---

### Deliverables by End of Phase 1 (March 20)

#### 1. GitHub Repository ✅
```
✓ README.md (this document + more details)
✓ Clean folder structure
✓ Initial code with comments
✓ .gitignore configured
✓ License file (MIT)
```

#### 2. Phase 1 Idea Document ✅ (This README)
```
✓ Problem statement + persona
✓ Solution approach
✓ Weekly pricing model explained
✓ AI/ML integration plan
✓ Tech stack justification
✓ Development roadmap (Week-by-week)
✓ Risk management + mitigation
✓ Financial projections
✓ Success criteria
```

#### 3. Technical Documentation
```
✓ Database Schema (DATABASE.md)
  ├── Workers table with risk scores
  ├── Policies with premium calculations
  ├── Claims with fraud scores
  ├── Transactions for accounting
  └── API audit logs

✓ API Specification (API_SPEC.md)
  ├── Auth endpoints (register, login, OTP)
  ├── Policy endpoints (create, read, update, delete)
  ├── Claim endpoints (file, approve, reject, list)
  ├── Admin endpoints (workers, reports, settings)
  └── All with request/response examples

✓ ML Models Documentation (ML_MODELS.md)
  ├── Bayesian pricing (formula + training approach)
  ├── Fraud detection (Isolation Forest explanation)
  ├── Claim prediction (LightGBM approach)
  └── Feature engineering pipeline

✓ Architecture Diagram (Lucidchart export in docs/)
  ├── System components
  ├── Data flow
  ├── Integration points
```

#### 4. Working Code
```
✓ Backend (FastAPI)
  ├── /app: Main application structure
  ├── /api: Endpoint definitions (auth, policy, claim, admin)
  ├── /models: SQLAlchemy ORM models
  ├── /services: Business logic (premium calc, fraud check)
  ├── /integrations: Mock weather, traffic, payment APIs
  ├── requirements.txt: All dependencies listed
  ├── .env.example: Configuration template
  ├── Dockerfile: Container definition
  └── docker-compose.yml: Local environment

✓ Mobile App (React Native)
  ├── /src/screens: Onboarding, Dashboard, FileClaim, History
  ├── /src/components: Reusable components
  ├── /src/services: API client, Redux setup
  ├── package.json: Dependencies
  ├── .env.example: Configuration
  └── App.json: App metadata

✓ Admin Dashboard (React)
  ├── /src/components: Dashboard, ClaimsList, Analytics, Workers
  ├── /src/pages: Layout pages
  ├── /src/services: API client
  ├── package.json: Dependencies
  ├── .env.example: Configuration

✓ Configuration Files
  ├── docker-compose.yml: All services (backend, database, redis)
  ├── .github/workflows/ci.yml: Automated testing on PR
  ├── .gitignore: Prevent committing secrets
  └── Dockerfile(s): For containerization
```

#### 5. 2-Minute Demo Video
```
✓ Recording: Screen capture + voiceover
✓ Content:
  1. Intro (15 sec): "GigGuard protects food delivery workers..."
  2. Demo (80 sec):
     - Worker registration (10 sec)
     - View policy + premium breakdown (15 sec)
     - Simulate rain disruption (15 sec)
     - System auto-files claim (15 sec)
     - Instant fraud check (10 sec)
     - Admin sees claim in dashboard (15 sec)
  3. Call to action (5 sec): "Join 1M delivery workers"
✓ Upload: YouTube unlisted link + backup on Google Drive
✓ Quality: 1080p, clear audio, professional captions
```

---

## 🎯 Key Metrics & Success Criteria (Phase 1)

### Technical Excellence
- ✅ **Code Quality:** 80%+ test coverage, <2 sec average API latency
- ✅ **Database:** Schema normalized, indexes optimized
- ✅ **Security:** HTTPS everywhere, JWT tokens, input validation
- ✅ **Documentation:** Every endpoint documented, every model explained

### Product Functionality
- ✅ **Onboarding:** <3 min from download to active policy
- ✅ **Premium Calculation:** Works for 5+ example personas
- ✅ **Claim Filing:** <1 min from disruption to submitted claim
- ✅ **Fraud Detection:** Catches obvious anomalies (duplicate claims, 10x normal amount)

### Team Execution
- ✅ **Delivery:** All deliverables submitted on time (no penalties)
- ✅ **Communication:** Clear weekly updates, daily standups
- ✅ **Code Review:** 2+ approvals before merge
- ✅ **Video Quality:** Professional presentation, clear diction

### Investor Appeal
- ✅ **Problem clarity:** Jury understands income volatility for gig workers
- ✅ **Solution elegance:** Parametric insurance = instant payouts (wow moment)
- ✅ **Market size:** 5M+ delivery workers in India (huge TAM)
- ✅ **Differentiation:** AI-powered + mobile-first (vs traditional insurance)
- ✅ **Business viability:** Weekly premium model + 20%+ margins realistic

---

## 💰 Financial Projections (Phase 1 - Revenue Assumptions)

### Conservative Model (Target 3-star rating = DC 22,000)
```
Weekly Activities:
├── No CTF challenges: DC 0
├── Win 1 quiz (1st place): DC 5,000
├── Community engagement (2 posts + 1 blog): DC 2,000 + 2,500 = DC 4,500
└── Weekly subtotal: DC 9,500

Phase 1 (2 weeks):
├── Base earnings: DC 9,500 × 2 = DC 19,000
├── Phase 1 Funding (3-star): DC 22,000
├── Weekly burn: DC 5,000 × 2 = DC 10,000
│
└─ Net: DC 19,000 + DC 22,000 - DC 10,000 = DC 31,000 remaining
   (Out of DC 100,000 starting capital)
```

### Aggressive Model (Target 4-star rating = DC 32,000)
```
Weekly Activities:
├── CTF Challenge easy (2 flags): DC 1,500 × 2 = DC 3,000
├── Win 1 quiz (1st place): DC 5,000
├── Community engagement (max): DC 15,000 cap
└── Weekly subtotal: DC 23,000 (capped)

Phase 1 (2 weeks):
├── Weekly earnings: DC 23,000 × 2 = DC 46,000
├── Phase 1 Funding (4-star): DC 32,000
├── Weekly burn: DC 5,000 × 2 = DC 10,000
│
└─ Net: DC 46,000 + DC 32,000 - DC 10,000 = DC 68,000 remaining
```

### Critical Path to Survival
```
REQUIRED for Phase 2:
├── Minimum: DC 50,000 remaining (covers 3 weeks burn at DC 12,000/week)
├── Comfortable: DC 80,000+ (allows expert sessions + contingency)
│
→ STRATEGY:
   ├── Win CTF challenges (quick wins, low effort)
   ├── Dominate quizzes (insurance domain knowledge)
   ├── Community engagement (consistent posts)
   ├── Secure 4-star funding in Phase 1 (hit quality bar)
   └── Stretch goal: 5-star for DC 40,000 injection
```

---

## ⚠️ Risk Management & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Missed Phase 1 deadline** | Medium | 🔴 Critical (Eliminated) | Daily standups, Friday submissions, buffer time |
| **API integration issues** | Medium | 🟠 High (Blocked development) | Use mocks early, real APIs in Phase 2 |
| **Database schema wrong** | Low | 🟠 High (Expensive refactor) | Design review with senior dev, normalization check |
| **Team member illness/dropout** | Low | 🟠 High (Workload spike) | Cross-train all members Week 1, document everything |
| **Poor video/demo quality** | Medium | 🟡 Medium (Lower star rating) | Professional setup, multiple takes, peer review |
| **Funding shortfall** | Low | 🔴 Critical (Phase 2 at risk) | Multiple income streams (CTF, quiz, community) |
| **Market crash fine** | Low | 🟡 Medium (DC 8K loss) | Buy Sabotage Shield if budget allows (DC 3K) |
| **Scope creep (too many features)** | High | 🟡 Medium (Burnout, quality drop) | Weekly planning, strict MVP for Phase 1 |

### Risk Response Plans
1. **Daily standup:** Catch blockers immediately (30 min cost vs 1 day delay cost)
2. **Code reviews:** Catch errors before they become tech debt
3. **Parallel workstreams:** Don't wait for backend to build mobile (independence)
4. **Documentation:** If someone drops, onboarding successor is fast
5. **Buffer time:** Finish features by Wednesday, Thu-Fri for polish + video

---

## 🎬 Demo Video Outline (2 minutes)

### Scene-by-Scene Breakdown
```
[0:00-0:15] INTRO
Camera: Wide shot of laptop showing GigGuard logo
Voice: "Meet Raj. He's a food delivery worker in Mumbai earning ₹5,000/week.
        When it rains, he loses 30% of earnings with zero safety net.
        We built GigGuard to change that."

[0:15-0:35] REGISTRATION
Screen: Mobile app screen showing registration flow
Actions:
  - Click "Sign Up"
  - Enter phone number
  - Get OTP, verify
  - Fill profile (name, zone, platform affiliation)
Voice: "Registration takes 2 minutes. KYC validation happens in the background."

[0:35-0:50] VIEW POLICY
Screen: Mobile app showing active policy
Content: "Premium this week: DC 150 | Coverage: Rain, Heat, AQI, Curfew, Outages"
Breakdown popup: "Base: 100 + Zone rain risk: 30 + Season: 20 = 150"
Voice: "Instead of confusing annual policies, Raj sees his weekly premium.
        AI calculates it based on his zone and risk."

[0:50-1:10] DISRUPTION DETECTED
Screen: Weather map showing heavy rain icon
Action: Fade in notification "Heavy rain detected in your zone (>20mm)"
Mobile app updates: Claim auto-filed banner appears
Voice: "It's raining. The system detects it in real-time.
        Within seconds, a claim is auto-filed. No paperwork. No waiting."

[1:10-1:25] FRAUD CHECK & APPROVAL
Screen: Admin dashboard background
Claim card shows:
  - Fraud score: 5/100 (Very Low Risk)
  - Claim amount: DC 1,500
  - Status: Auto-Approved ✅
Voice: "Our AI runs a fraud check in milliseconds.
        Checks location, earnings history, weather data.
        Low risk? Instant approval."

[1:25-1:40] PAYOUT
Mobile app notification: "₹1,200 credited to your wallet"
Earnings chart shows: Normal week + payout = profit despite rain
Voice: "Within 24 hours, Raj's wallet is credited.
        Even with heavy rain, this week is profitable."

[1:40-1:55] ADMIN INSIGHTS
Screen: Admin dashboard with graphs
Shows:
  - Claims approved: 847 | Fraud blocked: 23 | Payouts: DC 54,210
  - Forecast: 1,200 claims expected next week (monsoon)
  - Profitability: 12% margin, on track to 20%
Voice: "Behind the scenes, insurers get real-time insights.
        Fraud detection. Predictive analytics. Profitability tracking."

[1:55-2:00] CLOSING
Screen: GigGuard logo + text
"GigGuard: Protecting 1M+ Delivery Workers in India"
Voice: "Welcome to the future of gig economy insurance."
```

---

## 📈 Growth Projections (Phase 1-3, For Reference)

*Note: These are aspirational targets for the competition, not binding commitments.*

### Phase 1 (Weeks 1-2)
- **Users:** 5-10 pilots (team + friends)
- **Active policies:** 5-10
- **Demo claims:** 3-5 simulated
- **Goal:** Prove concept + secure 3-4 star funding

### Phase 2 (Weeks 3-4)
- **Users:** 500-1,000 (closed beta)
- **Active policies:** 500-1,000
- **Real claims:** 50-100
- **Fraud detection:** Catching 5-10% suspicious claims
- **Goal:** Scale to real workers, prove robustness

### Phase 3 (Weeks 5-6)
- **Users:** 5,000+ (open beta)
- **Active policies:** 5,000+
- **Real claims:** 500-1,000
- **Customer retention:** 85%+
- **Goal:** Production-ready, investor pitch

---

## 👥 Team Structure (3 Members)

| Role | Responsibilities | Primary Skillset |
|------|------------------|------------------|
| **Backend Lead (Dev 1)** | FastAPI, Database, ML models, Integrations | Python, PostgreSQL, ML |
| **Frontend Lead (Dev 2)** | React Native app, React admin dashboard | JavaScript, Mobile, UI/UX |
| **DevOps/QA (Dev 3)** | Docker, Testing, Documentation, Deployment | DevOps, Python testing, Linux |

### Weekly Collaboration
- **Monday 10 AM:** Sprint planning (1 hour)
- **Wed 3 PM:** Mid-week sync (30 min)
- **Friday 5 PM:** Demo + retro (1 hour)
- **Async:** Slack updates, GitHub PRs, Notion task board

---

## 🚀 Getting Started (Local Development)

### Prerequisites
```bash
# Install required software
- Python 3.10+
- Node.js 16+
- Docker Desktop
- PostgreSQL 13 (optional, Docker handles it)
- GitHub CLI (optional but recommended)

# Clone repo
git clone https://github.com/username/insuranceclaim.git
cd insuranceclaim

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start local dev environment
cd ..
docker-compose up -d

# Install mobile + admin dependencies
cd mobile-app && npm install
cd ../frontend-admin && npm install
```

### Run Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
# Backend running on http://localhost:8000
# Swagger API docs on http://localhost:8000/docs
```

### Run Mobile App (Expo)
```bash
cd mobile-app
npx expo start
# Scan QR code with Expo Go app
```

### Run Admin Dashboard
```bash
cd frontend-admin
npm start
# Frontend running on http://localhost:3000
```

---

## 📚 Additional Resources

- **Guidewire DEVTrails Rules:** See official competition document
- **Insurance Terminology:** Our [GLOSSARY.md](docs/GLOSSARY.md) explains key terms
- **Data Privacy:** See [PRIVACY.md](docs/PRIVACY.md) for GDPR/India data protection
- **Deployment Guide:** See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for cloud setup

---

## 📞 Contact & Support

**Team Lead:** Your Name  
**GitHub:** [https://github.com/yourname/insuranceclaim](https://github.com/yourname/insuranceclaim)  
**Email:** your.email@example.com  
**Slack:** #insuranceclaim-devtrails  

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file

---

## 🎓 Acknowledgments

Built for **Guidewire DEVTrails 2026: Unicorn Chase** competition.

**Vision:** Build insurance for India's gig economy workers. Solve a real problem. Become a Unicorn.

---

**Last Updated:** March 25, 2026  
**Phase:** 2 (Full Implementation) ✅ COMPLETE  
**Status:** All backend services, ML models, mobile app, and admin dashboard fully implemented
