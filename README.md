# SurePay — AI-Powered Parametric Income Insurance for Food Delivery Partners

> **Guidewire DEVTrails 2026**

---

## A Note From Us

We're a group of students. We don't deliver food for a living. But we've watched the guy on the bike outside our college gate wait out a downpour with nowhere to go — orders paused, clock ticking, rent still due on Friday.
That stuck with us.
There are millions of Rahuls and Priyas out there. They show up every single day — through heat, smog, flooded roads, and sudden curfews. And when the worst happens, nobody shows up for them. Not their platform. Not any insurer. Nobody.
That's the gap we're trying to close with **SurePay**.

---

## 📌 The Problem

India's food delivery partners are the backbone of our digital economy — and yet, they're completely exposed to forces they can't control. A Red Alert rain in Mumbai. An AQI spike in Delhi. A sudden bandh in Bengaluru. In each case, work stops. Income stops. But bills don't.
These workers lose **20–30% of their weekly earnings** during disruption events — with zero recourse. No safety net. No compensation. Just loss.
What makes this especially frustrating is that these aren't freak accidents — they're *predictable, measurable, repeatable events*. We know when monsoons hit Mumbai. We know when Delhi chokes in November. The data exists. The technology exists. What's missing is the product.
**SurePay** is that product — an AI-powered parametric insurance platform that detects disruptions in real time, triggers claims automatically, and puts money back in workers' hands within hours.
No paperwork. No waiting. No fighting with an adjuster.

---

## 👤 Persona: Food Delivery Partner (Zomato / Swiggy)
### Who We're Building For

| Attribute | Profile |
|-----------|---------|
| **Platform** | Zomato / Swiggy |
| **Working Hours** | 8–12 hrs/day, 6–7 days/week |
| **Avg. Weekly Income** | ₹3,000 – ₹7,000 |
| **Payment Cycle** | Weekly (platform payout every 7 days) |
| **Risk Exposure** | Outdoor, city-wide, weather & pollution dependent |

These aren't abstract users in a product spec. They're people making real trade-offs — skip a meal or buy a raincoat? Work through the smog or lose the day's income? SurePay is designed to remove that impossible choice.

### Real Scenarios, Real People

**Scenario 1 — Heavy Rainfall, Mumbai, July**
> Rahul has been delivering for Swiggy for two years. He knows the monsoon rhythm — but this July, a Red Alert hits and the roads near Dharavi flood by noon. Orders dry up. He can't work. SurePay detects the IMD Red Alert, automatically initiates a claim, and ₹900 lands in his UPI before he gets home.

**Scenario 2 — Severe Air Pollution, Delhi, November**
> Priya has asthma. When Delhi's AQI crosses 400 in November, she can't afford to be outside — but she also can't afford not to work. With SurePay's Gold plan, a Severe AQI trigger fires automatically. She gets 75% of her estimated daily income. She stays home. She's okay.

**Scenario 3 — Unplanned Curfew, Bengaluru**
> Arjun was mid-shift in Koramangala when a sudden bandh shut everything down. No warning. No alternate route. Half his day, gone. SurePay's geofenced civil alert detector logs the zone-level disruption and processes a half-day income claim — no action needed from Arjun.

---

## 📋 How It Works — The Full Workflow

```
┌───────────────────────────────────────────────────────┐
│                    SurePay Platform                   │
├──────────────────┬──────────────────┬─────────────────┤
│  Mobile App      │  Admin Dashboard │  Backend API    │
│  (React Native)  │  (React)         │  (FastAPI)      │
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
    ┌────▼──────────────────▼────────────────▼───────┐
    │   PostgreSQL Database                          │
    │  (Workers, Policies, Claims, Transactions)     │
    └────────────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────┐
    │   External Integrations                       │
    │ • Weather APIs (OpenWeatherMap)               │
    │ • Traffic APIs (Google Maps / Mock)           │
    │ • Delivery Platform APIs (Zomato/Swiggy mock) │
    │ • Notifications (Twilio, Firebase)            │
    └───────────────────────────────────────────────┘
```

We designed this so that a worker who just wants coverage doesn't need to understand insurance at all. Here's the journey:

1. **Onboarding** — Register in under 3 minutes. Aadhaar/phone, link your Zomato or Swiggy ID, add a UPI handle, pick your city zone. Done.
2. **Risk Profiling** — Our AI builds a risk score based on city, zone, season, and disruption history. No guesswork, no flat rates.
3. **Plan Selection** — Pick Bronze, Silver, or Gold. Weekly premium auto-debits every Monday. That's it.
4. **Real-Time Monitoring** — We watch weather, AQI, and civil alert feeds around the clock for your registered zone. You don't have to do anything.
5. **Parametric Trigger** — The moment a qualifying event crosses threshold, your claim is initiated. No form. No call. No waiting.
6. **Fraud Check** — Our system quietly validates you were genuinely in the affected zone, using physics — not assumptions (more below).
7. **Payout** — Money in your UPI within 2–4 hours of trigger. On the days it matters most.

