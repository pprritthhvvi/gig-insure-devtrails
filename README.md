# SurePay 
*Parametric Insurance for the Gig Economy*

## Inspiration
India's 5 million+ platform-based delivery workers operate without a financial safety net. External disruptions like heavy rain, extreme heat (45°C+), and severe pollution (AQI >300) force workers offline, causing them to lose 20-30% of their weekly earnings. For a delivery partner earning ₹4,500/week, a single rainy Saturday means losing ₹1,000—a devastating 20% loss with zero compensation. 

Traditional insurance is too slow, requires complex paperwork, and does not align with week-to-week gig cycles. We were inspired to build SurePay to become the financial lifeline for these workers, ensuring their livelihoods are protected every week through automated, weather-triggered micro-policies.

## What it does
SurePay is an AI-powered, parametric insurance platform that provides automatic, instant income protection for gig workers during localized disruptions. 

* **Weekly Subscription Model:** Instead of annual premiums, workers pay a micro-premium (e.g., DC 120-200/week) aligned with their payout cycles.
* **Parametric Automation:** When a severe weather event is detected via external APIs, the system automatically files a claim for affected workers—no manual action required.
* **Instant Payouts:** Claims pass through an AI fraud check and are paid out within 24 hours.
* **Full-Stack Visibility:** Workers track active policies and payouts on a React Native mobile app, while insurers monitor claim clusters and fraud flags on a React web dashboard.

## How we built it
We engineered SurePay using a decoupled, high-performance three-tier architecture:

* **Backend (The Brain):** Python FastAPI for asynchronous, high-speed API routing, connected to a PostgreSQL database (via SQLAlchemy ORM) to handle workers, policies, and claims.
* **Mobile App (The Worker UI):** Built with React Native and Expo SDK 54, utilizing Redux Toolkit for state management to ensure a smooth, mobile-first experience.
* **Admin Dashboard (The Command Center):** A React 18 web application using Material-UI (MUI v5) and Zustand to give insurers real-time monitoring capabilities.
* **AI/ML Layer:** Designed a Bayesian Pricing Model to calculate dynamic weekly premiums based on 50+ features (zone risk, seasonal weather, worker history), alongside an Isolation Forest model for real-time anomaly detection.

## Challenges we ran into
Halfway through development, we were hit with the **Phase 1 Market Crash Scenario**: a simulated threat where a syndicate of 500 delivery workers used localized Telegram groups and advanced GPS-spoofing to fake being in a severe weather zone, draining the liquidity pool. Simple GPS verification was officially rendered obsolete.

Additionally, we battled severe technical bottlenecks during late-night development, including React Navigation version clashing (v6 vs v7 causing `ERESOLVE` npm errors) and strict Python indentation errors that temporarily broke our backend routing. 

## Accomplishments that we're proud of
We successfully pivoted our architecture under extreme time pressure to defeat the GPS-spoofing syndicate without burning cloud computing resources on heavy ML models. We designed a **Lightweight Sensor-Fusion Architecture** that relies on mathematical truths and native OS hardware:
* **"Impossible Travel" Matrix:** Calculating Haversine distance between pings to instantly flag workers moving at mathematically impossible speeds. 
* **Environmental Truths:** Cross-referencing spoofed GPS data with native Barometric pressure readings and battery charging states.
* **Geohash Collisions:** Converting coordinates into 9-character Geohashes to detect if 500+ workers are artificially stacked in the exact same 4-square-meter grid.

Furthermore, we built out a complete, fully documented technical foundation including a 25+ endpoint API specification, an ML models strategy, and a robust database schema.

## What we learned
We learned that security must never punish the honest user. While engineering our anti-spoofing defenses, we realized a genuine worker trapped in a storm might lose their network connection or trigger a false positive. We learned to balance UX and security by implementing the "Soft Flag" Queue and Offline Telemetry Caching mentioned above.

## What's next for SurePay
Moving into Phase 2 and beyond, we plan to fully activate our AI architecture:
* **Predictive Claim Forecasting:** Implementing LightGBM models to forecast which zones will generate the most claims next week, allowing the platform to dynamically adjust cash reserves.
* **Explainable AI (SHAP):** Providing workers with a transparent "Waterfall plot" that shows exactly *why* their premium costs what it does, building ultimate trust in the platform.
* **Production Deployment:** Transitioning from our Docker Compose local environment to a fully orchestrated cloud deployment (AWS EC2/RDS).
