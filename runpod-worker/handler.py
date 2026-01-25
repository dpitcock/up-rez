import runpod
import json

import os
import pandas as pd

# Path to bundled data
DATA_PATH = "/app/data/historical_offer_success.csv"

def score_guest_fit(job):
    """
    Analyzes guest propensity by cross-referencing real-time behavior 
    with bundled historical performance data.
    """
    job_input = job["input"]
    guest = job_input.get("guest", {})
    property = job_input.get("property", {})
    
    # Base configuration
    is_luxury = guest.get("is_luxury_loyalty", False)
    budget = property.get("current_adr", 0)
    category = property.get("category", "mid") # Assumed fallback
    
    # 1. Load and Analyze Historical Data
    history_multiplier = 1.0
    if os.path.exists(DATA_PATH):
        try:
            df = pd.read_csv(DATA_PATH)
            # Find historical success rate for this tier transition
            # E.g. budget -> premium
            mask = (df['budget_tier'] == 'budget') & (df['upgrade_tier'] == category)
            if mask.any():
                success_rate = df[mask]['was_accepted'].mean()
                history_multiplier = 0.5 + success_rate # Scale multiplier [0.5 to 1.5]
        except Exception as e:
            print(f"⚠️ History lookup failed: {e}")

    # 2. Logic-Based Propensity (Aggregated with Data)
    base_score = 0.4
    if is_luxury: base_score += 0.3
    if budget > 300: base_score += 0.2
    
    # Amplify by historical patterns
    final_score = min(base_score * history_multiplier, 1.0)
        
    motives = []
    if is_luxury: motives.append("Luxury Experience Seeker")
    if history_multiplier > 1.2: motives.append("High-Conversion Segment")
    
    strategy = "Conservative"
    if final_score > 0.8:
        strategy = "Aggressive Upsell"
    elif final_score > 0.6:
        strategy = "Personalized Touch"

    return {
        "propensity_score": float(round(final_score, 2)),
        "key_motivators": motives,
        "recommended_offer_style": strategy,
        "worker_node": "runpod-gpu-vllm-01",
        "data_ingested": os.path.exists(DATA_PATH)
    }

runpod.serverless.start({"handler": score_guest_fit})
