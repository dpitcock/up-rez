"""
Offers router for fetching and regenerating offers.
"""
from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
import json
import uuid
from datetime import datetime, timezone

from database import get_db
from models import RegenRequest, OfferResponse, AcceptOffer

router = APIRouter()


@router.get("/api/admin/offers")
async def list_offers():
    """List all offers for admin view."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.*, b.guest_name, p.name as prop_name
            FROM offers o
            JOIN bookings b ON o.booking_id = b.id
            JOIN properties p ON b.prop_id = p.id
            ORDER BY o.created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


@router.post("/api/admin/offers/{offer_id}/expire")
async def expire_offer(offer_id: str = Path(..., description="Offer ID")):
    """Manually expire an offer."""
    now = datetime.now(timezone.utc).isoformat() + "Z"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE offers SET expires_at = ?, status = 'expired' WHERE id = ?", (now, offer_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Offer not found")
    return {"status": "ok", "message": "Offer expired"}


@router.post("/offer/{offer_id}/accept")
async def accept_offer(offer_id: str, request: AcceptOffer):
    """
    Accept an upgrade offer.
    Marks offer as accepted, generates confirmation number, 
    and handles state transition.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Validate offer
        cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        offer_row = cursor.fetchone()
        if not offer_row:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        offer = dict(offer_row)
        
        # Check if already accepted
        if offer["status"] == "accepted":
            return {
                "success": True, 
                "confirmation_number": offer["confirmation_number"],
                "message": "Offer already accepted",
                "is_duplicate": True
            }
        
        # Check if expired
        expires_at = datetime.fromisoformat(offer["expires_at"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Offer has expired")

        # 2. Get pricing for the selected option
        try:
            top3 = json.loads(offer["top3"])
            selected_option = next((opt for opt in top3 if opt["prop_id"] == request.prop_id), None)
            if not selected_option:
                raise HTTPException(status_code=404, detail="Selected property not found in offer")
                
            payment_amount = selected_option["pricing"]["offer_total"]
        except Exception as e:
            print(f"Error parsing offer data: {e}")
            payment_amount = 0

        # 3. Generate Artifacts
        confirmation_num = f"UREZ-{str(uuid.uuid4())[:8].upper()}"
        now = datetime.now(timezone.utc).isoformat() + "Z"
        
        # 4. Update Database
        cursor.execute("""
            UPDATE offers 
            SET status = 'accepted', 
                accepted_at = ?, 
                confirmation_number = ?, 
                selected_prop_id = ?,
                payment_amount = ?
            WHERE id = ?
        """, (now, confirmation_num, request.prop_id, payment_amount, offer_id))
        
        conn.commit()
        
        return {
            "success": True,
            "confirmation_number": confirmation_num,
            "message": "Congratulations! Processing your upgrade...",
            "payment_url": f"/pay/{offer_id}", # Next step for the guest
            "next_steps": "Complete payment to finalize."
        }



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
