import sqlite3
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

# Config
DB_PATH = Path(__file__).parent.parent / "UpRez.db"
DEMO_HOST_ID = "demo_host_001"

def reset_demo():
    print(f"🔄 Resetting demo data for {DEMO_HOST_ID}...")
    
    if not DB_PATH.exists():
        print(f"❌ DB {DB_PATH} not found. Running seed.py for full setup...")
        subprocess.run(["python3", "backend/seed.py"], check=True)
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 1. Clear offers linked to demo host bookings
        cursor.execute("""
            DELETE FROM offers 
            WHERE booking_id IN (SELECT id FROM bookings WHERE host_id = ?)
        """, (DEMO_HOST_ID,))
        print(f"✓ Cleared {cursor.rowcount} offers.")
        
        # 2. Clear bookings for demo host
        cursor.execute("DELETE FROM bookings WHERE host_id = ?", (DEMO_HOST_ID,))
        print(f"✓ Cleared {cursor.rowcount} bookings.")
        
        # 3. Clear host settings for demo host
        cursor.execute("DELETE FROM host_settings WHERE host_id = ?", (DEMO_HOST_ID,))
        print("✓ Cleared host settings.")
        
        # 4. Clear offer history if table exists (optional based on future schemas)
        # cursor.execute("DELETE FROM offer_option_history WHERE host_id = ?", (DEMO_HOST_ID,))
        
        conn.commit()
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        conn.rollback()
    finally:
        conn.close()

    # 5. Re-seed pristine data
    # (Reusing seed.py logic by calling it via subprocess or importing)
    # Since seed.py --demo-only is requested, but seed.py doesn't have it yet, 
    # I will just run the full seed for now or implement the demo reseeding logic here.
    
    print("🌱 Re-seeding pristine data...")
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    import seed
    
    # Run full seed to ensure schema is fresh
    seed.main()
    print("✓ Full seeding complete.")

    print(f"✅ Demo reset complete at {datetime.now().strftime('%H:%M:%S')}")
    print("👉 Run 'python scripts/normalize_demo_dates.py --apply' to prepare dates.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Force reset")
    args = parser.parse_args()
    
    reset_demo()
