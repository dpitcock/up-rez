# RunPod Integration Setup

To qualify for the hackathon, we are using **RunPod** as our high-performance GPU compute provider. We utilize **Custom RunPod Workers** to perform computationally expensive **Guest Fit Scoring** directly on GPU nodes.

## 1. Why Custom Workers?
While RunPod offers simple API templates, we have implemented a **Custom Worker** architecture. This allows us to run specialized Python scoring logic that cross-references live request data with bundled historical datasets (`historical_offer_success.csv`) directly on the GPU hardware.

---

## 2. Prerequisites

### Hugging Face (Optional)
If your scoring logic needs specific gated model weights (e.g. Gemma):
1. Create a "Read" token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. **Accept License**: Visit the [google/gemma-3-4b-it](https://huggingface.co/google/gemma-3-4b-it) page and click "Accept License".

### Docker Hub (Required)
To get your custom code onto RunPod, you must host your container image on **Docker Hub**.
1. **Create Account**: Sign up at [hub.docker.com](https://hub.docker.com).
2. **Authenticate CLI**:
   ```bash
   docker login
   ```
3. **Naming Rule**: Your image name must be `[username]/up-rez-worker:latest`.

---

## 3. The Development & Deployment Loop

We have automated the build and test cycle using a management script.

### 1. Build and Test Locally
Ensure your Python logic is correct without burning credits:
```bash
# Set DOCKER_USER in your .env
chmod +x scripts/*.sh
./scripts/manage_worker.sh build
./scripts/manage_worker.sh test
```

### 2. Deploy to Cloud & test
Once the local test succeeds, push the image to Docker Hub:
```bash
./scripts/manage_worker.sh push
```
```bash
./scripts/manage_worker.sh test
```

### 3. Create RunPod Endpoint
1. Go to **RunPod Console** -> **Serverless** -> **New Endpoint**.
2. **Container Image**: Enter your tagged image name (e.g., `youruser/up-rez-worker:latest`).
3. **Recommended Settings**:
   - **GPU**: 80 GB PRO or 80 GB Standard.
   - **FlashBoot**: ENABLED (Sub-2s cold starts).
   - **Environment Variables**: Add `HF_TOKEN` if using gated weights.

---

## 4. Where to Find Your Data

Populate your local `.env` with these IDs:

*   **API Key**: Profile (bottom left) -> **Settings** -> **API Keys**.
*   **Endpoint ID**: Go to **Serverless** -> **Endpoints**. Locate your active endpoint and copy the alphanumeric ID below the name.

## 5. Deployment Recap (.env)

```env
# Required for worker communication
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_ENDPOINT_ID=your_endpoint_id
DOCKER_USER=your_docker_hub_username
RUNPOD_DATA_CENTER=EU-RO-1  # Preferred Region
```

---

## 6. Troubleshooting
- **Cold Boot**: Serverless workers scale to 0. Enable **FlashBoot** in the UI to minimize startup time.
- **Logs**: View real-time `stdout` in the "Activity" tab of your RunPod Endpoint dashboard.
- **Updates**: After pushing a new version to Docker Hub, click "Update Image" in the RunPod dashboard to refresh the workers.
