"""
Demo trigger router for hackathon demonstrations.
"""
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from database import get_db
from models import DemoTriggerPayload
from services.offer_service import generate_offer

from pydantic import BaseModel
from services.pricing_service import calculate_offer_pricing
from services.rag_service import generate_marketing_copy, generate_full_offer_preview_copy

import json
from datetime import timedelta

router = APIRouter()

@router.get("/properties")
async def get_demo_properties():
    """Fetch all properties for selection in the editor."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, list_nightly_rate, beds, category, images FROM properties")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

class DemoSettings(BaseModel):
    use_openai: bool
    local_model: Optional[str] = "gemma3:latest"
    pm_company_name: Optional[str] = "@luxury_stays"

class PreviewRequest(BaseModel):
    original_prop_id: str
    upgrade_prop_id: str
    guest_name: str
    adults: int = 2
    children: int = 0
    has_car: bool = False

@router.get("/ollama-models")
async def get_ollama_models():
    """Fetch available models from local Ollama instance."""
    import requests
    import os
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    try:
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return {"models": [m["name"] for m in models]}
        return {"models": ["gemma3:latest"]}
    except Exception as e:
        print(f"Ollama fetch error: {e}")
        return {"models": ["gemma3:latest"], "error": str(e)}

@router.post("/offer-preview")
async def get_offer_preview(req: PreviewRequest):
    """Generate a full AI-powered offer preview for the editor."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch properties
        cursor.execute("SELECT * FROM properties WHERE id = ?", (req.original_prop_id,))
        orig = cursor.fetchone()
        cursor.execute("SELECT * FROM properties WHERE id = ?", (req.upgrade_prop_id,))
        up = cursor.fetchone()
        
        if not orig or not up:
            raise HTTPException(status_code=404, detail="One or more properties not found")
        
        # Convert rows to dicts to avoid .get() issues with sqlite3.Row
        orig = dict(orig)
        up = dict(up)

        # 2. Get LLM setting
        cursor.execute("SELECT use_openai_for_copy, local_llm_model, pm_company_name FROM host_settings WHERE host_id = 'demo_host_001'")
        set_row = cursor.fetchone()
        use_openai = bool(set_row[0]) if set_row else False
        local_model = set_row[1] if set_row and set_row[1] else "gemma3:latest"
        pm_name = set_row[2] if set_row and set_row[2] else "@luxury_stays"
        
        # 3. Calculate Pricing (40% discount)
        pricing = calculate_offer_pricing(
            from_adr=orig["list_nightly_rate"],
            to_adr=up["list_nightly_rate"],
            nights=7, # Demo default
            discount_pct=0.40
        )
        
        # 4. AI Copy Generation
        guest_context = {
            "guest_name": req.guest_name,
            "adults": req.adults,
            "children": req.children,
            "has_car": req.has_car,
            "local_model": local_model, # Pass preferred local model
            "pm_name": pm_name
        }
        copy = generate_full_offer_preview_copy(orig, up, pricing, guest_context, use_openai)
        
        # 5. Extract images
        orig_imgs = json.loads(orig.get("images", "[]"))
        up_imgs = json.loads(up.get("images", "[]"))
        
        return {
            "pricing": pricing,
            "copy": copy,
            "properties": {
                "original": {
                    "name": orig["name"],
                    "beds": orig["beds"],
                    "image": orig_imgs[0] if orig_imgs else None
                },
                "upgrade": {
                    "name": up["name"],
                    "beds": up["beds"],
                    "image": up_imgs[0] if up_imgs else None
                }
            }
        }

