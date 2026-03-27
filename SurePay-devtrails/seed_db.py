#!/usr/bin/env python
import asyncio
import sys
from datetime import datetime, timedelta, timezone

# Make sure we're in the right directory
import os
os.chdir('backend')
sys.path.insert(0, '.')

async def main():
    from app.database import AsyncSessionLocal, engine
    from models.worker import Worker
    from models.policy import Policy
    from models.claim import Claim
    from sqlalchemy import delete
    
    async with AsyncSessionLocal() as db:
        try:
            print("Clearing existing data...")
            await db.execute(delete(Claim))
            await db.execute(delete(Policy))
            await db.execute(delete(Worker))
            await db.commit()
            print("✅ Cleared existing data")
            
            # Create demo workers
            workers_data = [
                {"name": "Raj Kumar", "phone": "9876543210", "platform": "Ola", "zone": "Mumbai North"},
                {"name": "Priya Singh", "phone": "9876543211", "platform": "Uber", "zone": "Mumbai Central"},
                {"name": "Amit Patel", "phone": "9876543212", "platform": "Ola", "zone": "Mumbai South"},
                {"name": "Neha Sharma", "phone": "9876543213", "platform": "Uber", "zone": "Bangalore"},
                {"name": "David Jose", "phone": "9876543214", "platform": "Ola", "zone": "Bangalore"},
            ]
            
            print("Creating workers...")
            workers = []
            for w_data in workers_data:
                worker = Worker(
                    name=w_data["name"],
                    phone=w_data["phone"],
                    platform=w_data["platform"],
                    zone=w_data["zone"],
                    risk_score=45.0
                )
                workers.append(worker)
                db.add(worker)
            
            await db.commit()
            print(f"✅ Created {len(workers)} workers")
            
            # Create demo policies
            print("Creating policies...")
            policies = []
            for i, worker in enumerate(workers):
                policy = Policy(
                    worker_id=worker.id,
                    premium_amount=150.0 + (i * 10),
                    coverage_start=datetime.now(timezone.utc).date(),
                    coverage_end=(datetime.now(timezone.utc) + timedelta(days=365)).date(),
                    max_payout_per_week=5000.0,
                    status="ACTIVE"
                )
                policies.append(policy)
                db.add(policy)
            
            await db.commit()
            print(f"✅ Created {len(policies)} policies")
            
            # Create demo claims
            print("Creating claims...")
            claim_statuses = ["PENDING", "APPROVED", "REJECTED", "APPROVED"]
            claim_count = 0
            for i, policy in enumerate(policies):
                for j in range(2):
                    claim = Claim(
                        policy_id=policy.id,
                        disruption_type="RAIN" if j == 0 else "ACCIDENT",
                        triggered_at=datetime.now(timezone.utc) - timedelta(days=j+1),
                        claimed_amount=1200.0 + (j * 500),
                        status=claim_statuses[i % len(claim_statuses)],
                        fraud_score=5 + (i % 10),
                        payout_amount=1200.0 + (j * 500) if claim_statuses[i % len(claim_statuses)] == "APPROVED" else 0,
                        payout_status="PROCESSING" if claim_statuses[i % len(claim_statuses)] == "APPROVED" else "PENDING"
                    )
                    db.add(claim)
                    claim_count += 1
            
            await db.commit()
            print(f"✅ Created {claim_count} claims")
            print("✅ Database seeded successfully!")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
