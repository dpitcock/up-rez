"""
Database connection and table schemas for UpRez.
"""
import sqlite3
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

DATABASE_PATH = Path(__file__).parent / "UpRez.db"


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize database with schema."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Properties table
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
        
        # Bookings table
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
            upgraded_from_prop_id TEXT,
            original_base_rate REAL,
            original_total_paid REAL,
            upgrade_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
        """)
        
        # COLUMN ADDITIONS (Migration)
        # 1. Bookings Migration
        cursor.execute("PRAGMA table_info(bookings)")
        columns = [column[1] for column in cursor.fetchall()]
        if "upgraded_from_prop_id" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN upgraded_from_prop_id TEXT")
        if "original_base_rate" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN original_base_rate REAL")
        if "original_total_paid" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN original_total_paid REAL")
        if "upgrade_at" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN upgrade_at TEXT")
        
        # 2. Host Settings Migration
        cursor.execute("PRAGMA table_info(host_settings)")
        hs_columns = [column[1] for column in cursor.fetchall()]
        if "pm_company_name" not in hs_columns:
            cursor.execute("ALTER TABLE host_settings ADD COLUMN pm_company_name TEXT")
        if "host_phone" not in hs_columns:
            cursor.execute("ALTER TABLE host_settings ADD COLUMN host_phone TEXT")
        if "local_llm_model" not in hs_columns:
            cursor.execute("ALTER TABLE host_settings ADD COLUMN local_llm_model TEXT DEFAULT 'gemma3:latest'")

        # 3. Properties Migration (Safety check)
        cursor.execute("PRAGMA table_info(properties)")
        p_columns = [column[1] for column in cursor.fetchall()]
        needed_p = ["type", "category", "max_guests", "bedrooms", "size_sqm", "floor", "elevator", "view", "noise_level"]
        for col in needed_p:
            if col not in p_columns:
                cursor.execute(f"ALTER TABLE properties ADD COLUMN {col} TEXT")

        # Offers table
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
            accepted_at TEXT,
            confirmation_number TEXT,
            selected_prop_id TEXT,
            payment_status TEXT DEFAULT 'pending',
            payment_amount REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
        """)
        
        # Ensure offers has confirmation_number column (migration)
        cursor.execute("PRAGMA table_info(offers)")
        o_columns = [column[1] for column in cursor.fetchall()]
        if "confirmation_number" not in o_columns:
            cursor.execute("ALTER TABLE offers ADD COLUMN confirmation_number TEXT")
        if "selected_prop_id" not in o_columns:
            cursor.execute("ALTER TABLE offers ADD COLUMN selected_prop_id TEXT")
        if "payment_status" not in o_columns:
            cursor.execute("ALTER TABLE offers ADD COLUMN payment_status TEXT DEFAULT 'pending'")
        if "payment_amount" not in o_columns:
            cursor.execute("ALTER TABLE offers ADD COLUMN payment_amount REAL")
        if "accepted_at" not in o_columns:
            cursor.execute("ALTER TABLE offers ADD COLUMN accepted_at TEXT")
        
        # Offer candidates table (optional, for debugging)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS offer_candidates (
            id TEXT PRIMARY KEY,
            offer_id TEXT NOT NULL,
            from_prop_id TEXT NOT NULL,
            to_prop_id TEXT NOT NULL,
            viability_score REAL NOT NULL,
            ranking INTEGER,
            score_components TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (offer_id) REFERENCES offers(id)
        )
        """)
        
        # Host settings table
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
        print("✓ Database schema created successfully")


if __name__ == "__main__":
    init_db()
