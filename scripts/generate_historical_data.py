import json
import random
import csv
import uuid
import secrets
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
OUTPUT_FILE = Path("initial_data/offer_option_history.csv")
PROPERTIES_FILE = Path("initial_data/properties.json")
TOTAL_ROWS = 10000

# Funnel Probabilities
BASE_OPEN_RATE = 0.45
BASE_CLICK_RATE = 0.15
BASE_EXPIRATION_RATE = 0.05  # 5% chance the offer expires due to conflict

def load_properties():
    with open(PROPERTIES_FILE, "r") as f:
        props = json.load(f)
    # Filter only listable properties if needed, for now use all
    return props

def simplified_score(candidate, original):
    """
    Simplified version of backend scoring logic to determine base attractiveness.
    Returns 0.0 to 1.0 likelihood multiplier.
    """
    score = 0.05  # Base probability
    
    # Boosters
    if candidate["beds"] > original["beds"]:
        score += 0.04
    if candidate.get("pool") and not original.get("pool"):
        score += 0.05
    
    # Penalties
    price_ratio = candidate["price"] / max(original["price"], 1)
    if price_ratio > 1.8:
        score -= 0.04
    
    return max(0.01, min(0.30, score))  # Cap booking prob between 1% and 30%

def generate_row(offer_id, offer_type, original_prop, candidate_prop, booking_context, is_fallback=False):
    # 1. Determine Offer Economics
    # Random discount between 20% and 50%
    discount_pct = random.uniform(0.20, 0.50)
    original_adr = original_prop["price"]
    upgrade_list_adr = candidate_prop["price"]
    
    # Apply discount logic: (List - Original) * (1 - Discount) + Original
    diff = upgrade_list_adr - original_adr
    if diff < 0: diff = 0 # Should count filter these out usually
    upgrade_offer_price = original_adr + (diff * (1 - discount_pct))
    
    revenue_lift = upgrade_offer_price - original_adr
    
    # 2. Simulate User Behavior
    # Did they open?
    is_opened = random.random() < BASE_OPEN_RATE
    is_clicked = False
    is_booked = False
    is_expired = False
    
    # Expiration logic
    expiration_reason = None
    
    if not is_fallback and random.random() < BASE_EXPIRATION_RATE:
        is_expired = True
        status = "expired"
        
        # Determine specific reason
        rand_reason = random.random()
        if rand_reason < 0.4:
            expiration_reason = "target-property-booked"
        elif rand_reason < 0.7:
            expiration_reason = "time-expired"
        elif rand_reason < 0.9:
            expiration_reason = "reservation-started"
        else:
            expiration_reason = "reservation-cancelled"
            
    else:
        # Standard flow
        if is_opened:
            if random.random() < BASE_CLICK_RATE:
                is_clicked = True
                # Booking probability based on value score
                prob_book = simplified_score(candidate_prop, original_prop)
                
                # Boost prob if discount is high
                if discount_pct > 0.4: prob_book += 0.05
                
                if random.random() < prob_book:
                    is_booked = True
                    status = "purchased"
                else:
                    status = "clicked" # Clicked but didn't buy
            else:
                status = "opened" # Opened but didn't click
        else:
            status = "ignored"

    # If it expired, override status for tracking
    if is_expired:
        status = "expired"

    # 3. Construct Row
    return {
        "offer_id": offer_id,
        "offer_type": offer_type, # "original" or "fallback"
        "status": status,         # ignored, opened, clicked, purchased, expired
        "expiration_reason": expiration_reason, # New column
        "prop_id_original": original_prop["id"],
        "prop_id_upgrade": candidate_prop["id"],
        
        # Economics
        "original_adr": round(original_adr, 2),
        "upgrade_list_adr": round(upgrade_list_adr, 2),
        "offer_adr": round(upgrade_offer_price, 2),
        "discount_pct": round(discount_pct, 2),
        "revenue_lift": round(revenue_lift, 2),
        
        # Guest Context
        "guest_adults": booking_context["adults"],
        "stay_nights": booking_context["nights"],
        "days_to_arrival": booking_context["days_to_arrival"],
        
        # Outcomes (Binary flags for regression training)
        "email_opened": 1 if is_opened or is_expired else 0, # Assuming they saw it if expired later
        "email_clicked": 1 if is_clicked else 0,
        "offer_booked": 1 if is_booked else 0,
        "offer_expired": 1 if is_expired else 0
    }

def main():
    print(f"🚀 Generating {TOTAL_ROWS} historical offer records...")
    
    properties = load_properties()
    if len(properties) < 2:
        print("❌ Not enough properties to generate upgrades.")
        return

    data_rows = []
    
    # We generate "Events" rather than just rows.
    # An event might spawn a fallback.
    
    while len(data_rows) < TOTAL_ROWS:
        # 1. Pick a random "Original Booking"
        orig_prop = random.choice(properties)
        
        # 2. Pick a valid Upgrade Candidate (must be more expensive)
        candidates = [p for p in properties if p["price"] > orig_prop["price"]]
        if not candidates:
            continue # Try again
        cand_prop = random.choice(candidates)
        
        # 3. Booking Context
        ctx = {
            "adults": random.randint(1, 4),
            "nights": random.randint(2, 14),
            "days_to_arrival": random.randint(1, 60)
        }
        
        # 4. Generate Original Offer
        offer_id = f"hist_{secrets.token_hex(6)}"
        row = generate_row(offer_id, "original", orig_prop, cand_prop, ctx)
        data_rows.append(row)
        
        # 5. Handle Fallback Scenario
        if row["status"] == "expired":
            # If original expired, system sends a fallback offer
            # Pick a DIFFERENT candidate if possible
            fallback_candidates = [p for p in candidates if p["id"] != cand_prop["id"]]
            if fallback_candidates:
                fallback_cand = random.choice(fallback_candidates)
                fallback_id = f"hist_{secrets.token_hex(6)}"
                
                # Fallbacks rarely expire (system checks real-time)
                fallback_row = generate_row(fallback_id, "fallback", orig_prop, fallback_cand, ctx, is_fallback=True)
                data_rows.append(fallback_row)

    # Convert to CSV
    if data_rows:
        keys = data_rows[0].keys()
        with open(OUTPUT_FILE, "w", newline='') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(data_rows)
            
        print(f"✅ Automatically generated {len(data_rows)} rows.")
        print(f"💾 Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
