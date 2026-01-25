import sqlite3
import json
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from services.offer_service import generate_offer
from services.rag_service import generate_full_offer_preview_copy
from services.pricing_service import calculate_offer_pricing

def generate_templates():
    print("🚀 Starting Offer Template Generation...")
    
    scenarios = [
        {"id": "template_budget_to_mid", "name": "Budget to Midrange", "booking_id": "demo_budget_prop_xsf"},
        {"id": "template_budget_to_upper", "name": "Budget to Upper Midrange", "booking_id": "demo_budget_prop_3nr"},
        {"id": "template_mid_to_lux", "name": "Midrange to Luxury", "booking_id": "demo_budget_prop_odd"},
        {"id": "template_upper_to_high_lux", "name": "Upper Midrange to High Luxury", "booking_id": "demo_prem_prop_8b8"}
    ]

    templates = []

    with get_db() as conn:
        cursor = conn.cursor()
        
        for scenario in scenarios:
            print(f"Generating template for: {scenario['name']}...")
            
            # Use the real offer generation logic
            offer_id = generate_offer(scenario['booking_id'])
            
            if not offer_id:
                print(f"⚠️ Failed to generate offer for scenario: {scenario['name']}")
                continue
            
            # Fetch the generated offer
            cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
            offer_row = cursor.fetchone()
            if not offer_row:
                continue
            
            offer = dict(offer_row)
            
            # Revert the hardcoded URL back to placeholder for templates
            email_body = offer["email_body_html"]
            # Generate the transient offer URL to replace it back with placeholder
            base_url = (os.getenv("NEXT_PUBLIC_NGROK_URL") or 
                        os.getenv("NEXT_PUBLIC_FRONTEND_URL") or 
                        "http://localhost:3030").rstrip('/')
            transient_url = f"{base_url}/offer/{offer_id}"
            email_body = email_body.replace(transient_url, "{OFFER_URL}")
            
            # Robust fallback for any other generated URLs
            import re
            email_body = re.sub(r'https?://[^/]+/offer/[a-f0-9-]+', '{OFFER_URL}', email_body)

            # Set dates to None (null in JSON) for template consistency
            template = {
                "template_id": scenario['id'],
                "scenario": scenario['name'],
                "top3": json.loads(offer["top3"]),
                "email_subject": offer["email_subject"],
                "email_body_html": email_body,
                "status": "active",
                "expires_at": None,
                "created_at": None,
                "updated_at": None
            }
            print(f"   Fields: {list(template.keys())}")
            print(f"   Dates: expires_at={template['expires_at']}, created_at={template['created_at']}")
            
            # Maintain date properties as null in top3 options
            for opt in template["top3"]:
                opt["created_at"] = None
                opt["updated_at"] = None
            
            templates.append(template)
            
            # Clean up the temporary offer from DB
            cursor.execute("DELETE FROM offers WHERE id = ?", (offer_id,))
            conn.commit()
            print(f"✅ Template generated: {scenario['id']}")

    # Save to a temporary file that export_demo_data.py can pick up
    output_path = Path(__file__).parent.parent / "data" / "offer_templates.json"
    os.makedirs(output_path.parent, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(templates, f, indent=2)
    
    print(f"🎉 All templates saved to {output_path}")

if __name__ == "__main__":
    generate_templates()
