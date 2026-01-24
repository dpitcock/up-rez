"""
Main offer generation orchestration service.
Coordinates scoring, pricing, LLM copy generation, and offer persistence.
"""
from typing import Dict, List, Any, Optional, Tuple
import json
from datetime import datetime, timedelta
import sqlite3
import uuid
import os

from services.scoring_service import compute_score, filter_eligible_candidates
from services.pricing_service import calculate_offer_pricing, validate_pricing
from services.rag_service import generate_marketing_copy, generate_property_diffs, generate_full_offer_preview_copy
from database import get_db


def generate_headline_and_summary(
    candidate_prop: Dict[str, Any],
    diffs: List[str],
    booking: Dict[str, Any]
) -> Tuple[str, str]:
    """
    Generate headline and summary for upgrade option.
    
    Returns:
        (headline, summary) tuple
    """
    # Simple headline generation
    prop_name = candidate_prop["name"]
    
    # Parse metadata
    metadata = candidate_prop.get("metadata", {})
    if isinstance(metadata, str):
        metadata = json.loads(metadata) if metadata else {}
    
    # Create headline based on property features
    if "pool" in candidate_prop.get("amenities", []):
        headline = "Upgrade to villa with private pool"
    elif candidate_prop["beds"] >= 3:
        headline = "More space for the whole family"
    elif "beachfront" in metadata.get("beach_distance", ""):
        headline = "Beachfront luxury upgrade"
    else:
        headline = f"Upgrade to {prop_name}"
    
    # Create summary from diffs
    if len(diffs) >= 2:
        summary = f"{diffs[0]}, {diffs[1].lower()}"
        if len(diffs) >= 3:
            summary += f", {diffs[2].lower()}"
        summary += "."
    elif diffs:
        summary = diffs[0] + "."
    else:
        summary = f"Enhanced property in {candidate_prop['location']}."
    
    return headline, summary


def get_all_properties(conn) -> List[Dict[str, Any]]:
    """Fetch all properties from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties")
    rows = cursor.fetchall()
    
    properties = []
    for row in rows:
        prop = dict(row)
        properties.append(prop)
    
    return properties


def get_booking(conn, booking_id: str) -> Optional[Dict[str, Any]]:
    """Fetch booking by ID."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
    row = cursor.fetchone()
    
    if row:
        return dict(row)
    return None


def get_property(conn, prop_id: int) -> Optional[Dict[str, Any]]:
    """Fetch property by ID."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties WHERE id = ?", (prop_id,))
    row = cursor.fetchone()
    
    if row:
        return dict(row)
    return None


def get_host_settings(conn, host_id: str) -> Dict[str, Any]:
    """Fetch host settings."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM host_settings WHERE host_id = ?", (host_id,))
    row = cursor.fetchone()
    
    if row:
        settings = dict(row)
        # Parse JSON fields
        if settings.get("blocked_prop_ids"):
            try:
                settings["blocked_prop_ids"] = json.loads(settings["blocked_prop_ids"])
            except:
                settings["blocked_prop_ids"] = []
        return settings
    
    # Return defaults if not found
    return {
        "host_id": host_id,
        "max_discount_pct": 0.40,
        "min_revenue_lift_eur_per_night": 30.0,
        "max_adr_multiplier": 2.5,
        "offer_validity_hours": 48,
        "use_openai_for_copy": False,
        "local_llm_model": "gemma3:latest"
    }


