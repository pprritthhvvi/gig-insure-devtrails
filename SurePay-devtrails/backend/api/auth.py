from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
from pydantic import BaseModel

from app.database import get_db
from models.worker import Worker
from schemas.pydantic_models import WorkerCreate, WorkerResponse

router = APIRouter()

# Admin Login Request/Response Models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict

class LoginRequest(BaseModel):
    phone: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# Demo admin credentials (for MVP)
DEMO_ADMIN_EMAIL = "admin@gigguard.io"
DEMO_ADMIN_PASSWORD = "demo123"

# Demo worker credentials
DEMO_PHONE = "9876543210"
DEMO_PASSWORD = "demo123"

@router.post("/login", response_model=LoginResponse)
async def login_worker(request: LoginRequest):
    """
    Worker login endpoint with phone and password
    Demo credentials: 9876543210 / demo123
    """
    if request.phone == DEMO_PHONE and request.password == DEMO_PASSWORD:
        return LoginResponse(
            token="demo-worker-token-" + str(uuid.uuid4()),
            user={
                "id": "worker-001",
                "phone": DEMO_PHONE,
                "name": "Demo Worker",
                "platform": "Zomato",
                "zone": "Mumbai",
                "risk_score": 45.5
            }
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid phone or password"
    )

@router.post("/register", response_model=LoginResponse)
async def register_worker_with_password(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new worker with phone and password
    """
    phone = request.phone
    password = request.password
    
    # Check if worker already exists
    result = await db.execute(select(Worker).where(Worker.phone == phone))
    existing_worker = result.scalars().first()
    
    if existing_worker:
        return LoginResponse(
            token="demo-worker-token-" + str(uuid.uuid4()),
            user={
                "id": str(existing_worker.id),
                "phone": existing_worker.phone,
                "name": existing_worker.name,
                "platform": existing_worker.platform,
                "zone": existing_worker.zone,
                "risk_score": existing_worker.risk_score
            }
        )
    
    # Create new worker
    new_worker = Worker(
        phone=phone,
        name="New User",
        platform="Zomato",
        zone="Mumbai",
        risk_score=50.0
    )
    
    db.add(new_worker)
    await db.commit()
    await db.refresh(new_worker)
    
    return LoginResponse(
        token="demo-worker-token-" + str(uuid.uuid4()),
        user={
            "id": str(new_worker.id),
            "phone": new_worker.phone,
            "name": new_worker.name,
            "platform": new_worker.platform,
            "zone": new_worker.zone,
            "risk_score": new_worker.risk_score
        }
    )

@router.post("/admin-login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """
    Admin login endpoint
    Demo credentials: admin@gigguard.io / demo123
    """
    if request.email == DEMO_ADMIN_EMAIL and request.password == DEMO_ADMIN_PASSWORD:
        return AdminLoginResponse(
            access_token="demo-admin-token-" + str(uuid.uuid4()),
            admin={
                "id": "admin-001",
                "email": DEMO_ADMIN_EMAIL,
                "name": "Admin User",
                "role": "admin"
            }
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

@router.post("/register-full", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def register_worker(worker_data: WorkerCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new worker with full profile details. 
    """
    
    # Check if worker already exists (by phone)
    result = await db.execute(select(Worker).where(Worker.phone == worker_data.phone))
    existing_worker = result.scalars().first()
    
    if existing_worker:
        # Instead of failing, just return the existing worker for ease of demoing
        return existing_worker

    # Create new worker
    new_worker = Worker(
        phone=worker_data.phone,
        name=worker_data.name,
        platform=worker_data.platform,
        zone=worker_data.zone,
        risk_score=50.0  # Base line
    )
    
    db.add(new_worker)
    await db.commit()
    await db.refresh(new_worker)
    
    return new_worker

@router.get("/me/{worker_id}", response_model=WorkerResponse)
async def get_worker(worker_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get worker profile"""
    result = await db.execute(select(Worker).where(Worker.id == worker_id))
    worker = result.scalars().first()
    
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
        
    return worker