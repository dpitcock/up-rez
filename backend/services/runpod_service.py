"""
Mock RunPod Service.
Provides simulated GPU-accelerated scoring without actual RunPod API calls.
"""
import random
from typing import Dict, Any, Optional


class RunpodService:
    """
    Mock implementation of RunPod Serverless GPU compute.
    Returns simulated behavioral analysis and guest fit scores.
    """
    
    def __init__(self):
        # No actual API keys needed for mock
        pass
        
    def score_guest_fit(self, guest_data: Dict[str, Any], property_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Returns mock GPU-accelerated guest fit scoring.
        Simulates the response that would come from a real RunPod worker.
        """
        # Generate a realistic propensity score based on mock heuristics
        base_score = 0.5
        
        # Boost for higher-value bookings
        nightly_rate = guest_data.get("base_nightly_rate", 0)
        if nightly_rate > 300:
            base_score += 0.25
        elif nightly_rate > 150:
            base_score += 0.15
        
        # Boost for families (more invested in quality)
        if guest_data.get("children", 0) > 0:
            base_score += 0.1
        
        # Add some realistic variance
        final_score = min(0.95, max(0.2, base_score + (random.random() * 0.15 - 0.075)))
        
        # Generate motivators based on property features
        motivators = []
        prop_category = property_data.get("category", "").lower()
        if "luxury" in prop_category or "premium" in prop_category:
            motivators.append("premium_experience")
        if property_data.get("pool"):
            motivators.append("pool_access")
        if property_data.get("beds", 0) >= 3:
            motivators.append("extra_space")
        
        # Determine offer strategy
        if final_score > 0.7:
            strategy = "Premium Push"
        elif final_score > 0.5:
            strategy = "Balanced"
        else:
            strategy = "Value Focused"
        
        return {
            "propensity_score": round(final_score, 3),
            "key_motivators": motivators if motivators else ["general_upgrade"],
            "recommended_offer_style": strategy,
            "confidence": round(0.8 + random.random() * 0.15, 2),
            "model_version": "mock-v2.5",
            "worker_node": "mock-gpu-node-01"
        }


# Singleton instance
runpod_service = RunpodService()
