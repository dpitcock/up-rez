# UpRez Data Contract & Seed Doc

***

## 1. SQLite Schema Overview

All data lives in a single SQLite database (`UpRez.db`).

Use a shortened UUID for ids for hosts, properties, bookings and offers

### Tables

```
bookings           – Guest reservations
properties         – Rental unit inventory
offers             – Generated upgrade offers
offer_candidates   – Intermediate scoring results (optional, for debugging)
host_settigns      - Sets guardrails to avoid crazy deals
```

***

## 2. Table: `bookings`

Represents a guest's reservation.

### Schema

```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Core reservation
  prop_id INTEGER NOT NULL,
  arrival_date TEXT NOT NULL,  -- ISO8601 "2026-06-10"
  departure_date TEXT NOT NULL,  -- ISO8601 "2026-06-17"
  nights INTEGER NOT NULL,
  
  -- Guest demographics
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_country TEXT,  -- ISO 3166-1 alpha-2, e.g. "DE"
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  infants INTEGER NOT NULL DEFAULT 0,
  has_car INTEGER NOT NULL DEFAULT 0,  -- 0=false, 1=true
  
  -- Pricing
  rate_code TEXT,  -- "FLEX", "EARLY_BIRD", "LAST_MINUTE", etc.
  base_nightly_rate REAL NOT NULL,  -- EUR, e.g. 150.00
  total_paid REAL NOT NULL,  -- EUR, sum of all nights
  
  -- Metadata
  channel TEXT,  -- "airbnb", "booking.com", "direct", etc.
  created_at TEXT NOT NULL,  -- ISO8601 timestamp
  updated_at TEXT
);
```

### Key constraints

- `prop_id` must exist in `properties` table.
- `nights = (departure_date - arrival_date).days`
- `total_paid >= base_nightly_rate * nights` (can include fees, taxes)
- `guest_email` is unique or at least used as contact method
- Dates are ISO8601 strings for simplicity (in production, use DATE type)

### Example rows

```sql
INSERT INTO bookings 
(prop_id, arrival_date, departure_date, nights, guest_name, guest_email, 
 guest_country, adults, children, infants, has_car, 
 rate_code, base_nightly_rate, total_paid, channel, created_at)
VALUES
  (1, "2026-06-10", "2026-06-17", 7, "Alice Weber", "alice.weber@example.com", 
   "DE", 2, 0, 0, 0, "FLEX", 150.00, 1170.00, "airbnb", "2026-05-01T14:30:00Z"),
  
  (2, "2026-06-12", "2026-06-19", 7, "James Collins", "james.collins@example.com", 
   "GB", 2, 2, 0, 1, "EARLY_BIRD", 145.00, 1015.00, "booking.com", "2026-04-20T09:15:00Z"),
  
  (1, "2026-06-20", "2026-06-27", 7, "Sofia García", "sofia.garcia@example.com", 
   "ES", 1, 0, 0, 1, "LAST_MINUTE", 130.00, 910.00, "direct", "2026-06-05T16:45:00Z"),
  
  (6, "2026-07-01", "2026-07-08", 7, "Raj Patel", "raj.patel@example.com", 
   "IN", 2, 0, 0, 0, "FLEX", 120.00, 840.00, "airbnb", "2026-05-15T11:20:00Z");
```

***

## 3. Table: `properties`

Represents a vacation rental unit.

### Schema

```sql
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Basic info
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,  -- "Palma", "Son Vida", "Cala Major", etc.
  
  -- Capacity
  beds INTEGER NOT NULL,
  baths INTEGER NOT NULL,
  
  -- Pricing (for offer calculation)
  list_nightly_rate REAL NOT NULL,  -- EUR, the "rack rate" or ADR
  
  -- Amenities (JSON array)
  amenities TEXT NOT NULL,  -- JSON: ["wifi", "ac", "pool", "parking", "elevator", ...]
  
  -- Metadata (JSON object with optional details)
  metadata TEXT,  -- JSON: {"wifi_speed": "good 100mbps", "noise_level": "quiet", ...}
  
  -- Images (JSON array of filenames/URLs)
  images TEXT,  -- JSON: ["exterior.jpg", "living-room.jpg", "pool.jpg", ...]
  
  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT
);
```

