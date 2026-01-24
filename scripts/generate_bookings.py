import json
import random
import secrets
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path("initial_data")
PROP_FILE = DATA_DIR / "properties.json"
BOOK_FILE = DATA_DIR / "bookings.json"

def generate_bookings():
    print("🚀 Generating realistic dummy bookings...")
    
    with open(PROP_FILE, "r") as f:
        properties = json.load(f)
        
    bookings = []
    
    guest_names = [
        "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
        "Fiona Gallagher", "George Martin", "Hannah Abbott", "Ian McKellen", "Julia Roberts"
    ]
    
    for prop in properties:
        # Create 1-3 bookings per property
        num_bookings = random.randint(1, 3)
        
        for i in range(num_bookings):
            # Arrival 7-60 days in future
            days_ahead = random.randint(7, 60)
            arrival = datetime.now() + timedelta(days=days_ahead)
            nights = random.randint(3, 10)
            departure = arrival + timedelta(days=nights)
            
            price_per_night = prop.get("price", 150)
            total_paid = price_per_night * nights
            
            # Generate ID first
            booking_id = f"book_{secrets.token_hex(4)}"
            
            booking = {
                "id": booking_id,
                "prop_id": prop["id"],  # Use the ID directly from the property
                "arrival_date": arrival.strftime("%Y-%m-%d"),
                "departure_date": departure.strftime("%Y-%m-%d"),
                "nights": nights,
                "guest_name": random.choice(guest_names),
                "guest_email": f"dpitcock.dev+{booking_id}@gmail.com",
                "guest_country": random.choice(["US", "UK", "DE", "FR", "ES"]),
                "adults": random.randint(1, prop.get("maxGuests", 2)),
                "children": random.randint(0, 2),
                "base_nightly_rate": price_per_night,
                "total_paid": total_paid,
                "channel": random.choice(["airbnb", "booking", "direct"])
            }
            bookings.append(booking)
            
    print(f"✓ Generated {len(bookings)} bookings.")
    
    with open(BOOK_FILE, "w") as f:
        json.dump(bookings, f, indent=4)
    print(f"💾 Saved to {BOOK_FILE}")

if __name__ == "__main__":
    generate_bookings()
