import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent / "backend" / "UpRez.db"

def run_migration():
    conn = sqlite3.connect(str(DATABASE_PATH))
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(offers)")
    columns = [row[1] for row in cursor.fetchall()]
    
    new_cols = [
        ("accepted_at", "TEXT"),
        ("confirmation_number", "TEXT"),
        ("selected_prop_id", "TEXT"),
        ("payment_status", "TEXT DEFAULT 'pending'"),
        ("payment_amount", "REAL")
    ]
    
    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column {col_name} to offers table...")
            cursor.execute(f"ALTER TABLE offers ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