### Key constraints

- `name` is unique (used as human-readable identifier in offers).
- `beds`, `baths` >= 1.
- `list_nightly_rate` > 0 (in EUR).
- `amenities` is a JSON array of strings (lowercase, underscore-separated).
- `metadata` is optional JSON object with string keys and mixed values.
- `images` is optional JSON array of filenames (can be relative paths for demo, full URLs in production).

### Standard amenities set

```
wifi, ac, heating, pool, parking, washer, dryer, dishwasher, 
elevator, balcony, garden, terrace, kitchen, bathroom, 
kids_allowed, pets_allowed, wheelchair_accessible, workspace
```

(Not all properties have all amenities; this is just the canonical list.)

### Example `amenities` JSON

```json
["wifi", "ac", "parking", "washer", "workspace"]
```

### Example `metadata` JSON

```json
{
  "wifi_speed": "good 100mbps",
  "noise_level": "quiet",
  "distance_to_beach_m": 150,
  "age_years": 3,
  "kids_suitability": "great",
  "parking_type": "underground",
  "outdoor_space": "balcony_with_view",
  "elevator": true,
  "pet_policy": "no_pets"
}
```

### Example rows

```sql
INSERT INTO properties 
(name, location, beds, baths, list_nightly_rate, amenities, metadata, images, created_at)
VALUES
  (1, "Budget Beach Apt", "Palma", 1, 1, 150.00,
   '["wifi","ac","balcony"]',
   '{"wifi_speed":"basic 30mbps","noise_level":"moderate","distance_to_beach_m":250,"age_years":8}',
   '["budget-beach-apt-exterior.jpg","budget-beach-apt-living.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (2, "City Studio", "Palma", 1, 1, 140.00,
   '["wifi","ac","workspace","ac"]',
   '{"wifi_speed":"excellent 200mbps","noise_level":"busy","distance_to_beach_m":800,"age_years":2}',
   '["city-studio-desk.jpg","city-studio-balcony.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (3, "Family 2BR Apt", "Palma", 2, 1, 220.00,
   '["wifi","ac","parking","washer","balcony","kids_allowed"]',
   '{"wifi_speed":"good 100mbps","noise_level":"quiet","distance_to_beach_m":200,"age_years":5,"kids_suitability":"great","parking_type":"underground"}',
   '["family-2br-apt-exterior.jpg","family-2br-apt-living.jpg","family-2br-apt-bedroom.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (4, "Mid-Tier Villa", "Son Vida", 3, 2, 350.00,
   '["wifi","ac","pool","parking","washer","elevator","garden","workspace","ac"]',
   '{"wifi_speed":"good 100mbps","noise_level":"quiet","distance_to_beach_m":2000,"age_years":4,"kids_suitability":"great","parking_type":"driveway","outdoor_space":"pool_and_garden","elevator":true}',
   '["mid-tier-villa-exterior.jpg","mid-tier-villa-pool.jpg","mid-tier-villa-living.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (5, "Golf Villa", "Son Vida", 4, 3, 450.00,
   '["wifi","ac","pool","parking","washer","dryer","elevator","garden","workspace"]',
   '{"wifi_speed":"excellent 200mbps","noise_level":"very_quiet","distance_to_beach_m":3000,"age_years":2,"kids_suitability":"excellent","parking_type":"driveway","outdoor_space":"pool_garden_terrace","elevator":true}',
   '["golf-villa-exterior.jpg","golf-villa-pool.jpg","golf-villa-golf-course.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (6, "Poolside Apt", "Cala Major", 2, 2, 250.00,
   '["wifi","ac","pool","parking","balcony","kids_allowed"]',
   '{"wifi_speed":"good 100mbps","noise_level":"moderate","distance_to_beach_m":100,"age_years":6,"kids_suitability":"good","parking_type":"on_street"}',
   '["poolside-apt-exterior.jpg","poolside-apt-pool.jpg","poolside-apt-terrace.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (7, "Lux Beach House", "Cala Major", 4, 3, 550.00,
   '["wifi","ac","pool","parking","washer","dryer","elevator","garden","workspace","pets_allowed"]',
   '{"wifi_speed":"excellent 200mbps","noise_level":"very_quiet","distance_to_beach_m":50,"age_years":1,"kids_suitability":"excellent","parking_type":"driveway","outdoor_space":"pool_garden_direct_beach_access","elevator":true}',
   '["lux-beach-house-exterior.jpg","lux-beach-house-pool.jpg","lux-beach-house-beach-access.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (8, "Seafront 2BR", "Palma", 2, 1, 280.00,
   '["wifi","ac","parking","balcony","workspace"]',
   '{"wifi_speed":"good 100mbps","noise_level":"quiet","distance_to_beach_m":50,"age_years":3,"kids_suitability":"good","parking_type":"on_street"}',
   '["seafront-2br-exterior.jpg","seafront-2br-sea-view.jpg"]',
   "2026-01-01T00:00:00Z"),
   
  (9, "Garden Villa", "Son Vida", 3, 2, 320.00,
   '["wifi","ac","pool","parking","garden","washer","workspace"]',
   '{"wifi_speed":"good 100mbps","noise_level":"quiet","distance_to_beach_m":1500,"age_years":5,"kids_suitability":"great","parking_type":"driveway","outdoor_space":"pool_and_garden"}',
   '["garden-villa-exterior.jpg","garden-villa-pool.jpg","garden-villa-garden.jpg"]',
   "2026-01-01T00:00:00Z");
```

