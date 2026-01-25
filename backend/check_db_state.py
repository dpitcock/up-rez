
import sqlite3
import json
import os
from datetime import datetime, timezone

def check_db():
    db_path = "UpRez.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print(f"Current UTC Time: {datetime.now(timezone.utc).isoformat()}")
    
    print("\n--- Offer Expiry Check ---")
    try:
        cursor.execute("""
            SELECT id, status, expires_at, created_at 
            FROM offers
            ORDER BY created_at DESC LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            print(f"Offer ID: {row['id']}")
            print(f"Status: {row['status']}")
            print(f"Created: {row['created_at']}")
            print(f"Expires: {row['expires_at']}")
            
            expires_at = datetime.fromisoformat(row['expires_at'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            
            if now > expires_at:
                print(">>> RESULT: OFFER IS EXPIRED <<<")
                print(f"Diff: {now - expires_at} past expiry")
            else:
                print(">>> RESULT: OFFER IS ACTIVE <<<")
                print(f"T-minus: {expires_at - now} until expiry")
        else:
            print("No offers found.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_db()
