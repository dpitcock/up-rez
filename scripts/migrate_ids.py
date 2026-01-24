import json
import secrets
import string
from pathlib import Path

DATA_DIR = Path("initial_data")
PROP_FILE = DATA_DIR / "properties.json"
BOOK_FILE = DATA_DIR / "reservations.json" # Original file name based on your file list

def generate_short_id(prefix="prop"):
    """Generate a random short ID like 'prop_a1b2c3'."""
    chars = string.ascii_lowercase + string.digits
    suffix = ''.join(secrets.choice(chars) for _ in range(6))
    return f"{prefix}_{suffix}"

def migrate_ids():
    print("🚀 Starting ID migration to short UUIDs...")
    
    # 1. Load Data
    if not PROP_FILE.exists():
        print(f"❌ Error: {PROP_FILE} not found.")
        return

    with open(PROP_FILE, "r") as f:
        properties = json.load(f)
    
    # Check if bookings file exists (it was named reservations.json in your file list earlier)
    bookings_path = BOOK_FILE
    if not bookings_path.exists():
        # Fallback check for bookings.json if name changed
        bookings_path = DATA_DIR / "bookings.json"
    
    if bookings_path.exists():
        with open(bookings_path, "r") as f:
            bookings = json.load(f)
        print(f"✓ Loaded {len(bookings)} bookings.")
    else:
        bookings = []
        print("⚠️ No bookings file found, skipping booking updates.")

    # 2. Map Old ID -> New ID
    id_map = {}
    
    print(f"✓ Loaded {len(properties)} properties.")
    
    for prop in properties:
        old_id = prop.get("id")
        new_id = generate_short_id("prop")
        
        # Ensure we don't accidentally overwrite if ID format changes mid-flight
        if old_id:
            id_map[old_id] = new_id
            prop["id"] = new_id
            print(f"  - Mapped {old_id} -> {new_id}")

    # 3. Update Bookings with New IDs
    updated_bookings_count = 0
    for booking in bookings:
        # Check both potential keys based on typical schemas
        original_prop_id = booking.get("propertyId") or booking.get("prop_id") or booking.get("listing_id")
        
        # If the booking uses the old integer ID, update it
        if original_prop_id in id_map:
            # We standardize on 'prop_id' key for the backend
            booking["prop_id"] = id_map[original_prop_id]
            # Remove old keys if they exist to clean up
            if "propertyId" in booking: del booking["propertyId"]
            if "listing_id" in booking: del booking["listing_id"]
            updated_bookings_count += 1
    
    print(f"✓ Updated {updated_bookings_count} bookings with new property IDs.")

    # 4. Save Updates
    with open(PROP_FILE, "w") as f:
        json.dump(properties, f, indent=4)
        print(f"💾 Saved updates to {PROP_FILE}")

    if bookings:
        # We'll save it as 'bookings.json' since that is what the seed script expects
        # This fixes the filename mismatch too!
        target_booking_file = DATA_DIR / "bookings.json" # Force standard name
        with open(target_booking_file, "w") as f:
            json.dump(bookings, f, indent=4)
        print(f"💾 Saved updates to {target_booking_file}")

if __name__ == "__main__":
    migrate_ids()
