"""
Main offer generation orchestration service.
Coordinates scoring, pricing, LLM copy generation, and offer persistence.
"""
from typing import Dict, List, Any, Optional, Tuple
import json
from datetime import datetime, timedelta
import sqlite3
import uuid

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


def get_booking(conn, booking_id: int) -> Optional[Dict[str, Any]]:
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


def generate_offer(booking_id: int) -> Optional[int]:
    """
    Main offer generation function.
    """
    with get_db() as conn:
        # 1. Load booking and original property
        booking = get_booking(conn, booking_id)
        if not booking:
            print(f"Booking {booking_id} not found")
            return None
        
        original_prop = get_property(conn, booking["prop_id"])
        if not original_prop:
            print(f"Property {booking['prop_id']} not found")
            return None
        
        # 2. Load host settings
        host_id = booking.get("host_id", "demo_host_001")
        host_settings = get_host_settings(conn, host_id)
        
        # 3. Find eligible candidates
        all_properties = get_all_properties(conn)
        candidates = filter_eligible_candidates(
            all_properties,
            original_prop,
            booking,
            host_settings
        )
        
        if not candidates:
            print("No eligible upgrade candidates found")
            return None
        
        # 4. Score each candidate and calculate pricing
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
        scored_options.sort(key=lambda x: x["viability_score"], reverse=True)
        top3 = scored_options[:3]
        
        if not top3:
            print("No valid upgrade options after filtering")
            return None
        
        # Set rankings
        for idx, option in enumerate(top3):
            option["ranking"] = idx + 1
        
        # 6. Store offer
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
            print(f"Error parsing arrival date for expiration: {e}")
            
        now = now_dt.isoformat() + "Z"
        expires_at = expires_dt.isoformat() + "Z"
        
        # Prepare email data from the top option
        top_option = top3[0]
        email_subject = top_option.get("ai_copy", {}).get("subject", f"{booking['guest_name']}, upgrade your stay?")
        email_body = top_option.get("ai_copy", {}).get("email_html", "")

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
        
        print(f"✓ Generated offer {offer_id} with {len(top3)} options")
        return offer_id
