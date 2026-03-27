#!/usr/bin/env python
import asyncio
import sys
sys.path.insert(0, 'backend')

async def main():
    from app.database import init_db, engine
    from app.database import Base
    from models.worker import Worker
    from models.policy import Policy
    from models.claim import Claim
    
    print("Creating database tables...")
    await init_db()
    print("✅ Database initialization complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
