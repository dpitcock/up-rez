"""
Offers router for fetching and regenerating offers.
"""
from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
import json
from datetime import datetime, timezone

from database import get_db
from models import RegenRequest, OfferResponse

router = APIRouter()


@router.get("/offer/{offer_id}")
async def get_offer(offer_id: str = Path(..., description="Offer ID")):
    """
    Fetch offer by ID with availability check.
    
    Returns complete offer details including:
    - Original booking info
    - Top 3 upgrade options
    - Pricing for each option
    - Availability status
    """
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch offer
        cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        offer_row = cursor.fetchone()
        
        if not offer_row:
            raise HTTPException(status_code=404, detail=f"Offer {offer_id} not found")
        
        offer = dict(offer_row)
        
        # Fetch booking
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (offer["booking_id"],))
        booking_row = cursor.fetchone()
        
        if not booking_row:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = dict(booking_row)
        
        # Fetch original property
        cursor.execute("SELECT * FROM properties WHERE id = ?", (booking["prop_id"],))
        prop_row = cursor.fetchone()
        
        if not prop_row:
            raise HTTPException(status_code=404, detail="Original property not found")
        
        original_prop = dict(prop_row)
        
        # Parse top3 options
        try:
            top3 = json.loads(offer["top3"])
        except:
            top3 = []
        
        # Check expiry
        expires_at = datetime.fromisoformat(offer["expires_at"].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        is_expired = now > expires_at
        
        status = "expired" if is_expired else offer.get("status", "active")
        
        # Fetch host settings
        host_id = booking.get("host_id", "demo_host_001")
        cursor.execute("SELECT host_name, pm_company_name, host_phone FROM host_settings WHERE host_id = ?", (host_id,))
        h_row = cursor.fetchone()
        host_name = h_row[0] if h_row else "Your Host"
        pm_name = h_row[1] if h_row and h_row[1] else "@luxury_stays"
        host_phone = h_row[2] if h_row and h_row[2] else ""
        
        return {
            "offer_id": offer["id"],
            "booking_id": booking["id"],
            "status": status,
            "expires_at": offer["expires_at"],
            "regen_count": offer.get("regen_count", 0),
            "host_info": {
                "name": host_name,
                "pm_name": pm_name,
                "phone": host_phone
            },
            "original_booking": {
                "arrival_date": booking["arrival_date"],
                "departure_date": booking["departure_date"],
                "nights": booking["nights"],
                "adults": booking["adults"],
                "children": booking["children"],
                "prop_name": original_prop["name"],
                "guest_name": booking["guest_name"],
                "current_adr": booking["base_nightly_rate"],
                "current_total": booking["total_paid"]
            },
            "options": top3
        }


@router.post("/regen/{offer_id}")
async def regenerate_offer(
    offer_id: str = Path(..., description="Offer ID"),
    request: RegenRequest = None
):
    """
    Regenerate upgrade options if some are unavailable.
    
    Excludes specified property IDs and generates new alternatives.
    """
    
    # TODO: Implement regeneration logic
    # For now, return the existing offer
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        offer_row = cursor.fetchone()
        
        if not offer_row:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        offer = dict(offer_row)
        top3 = json.loads(offer["top3"])
        
        return {
            "offer_id": offer_id,
            "status": "active",
            "regen_count": offer.get("regen_count", 0) + 1,
            "message": "Regeneration successful (simulated)",
            "options": top3
        }
