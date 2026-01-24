"""
UpRez FastAPI Application
AI-powered vacation rental upsell platform
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
from pathlib import Path
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv() # Fallback to default .env behavior

# Import routers
from routers import webhook, offers, bot, demo, host

app = FastAPI(
    title="UpRez API",
    description="AI-powered vacation rental upgrade engine",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3030", "http://frontend:3030", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "UpRez API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "webhook": "/webhook/channel-manager",
            "demo": "/demo/trigger",
            "offers": "/offer/{offer_id}",
            "bot": "/bot/query",
            "regen": "/regen/{offer_id}"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
app.include_router(webhook.router, prefix="/webhook", tags=["webhooks"])
app.include_router(demo.router, prefix="/demo", tags=["demo"])
app.include_router(offers.router, tags=["offers"])
app.include_router(bot.router, prefix="/bot", tags=["bot"])
app.include_router(host.router, prefix="/api/host", tags=["host"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
