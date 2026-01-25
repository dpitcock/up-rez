import os
import sys
from dotenv import load_dotenv

# Add parent dir to path to import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.runpod_service import runpod_service

def test_connection():
    load_dotenv()
    
    print("🛰️ Testing RunPod Connectivity...")
    
    if not os.getenv("RUNPOD_API_KEY") or not os.getenv("RUNPOD_ENDPOINT_ID"):
        print("❌ Error: Missing RUNPOD_API_KEY or RUNPOD_ENDPOINT_ID in .env")
        return

    # Mock data for testing
    guest = {"name": "Test Guest", "is_luxury_loyalty": True}
    property = {"name": "Ocean Villa", "current_adr": 450}

    print(f"📡 Sending test request to Endpoint: {os.getenv('RUNPOD_ENDPOINT_ID')}...")
    
    result = runpod_service.score_guest_fit(guest, property)
    
    if result:
        print("\n✅ SUCCESS! RunPod responded:")
        print(f"  - Score: {result.get('propensity_score')}")
        print(f"  - Strategy: {result.get('recommended_offer_style')}")
    else:
        print("\n❌ FAILED. No response from RunPod. Check your Endpoint status and API Key.")

if __name__ == "__main__":
    test_connection()
