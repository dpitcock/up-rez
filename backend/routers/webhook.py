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
        # TODO: Find overlapping bookings and generate offers
        # For now, return success
        return {
            "status": "ok",
            "message": "Cancellation webhook received. Offer generation not yet implemented for cancellations."
        }
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {payload.event}")