***

## 4. Table: `offers`

Represents a generated upgrade offer sent (or about to be sent) to a guest.

### Schema

```sql
CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Link to booking
  booking_id INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  
  -- Offer state
  status TEXT NOT NULL DEFAULT "active",  -- "active", "partial", "expired", "completed"
  
  -- Top 3 upgrade options (JSON array, see structure below)
  top3 TEXT NOT NULL,  -- JSON array of candidate objects
  
  -- Expiry
  expires_at TEXT NOT NULL,  -- ISO8601, typically now + 48 hours
  
  -- Regen tracking
  regen_count INTEGER NOT NULL DEFAULT 0,
  
  -- Generated copy (for audit / reuse)
  email_subject TEXT,
  email_body_html TEXT,
  
  -- Email delivery state (optional, for tracking)
  email_sent_at TEXT,
  email_sent_to TEXT,
  email_opened_at TEXT,
  email_clicked_at TEXT,
  
  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT
);
```

### Key constraints

- `booking_id` must exist and be unique (one offer per booking).
- `status`: `"active"` means offer is live and valid; `"partial"` means some options became unavailable; `"expired"` means expires_at has passed.
- `top3` is a JSON array with structure (see below).
- `expires_at` is typically `now() + 48 hours`.

### Structure of `top3` JSON

Each candidate in the array:

```json
{
  "ranking": 1,
  "prop_id": 3,
  "prop_name": "Family 2BR Apt",
  "viability_score": 8.5,
  "pricing": {
    "from_adr": 150.0,
    "to_adr_list": 220.0,
    "offer_adr": 192.0,
    "offer_total": 1344.0,
    "list_total": 1540.0,
    "discount_percent": 0.4,
    "discount_amount_total": 196.0,
    "revenue_lift": 174.0
  },
  "diffs": [
    "+1 extra bedroom (3 beds vs 1)",
    "Includes underground parking",
    "Closer to Palma harbour and park"
  ],
  "headline": "More space for your beach week",
  "summary": "Extra bedroom, underground parking, and a balcony with sea and city glimpses.",
  "images": [
    "family-2br-apt-exterior.jpg",
    "family-2br-apt-living-room.jpg"
  ],
  "availability": {
    "available": true,
    "reason": null
  }
}
```

### Example row

