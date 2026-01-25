import os
import requests
import time
import json
import random
from dotenv import load_dotenv

# Load environment
load_dotenv()

API_KEY = os.getenv("RUNPOD_API_KEY")
ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")

def hammer_runpod(count=50, interval=0.5):
    """
    Triggers 'count' number of RunPod jobs to generate traffic visibility.
    """
    if not API_KEY or not ENDPOINT_ID:
        print("❌ Error: RUNPOD_API_KEY or RUNPOD_ENDPOINT_ID not found in .env")
        return

    url = f"https://api.runpod.ai/v2/{ENDPOINT_ID}/run"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    print(f"🚀 Starting RunPod Traffic Hammer ({count} requests)...")
    
    successful = 0
    failed = 0

    for i in range(count):
        payload = {
            "input": {
                "guest": {
                    "name": f"Traffic Guest {i}",
                    "nights": random.randint(2, 14),
                    "total_paid": random.randint(500, 5000)
                },
                "property": {
                    "name": "Luxury Villa Alpha",
                    "beds": 4,
                    "category": "Premium"
                }
            }
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=5)
            if res.status_code == 200:
                job_id = res.json().get("id")
                print(f"  [{i+1}/{count}] ✅ Job started: {job_id}")
                successful += 1
            else:
                print(f"  [{i+1}/{count}] ❌ Request failed: {res.status_code}")
                failed += 1
        except Exception as e:
            print(f"  [{i+1}/{count}] ❌ Error: {e}")
            failed += 1

        if interval > 0:
            time.sleep(interval)

    print("\n--- Summary ---")
    print(f"Total Requests: {count}")
    print(f"Successful Hits: {successful}")
    print(f"Failed: {failed}")
    print("----------------")

if __name__ == "__main__":
    hammer_runpod(count=100, interval=0.2)
