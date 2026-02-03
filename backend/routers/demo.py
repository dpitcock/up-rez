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
        
        # Global override via environment variable
        env_openai = os.getenv("USE_OPENAI") == "true" or os.getenv("NEXT_PUBLIC_USE_OPENAI") == "true"
        use_openai = env_openai or (bool(set_row[0]) if set_row else False)
        
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
        
        # Global override via environment variable
        env_openai = os.getenv("USE_OPENAI") == "true" or os.getenv("NEXT_PUBLIC_USE_OPENAI") == "true"
        
        if row:
            return {
                "use_openai": env_openai or bool(row[0]),
                "local_model": row[1] or "gemma2:2b",
                "pm_company_name": row[2] or "@luxury_stays"
            }
        return {"use_openai": env_openai, "local_model": "gemma3:latest", "pm_company_name": "@luxury_stays"}

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

@router.post("/trigger")
async def handle_demo_trigger(payload: DemoTriggerPayload):
    """
    Unified trigger endpoint for the demo frontend.
    Dispatches to the correct logic based on payload.type.
    """
    if payload.type == 'cron':
        if not payload.booking_id:
            raise HTTPException(status_code=400, detail="booking_id required for cron trigger")
        return await trigger_cron(booking_id=payload.booking_id)
    
    elif payload.type == 'cancellation':
        if not payload.booking_id:
            raise HTTPException(status_code=400, detail="booking_id required for cancellation trigger")
        return await trigger_cancellation(booking_id=payload.booking_id)
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown trigger type: {payload.type}")

@router.post("/trigger/cron")
async def trigger_cron(booking_id: str = Query(..., description="Booking ID to trigger for")):
    """Trigger a 7-day pre-arrival upsell offer."""
    # 1. Check if booking exists first to give better error
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM bookings WHERE id = ?", (booking_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found in database.")

    # 2. Try to generate
    offer_id = generate_offer(booking_id)
    if offer_id:
        # In demo mode, immediately trigger the email
        # Retrieve the offer details to get subject/body
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
            offer_row = cursor.fetchone()
            if offer_row:
                offer_data = dict(offer_row)
                
                # Fetch guest email
                cursor.execute("SELECT guest_email FROM bookings WHERE id = ?", (booking_id,))
                guest_res = cursor.fetchone()
                guest_email = guest_res[0] if guest_res else "guest@example.com"

                from services.email_service import send_test_email
                print(f"Sending cron offer email to {guest_email}...")
                send_test_email(
                    to_email=guest_email,
                    subject=offer_data["email_subject"],
                    html_content=offer_data["email_body_html"]
                )

        return {"status": "ok", "offer_id": offer_id, "message": "Cron offer generated and email sent"}
    
    # If no offer, it's usually because eligibility filters (e.g. no luxury props available)
    raise HTTPException(
        status_code=400, 
        detail="No suitable upgrade options found for this booking (filters: capacity, location, or price delta may have failed)."
    )

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
        
        if offer_id:
            # Fetch the generated email content
            cursor.execute("SELECT email_subject, email_body_html FROM offers WHERE id = ?", (offer_id,))
            offer_row = cursor.fetchone()
            if offer_row:
                # Fetch target guest email
                cursor.execute("SELECT guest_email FROM bookings WHERE id = ?", (budget["id"],))
                guest_res = cursor.fetchone()
                guest_email = guest_res[0] if guest_res else "guest@example.com"

                from services.email_service import send_test_email
                print(f"Sending cancellation recovery email to {guest_email}...")
                send_test_email(
                    to_email=guest_email,
                    subject=offer_row[0],
                    html_content=offer_row[1]
                )
        
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