```sql
INSERT INTO offers 
(booking_id, status, top3, expires_at, regen_count, 
 email_subject, email_body_html, email_sent_at, email_sent_to, created_at)
VALUES
  (1, "active",
   '[
      {
        "ranking": 1,
        "prop_id": 3,
        "prop_name": "Family 2BR Apt",
        "viability_score": 8.5,
        "pricing": {
          "from_adr": 150.0,
          "to_adr_list": 220.0,
          "offer_adr": 192.0,
          "offer_total": 1344.0,
          "list_total": 1540.0,
          "discount_percent": 0.4,
          "discount_amount_total": 196.0,
          "revenue_lift": 174.0
        },
        "diffs": ["+1 extra bedroom", "+parking", "+sea view"],
        "headline": "More space for your beach week",
        "summary": "Extra bedroom, underground parking, and a balcony.",
        "images": ["family-2br-apt-exterior.jpg"],
        "availability": {"available": true, "reason": null}
      }
    ]',
   "2026-06-08T10:30:00Z",
   0,
   "Alice, upgrade to Family 2BR (+1 bed +parking, save 280€)",
   "<h1>Exclusive Upgrade</h1>...",
   "2026-06-06T08:00:00Z",
   "alice.weber@example.com",
   "2026-06-06T08:00:00Z");
```

***

## 5. Table: `offer_candidates` (Optional, for debugging)

If you want to log intermediate scoring for analysis / debugging:

### Schema

```sql
CREATE TABLE offer_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  offer_id INTEGER NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offers(id),
  
  from_prop_id INTEGER NOT NULL,
  to_prop_id INTEGER NOT NULL,
  
  viability_score REAL NOT NULL,
  ranking INTEGER,  -- 1, 2, 3, or NULL if filtered out
  
  score_components TEXT,  -- JSON: {"capacity": 3, "amenities": 2, ...}
  
  created_at TEXT NOT NULL
);
```

Use this if you want to store the intermediate scoring details for each candidate during classification.

***

## 6. Seed Script: `seed.py`

A Python script that populates the database from JSON files.

### Directory structure

```
UpRez/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── seed.py              ← This script
│   ├── data/
│   │   ├── properties.json
│   │   └── bookings.json
│   └── UpRez.db           ← Created by seed.py
```

### `seed.py`

