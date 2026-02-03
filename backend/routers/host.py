from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from database import get_db
from models import HostSettings
from pydantic import BaseModel
from datetime import datetime, timezone
import json
import uuid

router = APIRouter()

class TemplateCreate(BaseModel):
    name: str
    content_html: str
    type: str # "email" or "landing"

@router.get("/{host_id}/settings")
async def get_host_settings(host_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM host_settings WHERE host_id = ?", (host_id,))
        row = cursor.fetchone()
        if row:
            settings = dict(row)
            import os
            env_openai = os.getenv("USE_OPENAI") == "true" or os.getenv("NEXT_PUBLIC_USE_OPENAI") == "true"
            if env_openai:
                settings["use_openai_for_copy"] = True
            return settings
        raise HTTPException(status_code=404, detail="Host settings not found")

@router.patch("/{host_id}/settings")
async def update_host_settings(host_id: str, settings: Dict[str, Any]):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build dynamic update query
        fields = []
        values = []
        for k, v in settings.items():
            if k in ["id", "host_id", "created_at"]: continue
            fields.append(f"{k} = ?")
            if isinstance(v, (list, dict)):
                values.append(json.dumps(v))
            else:
                values.append(v)
        
        fields.append("updated_at = ?")
        values.append(datetime.now(timezone.utc).isoformat() + "Z")
        values.append(host_id)
        
        query = f"UPDATE host_settings SET {', '.join(fields)} WHERE host_id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()
        return {"status": "updated"}

@router.get("/templates")
async def get_templates(type: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        if type:
            cursor.execute("SELECT id as template_id, name as template_name, type as template_type, content_html, created_at FROM templates WHERE type = ?", (type,))
        else:
            cursor.execute("SELECT id as template_id, name as template_name, type as template_type, content_html, created_at FROM templates")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.post("/templates")
async def create_template(tpl: TemplateCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        tpl_id = f"tpl_{uuid.uuid4()}"
        cursor.execute("""
            INSERT INTO templates (id, name, content_html, type, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (tpl_id, tpl.template_name, tpl.content_html, tpl.template_type, datetime.now(timezone.utc).isoformat() + "Z"))
        conn.commit()
        return {"template_id": tpl_id, "template_name": tpl.template_name}

@router.post("/{host_id}/settings/reset")
async def reset_host_settings(host_id: str):
    # This should reset to defaults
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE host_settings SET 
                min_revenue_lift_eur_per_night = 30.00,
                max_discount_pct = 0.25,
                min_adr_ratio = 1.10,
                max_adr_multiplier = 2.50,
                updated_at = ?
            WHERE host_id = ?
        """, (datetime.now(timezone.utc).isoformat() + "Z", host_id))
        conn.commit()
        return {"status": "reset"}
