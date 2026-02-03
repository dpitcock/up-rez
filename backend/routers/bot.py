"""
Bot Q&A router for guest questions.
"""
from fastapi import APIRouter, HTTPException
import os

from models import BotQueryRequest, BotQueryResponse
from services.rag_service import (
    retrieve_property_info,
    build_property_context,
    answer_query_with_llm,
    extract_property_source
)
from database import get_db
import json

router = APIRouter()


@router.post("/query")
async def bot_query(request: BotQueryRequest):
    """
    Answer guest questions using RAG + LLM.
    
    Args:
        request: Bot query with offer_id, prop_id, and question
        
    Returns:
        Answer with source information
    """
    
    # Get all properties for context
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM properties")
        rows = cursor.fetchall()
        
        all_properties = [dict(row) for row in rows]
    
    # Find the specific property
    property_info = retrieve_property_info(request.prop_id, all_properties)
    if not property_info:
        raise HTTPException(status_code=404, detail=f"Property {request.prop_id} not found")

    # Load Offer, Original Booking and Host context
    guest_context = {}
    original_property_info = None
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.*, b.guest_name, b.arrival_date, b.departure_date, b.nights, b.adults, b.children, 
                   b.prop_id as orig_prop_id, b.base_nightly_rate as orig_adr, b.total_paid as orig_total,
                   h.host_name as pm_name
            FROM offers o
            JOIN bookings b ON o.booking_id = b.id
            LEFT JOIN host_settings h ON b.host_id = h.host_id
            WHERE o.id = ?
        """, (request.offer_id,))
        row = cursor.fetchone()
        if row:
            guest_context = dict(row)
            # Find original property
            orig_id = guest_context.get("orig_prop_id")
            if orig_id:
                cursor.execute("SELECT * FROM properties WHERE id = ?", (orig_id,))
                orig_row = cursor.fetchone()
                if orig_row:
                    original_property_info = dict(orig_row)
            
            # Extract all offers for comparison awareness
            try:
                top3 = json.loads(guest_context.get("top3", "[]"))
                guest_context["all_options"] = top3
                
                # Identify the specific pricing for the property they are currently viewing
                discussed_pricing = next((opt["pricing"] for opt in top3 if opt["prop_id"] == request.prop_id), None)
                if discussed_pricing:
                    guest_context["discussed_pricing"] = discussed_pricing
            except:
                pass
            
    # Build context for both properties
    upgrade_property_context = build_property_context(property_info)
    original_property_context = build_property_context(original_property_info) if original_property_info else None
    
    # Check if using OpenAI or Ollama
    use_openai = (os.getenv("USE_OPENAI", "false").lower() == "true") or (os.getenv("NEXT_PUBLIC_USE_OPENAI", "false").lower() == "true")
    
    # Get answer from LLM with comparison capability and history
    answer = answer_query_with_llm(
        question=request.question,
        property_context=upgrade_property_context,
        guest_context=guest_context, 
        original_property_context=original_property_context,
        history=request.history,
        use_openai=use_openai
    )
    
    # Extract source information
    source = extract_property_source(property_info, request.question)
    
    return {
        "offer_id": request.offer_id,
        "prop_id": request.prop_id,
        "answer": answer,
        "source": source
    }