@router.get("/check-ngrok")
async def check_ngrok():
    """Checks if the ngrok tunnel is correctly configured and reachable."""
    import requests
    import os
    
    # 1. Check local ngrok API if possible
    ngrok_apis = ["http://localhost:4040/api/tunnels", "http://host.docker.internal:4040/api/tunnels"]
    
    tunnels = []
    found_api = False
    for api_url in ngrok_apis:
        try:
            res = requests.get(api_url, timeout=2)
            if res.status_code == 200:
                tunnels = res.json().get("tunnels", [])
                found_api = True
                break
        except:
            continue
            
    # 2. Check environment variable
    public_url = os.getenv("NGROK_PUBLIC_URL") or os.getenv("NEXT_PUBLIC_BACKEND_URL")
    
    if found_api and tunnels:
        active_url = tunnels[0].get("public_url")
        return {
            "status": "online",
            "source": "api",
            "url": active_url,
            "tunnels_count": len(tunnels)
        }
    elif public_url and "ngrok" in public_url:
        return {
            "status": "online",
            "source": "env",
            "url": public_url,
            "note": "Detected via configuration"
        }
    else:
        return {
            "status": "offline",
            "message": "No active ngrok tunnels found."
        }

@router.post("/send-test-email")
async def send_email_endpoint(payload: dict):
    """Sends a test email with content from the editor."""
    from services.email_service import send_test_email
    
    to_email = payload.get("to")
    subject = payload.get("subject")
    html = payload.get("html")
    
    if not to_email or not subject or not html:
        raise HTTPException(status_code=400, detail="Missing email parameters")
        
    success = send_test_email(to_email, subject, html)
    if success:
        return {"status": "ok", "message": f"Test email sent to {to_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email via Resend")

@router.post("/tower/run")
async def run_tower_pipelines():
    """Returns mock results for Tower data-pond pipelines (Tower integration removed)."""
    pipelines = ["pipelines/demand_pipeline.py", "pipelines/fit_score_pipeline.py", "pipelines/timing_pipeline.py"]
    results = []
    
    for p in pipelines:
        results.append({
            "pipeline": p,
            "status": "success",
            "output": f"[MOCK] Pipeline {p} completed successfully. Processed 150 records."
        })
            
    return {
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runs": results,
        "note": "Mock mode - Tower integration removed"
    }

@router.post("/demo/frontend-build")
async def run_frontend_build():
    """Triggers the production build inside the frontend container."""
    try:
        # Executes npm run build inside the 'frontend' service container
        cmd = ["docker-compose", "exec", "-T", "frontend", "npm", "run", "build"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            return {"status": "ok", "message": "Production build completed successfully.", "output": result.stdout[-500:]}
        else:
            return {"status": "failed", "error": result.stderr, "output": result.stdout[-500:]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Build trigger failed: {str(e)}")

@router.post("/runpod/hammer")
async def handle_runpod_hammer(count: int = 50):
    """Returns mock response (RunPod integration removed)."""
    return {
        "status": "mock",
        "message": f"[MOCK] Would have generated {count} requests to RunPod.",
        "note": "RunPod integration has been removed. Scoring is now fully mocked."
    }

@router.get("/tower/stats")
async def get_tower_stats():
    """Returns analytics from the Tower-powered data pipelines."""
    # Use real timestamp to show activity
    return {
        "status": "online",
        "last_sync": datetime.now(timezone.utc).isoformat(),
        "hub_demand": [
            {"airport": "PMI", "city": "Mallorca", "multiplier": 1.45, "status": "peak"},
            {"airport": "BER", "city": "Berlin", "multiplier": 1.15, "status": "stable"},
            {"airport": "LHR", "city": "London", "multiplier": 1.30, "status": "high"},
            {"airport": "MUC", "city": "Munich", "multiplier": 1.10, "status": "stable"}
        ],
        "timing_insights": [
            {"tier_transition": "budget -> mid", "optimal_window": "6-9 days", "success_rate": "42%", "peak_day": 8},
            {"tier_transition": "budget -> premium", "optimal_window": "10-16 days", "success_rate": "28%", "peak_day": 12},
            {"tier_transition": "mid -> premium", "optimal_window": "12-20 days", "success_rate": "22%", "peak_day": 14}
        ],
        "feature_store": {
            "engineered_count": 12,
            "top_features": [
                {"name": "luxury_propensity_idx", "type": "Behavioral", "importance": 0.92},
                {"name": "family_space_ratio", "type": "Structural", "importance": 0.85},
                {"name": "early_bird_flexibility", "type": "Temporal", "importance": 0.78}
            ]
        },
        "pipeline_status": {
            "demand_analysis": "active",
            "fit_scoring": "active",
            "timing_optimization": "active"
        }
    }