---

## 💰 Weekly Premium Model

We chose weekly pricing deliberately. Gig workers don't think in months — they think in weeks. Platforms pay weekly. Budgets reset weekly. Insurance should match that rhythm.

### Plan Tiers

| Plan | Weekly Premium | Max Weekly Payout | Coverage Days | Disruptions Covered |
|------|---------------|-------------------|--------------|---------------------|
| **Bronze** | ₹25 / week | ₹500 | Up to 2 days/week | Rain (Red Alert), Flood |
| **Silver** | ₹45 / week | ₹1,000 | Up to 3 days/week | Rain, Flood, Severe AQI |
| **Gold** | ₹85 / week | ₹1,800 | Up to 5 days/week | Rain, Flood, AQI, Curfew, Strike |

At ₹25/week, that's less than a single order's delivery fee. We think that's a fair price for a safety net.

### How Premiums Are Calculated

We don't use a flat rate — that would be lazy and unfair. A partner in coastal Chennai faces a very different risk profile than one in inland Pune. Our dynamic pricing model accounts for this:

```
Weekly_Premium = Base_Rate × City_Risk_Factor × Season_Multiplier × Claim_History_Modifier
```

- **Base_Rate** — Actuarially derived from 3 years of city-level disruption frequency data
- **City_Risk_Factor** — Mumbai (1.4×), Delhi (1.3×), Chennai (1.2×), Bengaluru (1.1×)
- **Season_Multiplier** — Monsoon Jun–Sep (1.5×), Delhi winter smog Oct–Jan (1.3×), otherwise (1.0×)
- **Claim_History_Modifier** — Rewards clean history (0.9×), adjusts upward for high frequency (up to 1.2×)

**One rule that's non-negotiable**: the premium can never exceed 2% of the worker's average weekly income. Affordability isn't a feature — it's a constraint we've built into the foundation.

---

## ⚡ Parametric Triggers

The whole philosophy here is simple: if the event is real and measurable, we pay — automatically, immediately, without asking the worker to prove anything.

| Trigger Type | Data Source | Threshold | Payout % |
|-------------|-------------|-----------|----------|
| Heavy Rainfall | IMD / OpenWeatherMap API | > 64.5 mm/day (Red Alert) | 100% daily |
| Moderate Rainfall | IMD / OpenWeatherMap API | 35–64.5 mm/day (Orange Alert) | 50% daily |
| Flood / Waterlogging | State Disaster APIs / Google Maps | Zone-level flood tag | 100% daily |
| Severe Air Pollution | CPCB AQI API | AQI > 400 (Severe+) | 75% daily |
| Very Poor AQI | CPCB AQI API | AQI 301–400 | 50% daily |
| Curfew / Section 144 | Government alert feeds / News APIs | Zone-level order issued | 100% for affected hours |
| Platform Outage | Zomato/Swiggy API health check | > 2 hrs downtime in zone | 60% daily |

> **What we don't cover**: Vehicle damage, health expenses, accidents, personal leave. This is income loss from external events — full stop.

---

## 🤖 The AI/ML Stack — Built to Be Fair, Not Just Smart

### 1. Dynamic Premium Engine
We use **XGBoost (Gradient Boosted Regression)** — battle-tested and explainable. Features include city, zone, season, disruption history, tenure, and prior claims. Output is a personalized weekly premium, recalculated every Monday.

We avoided black-box deep learning here intentionally. If a worker ever asks *"why did my premium go up?"*, we should be able to answer in plain language.

### 2. Fraud Detection — Physics Over Paranoia

This is the part we designed most carefully, because we kept asking ourselves: *what if we build fraud detection that ends up punishing honest workers?* That would be worse than no fraud detection at all.

So we built something lean, fast, and grounded in physics rather than probabilistic guesswork.

> **Core principle**: A genuine worker got to that zone gradually, at human speed. A fraudster teleported there via a GPS spoofing app. Physics can tell the difference in under 50ms.

**The Haversine Velocity Check**

We store a coordinate + timestamp on every app ping — on our backend, not the device, so it can't be tampered with. When a claim fires, we run the Haversine formula on the last known location vs. the claimed location:

```
velocity = haversine(coord_prev, coord_now) / time_delta
```

A real delivery partner who rode into a flooded zone will show travel history consistent with a bike — 20 to 40 km/h over several minutes. A fraudster who activated a GPS spoofing app from home will show a velocity of thousands of km/h — a teleportation event that is physically impossible. No ambiguity. Just physics.

**Two Hardware-Level Checks**

| # | Data Point | What It Catches | Why It Can't Be Faked |
|---|-----------|----------------|----------------------|
| 1 | **Travel Velocity** (Haversine + timestamp delta) | The "teleport" from home to weather zone | Coordinate history lives on our backend — unalterable after the fact |
| 2 | **Network Cell Tower ID** | Phone pinging a tower in Zone B while claiming Zone A | Cell tower registration happens at radio hardware level — no app can override it |