```python
#!/usr/bin/env python3
"""
Seed script for UpRez SQLite database.
Run: python seed.py
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = "UpRez.db"
DATA_DIR = Path(__file__).parent / "data"

def create_schema(conn):
    """Create all tables."""
    cursor = conn.cursor()
    
    # bookings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prop_id INTEGER NOT NULL,
        arrival_date TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        nights INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_country TEXT,
        adults INTEGER NOT NULL DEFAULT 2,
        children INTEGER NOT NULL DEFAULT 0,
        infants INTEGER NOT NULL DEFAULT 0,
        has_car INTEGER NOT NULL DEFAULT 0,
        rate_code TEXT,
        base_nightly_rate REAL NOT NULL,
        total_paid REAL NOT NULL,
        channel TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
    )
    """)
    
    # properties
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        beds INTEGER NOT NULL,
        baths INTEGER NOT NULL,
        list_nightly_rate REAL NOT NULL,
        amenities TEXT NOT NULL,
        metadata TEXT,
        images TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
    )
    """)
    
    # offers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT "active",
        top3 TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        regen_count INTEGER NOT NULL DEFAULT 0,
        email_subject TEXT,
        email_body_html TEXT,
        email_sent_at TEXT,
        email_sent_to TEXT,
        email_opened_at TEXT,
        email_clicked_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
    """)
    
    # offer_candidates (optional)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offer_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_id INTEGER NOT NULL,
        from_prop_id INTEGER NOT NULL,
        to_prop_id INTEGER NOT NULL,
        viability_score REAL NOT NULL,
        ranking INTEGER,
        score_components TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (offer_id) REFERENCES offers(id)
    )
    """)
    
    conn.commit()
    print("✓ Schema created.")

def load_properties(conn):
    """Load properties from properties.json."""
    properties_file = DATA_DIR / "properties.json"
    
    with open(properties_file, "r") as f:
        properties = json.load(f)
    
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    for prop in properties:
        cursor.execute("""
        INSERT INTO properties 
        (name, location, beds, baths, list_nightly_rate, 
         amenities, metadata, images, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prop["name"],
            prop["location"],
            prop["beds"],
            prop["baths"],
            prop["list_nightly_rate"],
            json.dumps(prop["amenities"]),
            json.dumps(prop.get("metadata", {})),
            json.dumps(prop.get("images", [])),
            now
        ))
    
    conn.commit()
    print(f"✓ Loaded {len(properties)} properties.")

def load_bookings(conn):
    """Load bookings from bookings.json."""
    bookings_file = DATA_DIR / "bookings.json"
    
    with open(bookings_file, "r") as f:
        bookings = json.load(f)
    
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    for booking in bookings:
        cursor.execute("""
        INSERT INTO bookings 
        (prop_id, arrival_date, departure_date, nights,
         guest_name, guest_email, guest_country,
         adults, children, infants, has_car,
         rate_code, base_nightly_rate, total_paid,
         channel, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking["prop_id"],
            booking["arrival_date"],
            booking["departure_date"],
            booking["nights"],
            booking["guest_name"],
            booking["guest_email"],
            booking.get("guest_country"),
            booking.get("adults", 2),
            booking.get("children", 0),
            booking.get("infants", 0),
            booking.get("has_car", 0),
            booking.get("rate_code", "FLEX"),
            booking["base_nightly_rate"],
            booking["total_paid"],
            booking.get("channel", "direct"),
            now
        ))
    
    conn.commit()
    print(f"✓ Loaded {len(bookings)} bookings.")

def main():
    """Create and seed database."""
    # Drop if exists (for clean seed)
    if Path(DB_PATH).exists():
        Path(DB_PATH).unlink()
        print(f"✓ Removed old {DB_PATH}.")
    
    # Connect
    conn = sqlite3.connect(DB_PATH)
    
    try:
        create_schema(conn)
        load_properties(conn)
        load_bookings(conn)
        print(f"\n✓✓✓ Database seeded: {DB_PATH}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
```

### Run seed

```bash
cd backend
python seed.py
```

Output:

```
✓ Schema created.
✓ Loaded 9 properties.
✓ Loaded 4 bookings.

✓✓✓ Database seeded: UpRez.db
```

***

## 7. Data Files

### `data/properties.json`

