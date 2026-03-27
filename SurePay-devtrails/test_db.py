#!/usr/bin/env python
"""Test script to verify database setup"""
import asyncio
import sys
import os

# Change to backend directory
os.chdir('backend')
sys.path.insert(0, '.')

async def test_db():
    from app.database import engine, Base
    from models.worker import Worker
    from models.policy import Policy
    from models.claim import Claim
    
    print("Testing database setup...")
    print(f"Engine URL: {engine.url}")
    
    try:
        print("\n1. Creating tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("   ✅ Tables created")
        
        print("\n2. Testing connection...")
        from sqlalchemy import text
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT sqlite_version()"))
            version = result.scalar()
            print(f"   ✅ SQLite version: {version}")
        
        print("\n3. Checking tables...")
        from sqlalchemy import inspect
        async with engine.begin() as conn:
            def get_table_names(conn):
                inspector = inspect(conn)
                return inspector.get_table_names()
            tables = await conn.run_sync(get_table_names)
            print(f"   Tables: {tables}")
            
        print("\n4. Creating test data...")
        from app.database import AsyncSessionLocal
        from datetime import datetime, timezone, timedelta
        
        async with AsyncSessionLocal() as db:
            worker = Worker(
                name="Test Worker",
                phone="1234567890",
                platform="Ola",
                zone="Test Zone",
                risk_score=45.0
            )
            db.add(worker)
            await db.commit()
            print("   ✅ Test worker created")
            
            # Query back
            from sqlalchemy.future import select
            result = await db.execute(select(Worker))
            workers = result.scalars().all()
            print(f"   ✅ Found {len(workers)} workers")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db())