**Fraud Ring Detection**

Both checks become far more powerful at population scale. If 40+ claims arrive within 6 minutes with teleportation signatures from a tight residential cell tower cluster — that's a coordinated syndicate. The system auto-escalates to a **fraud ring alert** and freezes the batch for human review.

**Flagged ≠ Denied — This Is a Design Decision We Feel Strongly About**

| Verdict | Condition | Action |
|---------|-----------|--------|
| ✅ **0 flags** | Both checks pass | Instant auto-approval and payout |
| ⏳ **1 flag** | One check fails | 4-hour soft hold. Worker is notified. System re-pings passively after 20 min. A genuinely stranded worker is still there. A fraudster at home isn't. |
| 🔴 **2 flags** | Both checks fail | Auto-hold → human analyst. Worker gets acknowledgment + appeal path. Never ghosted. |

**Network Drop Protection**: In severe weather, connectivity fails — and that's *expected*. If a worker can't complete passive verification due to no signal, the system logs the failure and retries on restoration. Connectivity returning only *after* the disruption ends is itself corroborating evidence. Honest workers are never penalized for the very event they're claiming against.

### 3. Risk Profiling at Onboarding
K-Means clustering on onboarding data assigns each worker to a risk tier (Low / Medium / High / Seasonal). This determines their initial premium band and payout limits — done once at signup, updated weekly.

### 4. Predictive Disruption Forecasting
An LSTM/Prophet time-series model forecasts next-week disruption probability per city zone. Workers in high-risk zones get proactive nudges: *"Heavy rain expected in your area next week — consider upgrading to Silver."* We want to be useful before things go wrong, not just after.

---

## 🗂️ Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Android-first) |
| Web Dashboard | React.js |
| Notifications | Firebase Cloud Messaging (FCM) |

### Backend
| Layer | Technology |
|-------|-----------|
| API Server | Python FastAPI |
| Auth | JWT + OAuth2 |
| Database | PostgreSQL (policies, claims) + Redis (real-time event cache) |
| ML Services | Python (scikit-learn, XGBoost, pandas + numpy : data processing) via FastAPI microservice |
| Message Queue | RabbitMQ (event triggers → claim pipeline) |

### Integrations
| Integration | Provider | Mode |
|-------------|----------|------|
| Weather API | OpenWeatherMap (free tier) + IMD mock | Live / Mock |
| AQI Data | CPCB API + OpenAQ | Live / Mock |
| Platform Activity | Zomato/Swiggy APIs | Simulated |
| Payment | Razorpay UPI |
| Geolocation | Google Maps Geocoding API | Live |
| Civil Alerts | Custom mock feed (curfews, strikes) | Mock |

### Infrastructure
- **CI/CD**: GitHub Actions

## 📊 Analytics Dashboard

The insurer dashboard surfaces what actually matters in running this platform:

- **Live Disruption Map** — City-zone heatmap of active weather/AQI events
- **Claims Pipeline** — Real-time status from trigger initiation to payout
- **Fraud Alert Queue** — Flagged claims with velocity and tower mismatch data
- **Premium vs. Payout Ratio** — Weekly financial health at a glance
- **Worker Coverage Metrics** — Active policies, lapse rates, renewal trends
- **Disruption History Charts** — Seasonal and geographic patterns over time

---

## 🔒 What We Don't Cover (And Never Will)

This is important enough to say plainly:

- ❌ Vehicle damage or repair
- ❌ Health expenses or medical bills
- ❌ Accident compensation
- ❌ Life insurance or death benefits
- ❌ Income loss from personal reasons (illness, personal leave)
- ❌ Income loss from low demand on normal, undisrupted days

SurePay insures one thing: **income lost because of an external, measurable, unavoidable disruption**. That scope is intentional, and we won't drift from it.

---

## 🌐 Why Mobile-First?

Because that's the only screen these workers have. 95%+ of food delivery partners access the internet exclusively on Android phones. Building desktop-first would mean building for the wrong person entirely.

Mobile-first means:
- Onboarding in under 3 minutes
- Push alerts the moment a disruption hits their zone
- One-tap claim acknowledgment
- UPI-native payouts — no bank login, no IFSC code hunt

We do have a web dashboard — but that's for insurers and admins, not for the workers SurePay actually serves.


## 📁 Repository Structure

```
SurePay/
├── README.md
├── docs/
│   └── architecture.png
├── frontend/
│   ├── mobile/          # React Native app
│   └── web/             # Admin dashboard (React.js)
├── backend/
│   ├── api/             # FastAPI services
│   ├── ml/              # ML models (premium, fraud, risk)
│   └── triggers/        # Parametric event monitoring pipeline
├── integrations/
│   ├── weather/         # OpenWeatherMap + IMD mock
│   ├── aqi/             # CPCB AQI integration
│   └── payments/        # Razorpay UPI sandbox
└── scripts/
    └── seed_data/       # Demo data for testing
```