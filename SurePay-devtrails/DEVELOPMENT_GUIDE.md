# GigGuard Development Guide

## Quick Start (5 minutes)

### Prerequisites
- Python 3.10+
- Node.js 16+
- Docker Desktop
- Git

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourteam/insuranceclaim.git
cd insuranceclaim

# 2. Start Docker containers (PostgreSQL, Redis, RabbitMQ, Backend)
docker-compose up -d

# 3. Check containers are running
docker-compose ps

# 4. Create Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# 5. Install dependencies
pip install -r requirements.txt

# 6. Run backend
python -m uvicorn app.main:app --reload
# Backend ready at http://localhost:8000
# Swagger docs at http://localhost:8000/docs

# 7. In another terminal: Install mobile dependencies
cd ../mobile-app
npm install

# 8. Start React Native
npx expo start

# 9. In another terminal: Install admin dashboard
cd ../frontend-admin
npm install
npm start
```

---

## Development Workflow

### Backend Development (FastAPI)

**Structure:**
```
backend/
├── app/
│   ├── main.py           # FastAPI app entry + router registration
│   ├── config.py         # Configuration (env vars)
│   ├── database.py       # DB connection + session management
│   └── __init__.py
├── api/
│   ├── auth.py           # Auth routes (login, register, admin-login)
│   ├── policies.py       # Policy CRUD + /my endpoint
│   ├── claims.py         # Claims lifecycle + fraud scoring
│   ├── payments.py       # Payment initiation + tracking
│   ├── weather.py        # Weather conditions + disruption checks
│   ├── workers.py        # Worker profile + premium quotes
│   ├── admin.py          # Admin dashboard + analytics
│   └── demo.py           # Demo trigger endpoint
├── models/
│   ├── base.py           # Base model + GUID type
│   ├── worker.py         # Worker model
│   ├── policy.py         # Policy model
│   ├── claim.py          # Claim model
│   └── payment.py        # Payment model (Phase 2)
├── services/
│   ├── fraud_service.py  # Multi-rule fraud detection engine
│   ├── pricing_service.py # Dynamic premium pricing
│   └── weather_service.py # Mock weather data provider
├── schemas/
│   └── pydantic_models.py # Request/response validation
├── integrations/         # External API integrations
├── tests/                # Unit & integration tests
└── requirements.txt
```

**Adding a New Endpoint:**

1. Create service in `services/`:
```python
# services/premium_calc.py
async def calculate_premium(worker_id: str) -> float:
    """Calculate dynamic weekly premium for worker"""
    # Bayesian pricing logic here
    return 150.0
```

2. Create route in `api/`:
```python
# api/policies.py
from fastapi import APIRouter
from services.premium_calc import calculate_premium

router = APIRouter()

@router.post("/policies/premium")
async def get_premium(worker_id: str):
    premium = await calculate_premium(worker_id)
    return {"premium": premium}
```

3. Include in `main.py`:
```python
from api.policies import router
app.include_router(router, prefix="/api/v1", tags=["policies"])
```

### Mobile Development (React Native)

**Structure:**
```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── Onboarding.js      # Registration flow
│   │   ├── Dashboard.js       # Worker home
│   │   ├── FileClaim.js       # Claim filing
│   │   └── History.js         # Claims history
│   ├── components/            # Reusable UI components
│   ├── services/              # API client
│   ├── redux/                 # State management
│   └── App.js                 # Root component
└── app.json                   # Expo config
```

**Running on Device:**

1. Expo Go App (Easy):
```bash
cd mobile-app
npx expo start
# Scan QR code with Expo Go app (iOS/Android)
```

2. Real Device:
```bash
# iOS
npx expo start --ios

# Android
npx expo start --android
```

### Admin Dashboard (React + MUI)

**Structure:**
```
frontend-admin/
├── src/
│   ├── components/
│   │   ├── Sidebar.js          # Navigation sidebar
│   │   ├── TopBar.js           # Top navigation bar
│   │   ├── ActionDialog.js     # Approve/reject dialog
│   │   └── ClaimDetailsDialog.js # Claim details popup
│   ├── pages/
│   │   ├── Dashboard.js        # Live analytics dashboard
│   │   ├── ClaimsManagement.js # Claims list + approve/reject
│   │   ├── PoliciesManagement.js # Policies list
│   │   ├── WorkersManagement.js  # Workers list
│   │   ├── AnalyticsPage.js    # Deep analytics + weather
│   │   ├── SettingsPage.js     # DB init/seed + config
│   │   └── Login.js            # Admin login
│   ├── services/
│   │   └── api.js              # API client (admin, weather, payments)
│   ├── store/
│   │   └── authStore.js        # Zustand auth state
│   ├── utils/
│   │   └── helpers.js          # Formatting utilities
│   └── App.js               # Root + routing
└── package.json
```

**Running:**
```bash
cd frontend-admin
npm start
# Opens at http://localhost:3000
```

---

## Database Management

### Access PostgreSQL

```bash
# Option 1: Docker CLI
docker exec -it gigguard_postgres psql -U gigguard -d gigguard_db

