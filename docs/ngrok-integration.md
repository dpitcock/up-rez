# Ngrok Integration for Vercel Deployment

This guide explains how to expose your local Dockerized backend to a frontend deployed on Vercel.

## 1. Setup Ngrok

1.  **Install Ngrok**:
    *   Mac: `brew install ngrok/ngrok/ngrok`
    *   Windows/Linux: Download from [ngrok.com](https://ngrok.com)

2.  **Authenticate**:
    ```bash
    ngrok config add-authtoken <YOUR_TOKEN>
    ```

## 2. Expose Local Backend

Your backend runs on `localhost:8080` inside Docker.

**Start the tunnel:**
```bash
ngrok http 8080
```

*Note: If you have issues connecting to Docker, try `ngrok http host.docker.internal:8080` check your ngrok version.*

**Copy the Forwarding URL**:
It will look like `https://<random-id>.ngrok-free.app`

## 3. Configure Frontend (Vercel)

1.  Go to your Vercel Project Settings.
2.  Navigate to **Environment Variables**.
3.  Add/Update `NEXT_PUBLIC_API_URL`:
    *   Key: `NEXT_PUBLIC_API_URL`
    *   Value: `https://<your-ngrok-id>.ngrok-free.app` (The URL from step 2)

## 4. Automation (Optional)

You can define a persistent domain in Ngrok (paid plan) or use a script to update Vercel env vars automatically.

**Example Task for Workflow:**
- [ ] Start Local Backend: `docker-compose up backend`
- [ ] Start Ngrok: `ngrok http 8080`
- [ ] Update Vercel Env: Copy URL -> Vercel Dashboard
- [ ] Redeploy/Restart Frontend (usually instant for Env Var changes)
