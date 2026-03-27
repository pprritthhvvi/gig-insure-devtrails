"""
Application Configuration Management
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application Settings"""
    
    # Application Info
    APP_NAME: str = "GigGuard"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = "AI-Powered Parametric Insurance Platform for Gig Workers"
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database (Using SQLite for MVP testing)
    DATABASE_URL: str = "sqlite+aiosqlite:///./gigguard.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672//"
    
    # JWT Configuration
    JWT_SECRET: str = "dev_secret_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API Configuration
    API_PREFIX: str = "/api/v1"
    ALLOWED_HOSTS: list = ["*"]
    CORS_ORIGINS: list = ["*"]
    
    # External APIs
    WEATHER_API_KEY: Optional[str] = None
    WEATHER_API_BASE_URL: str = "https://api.openweathermap.org/data/2.5"
    
    # Payment Gateway
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    
    # Twilio SMS
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Firebase Push Notifications
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    
    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: str = "gigguard-dev"
    AWS_REGION: str = "us-east-1"
    
    # Feature Flags
    ENABLE_FRAUD_DETECTION: bool = True
    ENABLE_AUTO_PAYOUT: bool = True
    ENABLE_CLAIMS_AUTO_TRIGGER: bool = True
    ENABLE_PREDICTIVE_ALERTS: bool = False  # Phase 3
    
    # ML Models
    ML_MODEL_PATH: str = "models/"
    FRAUD_SCORE_THRESHOLD: int = 20  # 0-100
    
    # App Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    REQUEST_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()
