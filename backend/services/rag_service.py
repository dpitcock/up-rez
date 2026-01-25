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
    guest_context: Dict[str, Any] = {},
    original_property_context: Optional[str] = None,
    history: List[Dict[str, str]] = [],
    use_openai: bool = False
) -> str:
    """
    Answer guest question using LLM with property, guest context, and memory.
    """
    guest_name = guest_context.get("guest_name", "Valued Guest").split()[0]
    
    # Calculate Incremental Cost
    orig_adr = guest_context.get("orig_adr", 0)
    discussed_pricing = guest_context.get("discussed_pricing", {})
    offer_adr = discussed_pricing.get("offer_adr", 0)
    delta_adr = max(0, offer_adr - orig_adr)
    
    prompt = f"""You are an elite luxury sales concierge. You are speaking with {guest_name} about upgrading their stay.
    
    GUEST CONTEXT:
    - Staying from {guest_context.get('arrival_date', 'soon')} to {guest_context.get('departure_date', '')}
    - Original Booking Cost: €{orig_adr}/night (Total: €{guest_context.get('orig_total', 0)})
    - Upgrade Option currently viewed: {property_context}
    - INCREMENTAL COST: The guest only pays the difference. For this property, it is ONLY €{delta_adr:.2f} extra per night.
    
    YOUR MISSION:
    1. Sell the value of the upgrade by focusing on the INCREMENTAL cost (€{delta_adr:.2f}/night), not the total price.
    2. Be aware of the conversation history provided below.
    3. Authorized floor for this prop: €{discussed_pricing.get('floor_total', 'N/A')} total stay. (This is the absolute minimum total price).
    """

    # Add Multi-Offer Context
    all_options = guest_context.get("all_options", [])
    if all_options:
        prompt += "\nOTHER AVAILABLE OPTIONS:\n"
        for opt in all_options:
            p = opt.get("pricing", {})
            d = max(0, p.get("offer_adr", 0) - orig_adr)
            prompt += f"- {opt['prop_name']}: Just €{d:.2f} more/night. (Floor Total: €{p.get('floor_total')}). Highlights: {', '.join(opt.get('diffs', []))}\n"

    # Format History
    history_str = ""
    if history:
        history_str = "\nCONVERSATION HISTORY:\n"
        for msg in history[-5:]: # Last 5 turns
            role = "Guest" if msg["role"] == "user" else "You"
            history_str += f"{role}: {msg['content']}\n"

    prompt += f"""
    {history_str}
    
    NEGOTIATION RULES:
    1. Always lead with the "incremental delta" (€{delta_adr:.2f}) to make it feel affordable.
    2. Suggest other options if this one is too expensive.
    3. Position concessions as a 'special one-time gesture' from the manager.
    4. If asked about availability: Remind {guest_name} that it is first-come, first-served. Scarcity is key.
    5. Be concise (2-3 sentences). Focus on luxury benefits.
    6. If they agree to a price, YOU MUST END with: 'Let me update that for you... and done! [ACTION:NEGOTIATE:PID:[prop_id]:VAL:[negotiated_total_price]]'
    
    GUEST QUESTION: {question}
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
    # Priority: NEXT_PUBLIC_NGROK_URL -> FRONTEND_URL -> NEXT_PUBLIC_FRONTEND_URL -> local
    frontend_url = (os.getenv("NEXT_PUBLIC_NGROK_URL") or 
                    os.getenv("FRONTEND_URL") or 
                    os.getenv("NEXT_PUBLIC_FRONTEND_URL") or 
                    "http://localhost:3030").rstrip('/')

    # Priority for images: Frontend Public URL (always available) -> ngrok -> local
    image_base_url = (os.getenv("NEXT_PUBLIC_FRONTEND_URL") or 
                      os.getenv("IMAGE_BASE_URL") or 
                      frontend_url).rstrip('/')
    
    # Ensure image path has single slash
    img_path = up_imgs[0] if up_imgs else ""
    if not img_path.startswith('/'):
        img_path = f"/{img_path}"
        
    hero_img_url = f"{image_base_url}{img_path}" if img_path else ""
    print(f"[DEBUG] Email Assets: hero={hero_img_url} logo_base={image_base_url} app_base={frontend_url}")
    
    # Calculate price difference for "Only X more" messaging
    price_delta = pricing['offer_adr'] - pricing['from_adr']
    price_delta_fmt = f"{price_delta:.0f}"

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
    
    SCARCITY & URGENCY (CRITICAL): 
    - Clearly state in both the email and landing copy that this is a "LIMITED TIME OFFER" and "WHILE SUPPLIES LAST".
    - Mention that this exclusive invitation has been "shared with other qualified guests" on overlapping dates, and the upgrade is granted on a "first-come, first-served" basis. This creates high conversion pressure.
    
    FIELDS TO GENERATE:
    1. subject: (Max 60 chars) High-urgency, personalized benefit (e.g. {guest_name}, we've added a private pool to your Mallorca stay?)
    2. email_html: A stunning, modern 'Midnight' luxury HTML email.
       - IMPORTANT: USE ONLY DOUBLE QUOTES (") FOR ALL HTML ATTRIBUTES. DO NOT USE SINGLE QUOTES.
       - Body: #050505 background, white text (#ffffff), 24px horizontal padding.
       - HEADER: NO 'UPREZ' LOGO. Instead, show "{guest_context.get('pm_name', 'Luxury Stays')}" in small, elegant font (12px, color: #9ca3af).
       - Image: <img src="{hero_img_url}" style="display:block; margin-left:auto; margin-right:auto; width:100%; max-width:600px; border-radius:40px; margin-bottom:40px; box-shadow: 0 40px 100px -30px rgba(0,0,0,1);" alt="The Property">
       - Sales Hook: Use a <h1> like "Your Stay, Elevated."
       - Narrative: Focus on how for *only a small daily amount*, they can upgrade from {original_prop['name']} to the luxury of {upgrade_prop['name']}. 
       - NEGOTIATION HINT: Add a P sentence: "Our AI Revenue Manager has pre-approved this special rate for you, but it's first-come, first-served."
       - SCARCITY NOTE: Explicitly mention that this unit is in high demand and has been offered to others—first to claim it wins.
       - Offer Card: A <div> with #EA580C background, white text, 48px padding, border-radius: 40px. 
         Prominently show "Only {price_delta_fmt}€ more / night" in 64px bold text.
       - CTA: A white button-style link (<a href="{{OFFER_URL}}">) with black text: "UNLOCK UPGRADE". 
         IMPORTANT: The CTA MUST be an <a> tag with href="{{OFFER_URL}}". Add 40px margin-top to the link or its parent container.
       - FOOTER: At the very bottom, in small text (10px, color: #4b5563), show: "Upgrade offer powered by UpRez". (Strictly NO logo/SVG images in footer).
    3. landing_hero: (8 words max) Catchy emotional headline.
    4. landing_summary: 1 persuasive, high-prestige sentence. Hint that they can "Chat with our concierge" if they have specific requests.
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
                <img src="{hero_img_url}" style="display: block; margin-left: auto; margin-right: auto; width: 100%; border-radius: 40px; margin-bottom: 40px; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8);" alt="Exclusive View">
                <h1 style="font-size: 48px; font-weight: 900; letter-spacing: -3px; margin-bottom: 24px; line-height: 1.1; color: #ffffff;">Experience<br>the Extraordinary.</h1>
                <p style="color: #a0a0a0; font-size: 20px; line-height: 1.6; margin-bottom: 48px; max-width: 460px; margin-left: auto; margin-right: auto;">
                    Hi {guest_name}, we've unlocked a private invitation for you to upgrade your stay to the breathtaking <b>{upgrade_prop['name']}</b>.
                </p>
                <div style="background-color: #EA580C; padding: 56px 40px; border-radius: 40px; margin-bottom: 48px; box-shadow: 0 30px 60px -15px rgba(234, 88, 12, 0.4);">
                    <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; opacity: 0.8; letter-spacing: 2px; margin-bottom: 12px; color: #ffffff;">Upgrade today for only</div>
                    <div style="font-size: 72px; font-weight: 900; letter-spacing: -4px; line-height: 1; color: #ffffff;">{price_delta_fmt}€<span style="font-size: 22px; font-weight: 400; opacity: 0.7; letter-spacing: 0;">/night</span></div>
                </div>
                <a href="{{OFFER_URL}}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 26px 64px; border-radius: 24px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 16px; letter-spacing: 1px; box-shadow: 0 20px 40px rgba(255,255,255,0.15); margin-bottom: 60px; margin-top: 40px;">Unlock Upgrade</a>
                
                <div style="font-size: 10px; color: #444444; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                    Upgrade offer powered by UpRez
                </div>
            </div>
            """,
            "landing_hero": "Upgrade to Prestige",
            "landing_summary": f"Step into the extraordinary at {upgrade_prop['name']} for an exclusive rate of {pricing['offer_adr']}€/night.",
            "diff_bullets": ["Complete Luxury Privacy", "Premium Amenity Suite", "Prime Mediterranean Location"]
        }
