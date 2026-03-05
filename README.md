# Guidewire DEVTrails 2026 – Gig Insure

# Problem Statement
**AI-Powered Insurance for India’s Gig Economy**
India’s platform-based delivery partners (Zomato, Swiggy, Zepto, Amazon, Dunzo etc.) are the backbone of our fast-paced digital economy. However, external disruptions such as extreme weather, pollution, and natural disasters can reduce their working hours and cause them to lose 20–30% of their monthly earnings. Currently, gig workers have no income protection against these uncontrollable events. When disruptions occur, they bear the full financial loss with no safety net.

# The Challenge
Build an AI-enabled parametric insurance platform that safeguards gig workers against income loss caused by external disruptions such as extreme weather or environmental conditions.
The solution should provide:
Automated coverage and payouts  
Intelligent fraud detection mechanisms  
A simple weekly pricing model aligned with gig workers’ earnings cycle  
**Critical Constraints**
1. Exclude coverage for health, life, accidents, or vehicle repairs.  
2. Financial model must be structured on a **weekly pricing basis**.  

# Persona & Disruptions
**Chosen Persona:** Food Delivery Partners (Zomato/Swiggy)  
**Disruption Types & Examples**
**Environmental:** Extreme heat, heavy rain, floods, severe pollution → Deliveries halted  
**Social:** Unplanned curfews, local strikes, sudden market closures → Inability to access pickup/drop zones  
Note: We insure **income lost during these events**, not repair costs or medical bills.

# Technical Requirements
**AI-Powered Risk Assessment**
Dynamic weekly premium calculation  
Predictive risk modeling specific to delivery zones  
**Fraud Detection**
Anomaly detection in claims  
Location & activity validation  
Duplicate claim prevention  
**Parametric Automation**
Real-time trigger monitoring  
Automatic claim initiation  
Instant payout processing  
**Integration Capabilities**
Weather APIs (free tiers/mocks)  
Traffic data (mock acceptable)  
Platform APIs (simulated acceptable)  
Payment systems (sandbox/test modes)  

# Workflow (Draft)
**Onboarding** → Worker registers & selects weekly plan  
**Policy Creation** → Weekly premium auto-calculated  
**Trigger Monitoring** → APIs detect disruptions (rain, curfew, pollution)  
**Claim Automation** → Claim auto-initiated when disruption occurs  
**Payout Processing** → Instant transfer via mock payment gateway  
**Dashboard** → Worker view (coverage, payouts), Admin view (analytics, loss ratios)  

# Tech Stack (Planned)
**Frontend:** React (Web) or Flutter (Mobile)  
**Backend:** Python (FastAPI/Django)  
**AI/ML:** Scikit-learn / TensorFlow for risk & fraud models  
**Database:** PostgreSQL / MongoDB  
**APIs:** Weather, traffic, payment (mock/sandbox)  
**Cloud:** AWS/GCP/Azure (student credits/free tier)  