@router.get("/settings")
async def get_demo_settings():
    """Fetch current LLM settings for demo host."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT use_openai_for_copy, local_llm_model, pm_company_name FROM host_settings WHERE host_id = 'demo_host_001'")
        row = cursor.fetchone()
        if row:
            return {
                "use_openai": bool(row[0]),
                "local_model": row[1] or "gemma2:2b",
                "pm_company_name": row[2] or "@luxury_stays"
            }
        return {"use_openai": False, "local_model": "gemma3:latest", "pm_company_name": "@luxury_stays"}

@router.post("/settings")
async def update_demo_settings(settings: DemoSettings):
    """Toggle LLM provider for demo host."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE host_settings 
            SET use_openai_for_copy = ?, local_llm_model = ?, updated_at = ?, pm_company_name = ?
            WHERE host_id = 'demo_host_001'
        """, (
            int(settings.use_openai), 
            settings.local_model,
            datetime.now(timezone.utc).isoformat() + "Z",
            settings.pm_company_name
        ))
        conn.commit()
    return {"status": "ok", "settings": settings}

SCRIPTS_DIR = Path(__file__).parent.parent / "scripts"

@router.get("/ready-bookings")
async def get_ready_bookings():
    """Fetch bookings prepared for the demo."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Cron-ready (7 days out)
        seven_days = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            WHERE arrival_date = ? AND b.status = 'confirmed'
        """, (seven_days,))
        cron_ready = [dict(r) for r in cursor.fetchall()]
        
        # 2. Cancellation-ready (Premium bookings with ID demo_prem_)
        cursor.execute("""
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            WHERE b.id LIKE 'demo_prem_%' AND b.status = 'confirmed'
        """)
        cancellation_ready = [dict(r) for r in cursor.fetchall()]
        
        return {
            "cron_ready": cron_ready,
            "cancellation_ready": cancellation_ready
        }

@router.get("/status")
async def get_demo_status():
    """Returns stats about demo readiness."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Cron ready: 7 days to arrival
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        seven_days = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        
        cursor.execute("SELECT COUNT(*) FROM bookings WHERE arrival_date = ? AND status != 'cancelled'", (seven_days,))
        cron_ready = cursor.fetchone()[0]
        
        # Cancellation ready: Premium bookings that are "confirmed" and part of demo
        cursor.execute("SELECT COUNT(*) FROM bookings WHERE id LIKE 'demo_prem_%' AND status = 'confirmed'")
        cancellation_ready = cursor.fetchone()[0]
        
        return {
            "cron_ready_count": cron_ready,
            "cancellation_ready_count": cancellation_ready,
            "demo_ready": cron_ready >= 3 and cancellation_ready >= 3,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.post("/reset-data")
async def reset_data():
    """Wipes and re-seeds demo data."""
    script = SCRIPTS_DIR / "reset_demo_data.py"
    try:
        result = subprocess.run(["python3", str(script)], capture_output=True, text=True, check=True)
        return {"status": "ok", "message": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {e.stderr}")

@router.post("/normalize-dates")
async def normalize_demo_dates():
    """Runs the date shifter script."""
    script = SCRIPTS_DIR / "normalize_demo_dates.py"
    try:
        result = subprocess.run(["python3", str(script), "--apply"], capture_output=True, text=True, check=True)
        return {"status": "ok", "message": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Normalization failed: {e.stderr}")

@router.post("/trigger/cron")
async def trigger_cron(booking_id: str = Query(..., description="Booking ID to trigger for")):
    """Trigger a 7-day pre-arrival upsell offer."""
    offer_id = generate_offer(booking_id)
    if offer_id:
        return {"status": "ok", "offer_id": offer_id, "message": "Cron offer generated"}
    throw_offer_error()

@router.post("/trigger/cancellation")
async def trigger_cancellation(booking_id: str = Query(..., description="Premium booking ID to cancel")):
    """
    Simulate cancellation of a premium property.
    This triggers an upsell for the overlapping budget guest.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Get premium booking details
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        premium = cursor.fetchone()
        if not premium:
            raise HTTPException(status_code=404, detail="Premium booking not found")
        
        # 2. Cancel it
        cursor.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))
        
        # 3. Find the matching demo budget booking (based on our script pattern)
        # In our script, budget ID is 'demo_budget_' + premium_prop_id's partner
        # For demo simplicity, we'll find a confirmed booking at the SAME property
        # Wait, the budget guest is at a DIFFERENT property but wants to UPGRADE to this one.
        
        # Pattern match: demo_prem_prop_8b86 -> demo_budget_prop_xsf7
        # We'll just look for any confirmed booking with SAME DATES but lower ADR for now
        cursor.execute("""
            SELECT id FROM bookings 
            WHERE arrival_date = ? AND departure_date = ? 
            AND id != ? AND status = 'confirmed'
            ORDER BY base_nightly_rate ASC LIMIT 1
        """, (premium["arrival_date"], premium["departure_date"], booking_id))
        
        budget = cursor.fetchone()
        if not budget:
            conn.rollback()
            raise HTTPException(status_code=400, detail="No overlapping budget booking found to upsell")
        
        conn.commit()
        
        # 4. Trigger offer for the budget guest
        offer_id = generate_offer(budget["id"])
        
    return {
        "status": "ok", 
        "cancelled_booking": booking_id,
        "upsold_booking": budget["id"],
        "offer_id": offer_id,
        "message": f"Premium cancelled. Upsell sent to {budget['id']}"
    }

@router.post("/export-snapshot")
async def export_snapshot():
    """Triggers the DB-to-JSON export logic for Vercel fallbacks."""
    from export_demo_data import export_db_to_json
    try:
        data = export_db_to_json(write_to_file=False)
        return {"status": "ok", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