def generate_offer(booking_id: str) -> Optional[str]:
    """
    Main offer generation function.
    """
    print(f"\n=== Starting offer generation for booking {booking_id} ===")
    offer_id = str(uuid.uuid4())
    with get_db() as conn:
        # 1. Load booking and original property
        print(f"[1/7] Loading booking data...")
        booking = get_booking(conn, booking_id)
        if not booking:
            print(f"❌ Booking {booking_id} not found")
            return None
        print(f"✓ Booking loaded: {booking['guest_name']} at {booking.get('prop_id')}")
            
        # Clear any existing offers for this booking (for demo re-runnability)
        print(f"[2/7] Clearing existing offers...")
        conn.execute("DELETE FROM offers WHERE booking_id = ?", (booking_id,))
        conn.commit()
        
        original_prop = get_property(conn, booking["prop_id"])
        if not original_prop:
            print(f"❌ Property {booking['prop_id']} not found")
            return None
        print(f"✓ Original property: {original_prop['name']}")
        
        # 2. Load host settings
        print(f"[3/7] Loading host settings...")
        host_id = booking.get("host_id", "demo_host_001")
        host_settings = get_host_settings(conn, host_id)
        print(f"✓ Host settings loaded (use_openai={host_settings.get('use_openai_for_copy', False)})")
        
        # 3. Find eligible candidates
        print(f"[4/7] Finding eligible upgrade candidates...")
        all_properties = get_all_properties(conn)
        candidates = filter_eligible_candidates(
            all_properties,
            original_prop,
            booking,
            host_settings
        )
        
        if not candidates:
            print("❌ No eligible upgrade candidates found")
            return None
        print(f"✓ Found {len(candidates)} eligible candidates")
        
        # 4. Score each candidate and calculate pricing
        print(f"[5/7] Scoring candidates and generating AI copy...")
        scored_options = []
        for candidate in candidates:
            # Compute viability score
            score = compute_score(original_prop, candidate, booking)
            
            # Calculate pricing
            pricing = calculate_offer_pricing(
                from_adr=booking["base_nightly_rate"],
                to_adr=candidate["list_nightly_rate"],
                nights=booking["nights"],
                discount_pct=host_settings.get("max_discount_pct", 0.40),
                from_total=booking["total_paid"]
            )
            
            # Validate pricing against guardrails
            if not validate_pricing(pricing, host_settings):
                continue
            
            # Generate diffs
            diffs = generate_property_diffs(original_prop, candidate)
            
            # Generate fallback headline/summary
            headline, summary = generate_headline_and_summary(candidate, diffs, booking)
            
            # Generate Full AI Copy Package
            ai_data = generate_full_offer_preview_copy(
                original_prop,
                candidate,
                pricing,
                {
                    "guest_name": booking["guest_name"],
                    "adults": booking.get("adults", 2),
                    "children": booking.get("children", 0),
                    "local_model": host_settings.get("local_llm_model", "gemma3:latest")
                },
                use_openai=bool(host_settings.get("use_openai_for_copy", False))
            )
            
            # Parse images
            images = candidate.get("images", [])
            if isinstance(images, str):
                images = json.loads(images) if images else []
            
            option = {
                "ranking": 0,  # Will be set after sorting
                "prop_id": candidate["id"],
                "prop_name": candidate["name"],
                "viability_score": score,
                "pricing": pricing,
                "diffs": ai_data.get("diff_bullets", diffs), # Use high-quality bullets
                "headline": ai_data.get("landing_hero", headline),
                "summary": ai_data.get("landing_summary", summary),
                "ai_copy": ai_data, # Store the whole package
                "images": images,
                "availability": {
                    "available": True,
                    "reason": None
                }
            }
            
            scored_options.append(option)
        
        # 5. Sort by score and take top 3
        print(f"[6/7] Selecting top 3 options...")
        scored_options.sort(key=lambda x: x["viability_score"], reverse=True)
        top3 = scored_options[:3]
        
        if not top3:
            print("❌ No valid upgrade options after filtering")
            return None
        print(f"✓ Top 3 selected (scores: {[opt['viability_score'] for opt in top3]})")
        
        # Set rankings
        for idx, option in enumerate(top3):
            option["ranking"] = idx + 1
        
        # 6. Store offer
        print(f"[7/7] Storing offer in database...")
        now_dt = datetime.utcnow()
        validity_hours = host_settings.get("offer_validity_hours", 48)
        expires_dt = now_dt + timedelta(hours=validity_hours)
        
        # Hard cap at arrival date (e.g. 10am on arrival day)
        try:
            arrival_dt = datetime.strptime(booking["arrival_date"], "%Y-%m-%d")
            # Set to 10:00 AM on arrival day
            arrival_limit = arrival_dt.replace(hour=10, minute=0, second=0)
            
            if expires_dt > arrival_limit:
                expires_dt = arrival_limit
        except Exception as e:
            print(f"⚠️  Error parsing arrival date for expiration: {e}")
            
        now = now_dt.isoformat() + "Z"
        expires_at = expires_dt.isoformat() + "Z"
        
        # Prepare email data from the top option
        top_option = top3[0]
        email_subject = top_option.get("ai_copy", {}).get("subject", f"{booking['guest_name']}, upgrade your stay?")
        email_body = top_option.get("ai_copy", {}).get("email_html", "")
        
        # Inject Offer URL
        frontend_url = os.getenv("NEXT_PUBLIC_FRONTEND_URL") or "http://localhost:3030"
        frontend_url = frontend_url.rstrip('/')
        offer_url = f"{frontend_url}/offer/{offer_id}"
        email_body = email_body.replace("{OFFER_URL}", offer_url)

        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO offers 
        (id, booking_id, status, top3, email_subject, email_body_html, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            offer_id,
            booking_id,
            "active",
            json.dumps(top3),
            email_subject,
            email_body,
            expires_at,
            now
        ))
        
        conn.commit()
        
        print(f"✅ Generated offer {offer_id} with {len(top3)} options")
        print(f"=== Offer generation complete ===")
        return offer_id
