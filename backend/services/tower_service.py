"""
Mock Tower Integration Service.
Provides simulated market data and feature engineering without actual Tower API calls.
"""
import random
from typing import Dict, Any


def get_tower_market_demand(location_str: str) -> float:
    """
    Returns mock real-time market demand for a specific airport zone.
    Simulates what Tower.dev pipelines would provide.
    """
    # Mapping logic for mock airport-centric pipelines
    location_to_airport = {
        "Mallorca": "PMI",
        "Palma": "PMI",
        "Berlin": "BER",
        "London": "LHR",
        "Munich": "MUC"
    }

    # Extract primary identifier
    airport_code = "PMI"  # Default for this speciality
    for loc, code in location_to_airport.items():
        if loc.lower() in location_str.lower():
            airport_code = code
            break

    # Mock demand factors indexed by Airport Code
    demand_by_airport = {
        "PMI": 1.45,  # High seasonal demand for Mallorca
        "BER": 1.15,
        "LHR": 1.30,
        "MUC": 1.10
    }
    
    base_demand = demand_by_airport.get(airport_code, 1.0)
    # Add slight variance for realism
    return base_demand + (random.random() * 0.05)


def engineer_guest_fit_features(booking: Dict[str, Any], property: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns mock feature-engineered guest-property fit metrics.
    Simulates Tower Feature Store + RunPod GPU compute results.
    """
    # Generate mock fit score based on booking characteristics
    fit_score = 0.35  # Base score
    
    # Boost for higher-value bookings
    if booking.get("base_nightly_rate", 0) > 200:
        fit_score += 0.25
    elif booking.get("base_nightly_rate", 0) > 100:
        fit_score += 0.15
    
    # Boost for families
    if booking.get("children", 0) > 0:
        fit_score += 0.1
    
    # Boost for longer stays
    if booking.get("nights", 0) >= 7:
        fit_score += 0.1
    
    # Cap at realistic maximum
    fit_score = min(0.85, fit_score)
    
    # Add slight variance
    fit_score += random.random() * 0.1
    
    # Generate motivators
    motivators = []
    if property.get("pool"):
        motivators.append("pool_access")
    if property.get("beds", 0) >= 3:
        motivators.append("extra_space")
    prop_category = property.get("category", "").lower()
    if "luxury" in prop_category or "premium" in prop_category:
        motivators.append("premium_experience")
    
    # Determine strategy
    if fit_score > 0.6:
        strategy = "Premium Push"
    elif fit_score > 0.4:
        strategy = "Balanced"
    else:
        strategy = "Value Focused"
    
    return {
        "tower_fit_score": round(fit_score, 3),
        "motivators": motivators if motivators else ["general_upgrade"],
        "strategy": strategy,
        "pipeline_version": "mock-v2.5-stable",
        "last_sync": "real-time",
        "compute_node": "mock-cpu-local"
    }