```json
[
  {
    "name": "Budget Beach Apt",
    "location": "Palma",
    "beds": 1,
    "baths": 1,
    "list_nightly_rate": 150.0,
    "amenities": ["wifi", "ac", "balcony"],
    "metadata": {
      "wifi_speed": "basic 30mbps",
      "noise_level": "moderate",
      "distance_to_beach_m": 250,
      "age_years": 8
    },
    "images": ["budget-beach-apt-exterior.jpg", "budget-beach-apt-living.jpg"]
  },
  {
    "name": "City Studio",
    "location": "Palma",
    "beds": 1,
    "baths": 1,
    "list_nightly_rate": 140.0,
    "amenities": ["wifi", "ac", "workspace"],
    "metadata": {
      "wifi_speed": "excellent 200mbps",
      "noise_level": "busy",
      "distance_to_beach_m": 800,
      "age_years": 2
    },
    "images": ["city-studio-desk.jpg", "city-studio-balcony.jpg"]
  },
  {
    "name": "Family 2BR Apt",
    "location": "Palma",
    "beds": 2,
    "baths": 1,
    "list_nightly_rate": 220.0,
    "amenities": ["wifi", "ac", "parking", "washer", "balcony", "kids_allowed"],
    "metadata": {
      "wifi_speed": "good 100mbps",
      "noise_level": "quiet",
      "distance_to_beach_m": 200,
      "age_years": 5,
      "kids_suitability": "great",
      "parking_type": "underground"
    },
    "images": ["family-2br-apt-exterior.jpg", "family-2br-apt-living.jpg", "family-2br-apt-bedroom.jpg"]
  },
  {
    "name": "Mid-Tier Villa",
    "location": "Son Vida",
    "beds": 3,
    "baths": 2,
    "list_nightly_rate": 350.0,
    "amenities": ["wifi", "ac", "pool", "parking", "washer", "elevator", "garden", "workspace"],
    "metadata": {
      "wifi_speed": "good 100mbps",
      "noise_level": "quiet",
      "distance_to_beach_m": 2000,
      "age_years": 4,
      "kids_suitability": "great",
      "parking_type": "driveway",
      "outdoor_space": "pool_and_garden",
      "elevator": true
    },
    "images": ["mid-tier-villa-exterior.jpg", "mid-tier-villa-pool.jpg", "mid-tier-villa-living.jpg"]
  },
  {
    "name": "Golf Villa",
    "location": "Son Vida",
    "beds": 4,
    "baths": 3,
    "list_nightly_rate": 450.0,
    "amenities": ["wifi", "ac", "pool", "parking", "washer", "dryer", "elevator", "garden", "workspace"],
    "metadata": {
      "wifi_speed": "excellent 200mbps",
      "noise_level": "very_quiet",
      "distance_to_beach_m": 3000,
      "age_years": 2,
      "kids_suitability": "excellent",
      "parking_type": "driveway",
      "outdoor_space": "pool_garden_terrace",
      "elevator": true
    },
    "images": ["golf-villa-exterior.jpg", "golf-villa-pool.jpg"]
  },
  {
    "name": "Poolside Apt",
    "location": "Cala Major",
    "beds": 2,
    "baths": 2,
    "list_nightly_rate": 250.0,
    "amenities": ["wifi", "ac", "pool", "parking", "balcony", "kids_allowed"],
    "metadata": {
      "wifi_speed": "good 100mbps",
      "noise_level": "moderate",
      "distance_to_beach_m": 100,
      "age_years": 6,
      "kids_suitability": "good"
    },
    "images": ["poolside-apt-exterior.jpg", "poolside-apt-pool.jpg"]
  },
  {
    "name": "Lux Beach House",
    "location": "Cala Major",
    "beds": 4,
    "baths": 3,
    "list_nightly_rate": 550.0,
    "amenities": ["wifi", "ac", "pool", "parking", "washer", "dryer", "elevator", "garden", "workspace"],
    "metadata": {
      "wifi_speed": "excellent 200mbps",
      "noise_level": "very_quiet",
      "distance_to_beach_m": 50,
      "age_years": 1,
      "kids_suitability": "excellent",
      "parking_type": "driveway",
      "outdoor_space": "pool_garden_direct_beach_access",
      "elevator": true
    },
    "images": ["lux-beach-house-exterior.jpg", "lux-beach-house-pool.jpg", "lux-beach-house-beach.jpg"]
  },
  {
    "name": "Seafront 2BR",
    "location": "Palma",
    "beds": 2,
    "baths": 1,
    "list_nightly_rate": 280.0,
    "amenities": ["wifi", "ac", "parking", "balcony", "workspace"],
    "metadata": {
      "wifi_speed": "good 100mbps",
      "noise_level": "quiet",
      "distance_to_beach_m": 50,
      "age_years": 3,
      "kids_suitability": "good"
    },
    "images": ["seafront-2br-exterior.jpg", "seafront-2br-sea-view.jpg"]
  },
  {
    "name": "Garden Villa",
    "location": "Son Vida",
    "beds": 3,
    "baths": 2,
    "list_nightly_rate": 320.0,
    "amenities": ["wifi", "ac", "pool", "parking", "garden", "washer", "workspace"],
    "metadata": {
      "wifi_speed": "good 100mbps",
      "noise_level": "quiet",
      "distance_to_beach_m": 1500,
      "age_years": 5,
      "kids_suitability": "great",
      "outdoor_space": "pool_and_garden"
    },
    "images": ["garden-villa-exterior.jpg", "garden-villa-pool.jpg"]
  }
]
```

### `data/bookings.json`

