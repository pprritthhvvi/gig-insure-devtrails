""""
GigGuard Golden Path - Standalone Demo Script
This script simulates the entire flow of the MVP without requiring 
FastAPI or an active server, useful for recording the demo video 
if local environments present dependency issues.
"""
import uuid
import datetime
import json
import random

def print_step(step_num, title):
    print(f"\n{'='*50}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*50}")

def simulate_golden_path():
    print("Welcome to GigGuard - Parametric Insurance for Gig Workers")
    
    # STEP 1: Registration
    print_step(1, "Worker Registration (Raj)")
    worker = {
        "id": str(uuid.uuid4()),
        "name": "Raj Kumar",
        "phone": "+919876543210",
        "platform": "ZOMATO",
        "zone": "Coastal Mumbai",
        "risk_score": 50.0
    }
    print(f"Raj registers on the platform.")
    print(json.dumps(worker, indent=2))
    
    # STEP 2: Policy Creation
    print_step(2, "Generating Weekly Policy")
    print(f"Calculating dynamic premium based on {worker['zone']}...")
    
    policy = {
        "id": str(uuid.uuid4()),
        "worker_id": worker["id"],
        "premium": 150.0,
        "base_premium": 100.0,
        "zone_adjustment": "+50.0 (High Monsoon Risk)",
        "coverage_start": str(datetime.date.today()),
        "coverage_end": str(datetime.date.today() + datetime.timedelta(days=7)),
        "status": "ACTIVE"
    }
    print("Policy Created! Raj pays DC 150 for the week.")
    print(json.dumps(policy, indent=2))

    # STEP 3: The Disruption (Trigger)
    print_step(3, "Disruption Triggered (Heavy Rain)")
    print("WARNING: OpenWeatherMap API reports >25mm rain in Coastal Mumbai.")
    print("Impact: Delivery partners are unable to complete orders safely.")
    
    # STEP 4: Auto Claim
    print_step(4, "Automatic Claim Processing")
    print("System detects Raj's active policy in the affected zone.")
    print("Auto-filing claim... No manual intervention required.")
    
    claim = {
        "id": str(uuid.uuid4()),
        "policy_id": policy["id"],
        "disruption": "HEAVY_RAIN",
        "timestamp": str(datetime.datetime.now()),
        "estimated_hours_lost": 3,
        "calculated_payout": 1200.0  # e.g., 3 hours * avg earnings
    }
    print(json.dumps(claim, indent=2))

    # STEP 5: Fraud Check & Payout
    print_step(5, "Fraud Detection & Instant Payout")
    fraud_score = random.randint(1, 10)
    print(f"Running ML Fraud Check... Score: {fraud_score}/100 (Pass)")
    print("Claim APPROVED.")
    
    payout = {
        "claim_id": claim["id"],
        "amount_transferred": claim["calculated_payout"],
        "status": "SUCCESS",
        "destination": "Raj's UPI Wallet",
        "time_elapsed_since_disruption": "45 seconds"
    }
    print(json.dumps(payout, indent=2))
    print("\nGigGuard Phase 1 Demo Complete! 🚀")

if __name__ == "__main__":
    simulate_golden_path()