def find_overlapping_bookings(conn, prop_id: str, arrival: str, departure: str) -> List[Dict[str, Any]]:
    """
    Find bookings that overlap with the cancelled dates but are in different properties.
    """
    cursor = conn.cursor()
    # Logic: Search for bookings that stay during the same window but could move to the vacated prop
    # We exclude the same property (obviously) and look for lower-tier properties
    cursor.execute("""
        SELECT b.*, p.list_nightly_rate
        FROM bookings b
        JOIN properties p ON b.prop_id = p.id
        WHERE b.arrival_date >= ? AND b.departure_date <= ?
        AND b.prop_id != ?
    """, (arrival, departure, prop_id))
    
    return [dict(row) for row in cursor.fetchall()]

def handle_cancellation(cancelled_booking_id: str) -> List[str]:
    """
    Orchestrates the response to a cancellation.
    Returns a list of generated offer IDs.
    """
    generated_offers = []
    with get_db() as conn:
        # 1. Get the cancelled booking details
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (cancelled_booking_id,))
        cancelled = cursor.fetchone()
        if not cancelled:
            return []
            
        cancelled = dict(cancelled)
        
        # 2. Find overlapping candidates
        candidates = find_overlapping_bookings(
            conn, 
            cancelled["prop_id"], 
            cancelled["arrival_date"], 
            cancelled["departure_date"]
        )
        
        if not candidates:
            print(f"No candidates for cancellation recovery of booking {cancelled_booking_id}")
            return []
            
        # 3. Target the top 3 best guests (simplification for demo)
        # In a real system, we might only target the 'biggest' upgrade or send multiple
        for guest_booking in candidates[:3]:
            offer_id = generate_offer(guest_booking["id"])
            if offer_id:
                generated_offers.append(offer_id)
                # In demo mode, we also trigger the test email immediately if configured
                from services.email_service import send_test_email
                # Fetch the offer we just created to get the subject/body
                cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
                offer_row = cursor.fetchone()
                if offer_row:
                    offer_data = dict(offer_row)
                    send_test_email(
                        to_email=guest_booking["guest_email"], 
                        subject=offer_data["email_subject"],
                        html_content=offer_data["email_body_html"]
                    )
                    
    return generated_offers
