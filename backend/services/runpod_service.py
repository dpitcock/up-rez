import os
import requests
import time
from typing import Dict, Any, Optional

class RunpodService:
    """
    Handles high-performance GPU compute tasks via RunPod Serverless.
    Used for complex behavioral analysis and guest fit scoring.
    """
    
    def __init__(self):
        self.api_key = os.getenv("RUNPOD_API_KEY")
        self.endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID")
        self.base_url = f"https://api.runpod.ai/v2/{self.endpoint_id}/run"
        
    def score_guest_fit(self, guest_data: Dict[str, Any], property_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Sends guest behavior to our Custom RunPod Worker for GPU-accelerated scoring.
        """
        if not self.api_key or not self.endpoint_id:
            print("⚠️ RunPod not configured. Falling back to local scoring.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Structuring data for our handler.py
        payload = {
            "input": {
                "guest": guest_data,
                "property": property_data
            }
        }

        try:
            # 1. Start the job
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=10)
            job_id = response.json().get("id")
            
            if not job_id:
                return None

            # 2. Poll for results (simple version for demo)
            status_url = f"https://api.runpod.ai/v2/{self.endpoint_id}/status/{job_id}"
            for _ in range(10):
                status_res = requests.get(status_url, headers=headers).json()
                if status_res["status"] == "COMPLETED":
                    return status_res["output"]
                elif status_res["status"] in ["FAILED", "CANCELLED"]:
                    return None
                time.sleep(1)
                
        except Exception as e:
            print(f"❌ RunPod request failed: {e}")
            return None

runpod_service = RunpodService()
