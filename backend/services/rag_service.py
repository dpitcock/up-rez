"""
RAG service for property metadata retrieval and bot Q&A.
"""
from typing import List, Dict, Any, Optional, Tuple
import json
import os


# Initialize RAG system (simple version without FAISS for now)
def build_property_context(property_dict: Dict[str, Any]) -> str:
    """
    Build searchable text context from property data.
    
    Args:
        property_dict: Property dictionary
        
    Returns:
        Formatted text context
    """
    # Parse amenities and metadata
    amenities = property_dict.get("amenities", [])
    if isinstance(amenities, str):
        amenities = json.loads(amenities)
    
    metadata = property_dict.get("metadata", {})
    if isinstance(metadata, str):
        metadata = json.loads(metadata) if metadata else {}
    
    # Build context string
    context = f"""
Property: {property_dict['name']}
Location: {property_dict['location']}
Bedrooms: {property_dict['beds']}
Bathrooms: {property_dict['baths']}
Nightly Rate: €{property_dict['list_nightly_rate']}

Amenities: {', '.join(amenities)}

Property Details:
"""
    
    # Add metadata details
    for key, value in metadata.items():
        formatted_key = key.replace('_', ' ').title()
        context += f"- {formatted_key}: {value}\n"
    
    return context


def retrieve_property_info(
    prop_id: int,
    all_properties: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Retrieve property by ID.
    
    Args:
        prop_id: Property ID to find
        all_properties: List of all properties
        
    Returns:
        Property dict or None
    """
    for prop in all_properties:
        if prop["id"] == prop_id:
            return prop
    return None


def answer_query_with_llm(
    question: str,
    property_context: str,
    use_openai: bool = False
) -> str:
    """
    Answer guest question using LLM with property context.
    
    Args:
        question: Guest's question
        property_context: Property details as context
        use_openai: Whether to use OpenAI (True) or Ollama/Gemma (False)
        
    Returns:
        LLM-generated answer
    """
    prompt = f"""You are a helpful assistant for vacation rental property information.

Property Context:
{property_context}

Guest Question: {question}

Answer concisely (1-2 sentences max). Be honest - if the information isn't in the context, say "I'm not sure about that specific detail. Please contact the host to confirm."
"""
    
    try:
        if use_openai:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        else:
            # Use Ollama/Gemma
            import requests
            ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
            
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": "gemma3:latest",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 150
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                return "I'm having trouble accessing property information right now. Please try again or contact the host."
    
    except Exception as e:
        print(f"LLM error: {e}")
        return "I'm having trouble answering that question right now. Please contact the host for this information."


def generate_property_diffs(
    original_prop: Dict[str, Any],
    candidate_prop: Dict[str, Any]
) -> List[str]:
    """
    Generate human-readable diff list between properties.
    Shared by Offer Service and RAG Service for consistent comparison.
    """
    diffs = []
    
    # Parse amenities
    orig_amenities = original_prop.get("amenities", [])
    if isinstance(orig_amenities, str):
        orig_amenities = json.loads(orig_amenities)
    
    cand_amenities = candidate_prop.get("amenities", [])
    if isinstance(cand_amenities, str):
        cand_amenities = json.loads(cand_amenities)
    
    # Parse metadata
    orig_meta = original_prop.get("metadata", {})
    if isinstance(orig_meta, str):
        orig_meta = json.loads(orig_meta) if orig_meta else {}
    
    cand_meta = candidate_prop.get("metadata", {})
    if isinstance(cand_meta, str):
        cand_meta = json.loads(cand_meta) if cand_meta else {}
    
    # Beds/Baths
    if candidate_prop.get("beds", 0) > original_prop.get("beds", 0):
        bed_diff = candidate_prop["beds"] - original_prop["beds"]
        diffs.append(f"+{bed_diff} extra bedroom{'s' if bed_diff > 1 else ''} ({candidate_prop['beds']} beds vs {original_prop['beds']})")
    
    if candidate_prop.get("baths", 0) > original_prop.get("baths", 0):
        bath_diff = candidate_prop["baths"] - original_prop["baths"]
        diffs.append(f"+{bath_diff} extra bathroom{'s' if bath_diff > 1 else ''}")
    
    # Amenities
    new_amenities = set(cand_amenities) - set(orig_amenities)
    for amenity in ["pool", "parking", "workspace", "garden", "elevator", "gym", "balcony"]:
        if amenity.lower() in [a.lower() for a in list(new_amenities)]:
            diffs.append(f"Includes {amenity.title()}")
    
    # Location improvements
    orig_beach = orig_meta.get("beach_distance", "")
    cand_beach = cand_meta.get("beach_distance", "")
    if "beachfront" in cand_beach and "beachfront" not in orig_beach:
        diffs.append("Beachfront location")
    elif "<5min" in cand_beach and "<5min" not in orig_beach:
        diffs.append("Closer to beach (<5min walk)")
    
    # WiFi upgrade
    if "excellent" in cand_meta.get("wifi_speed", "") or "200mbps" in cand_meta.get("wifi_speed", ""):
        if "basic" in orig_meta.get("wifi_speed", "") or "30mbps" in orig_meta.get("wifi_speed", ""):
            diffs.append("Faster WiFi (excellent speed)")
    
    # If no diffs yet, add generic ones
    if not diffs:
        if candidate_prop.get("list_nightly_rate", 0) > original_prop.get("list_nightly_rate", 0) * 1.5:
            diffs.append("Premium property upgrade")
        else:
            diffs.append("Better amenities and location")
    
    return diffs[:3]
def generate_marketing_copy(
    candidate_prop: Dict[str, Any],
    diffs: List[str],
    booking: Dict[str, Any],
    use_openai: bool = False,
    local_model: str = "gemma3:latest"
) -> Tuple[str, str]:
    """
    Generate emotional marketing headline and summary using LLM.
    
    Args:
        candidate_prop: The target property
        diffs: Key improvements over original
        booking: Original booking context
        use_openai: LLM provider
        local_model: Specific Ollama model to use
        
    Returns:
        (headline, summary) tuple
    """
    guest_name = booking.get("guest_name", "Valued Guest").split()[0]
    prop_name = candidate_prop["name"]
    
    prompt = f"""You are a luxury hospitality copywriter. Generate a personalized upgrade offer for {guest_name}.
    
    Property: {prop_name}
    Key Improvements: {', '.join(diffs)}
    
    Task:
    1. Headline: A short, catchy 'emotional hook' (max 6 words).
    2. Summary: A persuasive 1-sentence summary of why this is better than their current booking.
    
    Style: Emotional, exclusive, inviting. Not too 'salesy'.
    
    Format:
    Headline: [TEXT]
    Summary: [TEXT]
    """
    
    try:
        if use_openai:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.8
            )
            raw = response.choices[0].message.content.strip()
        else:
            import requests
            ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": local_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.8}
                },
                timeout=30
            )
            raw = response.json().get("response", "") if response.status_code == 200 else ""
        
        # Parse output
        headline = "Upgrade your stay"
        summary = f"Enjoy {prop_name} with superior amenities."
        
        for line in raw.split('\n'):
            if line.startswith("Headline:"):
                headline = line.replace("Headline:", "").strip()
            elif line.startswith("Summary:"):
                summary = line.replace("Summary:", "").strip()
                
        return headline, summary

    except Exception as e:
        print(f"Copy generation error: {e}")
        return f"Upgrade to {prop_name}", f"Features {', '.join(diffs)}."

from typing import Tuple


def extract_property_source(property_dict: Dict[str, Any], question: str) -> Optional[Dict[str, Any]]:
    """
    Extract relevant source information for bot response.
    """
    # Parse amenities and metadata
    amenities = property_dict.get("amenities", [])
    if isinstance(amenities, str):
        amenities = json.loads(amenities)
    
    metadata = property_dict.get("metadata", {})
    if isinstance(metadata, str):
        metadata = json.loads(metadata) if metadata else {}
    
    # Simple keyword matching to extract relevant source
    question_lower = question.lower()
    source = {
        "amenities": [],
        "metadata": {}
    }
    
    # Check amenities
    for amenity in amenities:
        if amenity.lower() in question_lower:
            source["amenities"].append(amenity)
    
    # Check metadata keys
    for key, value in metadata.items():
        if key.lower() in question_lower or key.replace('_', ' ').lower() in question_lower:
            source["metadata"][key] = value
    
    return source if (source["amenities"] or source["metadata"]) else None


def generate_full_offer_preview_copy(
    original_prop: Dict[str, Any],
    upgrade_prop: Dict[str, Any],
    pricing: Dict[str, Any],
    guest_context: Dict[str, Any],
    use_openai: bool = False
) -> Dict[str, Any]:
    """
    Generate complex structured JSON for the Offer Editor preview.
    Follows requirements for rich HTML and emotional copywriting.
    """
    guest_name = guest_context.get("guest_name", "Valued Guest").split()[0]
    
    # Get high-quality diffs
    diffs_list = generate_property_diffs(original_prop, upgrade_prop)
    
    # Extract images
    up_imgs = upgrade_prop.get("images", [])
    if isinstance(up_imgs, str):
        up_imgs = json.loads(up_imgs)
    
    # Important: In Email templates, images MUST be fully qualified URLs
    # Priority: FRONTEND_URL -> NEXT_PUBLIC_FRONTEND_URL -> local
    frontend_url = os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_FRONTEND_URL") or "http://localhost:3030"
    frontend_url = frontend_url.rstrip('/')
    hero_img_url = f"{frontend_url}{up_imgs[0]}" if (up_imgs and up_imgs[0].startswith('/')) else (up_imgs[0] if up_imgs else "")

    prompt = f"""You are a luxury hospitality AI assigned to {guest_context.get('pm_name', 'your host')}. Generate a professional upgrade offer email and landing page copy. 
    The offer MUST appear to come directly from {guest_context.get('pm_name', 'the property manager')}, not from UpRez. UpRez is only the enabling technology.
    
    ORIGINAL BOOKING:
    Property: {original_prop['name']}
    Location: {original_prop['location']}
    Rate: {pricing['from_adr']}€/night
    
    UPGRADE PROPERTY: 
    Property: {upgrade_prop['name']}
    List rate: {pricing['to_adr_list']}€/night
    OFFER rate: {pricing['offer_adr']}€/night (Exclusive discounted rate)
    Total Savings for the guest: {pricing['discount_amount_total']}€
    Key Value-Add Features: {', '.join(diffs_list)}
    
    GUEST CONTEXT:
    Name: {guest_name}
    Party: {guest_context.get('adults', 2)} adults, {guest_context.get('children', 0)} children
    
    TASK:
    Generate a JSON response that feels premium, urgent, and tailored to {guest_name}.
    
    FIELDS TO GENERATE:
    1. subject: (Max 60 chars) High-urgency, personalized benefit (e.g. {guest_name}, we've added a private pool to your Mallorca stay?)
    2. email_html: A stunning, modern 'Midnight' luxury HTML email.
       - Body: #050505 background, white text (#ffffff), 24px horizontal padding.
       - HEADER: NO 'UPREZ' LOGO. Instead, show "{guest_context.get('pm_name', 'Luxury Stays')}" in a small, elegant font (12px, gray-500).
       - Image: <img src="{hero_img_url}" style="width:100%; max-width:600px; border-radius:40px; margin-bottom:40px; box-shadow: 0 40px 100px -30px rgba(0,0,0,1);" alt="The Property">
       - Sales Hook: Use a <h1> like "Your Stay, Elevated."
       - Narrative: Emotional contrast between their current booking ({original_prop['name']}) and the luxury of {upgrade_prop['name']}.
       - Offer Card: A <div> with #EA580C background, white text, 48px padding, border-radius: 40px. Show {pricing['offer_adr']}€/night in 64px bold text. Show {pricing['to_adr_list']}€ strikethrough in 24px.
       - CTA: A white button with black text: "VIEW EXCLUSIVE OFFER".
       - FOOTER: At the very bottom, in small text (10px, gray-600), show: "Upgrade offer powered by <img src='{frontend_url}/up-rez-logo-white.svg' style='height:10px; vertical-align:middle; margin-bottom:2px;'> UpRez".
    3. landing_hero: (8 words max) Catchy emotional headline.
    4. landing_summary: 1 persuasive, high-prestige sentence.
    5. diff_bullets: 3 concrete improvements (e.g. "Private Rooftop Pool").

    Output ONLY raw JSON.
    """
    
    try:
        if use_openai:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.7,
                response_format={ "type": "json_object" }
            )
            return json.loads(response.choices[0].message.content.strip())
        else:
            import requests
            ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
            local_model = guest_context.get("local_model", "gemma3:latest")
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": local_model,
                    "prompt": prompt + "\nRespond only with valid JSON.",
                    "stream": False,
                    "options": {"temperature": 0.7}
                },
                timeout=45
            )
            raw = response.json().get("response", "")
            start = raw.find('{')
            end = raw.rfind('}') + 1
            if start != -1 and end != 0:
                return json.loads(raw[start:end])
            raise ValueError("Incomplete JSON from local LLM")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Preview gen error: {e}")
        # High-Fidelity Fallback Template
        return {
            "subject": f"{guest_name}, an exclusive upgrade for your stay at {upgrade_prop['name']}",
            "email_html": f"""
            <div style="background-color: #050505; color: #ffffff; font-family: -apple-system, system-ui, sans-serif; padding: 60px 40px; text-align: center; max-width: 600px; margin: 0 auto; border-radius: 48px;">
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 2px; margin-bottom: 40px; color: #666666; text-transform: uppercase;">A message from {guest_context.get('pm_name', 'Luxury Stays')}</div>
                <img src="{hero_img_url}" style="width: 100%; border-radius: 40px; margin-bottom: 40px; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8);" alt="Exclusive View">
                <h1 style="font-size: 48px; font-weight: 900; letter-spacing: -3px; margin-bottom: 24px; line-height: 1.1; color: #ffffff;">Experience<br>the Extraordinary.</h1>
                <p style="color: #a0a0a0; font-size: 20px; line-height: 1.6; margin-bottom: 48px; max-width: 460px; margin-left: auto; margin-right: auto;">
                    Hi {guest_name}, we've unlocked a private invitation for you to upgrade your stay to the breathtaking <b>{upgrade_prop['name']}</b>.
                </p>
                <div style="background-color: #EA580C; padding: 56px 40px; border-radius: 40px; margin-bottom: 48px; box-shadow: 0 30px 60px -15px rgba(234, 88, 12, 0.4);">
                    <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; opacity: 0.8; letter-spacing: 2px; margin-bottom: 12px; color: #ffffff;">Exclusive Invite Rate</div>
                    <div style="font-size: 72px; font-weight: 900; letter-spacing: -4px; line-height: 1; color: #ffffff;">{pricing['offer_adr']}€<span style="font-size: 22px; font-weight: 400; opacity: 0.7; letter-spacing: 0;">/nt</span></div>
                    <div style="text-decoration: line-through; opacity: 0.6; font-size: 26px; font-weight: 700; margin-top: 12px; color: #ffffff;">{pricing['to_adr_list']}€</div>
                </div>
                <a href="{frontend_url}/offer/preview" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 26px 64px; border-radius: 24px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 16px; letter-spacing: 1px; box-shadow: 0 20px 40px rgba(255,255,255,0.15); margin-bottom: 60px;">Unlock Upgrade</a>
                
                <div style="font-size: 10px; color: #444444; border-top: 1px solid #1a1a1a; pt: 30px;">
                    Upgrade offer powered by <img src="{frontend_url}/up-rez-logo-white.svg" style="height: 10px; vertical-align: middle; margin-bottom: 2px; opacity: 0.3;"> UpRez
                </div>
            </div>
            """,
            "landing_hero": "Upgrade to Prestige",
            "landing_summary": f"Step into the extraordinary at {upgrade_prop['name']} for an exclusive rate of {pricing['offer_adr']}€/night.",
            "diff_bullets": ["Complete Luxury Privacy", "Premium Amenity Suite", "Prime Mediterranean Location"]
        }
