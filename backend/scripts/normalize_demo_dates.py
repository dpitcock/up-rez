import sqlite3
import json
import random
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Config
DB_PATH = Path(__file__).parent.parent / "UpRez.db"
AUDIT_LOG = Path(__file__).parent.parent / "data" / "audit_log.json"
DEMO_HOST_ID = "demo_host_001"

TARGET_DAYS_TO_ARRIVAL = {
    7: 0.30,   # Prime cron window
    4: 0.20,   # Last-minute
    12: 0.20,  # Early window
    25: 0.15,  # Future
    1: 0.15    # Too late
}

CANCELLATION_PAIRS = [
    ("prop_8b867z", "prop_xsf7c1"),  # Mid-Tier Villa -> Budget Beach Apt
    ("prop_wd9nox", "prop_odd9x1"),  # Lux Beach House -> Family 2BR
    ("prop_ohkebg", "prop_3nrojh"),  # Golf Villa -> City Studio
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def normalize_dates(apply=False):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Fetch regular bookings for demo host
    cursor.execute("SELECT * FROM bookings WHERE host_id = ?", (DEMO_HOST_ID,))
    bookings = cursor.fetchall()
    
    logs = []
    today = datetime.utcnow().replace(hour=15, minute=0, second=0, microsecond=0)
    
    print(f"Normalizing {len(bookings)} bookings...")
    
    for row in bookings:
        # Sample target days based on distribution
        days = random.choices(list(TARGET_DAYS_TO_ARRIVAL.keys()), 
                              weights=list(TARGET_DAYS_TO_ARRIVAL.values()))[0]
        
        nights = row["nights"]
        new_arrival = today + timedelta(days=days)
        new_departure = new_arrival + timedelta(days=nights)
        
        arrival_str = new_arrival.strftime("%Y-%m-%d")
        departure_str = new_departure.strftime("%Y-%m-%d")
        
        if apply:
            cursor.execute("""
                UPDATE bookings 
                SET arrival_date = ?, departure_date = ?, updated_at = ?
                WHERE id = ?
            """, (arrival_str, departure_str, datetime.utcnow().isoformat() + "Z", row["id"]))
        
        logs.append({
            "type": "booking_normalized",
            "booking_id": row["id"],
            "old_arrival": row["arrival_date"],
            "new_arrival": arrival_str,
            "days_to_arrival": days
        })
        
    # 2. Setup Cancellation Scenarios
    print("Setting up cancellation scenarios...")
    for premium_id, budget_id in CANCELLATION_PAIRS:
        # We need to create/update two overlapping bookings
        # Budget booking at 7 days
        arrival = today + timedelta(days=7)
        departure = arrival + timedelta(days=7)
        
        arr_str = arrival.strftime("%Y-%m-%d")
        dep_str = departure.strftime("%Y-%m-%d")
        
        # Budget Guest
        budget_booking_id = f"demo_budget_{budget_id[:8]}"
        if apply:
            cursor.execute("""
                INSERT OR REPLACE INTO bookings 
                (id, host_id, prop_id, guest_name, guest_email, arrival_date, departure_date, 
                 nights, adults, children, base_nightly_rate, total_paid, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT list_nightly_rate FROM properties WHERE id=?), ?, 'confirmed', ?)
            """, (
                budget_booking_id, DEMO_HOST_ID, budget_id, "Budget Demo Guest",
                f"dpitcock.dev+budget_{budget_id[5:]}@gmail.com", arr_str, dep_str,
                7, 2, 0, budget_id, 150*7, datetime.utcnow().isoformat() + "Z"
            ))
            
        # Premium Guest (Overlapping)
        premium_booking_id = f"demo_prem_{premium_id[:8]}"
        if apply:
            cursor.execute("""
                INSERT OR REPLACE INTO bookings 
                (id, host_id, prop_id, guest_name, guest_email, arrival_date, departure_date, 
                 nights, adults, children, base_nightly_rate, total_paid, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT list_nightly_rate FROM properties WHERE id=?), ?, 'confirmed', ?)
            """, (
                premium_booking_id, DEMO_HOST_ID, premium_id, "Premium Demo Guest",
                f"dpitcock.dev+prem_{premium_id[5:]}@gmail.com", arr_str, dep_str,
                7, 4, 0, premium_id, 400*7, datetime.utcnow().isoformat() + "Z"
            ))

        logs.append({
            "type": "cancellation_prepared",
            "premium_prop": premium_id,
            "budget_prop": budget_id,
            "dates": f"{arr_str} to {dep_str}"
        })

    if apply:
        conn.commit()
        print("✓ Changes applied to database.")
    else:
        print("! Dry run: no changes applied.")

    # Save logs
    with open(AUDIT_LOG, "w") as f:
        json.dump(logs, f, indent=2)
    print(f"💾 Audit log saved to {AUDIT_LOG}")
    
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to DB")
    args = parser.parse_args()
    
    normalize_dates(apply=args.apply)
