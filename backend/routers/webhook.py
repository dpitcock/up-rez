"""
Webhook router for handling channel manager events.
"""
from fastapi import APIRouter, HTTPException
from models import WebhookPayload
from services.offer_service import generate_offer

router = APIRouter()


@router.post("/channel-manager")
async def handle_webhook(payload: WebhookPayload):
    """
    Handle webhook events from channel manager.
    
    Supports two event types:
    - cron_pre_arrival: Triggered 7 days before arrival
    - cancellation: Triggered when a booking is cancelled
    """
    
    if payload.event == "cron_pre_arrival":
        if not payload.booking_id:
            raise HTTPException(status_code=400, detail="booking_id required for cron events")
        
        # Generate offer for the booking
        offer_id = generate_offer(payload.booking_id)
        
        if offer_id:
            return {
                "status": "ok",
                "offer_id": offer_id,
                "booking_id": payload.booking_id,
                "created": True,
                "message": "Offer generated and email queued."
            }
        else:
            return {
                "status": "no_offer",
                "booking_id": payload.booking_id,
                "message": "No suitable upgrade candidates found."
            }
    
    elif payload.event == "cancellation":
        if not payload.booking_id:
            raise HTTPException(status_code=400, detail="booking_id required for cancellation events")
            
        # Trigger cancellation orchestration
        from services.offer_service import handle_cancellation
        offer_ids = handle_cancellation(payload.booking_id)
        
        return {
            "status": "ok",
            "recovered": len(offer_ids) > 0,
            "offers_generated": offer_ids,
            "message": f"Cancellation processed. {len(offer_ids)} recovery offers dispatched."
        }
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {payload.event}")
