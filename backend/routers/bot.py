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
    
    # Build context
    property_context = build_property_context(property_info)
    
    # Check if using OpenAI or Ollama
    use_openai = os.getenv("USE_OPENAI", "false").lower() == "true"
    
    # Get answer from LLM
    answer = answer_query_with_llm(
        question=request.question,
        property_context=property_context,
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