```json
[
  {
    "prop_id": 1,
    "arrival_date": "2026-06-10",
    "departure_date": "2026-06-17",
    "nights": 7,
    "guest_name": "Alice Weber",
    "guest_email": "alice.weber@example.com",
    "guest_country": "DE",
    "adults": 2,
    "children": 0,
    "infants": 0,
    "has_car": 0,
    "rate_code": "FLEX",
    "base_nightly_rate": 150.0,
    "total_paid": 1170.0,
    "channel": "airbnb"
  },
  {
    "prop_id": 2,
    "arrival_date": "2026-06-12",
    "departure_date": "2026-06-19",
    "nights": 7,
    "guest_name": "James Collins",
    "guest_email": "james.collins@example.com",
    "guest_country": "GB",
    "adults": 2,
    "children": 2,
    "infants": 0,
    "has_car": 1,
    "rate_code": "EARLY_BIRD",
    "base_nightly_rate": 145.0,
    "total_paid": 1015.0,
    "channel": "booking.com"
  },
  {
    "prop_id": 1,
    "arrival_date": "2026-06-20",
    "departure_date": "2026-06-27",
    "nights": 7,
    "guest_name": "Sofia García",
    "guest_email": "sofia.garcia@example.com",
    "guest_country": "ES",
    "adults": 1,
    "children": 0,
    "infants": 0,
    "has_car": 1,
    "rate_code": "LAST_MINUTE",
    "base_nightly_rate": 130.0,
    "total_paid": 910.0,
    "channel": "direct"
  },
  {
    "prop_id": 6,
    "arrival_date": "2026-07-01",
    "departure_date": "2026-07-08",
    "nights": 7,
    "guest_name": "Raj Patel",
    "guest_email": "raj.patel@example.com",
    "guest_country": "IN",
    "adults": 2,
    "children": 0,
    "infants": 0,
    "has_car": 0,
    "rate_code": "FLEX",
    "base_nightly_rate": 120.0,
    "total_paid": 840.0,
    "channel": "airbnb"
  }
]
```

***

## 8. Querying Examples

Quick reference for backend devs:

### Get a booking with property details

```python
cursor.execute("""
SELECT b.*, p.name, p.list_nightly_rate, p.amenities
FROM bookings b
JOIN properties p ON b.prop_id = p.id
WHERE b.id = ?
""", (booking_id,))
booking = cursor.fetchone()
```

### Find all bookings arriving 7 days from now

```python
from datetime import datetime, timedelta

target_date = (datetime.utcnow() + timedelta(days=7)).date().isoformat()

cursor.execute("""
SELECT id, guest_name, guest_email
FROM bookings
WHERE arrival_date = ?
""", (target_date,))
bookings = cursor.fetchall()
```

### Find overlapping bookings for a date range

```python
cursor.execute("""
SELECT id, guest_name, guest_email
FROM bookings
WHERE arrival_date <= ? AND departure_date >= ?
AND id != ?  -- Exclude cancelled booking
""", (departure_date, arrival_date, cancelled_booking_id))
overlapping = cursor.fetchall()
```

### Check if property is booked on dates

```python
cursor.execute("""
SELECT COUNT(*) as count
FROM bookings
WHERE prop_id = ? AND arrival_date < ? AND departure_date > ?
""", (prop_id, departure_date, arrival_date))
result = cursor.fetchone()
is_booked = result[0] > 0
```

### Fetch an offer with full details

```python
cursor.execute("""
SELECT * FROM offers WHERE id = ?
""", (offer_id,))
offer = cursor.fetchone()
# Parse JSON: top3 = json.loads(offer['top3'])
```

***

## 9. Key Notes

1. **Dates are ISO8601 strings** for simplicity; in production, use DATE type.
2. **Timestamps are UTC + "Z" suffix**; parse with `datetime.fromisoformat()`.
3. **JSON fields** (amenities, metadata, top3) are stored as TEXT; deserialize with `json.loads()`.
4. **Boolean values** in metadata are stored as `true`/`false` (JSON), not 0/1.
5. **Uniqueness**: Each booking gets at most one offer (booking_id is UNIQUE in offers).
6. **Cascades**: Don't set CASCADE deletes; manage referential integrity in code.

***

**Next step:** Use this spec and `seed.py` to initialize your database in development. You're ready to start building the backend!

