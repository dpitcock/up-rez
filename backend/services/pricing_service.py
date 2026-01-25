"""
Offer pricing calculation service with discount logic.
"""
from typing import Dict, Any


def calculate_offer_pricing(
    from_adr: float,
    to_adr: float,
    nights: int,
    discount_pct: float = 0.40,
    from_total: float = None,
    max_discount_pct: float = 0.55
) -> Dict[str, Any]:
    """
    Calculate offer pricing with discount applied to price difference.
    Includes a 'Floor' for AI negotiation that respects host boundaries.
    """
    # Calculate price difference
    price_diff_per_night = to_adr - from_adr
    price_diff_total = price_diff_per_night * nights
    
    # Apply discount to difference
    discount_amount = price_diff_total * discount_pct
    
    # Calculate offer rate
    offer_adr = from_adr + (price_diff_per_night * (1 - discount_pct))
    offer_total = offer_adr * nights
    
    # Revenue lift
    if from_total is None:
        from_total = from_adr * nights
    revenue_lift = offer_total - from_total
    
    # Calculate "Floor" for AI negotiation (lowest auto-accept)
    # Rule: Accept 75% of the offer price, but ensure it stays above from_total + buffer
    floor_total_target = offer_total * 0.75
    min_floor_total = (from_total or (from_adr * nights)) + (nights * 20.0) # €20/night min lift
    
    floor_total = max(floor_total_target, min_floor_total)
    floor_adr = floor_total / nights
    
    return {
        "currency": "EUR",
        "from_adr": round(from_adr, 2),
        "to_adr_list": round(to_adr, 2),
        "offer_adr": round(offer_adr, 2),
        "extra_per_night": round(offer_adr - from_adr, 2),
        "nights": nights,
        "from_total": round(from_total, 2),
        "offer_total": round(offer_total, 2),
        "floor_total": round(floor_adr * nights, 2),
        "floor_adr": round(floor_adr, 2),
        "list_total": round(to_adr * nights, 2),
        "total_extra": round(offer_total - from_total, 2),
        "discount_percent": discount_pct,
        "discount_max_percent": max_discount_pct,
        "discount_amount_total": round(discount_amount, 2),
        "revenue_lift": round(revenue_lift, 2)
    }


def validate_pricing(
    pricing: Dict[str, Any],
    host_settings: Dict[str, Any]
) -> bool:
    """
    Validate pricing meets host guardrails.
    
    Args:
        pricing: Calculated pricing dict
        host_settings: Host settings with guardrails
        
    Returns:
        True if pricing is valid, False otherwise
    """
    # Check minimum revenue lift per night
    min_lift_per_night = host_settings.get("min_revenue_lift_eur_per_night", 30.0)
    revenue_lift_per_night = pricing["revenue_lift"] / pricing["nights"]
    
    if revenue_lift_per_night < min_lift_per_night:
        return False
    
    # Check offer total is greater than from total
    if pricing["offer_total"] <= pricing["from_total"]:
        return False
    
    # Check minimum ADR ratio
    min_adr_ratio = host_settings.get("min_adr_ratio", 1.10)
    if pricing["offer_adr"] < pricing["from_adr"] * min_adr_ratio:
        return False
    
    return True
