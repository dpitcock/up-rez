"""
Property comparison and upgrade viability scoring service.
"""
from typing import Dict, List, Any
import json


def compute_score(
    original_prop: Dict[str, Any],
    candidate_prop: Dict[str, Any],
    booking: Dict[str, Any]
) -> float:
    """
    Compute viability score for upgrade candidate.
    
    Args:
        original_prop: Original property dict
        candidate_prop: Candidate upgrade property dict
        booking: Booking details dict
        
    Returns:
        Score from 0-10
    """
    score = 0.0
    
    # Parse amenities if stored as JSON string
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
    
    # 1. Capacity upgrade
    if candidate_prop["beds"] > original_prop["beds"]:
        score += 2
    if candidate_prop["baths"] > original_prop["baths"]:
        score += 1
    
    # 2. Premium amenities
    if "pool" in cand_amenities or candidate_prop.get("pool"):
        if "pool" not in orig_amenities and not original_prop.get("pool"):
            score += 3
    
    if "parking" in cand_amenities or candidate_prop.get("parking"):
        if "parking" not in orig_amenities and not original_prop.get("parking"):
            # Extra weight if guest has car
            if booking.get("has_car", 0) == 1:
                score += 2
            else:
                score += 1
    
    if "garden" in cand_amenities or "garden" in cand_meta.get("outdoor_space", ""):
        score += 1
    
    # 3. WiFi quality upgrade
    cand_wifi = cand_meta.get("wifi_speed", "")
    orig_wifi = orig_meta.get("wifi_speed", "")
    if "excellent" in cand_wifi or "500mbps" in cand_wifi or "gigabit" in cand_wifi:
        if "basic" in orig_wifi or "30mbps" in orig_wifi:
            score += 1
    
    # 4. Family fit
    children = booking.get("children", 0)
    if children > 0:
        # Prioritize extra bedrooms for families
        if candidate_prop["beds"] >= original_prop["beds"] + 1:
            score += 2
        
        # Baby/kid amenities
        if cand_meta.get("baby_crib"):
            score += 1
        if cand_meta.get("high_chair"):
            score += 0.5
        if "kids_allowed" in cand_amenities:
            score += 0.5
    
    # 5. Location quality
    orig_beach_dist = orig_meta.get("beach_distance", "")
    cand_beach_dist = cand_meta.get("beach_distance", "")
    
    # If original was near beach, prioritize beach proximity
    if "beachfront" in orig_beach_dist or "<5min" in orig_beach_dist:
        if "beachfront" in cand_beach_dist or "<5min" in cand_beach_dist:
            score += 2
        elif "10min" in cand_beach_dist:
            score += 1
        else:
            # Penalize if moving far from beach when originally near
            score -= 2
    
    # 6. Reviews and host quality
    orig_rating = orig_meta.get("reviews_rating", 0.0)
    cand_rating = cand_meta.get("reviews_rating", 0.0)
    if isinstance(orig_rating, (int, float)) and isinstance(cand_rating, (int, float)):
        delta_rating = cand_rating - orig_rating
        score += max(0, delta_rating)
    
    if cand_meta.get("superhost") and not orig_meta.get("superhost"):
        score += 0.5
    
    # Normalize to 0-10
    return min(10.0, max(0.0, score))


def filter_eligible_candidates(
    all_properties: List[Dict[str, Any]],
    original_prop: Dict[str, Any],
    booking: Dict[str, Any],
    host_settings: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Filter properties to find eligible upgrade candidates.
    
    Args:
        all_properties: All available properties
        original_prop: Current booked property
        booking: Booking details
        host_settings: Host configuration/guardrails
        
    Returns:
        List of eligible candidate properties
    """
    eligible = []
    
    # Parse blocked prop IDs
    blocked_ids = host_settings.get("blocked_prop_ids") or []
    if isinstance(blocked_ids, str):
        blocked_ids = json.loads(blocked_ids) if blocked_ids else []
    
    for candidate in all_properties:
        # Skip if same property
        if candidate["id"] == original_prop["id"]:
            continue
        
        # Skip if blocked by host
        if candidate["id"] in blocked_ids:
            continue
        
        # Hard constraint: Capacity (no downgrades)
        if candidate["beds"] < original_prop["beds"]:
            continue
        if candidate["baths"] < original_prop["baths"]:
            continue
        
        # Hard constraint: Price direction (must cost more)
        if candidate["list_nightly_rate"] <= original_prop["list_nightly_rate"]:
            continue
        
        # Price reasonableness check
        max_multiplier = host_settings.get("max_adr_multiplier", 2.5)
        if candidate["list_nightly_rate"] > original_prop["list_nightly_rate"] * max_multiplier:
            # Too expensive, skip
            continue
        
        # Parse amenities
        orig_amenities = original_prop.get("amenities", [])
        if isinstance(orig_amenities, str):
            orig_amenities = json.loads(orig_amenities)
        
        cand_amenities = candidate.get("amenities", [])
        if isinstance(cand_amenities, str):
            cand_amenities = json.loads(cand_amenities)
        
        # Check critical amenities preserved
        if "wifi" in orig_amenities and "wifi" not in cand_amenities:
            continue
        if "ac" in orig_amenities and "ac" not in cand_amenities:
            continue
        
        # Passed all filters
        eligible.append(candidate)
    
    return eligible