# Option 2: pgAdmin UI
# http://localhost:5050
# Email: admin@gigguard.local
# Password: gigguard_dev_password
```

### Run Migrations (Phase 2)

```bash
cd backend
alembic upgrade head
```

### Create New Migration

```bash
alembic revision --autogenerate -m "Add claims table"
alembic upgrade head
```

---

## Testing

### Unit Tests (Backend)

```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app  # With coverage
```

### Integration Tests

```bash
pytest tests/integration/ -v
```

### Mobile Tests

```bash
cd mobile-app
npm test
```

---

## Common Issues & Solutions

### Docker Containers Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose down
docker-compose up --build -d
```

### PostgreSQL Connection Error
```bash
# Check if postgres is running
docker ps | grep postgres

# Restart postgres
docker restart gigguard_postgres
```

### Redis Connection Error
```bash
# Verify Redis is running
docker exec gigguard_redis redis-cli ping
# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

---

## Code Quality Standards

### Backend (Python)
- Follow PEP 8
- Type hints for all functions
- Docstrings for functions and classes
- Tests for all business logic

```bash
# Format code
black backend/
isort backend/

# Lint
flake8 backend/
pylint backend/
```

### Frontend (JavaScript/React)
- Functional components + hooks
- PropTypes or TypeScript
- Meaningful variable names
- 80% test coverage target

```bash
npm run lint
```

---

## Phase 1 Checklist — ✅ COMPLETE

- [x] GitHub repo initialized
- [x] Docker Compose working locally
- [x] Database schema designed
- [x] API specifications documented
- [x] Mobile UI screens created
- [x] Backend skeleton complete
- [x] Basic auth endpoints
- [x] README.md finalized

## Phase 2 Checklist — ✅ COMPLETE

### Backend
- [x] All 40+ API endpoints implemented
- [x] Payment system (mock Razorpay)
- [x] Fraud detection engine (5-rule scoring)
- [x] Dynamic pricing service (zone + seasonal + experience)
- [x] Weather integration service (10+ Indian cities)
- [x] Admin analytics (loss ratio, claims trend, revenue)
- [x] Worker profile + premium quote API
- [x] Claims auto-trigger endpoint
- [x] Fraud score admin override

### Mobile App
- [x] Dashboard with live weather (temp, rain, AQI, disruptions)
- [x] Claims filing with fraud scoring
- [x] Policy management screens
- [x] API integration with all new endpoints

### Admin Dashboard
- [x] Live analytics dashboard (replaced all mock data)
- [x] Revenue summary + loss ratio gauge
- [x] Claims trend area chart
- [x] Claims distribution pie chart
- [x] Loss ratio by zone bar chart
- [x] Analytics page with financial KPIs
- [x] Live weather monitoring (4 cities)
- [x] Fraud score override dialog
- [x] Settings page (DB init/seed)
- [x] PENDING status support in claims management

**Success Criteria:**
- Code runs locally without errors ✅
- Swagger API docs auto-generate ✅
- Mobile app compiles without errors ✅
- Admin dashboard loads with live data ✅
- All 3 AI services (fraud, pricing, weather) operational ✅

---

## Deployment (Phase 3)

### Docker Build

```bash
docker build -t gigguard-backend:latest backend/
docker run -p 8000:8000 gigguard-backend:latest
```

### AWS EC2 Deployment

```bash
# Coming in Phase 3
# Push to ECR
# Deploy on ECS/EKS
```

### Environment Variables

Copy `.env.example` to `.env` and update:
```bash
cp backend/.env.example backend/.env
# Edit with real API keys
```

---

## Learning Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Native Docs](https://reactnative.dev/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)

---

## Team Communication

- **Daily Standup:** 10 AM IST (Slack/Teams)
- **Weekly Planning:** Monday 9 AM
- **Weekly Demo:** Friday 5 PM
- **Slack Channel:** #gigguard-devtrails

---

**Document Updated:** March 25, 2026 (Phase 2 Complete)
