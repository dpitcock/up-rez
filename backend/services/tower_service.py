"""
Tower Integration Service.
Simulates calling Tower.dev pipelines for real-time market data 
and feature engineering to improve upgrade targeting.
"""
import random
from typing import Dict, Any

def get_tower_market_demand(location_str: str) -> float:
    """
    Simulates fetching real-time market demand via Tower for a specific airport zone.
    Focuses on PMI (Mallorca) as the primary hub.
    """
    # Mapping logic for Tower's airport-centric pipelines
    location_to_airport = {
        "Mallorca": "PMI",
        "Palma": "PMI",
        "Berlin": "BER",
        "London": "LHR",
        "Munich": "MUC"
    }

    # Extract primary identifier
    airport_code = "PMI" # Default for this speciality
    for loc, code in location_to_airport.items():
        if loc.lower() in location_str.lower():
            airport_code = code
            break

    # Tower-engineered demand factors indexed by Airport Code
    demand_by_airport = {
        "PMI": 1.45,  # High seasonal demand for Mallorca
        "BER": 1.15,
        "LHR": 1.30,
        "MUC": 1.10
    }
    
    base_demand = demand_by_airport.get(airport_code, 1.0)
    return base_demand + (random.random() * 0.05)

from services.runpod_service import runpod_service

def engineer_guest_fit_features(booking: Dict[str, Any], property: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses Tower Feature Store logic + RunPod GPU Compute to engineer 
    advanced guest-property fit metrics.
    """
    # 1. Attempt High-Fidelity Scoring via RunPod (Third Hackathon Partner)
    rp_result = runpod_service.score_guest_fit(booking, property)
    
    if rp_result:
        return {
            "tower_fit_score": rp_result.get("propensity_score", 0.5),
            "motivators": rp_result.get("key_motivators", []),
            "strategy": rp_result.get("recommended_offer_style", "Balanced"),
            "compute_node": "runpod-gpu-vllm",
            "pipeline_version": "v2.5-prod"
        }

    # 2. Fallback to Local/Mock heuristic
    fit_score = 0.0
    if booking.get("base_nightly_rate", 0) > 200:
        fit_score += 0.2
        
    return {
        "tower_fit_score": fit_score,
        "pipeline_version": "v2.4-stable",
        "last_sync": "real-time",
        "compute_node": "local-cpu"
    }
