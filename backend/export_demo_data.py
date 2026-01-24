import sqlite3
import json
import os
from pathlib import Path

def export_db_to_json(write_to_file=True):
    # Paths
    backend_dir = Path(__file__).parent
    db_path = backend_dir / "UpRez.db"
    output_path = backend_dir / ".." / "frontend" / "public" / "demo-data.json"
    
    if not db_path.exists():
        print(f"Error: Database {db_path} not found.")
        return

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    data = {
        "properties": [],
        "host_settings": {},
        "offers": {},
        "bookings": []
    }

    # 1. Properties
    cursor.execute("SELECT * FROM properties")
    data["properties"] = [dict(row) for row in cursor.fetchall()]

    # 2. Host Settings (Demo Host)
    cursor.execute("SELECT * FROM host_settings WHERE host_id = 'demo_host_001'")
    row = cursor.fetchone()
    if row:
        data["host_settings"] = dict(row)

    # 3. Bookings
    cursor.execute("SELECT * FROM bookings")
    data["bookings"] = [dict(row) for row in cursor.fetchall()]

    # 4. Offers (Expanded with original logic from routers/offers.py)
    cursor.execute("SELECT * FROM offers")
    offers_rows = cursor.fetchall()
    
    for o_row in offers_rows:
        offer = dict(o_row)
        offer_id = offer["id"]
        
        # We need to pre-build the object that /api/offer/{id} would return
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (offer["booking_id"],))
        b_row = cursor.fetchone()
        if not b_row: continue
        booking = dict(b_row)
        
        cursor.execute("SELECT * FROM properties WHERE id = ?", (booking["prop_id"],))
        p_row = cursor.fetchone()
        if not p_row: continue
        original_prop = dict(p_row)
        
        try:
            top3 = json.loads(offer["top3"])
        except:
            top3 = []
            
        data["offers"][offer_id] = {
            "offer_id": offer["id"],
            "booking_id": booking["id"],
            "status": offer["status"],
            "expires_at": offer["expires_at"],
            "regen_count": offer.get("regen_count", 0),
            "host_info": {
                "name": data["host_settings"].get("host_name", "Your Host"),
                "pm_name": data["host_settings"].get("pm_company_name", "@luxury_stays"),
                "phone": data["host_settings"].get("host_phone", "")
            },
            "original_booking": {
                "arrival_date": booking["arrival_date"],
                "departure_date": booking["departure_date"],
                "nights": booking["nights"],
                "adults": booking["adults"],
                "children": booking["children"],
                "prop_name": original_prop["name"],
                "guest_name": booking["guest_name"],
                "current_adr": booking["base_nightly_rate"],
                "current_total": booking["total_paid"]
            },
            "options": top3
        }

    if not write_to_file:
        return data

    # Write JSON
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"✓ Exported demo data to {output_path}")
    return data

if __name__ == "__main__":
    export_db_to_json()
