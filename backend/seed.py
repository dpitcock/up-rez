#!/usr/bin/env python3
"""
Seed script for UpRez SQLite database.
Run: python seed.py
"""

import json
import sqlite3
import secrets
from datetime import datetime
from pathlib import Path

DB_PATH = "UpRez.db"
DATA_DIR = Path(__file__).parent / "data"


def create_schema(conn):
    """Create all tables."""
    cursor = conn.cursor()
    
    # Properties
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        beds INTEGER NOT NULL,
        baths INTEGER NOT NULL,
        list_nightly_rate REAL NOT NULL,
        amenities TEXT NOT NULL,
        type TEXT,
        category TEXT,
        max_guests INTEGER,
        bedrooms INTEGER,
        size_sqm INTEGER,
        floor INTEGER,
        elevator INTEGER,
        view TEXT,
        noise_level TEXT,
        suitability TEXT,
        house_rules TEXT,
        description_short TEXT,
        description_long TEXT,
        metadata TEXT,
        images TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
    )
    """)
    
    # Bookings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        host_id TEXT DEFAULT 'demo_host_001',
        prop_id TEXT NOT NULL,
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
        status TEXT DEFAULT 'confirmed',
        created_at TEXT NOT NULL,
        updated_at TEXT
    )
    """)
    
    # Offers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
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
    
    # Host settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS host_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id TEXT NOT NULL UNIQUE,
        host_name TEXT,
        min_revenue_lift_eur_per_night REAL DEFAULT 30.00,
        max_discount_pct REAL DEFAULT 0.40,
        min_adr_ratio REAL DEFAULT 1.10,
        max_adr_multiplier REAL DEFAULT 2.50,
        channel_fee_pct REAL DEFAULT 0.18,
        change_fee_eur REAL DEFAULT 25.00,
        blocked_prop_ids TEXT,
        preferred_amenities TEXT,
        max_distance_to_beach_m INTEGER DEFAULT 5000,
        offer_validity_hours INTEGER DEFAULT 48,
        max_offers_per_month INTEGER,
        auto_regen_enabled INTEGER DEFAULT 1,
        email_sender_address TEXT,
        email_sender_name TEXT,
        use_openai_for_copy INTEGER DEFAULT 0,
        offers_sent_this_month INTEGER DEFAULT 0,
        revenue_lifted_this_month REAL DEFAULT 0.00,
        conversion_rate_pct REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
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
        (id, name, location, beds, baths, list_nightly_rate, 
         amenities, type, category, max_guests, bedrooms, size_sqm,
         floor, elevator, view, noise_level, suitability, house_rules,
         description_short, description_long, metadata, images, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prop["id"],
            prop["name"],
            json.dumps(prop["location"]),
            prop["beds"],
            prop["baths"],
            prop["price"],
            json.dumps(prop["amenities"]),
            prop.get("type"),
            prop.get("category"),
            prop.get("maxGuests"),
            prop.get("bedrooms"),
            prop.get("sizeSqm"),
            prop.get("floor"),
            1 if prop.get("elevator") else 0,
            prop.get("view"),
            prop.get("noiseLevel"),
            json.dumps(prop.get("suitability", {})),
            json.dumps(prop.get("houseRules", {})),
            prop.get("descriptionShort"),
            prop.get("descriptionLong"),
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
        # Generate booking ID if not exists
        booking_id = booking.get("id") or f"book_{secrets.token_hex(4)}"
        
        cursor.execute("""
        INSERT OR REPLACE INTO bookings 
        (id, prop_id, arrival_date, departure_date, nights,
         guest_name, guest_email, guest_country,
         adults, children, infants, has_car,
         rate_code, base_nightly_rate, total_paid,
         channel, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id,
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


def load_host_settings(conn):
    """Seed default host settings."""
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
    INSERT OR REPLACE INTO host_settings 
    (host_id, host_name, min_revenue_lift_eur_per_night, max_discount_pct,
     min_adr_ratio, max_adr_multiplier, offer_validity_hours,
     email_sender_name, email_sender_address, use_openai_for_copy,
     created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "demo_host_001",
        "Palma Properties Demo",
        30.00,
        0.40,
        1.10,
        2.50,
        48,
        "UpRez",
        "noreply@uprez.com",
        0,
        now,
        now
    ))
    
    conn.commit()
    print("✓ Seeded demo host settings.")


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
        load_host_settings(conn)
        print(f"\n✓✓✓ Database seeded: {DB_PATH}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
