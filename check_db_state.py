
import sqlite3
import json

def check_db():
    conn = sqlite3.connect("backend/UpRez.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Database Check ---")
    
    cursor.execute("SELECT COUNT(*) FROM properties")
    print(f"Properties count: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM bookings")
    print(f"Bookings count: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM offers")
    print(f"Offers count: {cursor.fetchone()[0]}")
    
    print("\n--- Recent Offers ---")
    cursor.execute("""
        SELECT o.id, o.booking_id, o.created_at, b.guest_name 
        FROM offers o
        JOIN bookings b ON o.booking_id = b.id
        ORDER BY o.created_at DESC LIMIT 5
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Offer: {row['id']} | Guest: {row['guest_name']} | Created: {row['created_at']}")
        
    print("\n--- Orphaned Offers (no matching booking) ---")
    cursor.execute("""
        SELECT id, booking_id FROM offers 
        WHERE booking_id NOT IN (SELECT id FROM bookings)
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Orphaned Offer: {row['id']} | Missing Booking: {row['booking_id']}")

    print("\n--- Bookings with no matching property ---")
    cursor.execute("""
        SELECT id, prop_id FROM bookings 
        WHERE prop_id NOT IN (SELECT id FROM properties)
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Booking {row['id']} has invalid prop_id: {row['prop_id']}")

    conn.close()

if __name__ == "__main__":
    check_db()
